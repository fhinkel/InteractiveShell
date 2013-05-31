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

#ifndef LIBEXEC_LISTMOUNTS_OPTIONS_H
#define LIBEXEC_LISTMOUNTS_OPTIONS_H

#include <bin-common/options.h>

#include <string>

namespace schroot_listmounts
{

  /**
   * schroot-listmounts command-line options.
   */
  class options : public bin_common::options
  {
  public:
    /// A shared_ptr to an options object.
    typedef std::shared_ptr<options> ptr;

    /// Begin, run and end a session.
    static const action_type ACTION_LISTMOUNTS;

    /// The constructor.
    options ();

    /// The destructor.
    virtual ~options ();

    /// The mountpoint to check.
    std::string mountpoint;

  protected:
    virtual void
    add_options ();

    virtual void
    add_option_groups ();

    virtual void
    check_options ();

    /// Mount options group.
    boost::program_options::options_description mount;
  };

}

#endif /* LIBEXEC_LISTMOUNTS_OPTIONS_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
