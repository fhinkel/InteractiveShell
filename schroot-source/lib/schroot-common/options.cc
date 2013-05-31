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

#include <sbuild/util.h>

#include <schroot-common/options.h>

#include <cstdlib>
#include <iostream>
#include <stdexcept>

#include <boost/format.hpp>
#include <boost/program_options.hpp>

using std::endl;
using boost::format;
using sbuild::_;
namespace opt = boost::program_options;

namespace schroot_common
{

  const options::action_type options::ACTION_SESSION_AUTO ("session_auto");
  const options::action_type options::ACTION_SESSION_BEGIN ("session_begin");
  const options::action_type options::ACTION_SESSION_RECOVER ("session_recover");
  const options::action_type options::ACTION_SESSION_RUN ("session_run");
  const options::action_type options::ACTION_SESSION_END ("session_end");
  const options::action_type options::ACTION_LIST ("list");
  const options::action_type options::ACTION_INFO ("info");
  const options::action_type options::ACTION_LOCATION ("location");
  const options::action_type options::ACTION_CONFIG ("config");

  options::options ():
    bin_common::options (),
    chroots(),
    command(),
    directory(),
    shell(),
    user(),
    preserve(false),
    all(false),
    all_chroots(false),
    all_sessions(false),
    all_source_chroots(false),
    exclude_aliases(false),
    session_name(),
    session_force(false),
    useroptions(),
    useroptions_map(),
    chroot(_("Chroot selection")),
    chrootenv(_("Chroot environment")),
    session_actions(_("Session actions")),
    session_options(_("Session options"))
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

    action.add(ACTION_SESSION_AUTO);
    action.set_default(ACTION_SESSION_AUTO);
    action.add(ACTION_SESSION_BEGIN);
    action.add(ACTION_SESSION_RECOVER);
    action.add(ACTION_SESSION_RUN);
    action.add(ACTION_SESSION_END);
    action.add(ACTION_LIST);
    action.add(ACTION_INFO);
    action.add(ACTION_LOCATION);
    action.add(ACTION_CONFIG);

    actions.add_options()
      ("list,l",
       _("List available chroots"))
      ("info,i",
       _("Show information about selected chroots"))
      ("config",
       _("Dump configuration of selected chroots"));

    chroot.add_options()
      ("chroot,c", opt::value<sbuild::string_list>(&this->chroots),
       _("Use specified chroot"));

    hidden.add_options()
      ("command", opt::value<sbuild::string_list>(&this->command),
       _("Command to run"));

    positional.add("command", -1);
  }

  void
  options::add_option_groups ()
  {
    // Chain up to add basic option groups.
    bin_common::options::add_option_groups();

#ifndef BOOST_PROGRAM_OPTIONS_DESCRIPTION_OLD
    if (!chroot.options().empty())
#else
      if (!chroot.primary_keys().empty())
#endif
        {
          visible.add(chroot);
          global.add(chroot);
        }
#ifndef BOOST_PROGRAM_OPTIONS_DESCRIPTION_OLD
    if (!chrootenv.options().empty())
#else
      if (!chrootenv.primary_keys().empty())
#endif
        {
          visible.add(chrootenv);
          global.add(chrootenv);
        }
#ifndef BOOST_PROGRAM_OPTIONS_DESCRIPTION_OLD
    if (!session_actions.options().empty())
#else
      if (!session_actions.primary_keys().empty())
#endif
        {
          visible.add(session_actions);
          global.add(session_actions);
        }

#ifndef BOOST_PROGRAM_OPTIONS_DESCRIPTION_OLD
    if (!session_options.options().empty())
#else
      if (!session_options.primary_keys().empty())
#endif
        {
          visible.add(session_options);
          global.add(session_options);
        }
  }

  void
  options::check_options ()
  {
    // Chain up to check basic options.
    bin_common::options::check_options();

    if (vm.count("list"))
      this->action = ACTION_LIST;
    if (vm.count("info"))
      this->action = ACTION_INFO;
    if (vm.count("config"))
      this->action = ACTION_CONFIG;
  }

  void
  options::check_actions ()
  {
    // Chain up to check basic actions.
    bin_common::options::check_actions();

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
        this->all = this->all_chroots = this->all_source_chroots = this->all_sessions = false;
      }

    /* Determine which chroots to load and use. */
    if (this->action == ACTION_SESSION_AUTO)
      {
        // Only allow normal chroots
        this->load_chroots = true;
        this->load_sessions = false;
        this->all = this->all_sessions = false;

        // If no chroot was specified, fall back to the "default" chroot.
        if (this->chroots.empty() && all_used() == false)
          this->chroots.push_back("default");
      }
    else if (this->action == ACTION_SESSION_BEGIN)
      {
        // Only allow one session chroot
        this->load_chroots = true;
        this->load_sessions = false;
        if (this->chroots.size() != 1 || all_used())
          throw error
            (_("Exactly one chroot must be specified when beginning a session"));

        this->all = this->all_chroots = this->all_source_chroots = this->all_sessions = false;
      }
    else if (this->action == ACTION_SESSION_RECOVER ||
             this->action == ACTION_SESSION_RUN ||
             this->action == ACTION_SESSION_END)
      {
        // Session operations work on all chroots.
        this->load_chroots = this->load_sessions = true;

        if (!this->session_name.empty())
          throw error
            (_("--session-name is not permitted for the specified action; did you mean to use --chroot?"));
      }
    else if (this->action == ACTION_HELP ||
             this->action == ACTION_VERSION)
      {
        // Chroots don't make sense here.
        this->load_chroots = this->load_sessions = false;
        this->all = this->all_chroots = this->all_source_chroots = this->all_sessions = false;
      }
    else if (this->action == ACTION_LIST ||
             this->action == ACTION_INFO ||
             this->action == ACTION_LOCATION ||
             this->action == ACTION_CONFIG)
      {
        // If not specified otherwise, load normal chroots, but allow
        // --all options.
        if (!this->chroots.empty()) // chroot specified
          this->load_chroots = this->load_sessions = true;
        else if (!all_used()) // no chroots specified
          {
            this->all_chroots = true;
            if (this->action == ACTION_LIST || this->action == ACTION_INFO)
              this->all_source_chroots = true;
            this->load_chroots = true;
          }
        if (this->all_chroots || this->all_source_chroots)
          this->load_chroots = true;
        if (this->all_sessions)
          this->load_chroots = this->load_sessions = true;
      }
    else
      {
        // Something went wrong
        this->load_chroots = this->load_sessions = false;
        this->all = this->all_chroots = this->all_source_chroots = this->all_sessions = false;
        throw error(_("Unknown action specified"));
      }

    if (!this->session_name.empty() && this->action != ACTION_SESSION_BEGIN)
      throw error
        (_("--session-name is not permitted for the specified action"));

    if (!this->session_name.empty() &&
        !sbuild::is_valid_sessionname(this->session_name))
      throw error(_("Invalid session name"));
  }

}
