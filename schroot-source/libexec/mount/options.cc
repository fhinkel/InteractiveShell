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

#include <sbuild/i18n.h>
#include <sbuild/util.h>

#include <libexec/mount/options.h>

#include <cstdlib>
#include <iostream>

#include <boost/format.hpp>
#include <boost/program_options.hpp>

using std::endl;
using boost::format;
using sbuild::_;
namespace opt = boost::program_options;

namespace schroot_mount
{

  const options::action_type options::ACTION_MOUNT ("mount");

  options::options ():
    bin_common::options(),
    dry_run(false),
    fstab(),
    mountpoint(),
    mount(_("Mount"))
  {
  }

  options::~options ()
  {
  }

  void
  options::add_options ()
  {
    // Chain up to add basic options.
    bin_common::options::add_options();

    action.add(ACTION_MOUNT);
    action.set_default(ACTION_MOUNT);


    mount.add_options()
      ("dry-run,d",
       _("Perform a simulation of actions which would be taken"))
      ("fstab,f", opt::value<std::string>(&this->fstab),
       _("fstab file to read (full path)"))
      ("mountpoint,m", opt::value<std::string>(&this->mountpoint),
       _("Mountpoint to check (full path)"));
  }

  void
  options::add_option_groups ()
  {
    // Chain up to add basic option groups.
    bin_common::options::add_option_groups();

#ifndef BOOST_PROGRAM_OPTIONS_DESCRIPTION_OLD
    if (!mount.options().empty())
#else
      if (!mount.primary_keys().empty())
#endif
        {
          visible.add(mount);
          global.add(mount);
        }
  }

  void
  options::check_options ()
  {
    // Chain up to check basic options.
    bin_common::options::check_options();

    if (vm.count("dry-run"))
      this->dry_run = true;

    this->mountpoint = sbuild::normalname(this->mountpoint);

    if (this->action == ACTION_MOUNT &&
        this->mountpoint.empty())
      throw error(_("No mount point specified"));
  }

}
