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

#ifndef SBUILD_AUTH_DENY_H
#define SBUILD_AUTH_DENY_H

#include <sbuild/auth/auth.h>

namespace sbuild
{
  namespace auth
  {

    /**
     * Deny Authentication handler.
     *
     * deny handles user authentication, authorisation and session
     * management.  Unlike auth_pam, it does nothing.  All attempts to
     * authenticate will fail (deny).
     */
    class deny : public auth
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
      deny (const std::string& service_name);

    public:
      /**
       * The destructor.
       */
      virtual ~deny ();

      /**
       * Create an deny object.
       *
       * @param service_name the PAM service name.  This should be a
       * hard-coded constant string literal for safety and security.
       * This is passed to pam_start() when initialising PAM, and is
       * used to load the correct configuration file from /etc/pam.d.
       * @returns a shared pointer to the created object.
       */
      static auth::ptr
      create (const std::string& service_name);

      /**
       * Get the PAM environment.  This is the environment as set by PAM
       * modules.
       *
       * @returns an environment list.
       */
      virtual environment
      get_auth_environment () const;

      virtual void
      start ();

      virtual void
      stop ();

      virtual void
      authenticate (status auth_status);

      virtual bool
      is_initialised () const;

    protected:
      /// Is the serive initialised?
      bool         initialised;
      /// Minimal environment.
      environment  auth_environment;
    };

  }
}

#endif /* SBUILD_AUTH_DENY_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
