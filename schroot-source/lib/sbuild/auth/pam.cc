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

#include <sbuild/auth/pam.h>
#include <sbuild/auth/pam-conv.h>
#include <sbuild/feature.h>

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

#if defined(__LINUX_PAM__)
#define PAM_TEXT_DOMAIN "Linux-PAM"
#elif defined(__sun__)
#define PAM_TEXT_DOMAIN "SUNW_OST_SYSOSPAM"
#endif

namespace sbuild
{
  namespace auth
  {

    namespace
    {

      /* This is the glue to link PAM user interaction with pam_conv. */
      int
      pam_conv_hook (int                          num_msg,
                     const struct ::pam_message **msgm,
                     struct ::pam_response      **response,
                     void                        *appdata_ptr)
      {
        log_debug(DEBUG_NOTICE) << "PAM conversation hook started" << endl;

        try
          {
            if (appdata_ptr == 0)
              return PAM_CONV_ERR;

            pam_conv *conv = static_cast<pam_conv *>(appdata_ptr);
            assert (conv != 0);

            log_debug(DEBUG_INFO) << "Found PAM conversation handler" << endl;

            /* Construct a message vector */
            pam_conv::message_list messages;
            for (int i = 0; i < num_msg; ++i)
              {
                const struct ::pam_message *source = msgm[i];

                pam_message
                  message(static_cast<pam_message::message_type>(source->msg_style),
                          source->msg);

                /* Replace PAM prompt */
                if (message.message == dgettext(PAM_TEXT_DOMAIN, "Password: ") ||
                    message.message == dgettext(PAM_TEXT_DOMAIN, "Password:"))
                  {
                    std::string user = "unknown"; // Set in case auth is void
                    std::shared_ptr<pam> auth = conv->get_auth();
                    assert(auth && auth.get() != 0); // Check auth is not void
                    if (auth && auth.get() != 0)
                      user = auth->get_user();
                    format fmt(_("[schroot] password for %1%: "));
                    fmt % user;
                    message.message = fmt.str();
                  }

                messages.push_back(message);
              }

            log_debug(DEBUG_INFO) << "Set PAM conversation message vector" << endl;

            /* Do the conversation; an exception will be thrown on failure */
            conv->conversation(messages);

            log_debug(DEBUG_INFO) << "Run PAM conversation" << endl;

            /* Copy response into **reponse */
            struct pam_response *reply =
              static_cast<struct pam_response *>
              (malloc(sizeof(struct pam_response) * num_msg));

            for (int i = 0; i < num_msg; ++i)
              {
                reply[i].resp_retcode = 0;
                reply[i].resp = strdup(messages[i].response.c_str());
              }

            *response = reply;
            reply = 0;

            log_debug(DEBUG_INFO) << "Set PAM conversation reply" << endl;

            return PAM_SUCCESS;
          }
        catch (const std::exception& e)
          {
            log_exception_error(e);
          }
        catch (...)
          {
            log_error() << _("An unknown exception occurred") << endl;
          }

        return PAM_CONV_ERR;
      }

      sbuild::feature feature_pam("PAM", N_("Pluggable Authentication Modules"));
    }

    pam::pam (const std::string& service_name):
      auth(service_name),
      pamh(0),
      conv()
    {
    }

    pam::~pam ()
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
    pam::create (const std::string& service_name)
    {
      return ptr(new pam(service_name));
    }

    environment
    pam::get_auth_environment () const
    {
      return environment(pam_getenvlist(this->pamh));
    }

    pam_conv::ptr&
    pam::get_conv ()
    {
      return this->conv;
    }

    void
    pam::set_conv (pam_conv::ptr& conv)
    {
      this->conv = conv;
    }

    void
    pam::start ()
    {
      assert(!this->user.empty());

      if (this->pamh != 0)
        {
          log_debug(DEBUG_CRITICAL)
            << "pam_start FAIL (already initialised)" << endl;
          throw error("Init PAM", PAM_DOUBLE_INIT);
        }

      struct ::pam_conv conv_hook =
        {
          pam_conv_hook,
          reinterpret_cast<void *>(this->conv.get())
        };

      int pam_status;

      if ((pam_status =
           pam_start(this->service.c_str(), this->user.c_str(),
                     &conv_hook, &this->pamh)) != PAM_SUCCESS)
        {
          log_debug(DEBUG_WARNING) << "pam_start FAIL" << endl;
          throw error(PAM, pam_strerror(pam_status));
        }

      log_debug(DEBUG_NOTICE) << "pam_start OK" << endl;
    }

    void
    pam::stop ()
    {
      if (this->pamh) // PAM must be initialised
        {
          int pam_status;

          if ((pam_status =
               pam_end(this->pamh, PAM_SUCCESS)) != PAM_SUCCESS)
            {
              log_debug(DEBUG_WARNING) << "pam_end FAIL" << endl;
              throw error(PAM_END);
            }

          this->pamh = 0;
          log_debug(DEBUG_NOTICE) << "pam_end OK" << endl;
        }
    }

    void
    pam::authenticate (status auth_status)
    {
      assert(!this->user.empty());
      assert(this->pamh != 0); // PAM must be initialised

      int pam_status;

      if ((pam_status =
           pam_set_item(this->pamh, PAM_RUSER, this->ruser.c_str())) != PAM_SUCCESS)
        {
          log_debug(DEBUG_WARNING) << "pam_set_item (PAM_RUSER) FAIL" << endl;
          throw error(_("Set RUSER"), PAM, pam_strerror(pam_status));
        }

      long hl = 256; /* sysconf(_SC_HOST_NAME_MAX); BROKEN with Debian libc6 2.3.2.ds1-22 */

      char *hostname = new char[hl];
      try
        {
          if (gethostname(hostname, hl) != 0)
            {
              log_debug(DEBUG_CRITICAL) << "gethostname FAIL" << endl;
              throw error(HOSTNAME, strerror(errno));
            }

          if ((pam_status =
               pam_set_item(this->pamh, PAM_RHOST, hostname)) != PAM_SUCCESS)
            {
              log_debug(DEBUG_WARNING) << "pam_set_item (PAM_RHOST) FAIL" << endl;
              throw error(_("Set RHOST"), PAM, pam_strerror(pam_status));
            }
        }
      catch (const error& e)
        {
          delete[] hostname;
          hostname = 0;
          throw;
        }
      delete[] hostname;
      hostname = 0;

      const char *tty = ttyname(STDIN_FILENO);
      if (tty)
        {
          if ((pam_status =
               pam_set_item(this->pamh, PAM_TTY, tty)) != PAM_SUCCESS)
            {
              log_debug(DEBUG_WARNING) << "pam_set_item (PAM_TTY) FAIL" << endl;
              throw error(_("Set TTY"), PAM, pam_strerror(pam_status));
            }
        }

      /* Authenticate as required. */
      switch (auth_status)
        {
        case STATUS_NONE:
          if ((pam_status = pam_set_item(this->pamh, PAM_USER, this->user.c_str()))
              != PAM_SUCCESS)
            {
              log_debug(DEBUG_WARNING) << "pam_set_item (PAM_USER) FAIL" << endl;
              throw error(_("Set USER"), PAM, pam_strerror(pam_status));
            }
          break;

        case STATUS_USER:
          if ((pam_status = pam_authenticate(this->pamh, 0)) != PAM_SUCCESS)
            {
              log_debug(DEBUG_INFO) << "pam_authenticate FAIL" << endl;
              syslog(LOG_AUTH|LOG_WARNING, "%s->%s Authentication failure",
                     this->ruser.c_str(), this->user.c_str());
              throw error(AUTHENTICATION, pam_strerror(pam_status));
            }
          log_debug(DEBUG_NOTICE) << "pam_authenticate OK" << endl;
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

    void
    pam::setupenv ()
    {
      assert(this->pamh != 0); // PAM must be initialised

      int pam_status;

      environment minimal(get_minimal_environment());

      // Move into PAM environment.
      for (const auto& env : minimal)
        {
          std::string env_string = env.first + "=" + env.second;
          if ((pam_status =
               pam_putenv(this->pamh, env_string.c_str())) != PAM_SUCCESS)
            {
              log_debug(DEBUG_WARNING) << "pam_putenv FAIL" << endl;
              throw error(PAM, pam_strerror(pam_status));
            }
          log_debug(DEBUG_INFO)
            << format("pam_putenv: set %1%=%2%") % env.first % env.second
            << endl;
        }

      log_debug(DEBUG_NOTICE) << "pam_putenv OK" << endl;
    }

    void
    pam::account ()
    {
      assert(this->pamh != 0); // PAM must be initialised

      int pam_status;

      if ((pam_status =
           pam_acct_mgmt(this->pamh, 0)) != PAM_SUCCESS)
        {
          /* We don't handle changing expired passwords here, since we are
             not login or ssh. */
          log_debug(DEBUG_WARNING) << "pam_acct_mgmt FAIL" << endl;
          throw error(PAM, pam_strerror(pam_status));
        }

      log_debug(DEBUG_NOTICE) << "pam_acct_mgmt OK" << endl;
    }

    void
    pam::cred_establish ()
    {
      assert(this->pamh != 0); // PAM must be initialised

      int pam_status;

      if ((pam_status =
           pam_setcred(this->pamh, PAM_ESTABLISH_CRED)) != PAM_SUCCESS)
        {
          log_debug(DEBUG_WARNING) << "pam_setcred FAIL" << endl;
          throw error(PAM, pam_strerror(pam_status));
        }

      log_debug(DEBUG_NOTICE) << "pam_setcred OK" << endl;

      const char *authuser = 0;
      const void *tmpcast = reinterpret_cast<const void *>(authuser);
      pam_get_item(this->pamh, PAM_USER, &tmpcast);
      log_debug(DEBUG_INFO)
        << format("PAM authentication succeeded for user %1%") % authuser
        << endl;
    }

    void
    pam::cred_delete ()
    {
      assert(this->pamh != 0); // PAM must be initialised

      int pam_status;

      if ((pam_status =
           pam_setcred(this->pamh, PAM_DELETE_CRED)) != PAM_SUCCESS)
        {
          log_debug(DEBUG_WARNING) << "pam_setcred (delete) FAIL" << endl;
          throw error(PAM, pam_strerror(pam_status));
        }

      log_debug(DEBUG_NOTICE) << "pam_setcred (delete) OK" << endl;
    }

    void
    pam::open_session ()
    {
      assert(this->pamh != 0); // PAM must be initialised

      int pam_status;

      if ((pam_status =
           pam_open_session(this->pamh, 0)) != PAM_SUCCESS)
        {
          log_debug(DEBUG_WARNING) << "pam_open_session FAIL" << endl;
          throw error(PAM, pam_strerror(pam_status));
        }

      log_debug(DEBUG_NOTICE) << "pam_open_session OK" << endl;
    }

    void
    pam::close_session ()
    {
      assert(this->pamh != 0); // PAM must be initialised

      int pam_status;

      if ((pam_status =
           pam_close_session(this->pamh, 0)) != PAM_SUCCESS)
        {
          log_debug(DEBUG_WARNING) << "pam_close_session FAIL" << endl;
          throw error(PAM, pam_strerror(pam_status));
        }

      log_debug(DEBUG_NOTICE) << "pam_close_session OK" << endl;
    }

    bool
    pam::is_initialised () const
    {
      return this->pamh != 0;
    }

    const char *
    pam::pam_strerror (int pam_error)
    {
      assert(this->pamh != 0); // PAM must be initialised

      return ::pam_strerror (this->pamh, pam_error);
    }

  }
}
