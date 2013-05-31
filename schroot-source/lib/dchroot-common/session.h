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

#ifndef DCHROOT_COMMON_SESSION_H
#define DCHROOT_COMMON_SESSION_H

#include <sbuild/session.h>

namespace dchroot_common
{

  /**
   * Basic session handler for dchroot sessions.
   *
   * This class provides common session functionality for dchroot and
   * dchroot-dsa, such as providing a schroot compatibility mode.  It
   * also prevents user switching when running sessions, which is
   * forbidden.
   */
  class session : public sbuild::session
  {
  public:
    /**
     * The constructor.
     *
     * @param service the PAM service name.
     * @param operation the session operation to perform.
     * @param chroots the chroots to act upon.
     */
    session (const std::string&         service,
             operation                  operation,
             const sbuild::session::chroot_list& chroots);

    /// The destructor.
    virtual ~session ();

  protected:
    virtual void
    run_impl ();

    virtual sbuild::string_list
    get_command_directories (sbuild::chroot::chroot::ptr& session_chroot,
                             const sbuild::environment&   env) const;
  };

}

#endif /* DCHROOT_COMMON_SESSION_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
