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

#include <dchroot/options.h>

#include <cstdlib>
#include <iostream>

#include <boost/format.hpp>
#include <boost/program_options.hpp>

using std::endl;
using sbuild::_;
using boost::format;
namespace opt = boost::program_options;

namespace dchroot
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
      ("path,p", opt::value<std::string>(&this->chroot_path),
       _("Print path to selected chroot"));

    chroot.add_options()
      ("all,a",
       _("Select all chroots"));

    chrootenv.add_options()
      ("directory", opt::value<std::string>(&this->directory),
       _("Directory to use"))
      ("preserve-environment,d",
       _("Preserve user environment"));
  }

  void
  options::check_options ()
  {
    // Chain up to check general schroot options.
    schroot_common::options::check_options();

    if (vm.count("path"))
      {
        this->action = ACTION_LOCATION;
        this->chroots.clear();
        this->chroots.push_back(this->chroot_path);
      }

    if (vm.count("all"))
      {
        this->all = false;
        this->all_chroots = true;
        this->all_sessions = false;
      }

    if (vm.count("preserve-environment"))
      this->preserve = true;

    if (this->quiet && this->verbose)
      {
        sbuild::log_warning()
          << _("--quiet and --verbose may not be used at the same time")
          << endl;
        sbuild::log_info() << _("Using verbose output") << endl;
      }

    if (!this->chroots.empty() && all_used())
      {
        sbuild::log_warning()
          << _("--chroot and --all may not be used at the same time")
          << endl;
        sbuild::log_info() << _("Using --chroots only") << endl;
        this->all = this->all_chroots = this->all_sessions = false;
      }

    if (this->all == true)
      {
        this->all_chroots = true;
        this->all_sessions = true;
      }
  }

}
