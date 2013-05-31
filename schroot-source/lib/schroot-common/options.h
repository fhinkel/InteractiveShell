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

#ifndef SCHROOT_COMMON_OPTIONS_H
#define SCHROOT_COMMON_OPTIONS_H

#include <sbuild/session.h>
#include <sbuild/types.h>

#include <bin-common/options.h>

#include <memory>
#include <string>
#include <vector>

#include <boost/program_options.hpp>

namespace schroot_common
{

  /**
   * Basic schroot command-line options.  This is specialised by the
   * frontends to suit their particular command-line options and
   * behaviour.  This class contains functionality and options common
   * to all schroot programs (schroot, dchroot, dchroot-dsa).
   */
  class options : public bin_common::options
  {
  public:
    /// Begin, run and end a session.
    static const action_type ACTION_SESSION_AUTO;
    /// Begin a session.
    static const action_type ACTION_SESSION_BEGIN;
    /// Recover an existing session.
    static const action_type ACTION_SESSION_RECOVER;
    /// Run an existing session.
    static const action_type ACTION_SESSION_RUN;
    /// End an existing session.
    static const action_type ACTION_SESSION_END;
    /// Display a list of chroots.
    static const action_type ACTION_LIST;
    /// Display chroot information.
    static const action_type ACTION_INFO;
    /// Display chroot location information.
    static const action_type ACTION_LOCATION;
    /// Display chroot configuration.
    static const action_type ACTION_CONFIG;

    /// A shared_ptr to an options object.
    typedef std::shared_ptr<options> ptr;

    /// The constructor.
    options ();

    /// The destructor.
    virtual ~options ();

    /// Chroots to use.
    sbuild::string_list  chroots;
    /// Chroot to print path.
    std::string          chroot_path;
    /// Command to run.
    sbuild::string_list  command;
    /// Directory to use.
    std::string          directory;
    /// Shell to use.
    std::string          shell;
    /// User to run as.
    std::string          user;
    /// Preserve environment.
    bool                 preserve;
    /// Use all chroots and sessions.
    bool                 all;
    /// Use all chroots.
    bool                 all_chroots;
    /// Use all sessions.
    bool                 all_sessions;
    /// Use all source_chroots.
    bool                 all_source_chroots;
    /// Exclude aliases in output.
    bool                 exclude_aliases;
    /// Load chroots.
    bool                 load_chroots;
    /// Load sessions.
    bool                 load_sessions;
    /// Session name.
    std::string          session_name;
    /// Force session operations.
    bool                 session_force;
    /// Options as a key=value list.
    sbuild::string_list  useroptions;
    /// Options in a string-string map.
    sbuild::string_map   useroptions_map;

  protected:
    /**
     * Check if any of the --all options have been used.
     *
     * @returns true if any of the options have been used, otherwise
     * false.
     */
    bool
    all_used () const
    {
      return (this->all || this->all_chroots || this->all_source_chroots || this->all_sessions);
    }

    virtual void
    add_options ();

    virtual void
    add_option_groups ();

    virtual void
    check_options ();

    virtual void
    check_actions ();

    /// Chroot options group.
    boost::program_options::options_description chroot;
    /// Chroot environment options group.
    boost::program_options::options_description chrootenv;
    /// Session actions group.
    boost::program_options::options_description session_actions;
    /// Session options group.
    boost::program_options::options_description session_options;
  };

}

#endif /* SCHROOT_COMMON_OPTIONS_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */

