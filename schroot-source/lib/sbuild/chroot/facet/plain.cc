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

#include <sbuild/chroot/facet/factory.h>
#include <sbuild/chroot/facet/plain.h>
#include <sbuild/chroot/facet/session-clonable.h>
#include <sbuild/format-detail.h>
#include <sbuild/util.h>

#include <cassert>
#include <cerrno>
#include <cstring>

#include <boost/format.hpp>

using boost::format;

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      namespace
      {

        const factory::facet_info plain_info =
          {
            "plain",
            N_("Support for ‘plain’ chroots"),
            false,
            []() -> facet::ptr { return plain::create(); }
          };

        factory plain_register(plain_info);

      }

      plain::plain ():
        directory_base()
      {
      }

      plain::~plain ()
      {
      }

      plain::plain (const plain& rhs):
        directory_base(rhs)
      {
      }

      std::string const&
      plain::get_name () const
      {
        return plain_info.name;
      }

      plain::ptr
      plain::create ()
      {
        return ptr(new plain());
      }

      facet::ptr
      plain::clone () const
      {
        return ptr(new plain(*this));
      }

      std::string
      plain::get_path () const
      {
        return get_directory();
      }

    }
  }
}
