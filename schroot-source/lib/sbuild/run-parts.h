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

#ifndef SBUILD_RUN_PARTS_H
#define SBUILD_RUN_PARTS_H

#include <sbuild/custom-error.h>
#include <sbuild/environment.h>
#include <sbuild/types.h>

#include <set>
#include <string>

#include <sys/types.h>
#include <sys/stat.h>

namespace sbuild
{

  /**
   * Run all scripts or programs within a directory.
   */
  class run_parts
  {
  public:
    /// Error codes.
    enum error_code
      {
        CHILD_FORK, ///< Failed to fork child.
        CHILD_WAIT, ///< Wait for child failed.
        EXEC,       ///< Failed to execute.
        PIPE,       ///< Failed to create pipe.
        DUP,        ///< Failed to duplicate file descriptor.
        POLL,       ///< Failed to poll file descriptor.
        READ        ///< Failed to read file descriptor.
      };

    /// Exception type.
    typedef custom_error<error_code> error;

    /**
     *  The constructor.
     *
     * @param directory the directory to run scripts from.
     * @param lsb_mode use Linux Standard Base filename requirements.
     * If true, the following patterns are permitted: LANANA
     * ("^[a-z0-9]+$"), LSB ("^_?([a-z0-9_.]+-)+[a-z0-9]+$"), and
     * Debian cron ("^[a-z0-9][a-z0-9-]*$").  Debian dpkg conffile
     * backups are not permitted ("dpkg-(old|dist|new|tmp)$").  If
     * false, the traditional run-parts pattern is used
     * ("^[a-zA-Z0-9_-]$").
     * @param abort_on_error stop executing scripts if one returns an error.
     * @param umask the umask to set when running scripts.
     */
    run_parts (const std::string& directory,
               bool               lsb_mode = true,
               bool               abort_on_error = true,
               mode_t             umask = 022);

    /// The destructor.
    ~run_parts ();

    /**
     * Get the verbosity level.
     *
     * @returns true if verbose, otherwise false.
     */
    bool
    get_verbose () const;

    /**
     * Set the verbosity level.
     *
     * @param verbose true to be verbose, otherwise false.
     */
    void
    set_verbose (bool verbose);

    /**
     * Get the script execution order.
     *
     * @returns true if executing in reverse, otherwise false.
     */
    bool
    get_reverse () const;

    /**
     * Set the script execution order.
     *
     * @param reverse true to execute in reverse, otherwise false.
     */
    void
    set_reverse (bool reverse);

    /**
     * Run all scripts in the specified directory.  If abort_on_error
     * is true, execution will stop at the first script to fail.
     *
     * @param command the command to run.
     * @param env the environment to use.
     * @returns the exit status of the scripts.  This will be 0 on
     * success, or the exit status of the last failing script.
     */
    int
    run(const string_list& command,
        const environment& env);

    /**
     * Output the environment to an ostream.
     *
     * @param stream the stream to output to.
     * @param rhs the environment to output.
     * @returns the stream.
     */
    template <class charT, class traits>
    friend
    std::basic_ostream<charT,traits>&
    operator << (std::basic_ostream<charT,traits>& stream,
                 const run_parts&                  rhs)
    {
      if (!rhs.reverse)
        {
          for (const auto& program : rhs.programs)
            stream << program << '\n';
        }
      else
        {
          for (program_set::const_reverse_iterator pos = rhs.programs.rbegin();
               pos != rhs.programs.rend();
               ++pos)
            stream << *pos << '\n';
        }
      return stream;
    }

  private:
    /**
     * Run the command specified by file (an absolute pathname), using
     * command and env as the argv and environment, respectively.
     *
     * @param file the program to execute.
     * @param command the arguments to pass to the executable.
     * @param env the environment.
     * @returns the return value of the execve system call on failure.
     */
    int
    run_child(const std::string& file,
              const string_list& command,
              const environment& env);

    /**
     * Wait for a child process to complete, and check its exit status.
     *
     * An error will be thrown on failure.
     *
     * @param pid the pid to wait for.
     * @param child_status the place to store the child exit status.
     */
    void
    wait_for_child (pid_t pid,
                    int&  child_status);

    /// A sorted set of filenames to use.
    typedef std::set<std::string> program_set;

    /// The LSB mode for allowed filenames.
    bool        lsb_mode;
    /// Whether to abort on script execution error.
    bool        abort_on_error;
    /// The umask to run scripts with.
    mode_t      umask;
    /// Verbose logging.
    bool        verbose;
    /// Execute scripts in reverse order.
    bool        reverse;
    /// The directory to run scripts from.
    std::string directory;
    /// The list of scripts to run.
    program_set programs;
  };

}

#endif /* SBUILD_RUN_PARTS_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
