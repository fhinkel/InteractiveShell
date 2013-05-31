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

#include <schroot/options.h>

#include <cstdlib>
#include <iostream>

#include <boost/format.hpp>
#include <boost/program_options.hpp>

using std::endl;
using boost::format;
using sbuild::_;
namespace opt = boost::program_options;

namespace schroot
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
      ("location",
       _("Print location of selected chroots"));

    chroot.add_options()
      ("all,a",
       _("Select all chroots and active sessions"))
      ("all-chroots",
       _("Select all chroots"))
      ("all-sessions",
       _("Select all active sessions"))
      ("all-source-chroots",
       _("Select all source chroots"))
      ("exclude-aliases",
       _("Do not include aliases"));

    chrootenv.add_options()
      ("directory,d", opt::value<std::string>(&this->directory),
       _("Directory to use"))
      ("shell,s", opt::value<std::string>(&this->shell),
       _("Shell to use as login shell"))
      ("user,u", opt::value<std::string>(&this->user),
       _("Username (default current user)"))
      ("preserve-environment,p",
       _("Preserve user environment"))
      ("option,o", opt::value<sbuild::string_list>(&this->useroptions),
       _("Set option"));

    session_actions.add_options()
      ("automatic-session",
       _("Begin, run and end a session automatically (default)"))
      ("begin-session,b",
       _("Begin a session; returns a session ID"))
      ("recover-session",
       _("Recover an existing session"))
      ("run-session,r",
       _("Run an existing session"))
      ("end-session,e",
       _("End an existing session"));

    session_options.add_options()
      ("session-name,n", opt::value<std::string>(&this->session_name),
       _("Session name (defaults to an automatically generated name)"))
      ("force,f",
       _("Force operation, even if it fails"));
  }


  void
  options::check_options ()
  {
    // Chain up to check general schroot options.
    schroot_common::options::check_options();

    if (vm.count("location"))
      this->action = ACTION_LOCATION;

    if (vm.count("all"))
      this->all = true;
    if (vm.count("all-chroots"))
      this->all_chroots = true;
    if (vm.count("all-sessions"))
      this->all_sessions = true;
    if (vm.count("all-source-chroots"))
      this->all_source_chroots = true;
    if (vm.count("exclude-aliases"))
      this->exclude_aliases = true;

    if (vm.count("preserve-environment"))
      this->preserve = true;

    if (vm.count("automatic-session"))
      this->action = ACTION_SESSION_AUTO;
    if (vm.count("begin-session"))
      this->action = ACTION_SESSION_BEGIN;
    if (vm.count("recover-session"))
      this->action = ACTION_SESSION_RECOVER;
    if (vm.count("run-session"))
      this->action = ACTION_SESSION_RUN;
    if (vm.count("end-session"))
      this->action = ACTION_SESSION_END;
    if (vm.count("force"))
      this->session_force = true;

    if (this->all == true)
      {
        this->all_chroots = true;
        this->all_sessions = true;
        this->all_source_chroots = true;
      }

    for (const auto& useroption : this->useroptions)
      {
        std::string::size_type sep = useroption.find_first_of('=', 0);
        std::string key = useroption.substr(0,sep);
        ++sep;
        std::string value = useroption.substr(sep);
        this->useroptions_map.insert(std::make_pair(key,value));
      }
  }

}
