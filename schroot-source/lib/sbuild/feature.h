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

#ifndef SBUILD_FEATURE_H
#define SBUILD_FEATURE_H

#include <map>
#include <ostream>
#include <string>

#include <boost/format.hpp>

namespace sbuild
{

  class feature
  {
  public:
    feature (const std::string& feature,
             const std::string& description);

    ~feature ();

    static std::ostream&
    print_features (std::ostream& stream);

  private:
    static std::map<std::string,std::string>&
    registered_features ();
  };

}

#endif /* SBUILD_FEATURE_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
