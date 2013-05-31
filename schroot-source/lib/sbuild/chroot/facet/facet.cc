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

#include <sbuild/chroot/chroot.h>
#include <sbuild/chroot/facet/facet.h>

#include <boost/format.hpp>

using boost::format;

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      facet::facet ():
        owner(0)
      {
      }

      facet::~facet ()
      {
      }

      void
      facet::set_chroot (chroot& chroot,
                         bool    copy)
      {
        this->owner = &chroot;
      }

      std::string const&
      facet::get_name () const
      {
        static const std::string name("facet");

        return name;
      }

      void
      facet::setup_env (environment& env) const
      {
      }

      facet::session_flags
      facet::get_session_flags () const
      {
        return SESSION_NOFLAGS;
      }

      void
      facet::get_details (format_detail& detail) const
      {
      }

      void
      facet::get_used_keys (string_list& used_keys) const
      {
      }

      void
      facet::get_keyfile (keyfile& keyfile) const
      {
      }

      void
      facet::set_keyfile (const keyfile& keyfile)
      {
      }

    }
  }
}
