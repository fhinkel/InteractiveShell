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

#ifndef SBUILD_AUTH_PAM_H
#define SBUILD_AUTH_PAM_H

#include <sbuild/auth/auth.h>
#include <sbuild/auth/pam-conv.h>

#include <security/pam_appl.h>

namespace sbuild
{
  namespace auth
  {

    /**
     * Authentication handler.
     *
     * pam handles user authentication, authorisation and session
     * management using the Pluggable Authentication Modules (PAM)
     * library.  It is essentially an object-oriented wrapper around PAM.
     */
    class pam : public auth
    {
    private:
      /**
       * The constructor.
       *
       * @param service_name the PAM service name.  This should be a
       * hard-coded constant string literal for safety and security.
       * This is passed to pam_start() when initialising PAM, and is
       * used to load the correct configuration file from /etc/pam.d.
       */
      pam (const std::string& service_name);

    public:
      /**
       * The destructor.
       */
      virtual ~pam ();

      /**
       * Create an pam object.
       *
       * @param service_name the PAM service name.  This should be a
       * hard-coded constant string literal for safety and security.
       * This is passed to pam_start() when initialising PAM, and is
       * used to load the correct configuration file from /etc/pam.d.
       * @returns a shared pointer to the created object.
       */
      static auth::ptr
      create (const std::string& service_name);

      virtual environment
      get_auth_environment () const;

      /**
       * Get the conversation handler.
       *
       * @returns a shared pointer to the conversation handler.
       */
      pam_conv::ptr&
      get_conv ();

      /**
       * Set the conversation handler.
       *
       * @param conv a shared pointer to the conversation handler.
       */
      void
      set_conv (pam_conv::ptr& conv);

      virtual void
      start ();

      virtual void
      stop ();

      virtual void
      authenticate (status auth_status);

      virtual void
      setupenv ();

      virtual void
      account ();

      virtual void
      cred_establish ();

      virtual void
      cred_delete ();

      virtual void
      open_session ();

      virtual void
      close_session ();

      /**
       * Check if PAM is initialised (i.e. start has been called).
       * @returns true if initialised, otherwise false.
       */
      virtual bool
      is_initialised () const;

    private:
      /**
       * Get a description of a PAM error.
       *
       * @param pam_error the PAM error number.
       * @returns the description.
       */
      const char *
      pam_strerror (int pam_error);

      /// The PAM handle.
      pam_handle_t *pamh;
      /// The PAM conversation handler.
      pam_conv::ptr conv;
    };

  }
}

#endif /* SBUILD_AUTH_PAM_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
