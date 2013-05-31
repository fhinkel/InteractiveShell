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

#ifndef SCHROOT_MAIN_H
#define SCHROOT_MAIN_H

#include <schroot-common/main.h>
#include <schroot-common/options.h>

/**
 * schroot program components.
 */
namespace schroot
{

  /**
   * Frontend for schroot.  This class is used to "run" schroot.
   */
  class main : public schroot_common::main
  {
  public:
    /**
     * The constructor.
     *
     * @param options the command-line options to use.
     */
    main (schroot_common::options::ptr& options);

    /// The destructor.
    virtual ~main ();

    /**
     * List chroots.
     */
    virtual void
    action_list ();

  protected:
    virtual void
    create_session(sbuild::session::operation sess_op);

    virtual void
    add_session_auth ();
  };

}

#endif /* SCHROOT_MAIN_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
