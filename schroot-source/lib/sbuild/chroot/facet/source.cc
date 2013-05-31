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
#include <sbuild/chroot/facet/factory.h>
#include <sbuild/chroot/facet/source.h>

#include <cassert>

using boost::format;
using std::endl;

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      namespace
      {

        const factory::facet_info source_info =
          {
            "source",
            N_("Support for source chroots"),
            false,
            []() -> facet::ptr { return source::create(); }
          };

        factory source_register(source_info);

      }

      source::source ():
        facet()
      {
      }

      source::~source ()
      {
      }

      source::ptr
      source::create ()
      {
        return ptr(new source());
      }

      facet::ptr
      source::clone () const
      {
        return ptr(new source(*this));
      }

      std::string const&
      source::get_name () const
      {
        return source_info.name;
      }

    }
  }
}
