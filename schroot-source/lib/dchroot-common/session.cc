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

#include <dchroot-common/session.h>

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

namespace dchroot_common
{

  session::session (const std::string&  service,
                    operation           operation,
                    const sbuild::session::chroot_list& chroots):
    sbuild::session(service, operation, chroots)
  {
  }

  session::~session ()
  {
  }

  void
  session::run_impl ()
  {
    if (get_auth()->get_ruid() != get_auth()->get_uid())
      throw error(get_auth()->get_ruser(), get_auth()->get_user(), USER_SWITCH,
                  _("dchroot session restriction"));

    sbuild::session::run_impl();
  }

  sbuild::string_list
  session::get_command_directories (sbuild::chroot::chroot::ptr& session_chroot,
                                    const sbuild::environment&   env) const
  {
    // dchroot does not treat logins differently from commands with
    // respect to the cwd inside the chroot.
    return get_login_directories(session_chroot, env);
  }

}
