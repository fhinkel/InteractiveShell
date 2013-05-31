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

#ifndef BIN_COMMON_OPTION_ACTION_H
#define BIN_COMMON_OPTION_ACTION_H

#include <set>
#include <string>

namespace bin_common
{

  /**
   * Actions specified as command-line options.  This class contains
   * all allowed options.  This replaced the use of enums to allow
   * extension of the options by inheritance.
   *
   * @todo Construct from iterator pair.
   */
  class option_action
  {
  public:
    /// Program action.
    typedef std::string action_type;

    /// The constructor.
    option_action ();

    /// The destructor.
    virtual ~option_action ();

    /**
     * Add an action.  The specified action is added to the list of
     * permitted actions.
     * @param action the action to add.
     */
    void
    add (const action_type& action);

    /**
     * Get the default action.
     * @returns the default action, or an empty string if no default
     * action has been set.
     */
    action_type const&
    get_default ();

    /**
     * Set the default action.
     * @param action the action to set.
     */
    void
    set_default (const action_type& action);

    /**
     * Get the action to perform.
     * @returns the action, or the default action if no action has
     * been set, or an empty string if no default action has been set.
     */
    action_type const&
    get ();

    /**
     * Set the action to perform.  This detects if an action has
     * already been set (only one action may be specified at once).
     * @param action the action to set.
     * @todo Throw a custom error, and add a more informative error in
     * main::run.
     */
    void
    set (const action_type& action);

    /**
     * Check if an action is valid.
     * @param action the action to check.
     * @returns if action is a valid action, otherwise false.
     */
    bool
    valid (const action_type& action);

    /**
     * Set an action.
     *
     * @param action the action to set.
     * @returns the option_action object.
     */
    option_action& operator = (const action_type& action)
    {
      set(action);
      return *this;
    }

    /**
     * Does the option_action contain the same action as the specified action?
     *
     * @param action the action to check.
     * @returns true if the same, otherwise false.
     */
    bool operator == (const action_type& action)
    {
      if (get() == action)
        return true;
      else
        return false;
    }

    /**
     * Does the option_action not contain the same action as the
     * specified action?
     *
     * @param action the action to check.
     * @returns true if different, otherwise false.
     */
    bool operator != (const action_type& action)
    {
      return !(*this == action);
    }

  private:
    /// The container of the actions.
    typedef std::set<std::string> action_set;

    /// Default action.
    std::string default_action;

    /// Current action.
    std::string current_action;

    /// Allowed actions.
    action_set  actions;
  };

}

#endif /* BIN_COMMON_OPTION_ACTION_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
