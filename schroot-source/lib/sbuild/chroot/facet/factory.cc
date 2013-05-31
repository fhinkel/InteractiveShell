/* Copyright © 2011-2013  Roger Leigh <rleigh@debian.org>
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

#include <ostream>

#include <sbuild/chroot/facet/factory.h>
#include <sbuild/i18n.h>

#include <boost/format.hpp>

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      factory::factory(const facet_info& info)
      {
        registered_facets().insert(std::make_pair(info.name, &info));
      }

      factory::~factory()
      {
      }

      std::ostream&
      factory::print_facets(std::ostream& stream)
      {
        boost::format fmt("  %1$-17s %2%\n");

        const map_type& facets = registered_facets();
        for (const auto& facet : facets)
          stream << fmt % facet.first % gettext(facet.second->description);

        return stream;
      }

      facet::ptr
      factory::create (const std::string& name)
      {
        facet::ptr ret;

        const map_type& facets = registered_facets();

        map_type::const_iterator info = facets.find(name);
        if (info == facets.end())
          throw chroot::error(name, chroot::FACET_INVALID);
        ret = info->second->create();

        return ret;
      }

      std::vector<facet::ptr>
      factory::create_auto ()
      {
        std::vector<facet::ptr> ret;

        for (const auto& facet : registered_facets())
          {
            if (facet.second->auto_install)
              ret.push_back(facet.second->create());
          }

        return ret;
      }

      factory::map_type&
      factory::registered_facets ()
      {
        static map_type facets;
        return facets;
      }

    }
  }
}
