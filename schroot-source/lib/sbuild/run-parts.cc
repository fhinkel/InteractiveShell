/* Copyright © 2005-2013  Roger Leigh <rleigh@debian.org>
 *
 * schroot is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * schroot is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see
 * <http://www.gnu.org/licenses/>.
 *
 *********************************************************************/

#include <config.h>

#include <sbuild/run-parts.h>
#include <sbuild/util.h>

#include <cerrno>

#include <poll.h>
#include <sys/wait.h>

#include <syslog.h>

#include <boost/format.hpp>
#include <boost/filesystem/operations.hpp>

using boost::format;

namespace sbuild
{

  template<>
  error<run_parts::error_code>::map_type
  error<run_parts::error_code>::error_strings =
    {
      {run_parts::CHILD_FORK, N_("Failed to fork child")},
      {run_parts::CHILD_WAIT, N_("Wait for child failed")},
      // TRANSLATORS: %1% = command name
      {run_parts::EXEC,       N_("Failed to execute “%1%”")},
      {run_parts::PIPE,       N_("Failed to create pipe")},
      {run_parts::DUP,        N_("Failed to duplicate file descriptor")},
      {run_parts::POLL,       N_("Failed to poll file descriptor")},
      {run_parts::READ,       N_("Failed to read file descriptor")}
    };

  run_parts::run_parts (const std::string& directory,
                        bool               lsb_mode,
                        bool               abort_on_error,
                        mode_t             umask):
    lsb_mode(true),
    abort_on_error(abort_on_error),
    umask(umask),
    verbose(false),
    reverse(false),
    directory(directory),
    programs()
  {
    boost::filesystem::path dirpath(directory);
    boost::filesystem::directory_iterator end_iter;
    for (boost::filesystem::directory_iterator dirent(dirpath);
         dirent != end_iter;
         ++dirent)
      {
#if !defined(BOOST_FILESYSTEM_VERSION) || BOOST_FILESYSTEM_VERSION == 2
        std::string name(dirent->leaf());
#else
        std::string name(dirent->path().filename().string());
#endif

        // Skip common directories.
        if (name == "." || name == "..")
          continue;

        // Skip backup files and dpkg configuration backup files.
        if (is_valid_filename(name, this->lsb_mode))
          this->programs.insert(name);
      }
  }

  run_parts::~run_parts ()
  {
  }

  bool
  run_parts::get_verbose () const
  {
    return this->verbose;
  }

  void
  run_parts::set_verbose (bool verbose)
  {
    this->verbose = verbose;
  }

  bool
  run_parts::get_reverse () const
  {
    return this->reverse;
  }

  void
  run_parts::set_reverse (bool reverse)
  {
    this->reverse = reverse;
  }

  int
  run_parts::run (const string_list& command,
                  const environment& env)
  {
    int exit_status = 0;

    if (!this->reverse)
      {
        for (const auto& program : this->programs)
          {
            string_list real_command;
            real_command.push_back(program);
            for (const auto& arg : command)
              real_command.push_back(arg);

            exit_status = run_child(program, real_command, env);

            if (exit_status && this->abort_on_error)
              return exit_status;
          }
      }
    else
      {
        for (program_set::const_reverse_iterator program = this->programs.rbegin();
             program != this->programs.rend();
             ++program)
          {
            string_list real_command;
            real_command.push_back(*program);
            for (const auto& arg : command)
              real_command.push_back(arg);

            exit_status = run_child(*program, real_command, env);

            if (exit_status && this->abort_on_error)
              return exit_status;
          }
      }

    return exit_status;
  }

  int
  run_parts::run_child (const std::string& file,
                        const string_list& command,
                        const environment& env)
  {
    int stdout_pipe[2];
    int stderr_pipe[2];
    int exit_status = 0;
    pid_t pid;

    try
      {
        if (pipe(stdout_pipe) < 0)
          throw error(PIPE, strerror(errno));
        if (pipe(stderr_pipe) < 0)
          throw error(PIPE, strerror(errno));

        if ((pid = fork()) == -1)
          {
            throw error(CHILD_FORK, strerror(errno));
          }
        else if (pid == 0)
          {
            try
              {
                log_debug(DEBUG_INFO) << "run_parts: executing "
                                      << string_list_to_string(command, ", ")
                                      << std::endl;
                if (this->verbose)
                  // TRANSLATORS: %1% = command
                  log_info() << format(_("Executing ‘%1%’"))
                    % string_list_to_string(command, " ")
                             << std::endl;
                ::umask(this->umask);

                // Don't leak syslog file descriptor to child processes.
                closelog();

                // Set up pipes for stdout and stderr
                if (dup2(stdout_pipe[1], STDOUT_FILENO) < 0)
                  throw error(DUP, strerror(errno));
                if (dup2(stderr_pipe[1], STDERR_FILENO) < 0)
                  throw error(DUP, strerror(errno));

                close(stdout_pipe[0]);
                close(stdout_pipe[1]);
                close(stderr_pipe[0]);
                close(stderr_pipe[1]);

                exec(this->directory + '/' + file, command, env);
                error e(file, EXEC, strerror(errno));
                log_exception_error(e);
              }
            catch (const std::exception& e)
              {
                log_exception_error(e);
              }
            catch (...)
              {
                log_error()
                  << _("An unknown exception occurred") << std::endl;
              }
            _exit(EXIT_FAILURE);
          }

        // Log stdout and stderr.
        close(stdout_pipe[1]);
        close(stderr_pipe[1]);

        struct pollfd pollfds[2];
        pollfds[0].fd = stdout_pipe[0];
        pollfds[0].events = POLLIN;
        pollfds[0].revents = 0;
        pollfds[1].fd = stderr_pipe[0];
        pollfds[1].events = POLLIN;
        pollfds[1].revents = 0;

        char buffer[BUFSIZ];

        std::string stdout_buf;
        std::string stderr_buf;

        while (1)
          {
            int status;
            if ((status = poll(pollfds, 2, -1)) < 0)
              throw error(POLL, strerror(errno));

            int outdata = 0;
            int errdata = 0;

            if (pollfds[1].revents & POLLIN)
              {
                if ((errdata = read(pollfds[1].fd, buffer, BUFSIZ)) < 0
                    && errno != EINTR)
                  throw error(READ, strerror(errno));

                if (errdata)
                  stderr_buf += std::string(&buffer[0], errdata);
              }

            if (pollfds[0].revents & POLLIN)
              {
                if ((outdata = read(pollfds[0].fd, buffer, BUFSIZ)) < 0
                    && errno != EINTR)
                  throw error(READ, strerror(errno));

                if (outdata)
                  stdout_buf += std::string(&buffer[0], outdata);
              }

            if (!stderr_buf.empty())
              {
                string_list lines = split_string_strict(stderr_buf, "\n");
                // If the buffer ends in a newline before splitting,
                // it's OK to flush all lines.
                bool flush = *stderr_buf.rbegin() == '\n';

                for (string_list::const_iterator pos = lines.begin();
                     pos != lines.end();
                     ++pos)
                  {
                    if (pos + 1 != lines.end() || flush)
                      log_error() << file << ": " << *pos << '\n';
                    else // Save possibly incompete line
                      stderr_buf = *pos;
                  }

                if (flush)
                  stderr_buf.clear();
              }

            if (!stdout_buf.empty())
              {
                string_list lines = split_string_strict(stdout_buf, "\n");
                // If the buffer ends in a newline before splitting,
                // it's OK to flush all lines.
                bool flush = *stdout_buf.rbegin() == '\n';

                for (string_list::const_iterator pos = lines.begin();
                     pos != lines.end();
                     ++pos)
                  {
                    if (pos + 1 != lines.end() || flush)
                      log_info() << file << ": " << *pos << '\n';
                    else // Save possibly incompete line
                      stdout_buf = *pos;
                  }

                if (flush)
                  stdout_buf.clear();
              }

            if (outdata == 0 && errdata == 0) // pipes closed
              {
                // Flush any remaining lines
                if (!stderr_buf.empty())
                  log_error() << file << ": " << stderr_buf << '\n';
                if (!stdout_buf.empty())
                  log_info() << file << ": " << stdout_buf << '\n';
                break;
              }
          }

        close(stdout_pipe[0]);
        close(stderr_pipe[0]);
        wait_for_child(pid, exit_status);
      }
    catch (const error& e)
      {
        close(stdout_pipe[0]);
        close(stdout_pipe[1]);
        close(stderr_pipe[0]);
        close(stderr_pipe[1]);
        throw;
      }

    if (exit_status)
      log_debug(DEBUG_INFO) << "run_parts: " << file
                            << " failed with status " << exit_status
                            << std::endl;
    else
      log_debug(DEBUG_INFO) << "run_parts: " << file
                            << " succeeded"
                            << std::endl;

    return exit_status;
  }

  void
  run_parts::wait_for_child (pid_t pid,
                             int&  child_status)
  {
    child_status = EXIT_FAILURE; // Default exit status

    int status;

    while (1)
      {
        if (waitpid(pid, &status, 0) == -1)
          {
            if (errno == EINTR)
              continue; // Wait again.
            else
              throw error(CHILD_WAIT, strerror(errno));
          }
        else
          break;
      }

    if (WIFEXITED(status))
      child_status = WEXITSTATUS(status);
  }

}
