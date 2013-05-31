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

#include <sbuild/auth/deny.h>

#include <cassert>
#include <cerrno>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <sstream>

#include <syslog.h>

#include <boost/format.hpp>

using std::cerr;
using std::endl;
using boost::format;

namespace sbuild
{
  namespace auth
  {

    deny::deny (const std::string& service_name):
      auth(service_name),
      initialised(false)
    {
    }

    deny::~deny ()
    {
      // Shutdown PAM.
      try
        {
          stop();
        }
      catch (const error& e)
        {
          log_exception_error(e);
        }
    }

    auth::ptr
    deny::create (const std::string& service_name)
    {
      return ptr(new deny(service_name));
    }

    environment
    deny::get_auth_environment () const
    {
      return get_minimal_environment();
    }

    void
    deny::start ()
    {
      assert(!this->user.empty());

      if (this->initialised)
        {
          log_debug(DEBUG_CRITICAL)
            << "pam_start FAIL (already initialised)" << endl;
          throw error("Init PAM", PAM_DOUBLE_INIT);
        }

      this->initialised = true;
    }

    void
    deny::stop ()
    {
      this->initialised = false;
    }

    void
    deny::authenticate (status auth_status)
    {
      assert(this->initialised); // PAM must be initialised

      switch (auth_status)
        {
        case STATUS_NONE:
          break;

        case STATUS_USER:
          // We don't support user authentication, so throw an error if
          // the user is not root.  i.e. Only root->root is permitted.
          // All other authentication attempts fail.  Note that this could
          // be used to escape pam_rootok restrictions on systems with PAM
          // also available and pam_rootok not enabled.
          if (this->ruid != 0)
            throw error(AUTHENTICATION, strerror(ENOTSUP));
          break;

        case STATUS_FAIL:
          {
            log_debug(DEBUG_INFO) << "PAM auth premature FAIL" << endl;
            syslog(LOG_AUTH|LOG_WARNING,
                   "%s->%s Unauthorised",
                   this->ruser.c_str(), this->user.c_str());
            error e(AUTHORISATION);
            // TRANSLATORS: %1% = program name (PAM service name)
            std::string reason(_("You do not have permission to access the %1% service."));
            reason += '\n';
            reason += _("This failure will be reported.");
            format fmt(reason);
            fmt % this->service;
            e.set_reason(fmt.str());
            throw e;
          }
        default:
          break;
        }
    }

    bool
    deny::is_initialised () const
    {
      return this->initialised;
    }

  }
}
