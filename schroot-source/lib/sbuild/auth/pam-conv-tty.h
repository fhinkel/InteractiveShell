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

#ifndef SBUILD_AUTH_PAM_CONV_TTY_H
#define SBUILD_AUTH_PAM_CONV_TTY_H

#include <sbuild/auth/pam-conv.h>
#include <sbuild/auth/auth.h>
#include <sbuild/custom-error.h>

#include <security/pam_appl.h>
#include <security/pam_misc.h>

namespace sbuild
{
  namespace auth
  {

    /**
     * @brief Authentication conversation handler for terminal devices.
     *
     * This class is an implementation of the auth_pam_conv interface,
     * and is used to interact with the user on a terminal (TTY)
     * interface.
     *
     * In order to implement timeouts, this class uses alarm(2).  This
     * has some important implications.  Global state is modified by the
     * object, so only one may be used at once in a single process.  In
     * addition, no other part of the process may set or unset the
     * SIGALRM handlers and the alarm(2) timer during the time PAM
     * authentication is proceeding.
     */
    class pam_conv_tty : public pam_conv
    {
    public:
      /// Error codes.
      enum error_code
        {
          CTTY,            ///< No controlling terminal.
          TIMEOUT,         ///< Timed out.
          TIMEOUT_PENDING, ///< Time is running out...
          TERMIOS,         ///< Failed to get terminal settings.
          CONV_TYPE        ///< Unsupported conversation type.
        };

      /// Exception type.
      typedef custom_error<error_code> error;

    private:
      /**
       * The constructor.
       *
       * @param auth The authentication object this conversation handler
       * will be associated with.
       */
      pam_conv_tty (auth_ptr auth);

    public:
      /// The destructor.
      virtual ~pam_conv_tty ();

      /**
       * Create an pam_conv_tty object.
       *
       * @param auth The authentication object this conversation handler
       * will be associated with.
       * @returns a shared pointer to the created object.
       */
      static ptr
      create (auth_ptr auth);

      virtual auth_ptr
      get_auth ();

      virtual void
      set_auth (auth_ptr auth);

      virtual time_t
      get_warning_timeout ();

      virtual void
      set_warning_timeout (time_t timeout);

      virtual time_t
      get_fatal_timeout ();

      virtual void
      set_fatal_timeout (time_t timeout);

      virtual void
      conversation (pam_conv::message_list& messages);

    private:
      /**
       * @brief Get the time delay before the next SIGALRM signal.
       *
       * If either the warning timeout or the fatal timeout have
       * expired, a message to notify the user is printed to stderr.  If
       * the fatal timeout is reached, an exception is thrown.
       *
       * @returns the delay in seconds, or 0 if no delay is set.
       */
      int get_delay ();

      /**
       * @brief Read user input from standard input.
       *
       * The prompt message is printed to prompt the user for input.  If
       * echo is true, the user input it echoed back to the terminal,
       * but if false, echoing is suppressed using termios(3).
       *
       * If the SIGALRM timer expires while waiting for input, this is
       * handled by re-checking the delay time which will warn the user
       * or cause the input routine to terminate if the fatal timeout
       * has expired.
       *
       * @param message the message to prompt the user for input.
       * @param echo echo user input to screen.
       * @returns a string, which is empty on failure.
       */
      std::string
      read_string (std::string message,
                   bool        echo);

      /// The auth object.
      weak_auth_ptr  auth;
      /// The time to warn at.
      time_t  warning_timeout;
      /// The time to end at.
      time_t  fatal_timeout;
      /// The time the current delay was obtained at.
      time_t  start_time;
    };

  }
}

#endif /* SBUILD_AUTH_PAM_CONV_TTY_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
