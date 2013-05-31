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

#include <iostream>

#include <sbuild/feature.h>
#include <sbuild/i18n.h>

namespace sbuild
{

  feature::feature(const std::string& feature,
                   const std::string& description)
  {
    registered_features().insert(std::make_pair(feature, description));
  }

  feature::~feature()
  {
  }

  std::ostream&
  feature::print_features(std::ostream& stream)
  {
    boost::format fmt("  %1$-12s %2%\n");

    std::map<std::string,std::string>& features = registered_features();
    for (const auto& feature : features)
      stream << fmt % feature.first % gettext(feature.second);

    return stream;
  }

  std::map<std::string,std::string>&
  feature::registered_features ()
  {
    static std::map<std::string,std::string> features;
    return features;
  }

}
