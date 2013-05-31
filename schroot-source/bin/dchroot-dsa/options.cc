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

#include <dchroot-dsa/options.h>

#include <sbuild/util.h>

#include <cstdlib>
#include <iostream>

#include <boost/format.hpp>
#include <boost/program_options.hpp>

using std::endl;
using sbuild::_;
using boost::format;
namespace opt = boost::program_options;

namespace dchroot_dsa
{

  options::options ():
    schroot_common::options()
  {
  }

  options::~options ()
  {
  }

  void
  options::add_options ()
  {
    // Chain up to add general schroot options.
    schroot_common::options::add_options();

    actions.add_options()
      ("listpaths,p",
       _("Print paths to available chroots"));

    chroot.add_options()
      ("all,a",
       _("Select all chroots"));

    chrootenv.add_options()
      ("directory,d", opt::value<std::string>(&this->directory),
       _("Directory to use"));
  }

  void
  options::check_options ()
  {
    // Chain up to check general schroot options.
    schroot_common::options::check_options();

    if (vm.count("listpaths"))
      this->action = ACTION_LOCATION;

    if (vm.count("all"))
      {
        this->all = false;
        this->all_chroots = true;
        this->all_sessions = false;
      }

    // Always preserve environment.
    this->preserve = true;

    // If no chroots specified, use the first non-option.
    if (this->chroots.empty() && !this->command.empty())
      {
        this->chroots.push_back(this->command[0]);
        this->command.erase(this->command.begin());
      }

    // dchroot-dsa only allows one command.
    if (this->command.size() > 1)
      throw error(_("Only one command may be specified"));

    if (!this->command.empty() &&
        !sbuild::is_absname(this->command[0]))
      throw error(_("Command must have an absolute path"));

    if (this->chroots.empty() && !all_used() &&
        (this->action != ACTION_CONFIG &&
         this->action != ACTION_INFO &&
         this->action != ACTION_LIST &&
         this->action != ACTION_LOCATION &&
         this->action != ACTION_HELP &&
         this->action != ACTION_VERSION))
      throw error(_("No chroot specified"));
  }

}
