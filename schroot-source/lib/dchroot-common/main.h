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

#ifndef DCHROOT_COMMON_MAIN_H
#define DCHROOT_COMMON_MAIN_H

#include <schroot-common/main.h>
#include <schroot-common/options.h>

namespace dchroot_common
{

  /**
   * Frontend base class for dchroot.  This class contains frontend
   * functionality common to dchroot and dchroot-dsa.
   */
  class main : public schroot_common::main
  {
  public:
    /**
     * The constructor.
     *
     * @param program_name the program name.
     * @param program_usage the program usage message.
     * @param options the command-line options to use.
     */
    main (const std::string&            program_name,
          const std::string&            program_usage,
          schroot_common::options::ptr& options);

    /// The destructor.
    virtual ~main ();

  protected:
    virtual void
    action_list ();
  };

}

#endif /* DCHROOT_COMMON_MAIN_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
