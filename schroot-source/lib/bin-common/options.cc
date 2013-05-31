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
#include <sbuild/log.h>

#include <bin-common/options.h>

#include <cstdlib>
#include <iostream>

#include <boost/format.hpp>
#include <boost/program_options.hpp>

using std::endl;
using boost::format;
using sbuild::_;
namespace opt = boost::program_options;

namespace bin_common
{

  /// Display program help.
  const options::action_type options::ACTION_HELP ("help");
  /// Display program version.
  const options::action_type options::ACTION_VERSION ("version");

  options::options ():
    action(),
    quiet(false),
    verbose(false),
    actions(_("Actions")),
    general(_("General options")),
    hidden(_("Hidden options")),
    positional(),
    visible(),
    global(),
    vm()
  {
  }

  options::~options ()
  {
  }

  boost::program_options::options_description const&
  options::get_visible_options() const
  {
    return this->visible;
  }

  void
  options::parse (int   argc,
                  char *argv[])
  {
    add_options();
    add_option_groups();

    opt::store(opt::command_line_parser(argc, argv).
               options(global).positional(positional).run(), vm);
    opt::notify(vm);

    check_options();
    check_actions();
  }

  void
  options::add_options ()
  {
    this->action.add(ACTION_HELP);
    this->action.add(ACTION_VERSION);

    actions.add_options()
      ("help,h",
       _("Show help options"))
      ("version,V",
       _("Print version information"));

    general.add_options()
      ("quiet,q",
       _("Show less output"))
      ("verbose,v",
       _("Show more output"));

    hidden.add_options()
      ("debug", opt::value<std::string>(&this->debug_level),
       _("Enable debugging messages"));
  }

  void
  options::add_option_groups ()
  {
#ifndef BOOST_PROGRAM_OPTIONS_DESCRIPTION_OLD
    if (!actions.options().empty())
#else
      if (!actions.primary_keys().empty())
#endif
        {
          visible.add(actions);
          global.add(actions);
        }
#ifndef BOOST_PROGRAM_OPTIONS_DESCRIPTION_OLD
    if (!general.options().empty())
#else
      if (!general.primary_keys().empty())
#endif
        {
          visible.add(general);
          global.add(general);
        }
#ifndef BOOST_PROGRAM_OPTIONS_DESCRIPTION_OLD
    if (!hidden.options().empty())
#else
      if (!hidden.primary_keys().empty())
#endif
        global.add(hidden);
  }

  void
  options::check_options ()
  {
    if (vm.count("help"))
      this->action = ACTION_HELP;

    if (vm.count("version"))
      this->action = ACTION_VERSION;

    if (vm.count("quiet"))
      this->quiet = true;
    if (vm.count("verbose"))
      this->verbose = true;

    if (vm.count("debug"))
      {
        if (this->debug_level == "none")
          sbuild::debug_log_level = sbuild::DEBUG_NONE;
        else if (this->debug_level == "notice")
          sbuild::debug_log_level = sbuild::DEBUG_NOTICE;
        else if (this->debug_level == "info")
          sbuild::debug_log_level = sbuild::DEBUG_INFO;
        else if (this->debug_level == "warning")
          sbuild::debug_log_level = sbuild::DEBUG_WARNING;
        else if (this->debug_level == "critical")
          sbuild::debug_log_level = sbuild::DEBUG_CRITICAL;
        else
          throw error(_("Invalid debug level"));
      }
    else
      sbuild::debug_log_level = sbuild::DEBUG_NONE;
  }

  void
  options::check_actions ()
  {
  }

}
