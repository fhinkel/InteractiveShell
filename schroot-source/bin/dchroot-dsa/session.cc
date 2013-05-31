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

#include <dchroot-dsa/session.h>

#include <cassert>
#include <cerrno>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <memory>

#include <unistd.h>

#include <syslog.h>

#include <boost/format.hpp>

using std::cout;
using std::endl;
using sbuild::_;
using boost::format;

namespace dchroot_dsa
{

  session::session (const std::string&         service,
                    operation                  operation,
                    const sbuild::session::chroot_list& chroots):
    dchroot_common::session(service, operation, chroots)
  {
  }

  session::~session ()
  {
  }

  sbuild::string_list
  session::get_login_directories (sbuild::chroot::chroot::ptr& session_chroot,
                                  const sbuild::environment&   env) const
  {
    sbuild::string_list ret;

    const std::string& wd(get_auth()->get_wd());
    if (!wd.empty())
      {
        // Set specified working directory.
        ret.push_back(wd);
      }
    else
      {
        ret.push_back(get_auth()->get_home());

        // Final fallback to root.
        if (std::find(ret.begin(), ret.end(), "/") == ret.end())
          ret.push_back("/");
      }

    return ret;
  }

  void
  session::get_user_command (sbuild::chroot::chroot::ptr& session_chroot,
                             std::string&                 file,
                             sbuild::string_list&         command,
                             const sbuild::environment&   env) const
  {
    std::string programstring = command[0];
    file = programstring;

    if (!sbuild::is_absname(file))
      throw error(file, COMMAND_ABS);

    std::string commandstring = sbuild::string_list_to_string(command, " ");
    sbuild::log_debug(sbuild::DEBUG_NOTICE)
      << format("Running command: %1%") % commandstring << endl;
    if (get_auth()->get_uid() == 0 ||
        get_auth()->get_ruid() != get_auth()->get_uid())
      syslog(LOG_USER|LOG_NOTICE, "[%s chroot] (%s->%s) Running command: \"%s\"",
             session_chroot->get_name().c_str(),
             get_auth()->get_ruser().c_str(),
             get_auth()->get_user().c_str(),
             commandstring.c_str());

    if (session_chroot->get_verbosity() != sbuild::chroot::chroot::VERBOSITY_QUIET)
      {
        std::string format_string;
        // TRANSLATORS: %1% = chroot name
        // TRANSLATORS: %2% = command
        format_string = (_("[%1% chroot] Running command: “%2%”"));

        format fmt(format_string);
        fmt % session_chroot->get_name()
          % programstring;
        sbuild::log_info() << fmt << endl;
      }
  }

}
