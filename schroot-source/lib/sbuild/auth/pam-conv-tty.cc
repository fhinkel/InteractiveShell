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

#include <sbuild/auth/pam-conv-tty.h>
#include <sbuild/ctty.h>
#include <sbuild/log.h>

#include <iostream>

#include <signal.h>
#include <termios.h>
#include <unistd.h>

#include <boost/format.hpp>

using std::endl;
using boost::format;

namespace
{

  volatile sig_atomic_t timer_expired = false;

  /**
   * Disable the alarm and signal handler.
   *
   * @param orig_sa the signal handler to restore.
   */
  void
  reset_alarm (struct sigaction *orig_sa)
  {
    // Stop alarm
    alarm (0);
    // Restore original handler
    sigaction (SIGALRM, orig_sa, 0);
  }

  /**
   * Handle the SIGALRM signal.
   *
   * @param ignore the signal number (unused).
   */
  void
  alarm_handler (int ignore)
  {
    timer_expired = true;
  }

  /**
   * Set the SIGALARM handler, and set the timeout to delay seconds.
   * The old signal handler is stored in orig_sa.
   *
   * @param delay the delay (in seconds) before SIGALRM is raised.
   * @param orig_sa the location to store the original signal handler.
   * @returns true on success, false on failure.
   */
  bool
  set_alarm (int delay,
             struct sigaction *orig_sa)
  {
    struct sigaction new_sa;
    sigemptyset(&new_sa.sa_mask);
    new_sa.sa_flags = 0;
    new_sa.sa_handler = alarm_handler;

    if (sigaction(SIGALRM, &new_sa, orig_sa) != 0)
      {
        return false;
      }
    if (alarm(delay) != 0)
      {
        sigaction(SIGALRM, orig_sa, 0);
        return false;
      }

    return true;
  }

}

namespace sbuild
{
  namespace auth
  {

    template<>
    error<pam_conv_tty::error_code>::map_type
    error<pam_conv_tty::error_code>::error_strings =
      {
        {auth::pam_conv_tty::CTTY,            N_("No controlling terminal")},
        {auth::pam_conv_tty::TIMEOUT,         N_("Timed out")},
        // TRANSLATORS: Please use an ellipsis e.g. U+2026
        {auth::pam_conv_tty::TIMEOUT_PENDING, N_("Time is running out…")},
        {auth::pam_conv_tty::TERMIOS,         N_("Failed to get terminal settings")},
        // TRANSLATORS: %1% = integer
        {auth::pam_conv_tty::CONV_TYPE,       N_("Unsupported conversation type ‘%1%’")}
      };

    pam_conv_tty::pam_conv_tty (auth_ptr auth):
      auth(weak_auth_ptr(auth)),
      warning_timeout(0),
      fatal_timeout(0),
      start_time(0)
    {
    }

    pam_conv_tty::~pam_conv_tty ()
    {
    }

    pam_conv::ptr
    pam_conv_tty::create (auth_ptr auth)
    {
      return ptr(new pam_conv_tty(auth));
    }

    pam_conv::auth_ptr
    pam_conv_tty::get_auth ()
    {
      return auth_ptr(this->auth);
    }

    void
    pam_conv_tty::set_auth (auth_ptr auth)
    {
      this->auth = weak_auth_ptr(auth);
    }

    time_t
    pam_conv_tty::get_warning_timeout ()
    {
      return this->warning_timeout;
    }

    void
    pam_conv_tty::set_warning_timeout (time_t timeout)
    {
      this->warning_timeout = timeout;
    }

    time_t
    pam_conv_tty::get_fatal_timeout ()
    {
      return this->fatal_timeout;
    }

    void
    pam_conv_tty::set_fatal_timeout (time_t timeout)
    {
      this->fatal_timeout = timeout;
    }

    int
    pam_conv_tty::get_delay ()
    {
      timer_expired = 0;
      time (&this->start_time);

      if (this->fatal_timeout != 0 &&
          this->start_time >= this->fatal_timeout)
        throw error(TIMEOUT);

      if (this->warning_timeout != 0 &&
          this->start_time >= this->warning_timeout)
        {
          error e(TIMEOUT_PENDING);
          log_ctty_exception_warning(e);
          return (this->fatal_timeout ?
                  this->fatal_timeout - this->start_time : 0);
        }

      if (this->warning_timeout != 0)
        return this->warning_timeout - this->start_time;
      else if (this->fatal_timeout != 0)
        return this->fatal_timeout - this->start_time;
      else
        return 0;
    }

    std::string
    pam_conv_tty::read_string (std::string message,
                               bool        echo)
    {
      if (CTTY_FILENO < 0)
        throw error(CTTY);

      struct termios orig_termios, noecho_termios;
      struct sigaction saved_signals;
      sigset_t old_sigs, new_sigs;
      bool use_termios = false;
      std::string retval;

      if (isatty(CTTY_FILENO))
        {
          use_termios = true;

          if (tcgetattr(CTTY_FILENO, &orig_termios) != 0)
            throw error(TERMIOS);

          memcpy(&noecho_termios, &orig_termios, sizeof(struct termios));

          if (echo == false)
            noecho_termios.c_lflag &= ~(ECHO);

          sigemptyset(&new_sigs);
          sigaddset(&new_sigs, SIGINT);
          sigaddset(&new_sigs, SIGTSTP);
          sigprocmask(SIG_BLOCK, &new_sigs, &old_sigs);
        }

      char input[PAM_MAX_MSG_SIZE];

      int delay = get_delay();

      while (delay >= 0)
        {
          cctty << message << std::flush;

          if (use_termios == true)
            tcsetattr(CTTY_FILENO, TCSAFLUSH, &noecho_termios);

          if (delay > 0 && set_alarm(delay, &saved_signals) == false)
            break;
          else
            {
              int nchars = read(CTTY_FILENO, input, PAM_MAX_MSG_SIZE - 1);
              if (use_termios)
                {
                  tcsetattr(CTTY_FILENO, TCSADRAIN, &orig_termios);
                  if (echo == false && timer_expired == true)
                    cctty << endl;
                }
              if (delay > 0)
                reset_alarm(&saved_signals);
              if (timer_expired == true)
                {
                  delay = get_delay();
                }
              else if (nchars > 0)
                {
                  if (echo == false)
                    cctty << endl;

                  if (input[nchars-1] == '\n')
                    input[--nchars] = '\0';
                  else
                    input[nchars] = '\0';

                  retval = input;
                  break;
                }
              else if (nchars == 0)
                {
                  if (echo == false)
                    cctty << endl;

                  retval = "";
                  break;
                }
            }
        }

      memset(input, 0, sizeof(input));

      if (use_termios == true)
        {
          sigprocmask(SIG_SETMASK, &old_sigs, 0);
          tcsetattr(CTTY_FILENO, TCSADRAIN, &orig_termios);
        }

      return retval;
    }

    void
    pam_conv_tty::conversation (pam_conv::message_list& messages)
    {
      log_debug(DEBUG_NOTICE) << "PAM TTY conversation handler started" << endl;

      for (auto& msg : messages)
        {
          switch (msg.type)
            {
            case pam_message::MESSAGE_PROMPT_NOECHO:
              log_debug(DEBUG_NOTICE) << "PAM TTY input prompt (noecho)" << endl;
              msg.response = read_string(msg.message, false);
              break;
            case pam_message::MESSAGE_PROMPT_ECHO:
              log_debug(DEBUG_NOTICE) << "PAM TTY input prompt (echo)" << endl;
              msg.response = read_string(msg.message, true);
              break;
            case pam_message::MESSAGE_ERROR:
              log_debug(DEBUG_NOTICE) << "PAM TTY output error" << endl;
              log_ctty_error() << msg.message << endl;
              break;
            case pam_message::MESSAGE_INFO:
              log_debug(DEBUG_NOTICE) << "PAM TTY output info" << endl;
              log_ctty_info() << msg.message << endl;
              break;
            default:
              throw error(msg.type, CONV_TYPE);
              break;
            }
        }

      log_debug(DEBUG_NOTICE) << "PAM TTY conversation handler ended" << endl;
    }

  }
}
