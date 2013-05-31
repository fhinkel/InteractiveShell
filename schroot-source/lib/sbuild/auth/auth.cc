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

#include <sbuild/auth/auth.h>
#include <sbuild/util.h>

#include <cassert>
#include <cerrno>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <sstream>

#include <syslog.h>
#include <unistd.h>

#include <boost/format.hpp>

using std::cerr;
using std::endl;
using boost::format;

namespace sbuild
{
  namespace auth
  {

    template<>
    error<auth::error_code>::map_type
    error<auth::error_code>::error_strings =
      {
        {auth::auth::HOSTNAME,        N_("Failed to get hostname")},
        // TRANSLATORS: %1% = user name or user ID
        {auth::auth::USER,            N_("User ‘%1%’ not found")},
        // TRANSLATORS: %1% = group name or group ID
        {auth::auth::GROUP,           N_("Group ‘%1%’ not found")},
        {auth::auth::AUTHENTICATION,  N_("Authentication failed")},
        {auth::auth::AUTHORISATION,   N_("Access not authorised")},
        {auth::auth::PAM_DOUBLE_INIT, N_("PAM is already initialised")},
        {auth::auth::PAM,             N_("PAM error")},
        {auth::auth::PAM_END,         N_("PAM failed to shut down cleanly")}
      };

    auth::auth (const std::string& service_name):
      service(service_name),
      uid(getuid()),
      gid(getgid()),
      user(),
      command(),
      home("/"),
      wd(),
      shell("/bin/false"),
      user_environment(environ),
      ruid(getuid()),
      rgid(getgid()),
      ruser(),
      rgroup()
    {
      set_ruser(this->ruid);

      /* By default, the auth user is the same as the remote user. */
      set_user(this->ruser);
    }

    auth::~auth ()
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

    std::string const&
    auth::get_service () const
    {
      return this->service;
    }

    void
    auth::set_ruser (uid_t ruid)
    {
      passwd pwent(ruid);
      if (!pwent)
        {
          if (errno)
            throw error(ruid, USER, strerror(errno));
          else
            throw error(ruid, USER);
        }

      set_ruser(pwent);
    }

    void
    auth::set_ruser (const std::string& ruser)
    {
      passwd pwent(ruser);
      if (!pwent)
        {
          if (errno)
            throw error(ruser, USER, strerror(errno));
          else
            throw error(ruser, USER);
        }

      set_ruser(pwent);
    }

    void
    auth::set_ruser (const passwd& rpwent)
    {
      group grent(rpwent.pw_gid);
      if (!grent)
        {
          if (errno)
            throw error(rpwent.pw_gid, GROUP, strerror(errno));
          else
            throw error(rpwent.pw_gid, GROUP);
        }
      this->ruid = rpwent.pw_uid;
      this->rgid = rpwent.pw_gid;
      this->ruser = rpwent.pw_name;
      this->rgroup = grent.gr_name;

      log_debug(DEBUG_INFO)
        << format("auth ruid = %1%, rgid = %2%") % this->ruid % this->rgid
        << endl;
    }

    uid_t
    auth::get_uid () const
    {
      return this->uid;
    }

    gid_t
    auth::get_gid () const
    {
      return this->gid;
    }

    std::string const&
    auth::get_user () const
    {
      return this->user;
    }

    void
    auth::set_user (uid_t uid)
    {
      passwd pwent(uid);
      if (!pwent)
        {
          if (errno)
            throw error(uid, USER, strerror(errno));
          else
            throw error(uid, USER);
        }

      set_user(pwent);
    }

    void
    auth::set_user (const std::string& user)
    {
      passwd pwent(user);
      if (!pwent)
        {
          if (errno)
            throw error(user, USER, strerror(errno));
          else
            throw error(user, USER);
        }

      set_user(pwent);
    }

    void
    auth::set_user (const passwd& pwent)
    {
      this->uid = pwent.pw_uid;
      this->gid = pwent.pw_gid;
      this->user = pwent.pw_name;
      this->home = pwent.pw_dir;
      this->shell = pwent.pw_shell;

      log_debug(DEBUG_INFO)
        << format("auth uid = %1%, gid = %2%") % this->uid % this->gid
        << endl;
    }

    string_list const&
    auth::get_command () const
    {
      return this->command;
    }

    void
    auth::set_command (const string_list& command)
    {
      this->command = command;
    }

    std::string const&
    auth::get_home () const
    {
      return this->home;
    }

    std::string const&
    auth::get_wd () const
    {
      return this->wd;
    }

    void
    auth::set_wd (const std::string& wd)
    {
      this->wd = wd;
    }

    std::string const&
    auth::get_shell () const
    {
      return this->shell;
    }

    environment const&
    auth::get_user_environment () const
    {
      return this->user_environment;
    }

    void
    auth::set_user_environment (char **environment)
    {
      set_user_environment(sbuild::environment(environment));
    }

    void
    auth::set_user_environment (const environment& environment)
    {
      this->user_environment = environment;
    }

    environment
    auth::get_minimal_environment () const
    {
      environment minimal;

      // For security, PATH is always set to a sane state for root, but
      // only set in other cases if not preserving the environment.
      if (this->uid == 0)
        minimal.add(std::make_pair("PATH", "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"));
      else
        minimal.add(std::make_pair("PATH", "/usr/local/bin:/usr/bin:/bin"));

      if (!this->home.empty() )
        minimal.add(std::make_pair("HOME", this->home));
      else
        minimal.add(std::make_pair("HOME", "/"));

      if (!this->user.empty())
        {
          minimal.add(std::make_pair("LOGNAME", this->user));
          minimal.add(std::make_pair("USER", this->user));
        }
      {
        const char *term = getenv("TERM");
        if (term)
          minimal.add(std::make_pair("TERM", term));
      }
      if (!this->shell.empty())
        minimal.add(std::make_pair("SHELL", this->shell));

      return minimal;
    }

    environment
    auth::get_complete_environment () const
    {
      environment complete;

      complete += get_minimal_environment();
      complete += get_auth_environment();

      environment user = get_user_environment();

      // For security, we don't preserve the user's PATH when switching to
      // root.
      if (this->uid == 0)
        user.remove("PATH");

      complete += user;

      return complete;
    }

    uid_t
    auth::get_ruid () const
    {
      return this->ruid;
    }

    gid_t
    auth::get_rgid () const
    {
      return this->rgid;
    }

    std::string const&
    auth::get_ruser () const
    {
      return this->ruser;
    }

    std::string const&
    auth::get_rgroup () const
    {
      return this->rgroup;
    }

    void
    auth::start ()
    {
    }

    void
    auth::stop ()
    {
    }

    void
    auth::authenticate (status auth_status)
    {
    }

    void
    auth::setupenv ()
    {
    }

    void
    auth::account ()
    {
    }

    void
    auth::cred_establish ()
    {
    }

    void
    auth::cred_delete ()
    {
    }

    void
    auth::open_session ()
    {
    }

    void
    auth::close_session ()
    {
    }

  }
}
