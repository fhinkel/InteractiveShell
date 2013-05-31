/* Copyright © 2006-2013  Roger Leigh <rleigh@debian.org>
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

#include <bin-common/option-action.h>
#include <bin-common/options.h>

#include <iomanip>

#include <boost/format.hpp>
#include <boost/program_options.hpp>

using std::endl;
using boost::format;
using sbuild::_;
namespace opt = boost::program_options;

namespace bin_common
{

  option_action::option_action ():
    default_action(),
    current_action(),
    actions()
  {
  }

  option_action::~option_action ()
  {
  }

  void
  option_action::add (const action_type& action)
  {
    this->actions.insert(action);
  }

  option_action::action_type const&
  option_action::get_default ()
  {
    return this->default_action;
  }

  void
  option_action::set_default (const action_type& action)
  {
    if (valid(action))
      this->default_action = action;
    else
      throw bin_common::options::error((format(_("%1%: invalid action")) % action).str());
  }

  option_action::action_type const&
  option_action::get ()
  {
    if (this->current_action != "")
      return this->current_action;
    else
      return this->default_action;
  }

  void
  option_action::set (const action_type& action)
  {
    if (valid(action))
      {
        if (this->current_action == "")
          this->current_action = action;
        else
          throw bin_common::options::error
            (_("Only one action may be specified"));
      }
    else
      throw bin_common::options::error((format(_("%1%: invalid action")) % action).str());
  }

  bool
  option_action::valid (const action_type& action)
  {
    return this->actions.find(action) != this->actions.end();
  }

}
