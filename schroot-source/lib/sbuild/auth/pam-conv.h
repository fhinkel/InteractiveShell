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

#ifndef SBUILD_AUTH_PAM_CONV_H
#define SBUILD_AUTH_PAM_CONV_H

#include <sbuild/auth/pam-message.h>
#include <sbuild/error.h>

#include <memory>
#include <vector>

#include <security/pam_appl.h>

namespace sbuild
{
  namespace auth
  {

    class pam;

    /**
     * Authentication conversation handler interface.
     *
     * This interface should be implemented by objects which handle
     * interaction with the user during authentication.
     *
     * This is a wrapper around the struct pam_conv PAM conversation
     * interface, and is used by auth when interacting with the user
     * during authentication.
     *
     * A simple implementation is provided in the form of
     * pam_conv_tty.  However, more complex implementations might hook
     * into the event loop of a GUI widget system, for example.
     *
     * The interface allows the setting of optional warning timeout
     * and fatal timeout values, which should default to 0 (not
     * enabled).  This is an absolute time after which a warning is
     * displayed or the conversation ends with an error.
     *
     * Note that the auth object must be specified, and must never be
     * void while the conversation is in progress.
     */
    class pam_conv
    {
    public:
      /// A list of messages.
      typedef std::vector<pam_message> message_list;
      /// A shared pointer to an pam object.
      typedef std::shared_ptr<pam> auth_ptr;
      /// A weak pointer to an pam object.
      typedef std::weak_ptr<pam> weak_auth_ptr;
      /// A shared_ptr to an pam_conv object.
      typedef std::shared_ptr<pam_conv> ptr;

    protected:
      /// The constructor.
      pam_conv ();

    public:
      /// The destructor.
      virtual ~pam_conv ();

      /**
       * Get the auth object.
       *
       * @returns the auth object.
       */
      virtual auth_ptr
      get_auth () = 0;

      /**
       * Set the auth object.
       *
       * @param auth the auth object.
       */
      virtual void
      set_auth (auth_ptr auth) = 0;

      /**
       * Get the time at which the user will be warned.
       *
       * @returns the time.
       */
      virtual time_t
      get_warning_timeout () = 0;

      /**
       * Set the time at which the user will be warned.
       *
       * @param timeout the time to set.
       */
      virtual void
      set_warning_timeout (time_t timeout) = 0;

      /**
       * Get the time at which the conversation will be terminated
       * with an error.
       *
       * @returns the time.
       */
      virtual time_t
      get_fatal_timeout () = 0;

      /**
       * Set the time at which the conversation will be terminated with
       * an error.
       *
       * @param timeout the time to set.
       */
      virtual void
      set_fatal_timeout (time_t timeout) = 0;

      /**
       * Hold a conversation with the user.
       *
       * Each of the messages detailed in messages should be displayed
       * to the user, asking for input where required.  The type of
       * message is indicated in the pam_message::type field of the
       * pam_message.  The pam_message::response field of the
       * pam_message should be filled in if input is required.
       *
       * On error, an exception will be thrown.
       *
       * @param messages the messages to display to the user, and
       * responses to return to the caller.
       */
      virtual void
      conversation (message_list& messages) = 0;
    };

  }
}

#endif /* SBUILD_AUTH_PAM_CONV_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
