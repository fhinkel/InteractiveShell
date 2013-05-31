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

#ifndef BIN_COMMON_OPTIONS_H
#define BIN_COMMON_OPTIONS_H

#include <sbuild/types.h>

#include <bin-common/option-action.h>

#include <memory>
#include <string>
#include <stdexcept>

#include <boost/program_options.hpp>

namespace bin_common
{

  /**
   * Basic schroot command-line options.  This is specialised by the
   * frontends to suit their particular command-line options and
   * behaviour.  This class implements the functionality common to all
   * options parsing classes.
   */
  class options
  {
  public:
    /// A shared_ptr to an options object.
    typedef std::shared_ptr<options> ptr;
    /// Program action.
    typedef option_action::action_type action_type;

    /// Exception type.
    class error : public std::runtime_error
    {
    public:
      error(const std::string& error):
        runtime_error(error)
      {
      }

      virtual
      ~error() throw() {}
    };

    /// The constructor.
    options ();

    /// The destructor.
    virtual ~options ();

    /**
     * Parse the command-line options.
     *
     * @param argc the number of arguments
     * @param argv argument vector
     */
    void
    parse (int   argc,
           char *argv[]);

    /// Display program help.
    static const action_type ACTION_HELP;
    /// Display program version.
    static const action_type ACTION_VERSION;

    /// Action list.
    option_action action;

    /// Quiet messages.
    bool          quiet;
    /// Verbose messages.
    bool          verbose;

    /**
     * Get the visible options group.  This options group contains all
     * the options visible to the user.
     *
     * @returns the options_description.
     */
    boost::program_options::options_description const&
    get_visible_options() const;

  protected:
    /**
     * Add options to option groups.
     */
    virtual void
    add_options ();

    /**
     * Add option groups to container groups.
     */
    virtual void
    add_option_groups ();

    /**
     * Check options after parsing.
     */
    virtual void
    check_options ();

    /**
     * Check actions after parsing.
     */
    virtual void
    check_actions ();

    /// Actions options group.
    boost::program_options::options_description            actions;
    /// General options group.
    boost::program_options::options_description            general;
    /// Hidden options group.
    boost::program_options::options_description            hidden;
    /// Positional options group.
    boost::program_options::positional_options_description positional;
    /// Visible options container (used for --help).
    boost::program_options::options_description            visible;
    /// Global options container (used for parsing).
    boost::program_options::options_description            global;
    /// Variables map, filled during parsing.
    boost::program_options::variables_map                  vm;

  private:
    /// Debug level string.
    std::string debug_level;
  };

}

#endif /* BIN_COMMON_OPTIONS_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */

