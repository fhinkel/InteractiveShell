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

#ifndef SCHROOT_OPTIONS_H
#define SCHROOT_OPTIONS_H

#include <schroot-common/options.h>

namespace schroot
{

  /**
   * schroot command-line options.
   */
  class options : public schroot_common::options
  {
  public:
    /// The constructor.
    options ();

    /// The destructor.
    virtual ~options ();

  protected:
    virtual void
    add_options ();

    virtual void
    check_options ();
  };

}

#endif /* SCHROOT_OPTIONS_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */

