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

#include <sbuild/chroot/chroot.h>
#ifdef SBUILD_FEATURE_PERSONALITY
#include <sbuild/chroot/facet/personality.h>
#endif // SBUILD_FEATURE_PERSONALITY
#include <sbuild/chroot/facet/session.h>
#include <sbuild/chroot/facet/session-clonable.h>
#ifdef SBUILD_FEATURE_UNSHARE
#include <sbuild/chroot/facet/unshare.h>
#endif // SBUILD_FEATURE_UNSHARE
#include <sbuild/chroot/facet/userdata.h>
#ifdef SBUILD_FEATURE_PAM
#include <sbuild/auth/pam.h>
#include <sbuild/auth/pam-conv.h>
#include <sbuild/auth/pam-conv-tty.h>
#else
#include <sbuild/auth/deny.h>
#endif // SBUILD_FEATURE_PAM
#include <sbuild/ctty.h>
#include <sbuild/feature.h>
#include <sbuild/run-parts.h>
#include <sbuild/session.h>
#include <sbuild/util.h>

#include <cassert>
#include <cerrno>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <memory>

#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <termios.h>
#include <unistd.h>

#include <syslog.h>

#include <boost/format.hpp>

using std::cout;
using std::endl;
using boost::format;

namespace sbuild
{

  namespace
  {

    volatile bool sighup_called = false;
    volatile bool sigint_called = false;
    volatile bool sigterm_called = false;

    /**
     * Handle the SIGHUP signal.
     *
     * @param ignore the signal number.
     */
    void
    sighup_handler (int ignore)
    {
      /* This exists so that system calls get interrupted. */
      sighup_called = true;
    }

    /**
     * Handle the SIGINT signal.
     *
     * We explicitly do nothing with SIGINT, and rely on the exit status
     * of child processes to determine if we should care.  We want to
     * make sure any child process (which will also have received
     * SIGINT) has exited before we do anything, and some child
     * processes (for example, emacs) may expect SIGINT during normal
     * operation.  See http://www.cons.org/cracauer/sigint.html for a
     * good discussion of SIGINT handling.

     * @param ignore the signal number.
     */
    void
    sigint_handler (int ignore)
    {
      /*
       * Allows us to detect if an interrupted waitpid() was interrupted
       * due to SIGINT or something else.  We may also want to use this
       * at exit time to see if we should re-kill ourselves with SIGINT.
       */
      sigint_called = true;
    }

    /**
     * Handle the SIGTERM signal.
     *
     * @param ignore the signal number.
     */
    void
    sigterm_handler (int ignore)
    {
      /* This exists so that system calls get interrupted. */
      sigterm_called = true;
    }

#ifdef SBUILD_DEBUG
    volatile bool child_wait = true;
#endif

  }

  template<>
  error<session::error_code>::map_type
  error<session::error_code>::error_strings =
    {
      // TRANSLATORS: %1% = directory
      {session::CHDIR,          N_("Failed to change to directory ‘%1%’")},
      // TRANSLATORS: %4% = directory
      {session::CHDIR_FB,       N_("Falling back to directory ‘%4%’")},
      {session::CHILD_CORE,     N_("Child dumped core")},
      {session::CHILD_FAIL,     N_("Child exited abnormally (reason unknown; not a signal or core dump)")},
      {session::CHILD_FORK,     N_("Failed to fork child")},
      // TRANSLATORS: %4% = signal name
      {session::CHILD_SIGNAL,   N_("Child terminated by signal ‘%4%’")},
      {session::CHILD_WAIT,     N_("Wait for child failed")},
      // TRANSLATORS: %1% = directory
      {session::CHROOT,         N_("Failed to change root to directory ‘%1%’")},
      // TRANSLATORS: %1% = chroot name
      {session::CHROOT_ALIAS,   N_("No chroot found matching name or alias ‘%1%’")},
      {session::CHROOT_LOCK,    N_("Failed to lock chroot")},
      {session::CHROOT_NOTFOUND,N_("%1%: Chroot not found")},
      {session::CHROOT_SETUP,   N_("Chroot setup failed")},
      // TRANSLATORS: %1% = chroot name
      {session::CHROOT_UNLOCK,  N_("Failed to unlock chroot")},
      // TRANSLATORS: %1% = command
      {session::COMMAND_ABS,    N_("Command “%1%” must have an absolute path")},
      // TRANSLATORS: %1% = command
      {session::EXEC,           N_("Failed to execute “%1%”")},
      // TRANSLATORS: A supplementary group is the list of additional
      // system groups a user belongs to, in addition to their default
      // group.
      {session::GROUP_GET_SUP,  N_("Failed to get supplementary groups")},
      // TRANSLATORS: A supplementary group is the list of additional
      // system groups a user belongs to, in addition to their default
      // group.
      {session::GROUP_GET_SUPC, N_("Failed to get supplementary group count")},
      // TRANSLATORS: %1% = integer group ID
      {session::GROUP_SET,      N_("Failed to set group ‘%1%’")},
      {session::GROUP_SET_SUP,  N_("Failed to set supplementary groups")},
      // TRANSLATORS: %1% = group name
      {session::GROUP_UNKNOWN,  N_("Group ‘%1%’ not found")},
      {session::PAM,            N_("PAM error")},
      {session::ROOT_DROP,      N_("Failed to drop root permissions")},
      // TRANSLATORS: %1% = chroot name
      // TRANSLATORS: %4% = session identifier
      {session::SET_SESSION_ID, N_("%1%: Chroot does not support setting a session ID; ignoring session ID ‘%4%’")},
      // TRANSLATORS: %1% = command
      {session::SHELL,          N_("Shell ‘%1%’ not available")},
      // TRANSLATORS: %4% = command
      {session::SHELL_FB,       N_("Falling back to shell ‘%4%’")},
      // TRANSLATORS: %4% = signal name
      {session::SIGNAL_CATCH,   N_("Caught signal ‘%4%’")},
      // TRANSLATORS: %4% = signal name
      {session::SIGNAL_SET,     N_("Failed to set signal handler ‘%4%’")},
      // TRANSLATORS: %1% = integer user ID
      {session::USER_SET,       N_("Failed to set user ‘%1%’")},
      // TRANSLATORS: %1% = user name
      // TRANSLATORS: %2% = user name
      // TRANSLATORS: Please translate "->" as a right arrow, e.g. U+2192
      {session::USER_SWITCH,    N_("(%1%→%2%): User switching is not permitted")}
    };

  session::session (const std::string&  service,
                    operation           operation,
                    const chroot_list&  chroots):
    authstat(
#ifdef SBUILD_FEATURE_PAM
             auth::pam::create(service)
#else
             auth::deny::create(service)
#endif // SBUILD_FEATURE_PAM
             ),
    chroots(chroots),
    chroot_status(true),
    lock_status(true),
    child_status(EXIT_FAILURE),
    session_operation(operation),
    session_id(),
    force(false),
    saved_sighup_signal(),
    saved_sigint_signal(),
    saved_sigterm_signal(),
    saved_termios(),
    termios_ok(false),
    verbosity(),
    preserve_environment(false),
    shell(),
    user_options(),
    cwd(sbuild::getcwd())
  {
  }

  session::~session ()
  {
  }

  auth::auth::ptr const&
  session::get_auth () const
  {
    return this->authstat;
  }

  void
  session::set_auth (auth::auth::ptr& auth)
  {
    this->authstat = auth;
  }

  session::chroot_list const&
  session::get_chroots () const
  {
    return this->chroots;
  }

  void
  session::set_chroots (const chroot_list& chroots)
  {
    this->chroots = chroots;
  }

  session::operation
  session::get_operation () const
  {
    return this->session_operation;
  }

  void
  session::set_operation (operation operation)
  {
    this->session_operation = operation;
  }

  std::string const&
  session::get_session_id () const
  {
    return this->session_id;
  }

  void
  session::set_session_id (const std::string& session_id)
  {
    this->session_id = session_id;
  }

  std::string const&
  session::get_verbosity () const
  {
    return this->verbosity;
  }

  void
  session::set_verbosity (const std::string& verbosity)
  {
    this->verbosity = verbosity;
  }

  bool
  session::get_preserve_environment () const
  {
    return this->preserve_environment;
  }

  void
  session::set_preserve_environment (bool preserve_environment)
  {
    this->preserve_environment = preserve_environment;
  }

  std::string const&
  session::get_shell_override () const
  {
    return this->shell;
  }

  void
  session::set_shell_override (const std::string& shell)
  {
    this->shell = shell;
  }

  string_map const&
  session::get_user_options () const
  {
    return this->user_options;
  }

  void
  session::set_user_options (const string_map& user_options)
  {
    this->user_options = user_options;
  }

  bool
  session::get_force () const
  {
    return this->force;
  }

  void
  session::set_force (bool force)
  {
    this->force = force;
  }

  void
  session::save_termios ()
  {
    const string_list& command(this->authstat->get_command());

    this->termios_ok = false;

    // Save if running a login shell and have a controlling terminal.
    if (CTTY_FILENO >= 0 &&
        (command.empty() || command[0].empty()))
      {
        if (tcgetattr(CTTY_FILENO, &this->saved_termios) < 0)
          {
            log_warning()
              << _("Error saving terminal settings")
              << endl;
          }
        else
          this->termios_ok = true;
      }
  }

  void
  session::restore_termios ()
  {
    const string_list& command(this->authstat->get_command());

    // Restore if running a login shell and have a controlling terminal,
    // and have previously saved the terminal state.
    if (CTTY_FILENO >= 0 &&
        (command.empty() || command[0].empty()) &&
        termios_ok)
      {
        if (tcsetattr(CTTY_FILENO, TCSANOW, &this->saved_termios) < 0)
          log_warning()
            << _("Error restoring terminal settings")
            << endl;
      }
  }

  int
  session::get_child_status () const
  {
    return this->child_status;
  }

  /**
   * Check group membership.
   *
   * @param group the group to check for.
   * @returns true if the user is a member of group, otherwise false.
   */
  bool
  session::is_group_member (const std::string& groupname) const
  {
    errno = 0;
    sbuild::group grp(groupname);
    if (!grp)
      {
        if (errno == 0)
          log_debug(DEBUG_INFO) << "Group " << groupname << "not found" << endl;
        else
          log_debug(DEBUG_INFO) << "Group " << groupname
                                << "not found: " << strerror(errno) << endl;
        return false;
      }

    bool group_member = false;
    if (grp.gr_gid == getgid())
      {
        group_member = true;
      }
    else
      {
        int supp_group_count = getgroups(0, 0);
        if (supp_group_count < 0)
          throw session::error(session::GROUP_GET_SUPC, strerror(errno));
        if (supp_group_count > 0)
          {
            gid_t *supp_groups = new gid_t[supp_group_count];
            assert (supp_groups);
            if (getgroups(supp_group_count, supp_groups) < 1)
              {
                // Free supp_groups before throwing to avoid leak.
                delete[] supp_groups;
                throw session::error(session::GROUP_GET_SUP, strerror(errno));
              }

            for (int i = 0; i < supp_group_count; ++i)
              {
                if (grp.gr_gid == supp_groups[i])
                  group_member = true;
              }
            delete[] supp_groups;
          }
      }

    return group_member;
  }

  void
  session::get_chroot_membership (const chroot::chroot::ptr& chroot,
                                  bool&                      in_users,
                                  bool&                      in_root_users,
                                  bool&                      in_groups,
                                  bool&                      in_root_groups) const
  {
    const string_list& users = chroot->get_users();
    const string_list& root_users = chroot->get_root_users();
    const string_list& groups = chroot->get_groups();
    const string_list& root_groups = chroot->get_root_groups();

    in_users = false;
    in_root_users = false;
    in_groups = false;
    in_root_groups = false;

    string_list::const_iterator upos =
      find(users.begin(), users.end(), this->authstat->get_ruser());
    if (upos != users.end())
      in_users = true;

    string_list::const_iterator rupos =
      find(root_users.begin(), root_users.end(), this->authstat->get_ruser());
    if (rupos != root_users.end())
      in_root_users = true;

    if (!groups.empty())
      {
        for (const auto& gp : groups)
          if (is_group_member(gp))
            in_groups = true;
      }

    if (!root_groups.empty())
      {
        for (const auto& rgp : root_groups)
          if (is_group_member(rgp))
            in_root_groups = true;
      }

    log_debug(DEBUG_INFO)
      << "In users: " << in_users << endl
      << "In groups: " << in_groups << endl
      << "In root-users: " << in_root_users << endl
      << "In root-groups: " << in_root_groups << endl;

  }

  auth::auth::status
  session::get_chroot_auth_status (auth::auth::status         status,
                                   const chroot::chroot::ptr& chroot) const
  {
    bool in_users = false;
    bool in_root_users = false;
    bool in_groups = false;
    bool in_root_groups = false;

    get_chroot_membership(chroot,
                          in_users, in_root_users,
                          in_groups, in_root_groups);

    /*
     * No auth required if in root users or root groups and
     * changing to root, or if the uid is not changing.  If not
     * in user or group, authentication fails immediately.
     */
    if ((in_users == true || in_groups == true ||
         in_root_users == true || in_root_groups == true) &&
        this->authstat->get_ruid() == this->authstat->get_uid())
      {
        status = auth::auth::change_auth(status, auth::auth::STATUS_NONE);
      }
    else if ((in_root_users == true || in_root_groups == true) &&
             this->authstat->get_uid() == 0)
      {
        status = auth::auth::change_auth(status, auth::auth::STATUS_NONE);
      }
    else if (in_users == true || in_groups == true)
      // Auth required if not in root group
      {
        status = auth::auth::change_auth(status, auth::auth::STATUS_USER);
      }
    else // Not in any groups
      {
        if (this->authstat->get_ruid() == 0)
          status = auth::auth::change_auth(status, auth::auth::STATUS_USER);
        else
          status = auth::auth::change_auth(status, auth::auth::STATUS_FAIL);
      }

    return status;
  }

  auth::auth::status
  session::get_auth_status () const
  {
    assert(!this->chroots.empty());

    /*
     * Note that the root user can't escape authentication.  This is
     * because pam_rootok.so should be used in the PAM configuration if
     * root should automatically be granted access.  The only exception
     * is that the root group doesn't need to be added to the groups or
     * root groups lists.
     */

    auth::auth::status status = auth::auth::STATUS_NONE;

    /** @todo Use set difference rather than iteration and
     * is_group_member.
     */
    for (const auto& chrootent : this->chroots)
      status = auth::auth::change_auth(status,
                                       get_chroot_auth_status(status, chrootent.chroot));

    return status;
  }

  void
  session::run ()
  {
    try
      {
        this->authstat->start();
        this->authstat->authenticate(get_auth_status());
        this->authstat->setupenv();
        this->authstat->account();
        try
          {
            this->authstat->cred_establish();

            run_impl();

            /* The session is now finished, either
               successfully or not.  All PAM operations are
               now for cleanup and shutdown, and we must
               clean up whether or not errors were raised at
               any previous point.  This means only the
               first error is reported back to the user. */

            /* Don't cope with failure, since we are now
               already bailing out, and an error may already
               have been raised */
          }
        catch (const auth::auth::error& e)
          {
            try
              {
                this->authstat->cred_delete();
              }
            catch (const auth::auth::error& discard)
              {
              }
            throw;
          }
        this->authstat->cred_delete();
      }
    catch (const auth::auth::error& e)
      {
        try
          {
            /* Don't cope with failure, since we are now already bailing out,
               and an error may already have been raised */
            this->authstat->stop();
          }
        catch (const auth::auth::error& discard)
          {
          }
        throw;
      }
    this->authstat->stop();
  }

  void
  session::run_impl ()
  {
    assert(!this->chroots.empty());

    try
      {
        sighup_called = false;
        set_sighup_handler();
        sigint_called = false;
        set_sigint_handler();
        sigterm_called = false;
        set_sigterm_handler();

        for (const auto& chrootent : this->chroots)
          {
            log_debug(DEBUG_NOTICE)
              << format("Running session in %1% chroot:") % chrootent.alias
              << endl;

            const chroot::chroot::ptr ch = chrootent.chroot;

            // TODO: Make chroot/session selection automatically fail
            // if no session exists earlier on when selecting chroots.
            if (ch->get_session_flags() & chroot::facet::facet::SESSION_CREATE &&
                (this->session_operation != OPERATION_AUTOMATIC &&
                 this->session_operation != OPERATION_BEGIN))
              throw error(chrootent.alias, CHROOT_NOTFOUND);

            // For now, use a copy of the chroot; if we create a session
            // later, we will replace it.
            chroot::chroot::ptr chroot(ch->clone());
            assert(chroot);

            /* Create a session using randomly-generated session ID. */
            if (ch->get_session_flags() & chroot::facet::facet::SESSION_CREATE)
              {
                assert(ch->get_facet<chroot::facet::session_clonable>());

                std::string new_session_id;

                if (!get_session_id().empty())
                  {
                    new_session_id = get_session_id();
                  }
                else
                  {
                    new_session_id =
                      ch->get_name() + '-' + unique_identifier();
                  }

                // Replace clone of chroot with cloned session.

                bool in_users = false;
                bool in_root_users = false;
                bool in_groups = false;
                bool in_root_groups = false;

                get_chroot_membership(chroot,
                                      in_users, in_root_users,
                                      in_groups, in_root_groups);

                chroot = ch->clone_session(new_session_id,
                                           chrootent.alias,
                                           this->authstat->get_ruser(),
                                           (in_root_users || in_root_groups));
                assert(chroot->get_facet<chroot::facet::session>());
              }
            assert(chroot);

            // Override chroot verbosity if needed.
            if (!this->verbosity.empty())
              chroot->set_verbosity(this->verbosity);

            // Set user options.
            chroot::facet::userdata::ptr userdata =
              chroot->get_facet<chroot::facet::userdata>();
            if (userdata)
              {
                // If the user running the command is root, or the user
                // being switched to is root, permit setting of
                // root-modifiable options in addition to
                // user-modifiable options.
                if (this->authstat->get_uid() == 0 ||
                    this->authstat->get_ruid() == 0)
                  userdata->set_root_data(this->user_options);
                else
                  userdata->set_user_data(this->user_options);
              }

            // Following authentication success, default child status to
            // success so that operations such as beginning, ending and
            // recovering sessions will return success unless an
            // exception is thrown.
            this->child_status = EXIT_SUCCESS;

            try
              {
                /* Run setup-start chroot setup scripts. */
                setup_chroot(chroot, chroot::chroot::SETUP_START);
                if (this->session_operation == OPERATION_BEGIN)
                  {
                    cout << chroot->get_name() << endl;
                  }

                /* Run recover scripts. */
                setup_chroot(chroot, chroot::chroot::SETUP_RECOVER);

                try
                  {
#ifdef SBUILD_FEATURE_UNSHARE
                    /* Unshare execution context */
                    chroot::facet::unshare::const_ptr pu = chroot->get_facet<chroot::facet::unshare>();
                    if (pu)
                      pu->do_unshare();
#endif // SBUILD_FEATURE_UNSHARE

                    /* Run exec-start scripts. */
                    setup_chroot(chroot, chroot::chroot::EXEC_START);

                    /* Run session if setup succeeded. */
                    if (this->session_operation == OPERATION_AUTOMATIC ||
                        this->session_operation == OPERATION_RUN)
                      {
                        try
                          {
                            this->authstat->open_session();
                            save_termios();
                            run_chroot(chroot);
                          }
                        catch (const std::runtime_error& e)
                          {
                            log_debug(DEBUG_WARNING)
                              << "Chroot session failed" << endl;
                            restore_termios();
                            this->authstat->close_session();
                            throw;
                          }
                        restore_termios();
                        this->authstat->close_session();
                      }
                  }
                catch (const error& e)
                  {
                    log_debug(DEBUG_WARNING)
                      << "Chroot exec scripts or session failed" << endl;
                    setup_chroot(chroot, chroot::chroot::EXEC_STOP);
                    throw;
                  }

                /* Run exec-stop scripts whether or not there was an
                   error. */
                setup_chroot(chroot, chroot::chroot::EXEC_STOP);
              }
            catch (const error& e)
              {
                log_debug(DEBUG_WARNING)
                  << "Chroot setup scripts, exec scripts or session failed" << endl;
                try
                  {
                    setup_chroot(chroot, chroot::chroot::SETUP_STOP);
                  }
                catch (const error& discard)
                  {
                    log_debug(DEBUG_WARNING)
                      << "Chroot setup scripts failed during stop" << endl;
                  }
                throw;
              }

            /* Run setup-stop chroot setup scripts whether or not there
               was an error. */
            setup_chroot(chroot, chroot::chroot::SETUP_STOP);
          }
      }
    catch (const error& e)
      {
        clear_sigterm_handler();
        clear_sigint_handler();
        clear_sighup_handler();

        /* If a command was not run, but something failed, the exit
           status still needs setting. */
        if (this->child_status == 0)
          this->child_status = EXIT_FAILURE;
        throw;
      }

    clear_sigterm_handler();
    clear_sigint_handler();
    clear_sighup_handler();
  }

  string_list
  session::get_login_directories (chroot::chroot::ptr& session_chroot,
                                  const environment&   env) const
  {
    string_list ret;

    const std::string& wd(this->authstat->get_wd());
    if (!wd.empty())
      {
        // Set specified working directory.
        ret.push_back(wd);
      }
    else
      {
        // Set current working directory.
        ret.push_back(this->cwd);

        // Set $HOME.
        std::string home;
        if (env.get("HOME", home) &&
            std::find(ret.begin(), ret.end(), home) == ret.end())
          ret.push_back(home);

        // Set passwd home.
        if (std::find(ret.begin(), ret.end(), this->authstat->get_home()) == ret.end())
          ret.push_back(this->authstat->get_home());

        // Final fallback to root.
        if (std::find(ret.begin(), ret.end(), "/") == ret.end())
          ret.push_back("/");
      }

    return ret;
  }

  string_list
  session::get_command_directories (chroot::chroot::ptr& session_chroot,
                                    const environment&   env) const
  {
    string_list ret;

    const std::string& wd(this->authstat->get_wd());
    if (!wd.empty())
      // Set specified working directory.
      ret.push_back(wd);
    else
      // Set current working directory.
      ret.push_back(this->cwd);

    return ret;
  }

  string_list
  session::get_shells (chroot::chroot::ptr& session_chroot) const
  {
    string_list ret;

    // Shell set with --shell (if any)
    if (!this->shell.empty())
      {
        ret.push_back(this->shell);
      }
    else if (!session_chroot->get_default_shell().empty())
      {
        ret.push_back(session_chroot->get_default_shell());
      }
    else
      {
        if (get_preserve_environment())
          {
            // $SHELL (if --preserve-environment used)
            const environment& env(this->authstat->get_complete_environment());

            std::string envshell;
            if (env.get("SHELL", envshell) &&
                std::find(ret.begin(), ret.end(), envshell) == ret.end())
              ret.push_back(envshell);
          }

        // passwd pw_shell
        const std::string& shell = this->authstat->get_shell();
        if (!shell.empty())
          ret.push_back(shell);

        // Fallback nice interactive shell
        if (std::find(ret.begin(), ret.end(), "/bin/bash") == ret.end())
          ret.push_back("/bin/bash");

        // Fallback basic interactive shell
        if (std::find(ret.begin(), ret.end(), "/bin/sh") == ret.end())
          ret.push_back("/bin/sh");
      }

    return ret;
  }

  std::string
  session::get_shell (chroot::chroot::ptr& session_chroot) const
  {
    string_list shells(get_shells(session_chroot));

    std::string found_shell;

    for (const auto& shell : shells)
      {
        try
          {
            stat(shell).check();
            found_shell = shell;
            break;
          }
        catch (const std::runtime_error& e)
          {
            error e1(shell, SHELL, e.what());
            log_exception_warning(e1);
          }
      }

    if (found_shell != *shells.begin())
      {
        error e2(SHELL_FB, shell);
        log_exception_warning(e2);
      }

    return found_shell;
  }

  void
  session::get_command (chroot::chroot::ptr& session_chroot,
                        std::string&         file,
                        string_list&         command,
                        environment&         env) const
  {
    /* Run login shell */
    if (command.empty() ||
        command[0].empty()) // No command
      get_login_command(session_chroot, file, command, env);
    else
      get_user_command(session_chroot, file, command, env);
  }

  void
  session::get_login_command (chroot::chroot::ptr& session_chroot,
                              std::string&         file,
                              string_list&         command,
                              environment&         env) const
  {
    command.clear();

    std::string shell = get_shell(session_chroot);
    file = shell;
    env.add("SHELL", shell);

    bool login_shell =
      !(get_preserve_environment() ||
        session_chroot->get_preserve_environment()) &&
      session_chroot->get_command_prefix().empty();

    // Not keeping environment and can setup argv correctly; login shell
    if (login_shell)
      {
        std::string shellbase = basename(shell);
        std::string loginshell = "-" + shellbase;
        command.push_back(loginshell);

        log_debug(DEBUG_NOTICE)
          << format("Running login shell: %1%") % shell << endl;
        if (this->authstat->get_uid() == 0 || this->authstat->get_ruid() != this->authstat->get_uid())
          syslog(LOG_USER|LOG_NOTICE,
                 "[%s chroot] (%s->%s) Running login shell: '%s'",
                 session_chroot->get_name().c_str(),
                 this->authstat->get_ruser().c_str(), this->authstat->get_user().c_str(),
                 shell.c_str());
      }
    else
      {
        command.push_back(shell);
        log_debug(DEBUG_NOTICE)
          << format("Running shell: %1%") % shell << endl;
        if (this->authstat->get_uid() == 0 || this->authstat->get_ruid() != this->authstat->get_uid())
          syslog(LOG_USER|LOG_NOTICE,
                 "[%s chroot] (%s->%s) Running shell: '%s'",
                 session_chroot->get_name().c_str(),
                 this->authstat->get_ruser().c_str(), this->authstat->get_user().c_str(),
                 shell.c_str());
      }

    if (session_chroot->get_verbosity() == chroot::chroot::VERBOSITY_VERBOSE)
      {
        std::string format_string;
        if (this->authstat->get_ruid() == this->authstat->get_uid())
          {
            if (login_shell)
              // TRANSLATORS: %1% = chroot name
              // TRANSLATORS: %4% = command
              format_string = _("[%1% chroot] Running login shell: ‘%4%’");
            else
              // TRANSLATORS: %1% = chroot name
              // TRANSLATORS: %4% = command
              format_string = _("[%1% chroot] Running shell: ‘%4%’");
          }
        else
          {
            if (login_shell)
              // TRANSLATORS: %1% = chroot name
              // TRANSLATORS: %2% = user name
              // TRANSLATORS: %3% = user name
              // TRANSLATORS: %4% = command
              // TRANSLATORS: Please translate "->" as a right arrow, e.g. U+2192
              format_string = _("[%1% chroot] (%2%→%3%) Running login shell: ‘%4%’");
            else
              // TRANSLATORS: %1% = chroot name
              // TRANSLATORS: %2% = user name
              // TRANSLATORS: %3% = user name
              // TRANSLATORS: %4% = command
              // TRANSLATORS: Please translate "->" as a right arrow, e.g. U+2192
              format_string = _("[%1% chroot] (%2%→%3%) Running shell: ‘%4%’");
          }

        format fmt(format_string);
        fmt % session_chroot->get_name()
          % this->authstat->get_ruser() % this->authstat->get_user()
          % shell;
        log_info() << fmt << endl;
      }
  }

  void
  session::get_user_command (chroot::chroot::ptr& session_chroot,
                             std::string&         file,
                             string_list&         command,
                             const environment&   env) const
  {
    /* Search for program in path. */
    std::string path;
    if (!env.get("PATH", path))
      path.clear();

    file = find_program_in_path(command[0], path, "");
    if (file.empty())
      file = command[0];
    std::string commandstring = string_list_to_string(command, " ");
    log_debug(DEBUG_NOTICE)
      << format("Running command: %1%") % commandstring << endl;
    if (this->authstat->get_uid() == 0 || this->authstat->get_ruid() != this->authstat->get_uid())
      syslog(LOG_USER|LOG_NOTICE, "[%s chroot] (%s->%s) Running command: \"%s\"",
             session_chroot->get_name().c_str(), this->authstat->get_ruser().c_str(), this->authstat->get_user().c_str(), commandstring.c_str());

    if (session_chroot->get_verbosity() == chroot::chroot::VERBOSITY_VERBOSE)
      {
        std::string format_string;
        if (this->authstat->get_ruid() == this->authstat->get_uid())
          // TRANSLATORS: %1% = chroot name
          // TRANSLATORS: %4% = command
          format_string = _("[%1% chroot] Running command: “%4%”");
        else
          // TRANSLATORS: %1% = chroot name
          // TRANSLATORS: %2% = user name
          // TRANSLATORS: %3% = user name
          // TRANSLATORS: %4% = command
          // TRANSLATORS: Please translate "->" as a right arrow, e.g. U+2192
          format_string = (_("[%1% chroot] (%2%→%3%) Running command: “%4%”"));

        format fmt(format_string);
        fmt % session_chroot->get_name()
          % this->authstat->get_ruser() % this->authstat->get_user()
          % commandstring;
        log_info() << fmt << endl;
      }
  }

  void
  session::setup_chroot (chroot::chroot::ptr&       session_chroot,
                         chroot::chroot::setup_type setup_type)
  {
    assert(!session_chroot->get_name().empty());

    log_debug(DEBUG_INFO) << format("setup_chroot: chroot=%1%, setup_type=%2%, chroot_status=%3%, lock_status=%4%")
      % session_chroot->get_name() % setup_type % chroot_status % lock_status
                          << std::endl;

    if (!((this->session_operation == OPERATION_BEGIN &&
           setup_type == chroot::chroot::SETUP_START) ||
          (this->session_operation == OPERATION_RECOVER &&
           setup_type == chroot::chroot::SETUP_RECOVER) ||
          (this->session_operation == OPERATION_END &&
           setup_type == chroot::chroot::SETUP_STOP) ||
          (this->session_operation == OPERATION_RUN &&
           (setup_type == chroot::chroot::EXEC_START ||
            setup_type == chroot::chroot::EXEC_STOP)) ||
          (this->session_operation == OPERATION_AUTOMATIC &&
           (setup_type == chroot::chroot::SETUP_START ||
            setup_type == chroot::chroot::SETUP_STOP ||
            setup_type == chroot::chroot::EXEC_START ||
            setup_type == chroot::chroot::EXEC_STOP))))
      return;

    // Don't clean up chroot on a lock failure--it's actually in use.
    if (this->lock_status == false)
      return;

    if (((setup_type == chroot::chroot::SETUP_START   ||
          setup_type == chroot::chroot::SETUP_RECOVER ||
          setup_type == chroot::chroot::SETUP_STOP ||
          setup_type == chroot::chroot::EXEC_START ||
          setup_type == chroot::chroot::EXEC_STOP) &&
         session_chroot->get_run_setup_scripts() == false))
      return;

    if (setup_type == chroot::chroot::SETUP_START)
      this->chroot_status = true;

    try
      {
        session_chroot->lock(setup_type);
      }
    catch (const chroot::chroot::error& e)
      {
        this->chroot_status = false;
        this->lock_status = false;
        try
          {
            // Release lock, which also removes session metadata.
            session_chroot->unlock(setup_type, 0);
          }
        catch (const chroot::chroot::error& ignore)
          {
          }
        throw error(session_chroot->get_name(), CHROOT_LOCK, e);
      }

    std::string setup_type_string;
    if (setup_type == chroot::chroot::SETUP_START)
      setup_type_string = "setup-start";
    else if (setup_type == chroot::chroot::SETUP_RECOVER)
      setup_type_string = "setup-recover";
    else if (setup_type == chroot::chroot::SETUP_STOP)
      setup_type_string = "setup-stop";
    else if (setup_type == chroot::chroot::EXEC_START)
      setup_type_string = "exec-start";
    else if (setup_type == chroot::chroot::EXEC_STOP)
      setup_type_string = "exec-stop";

    std::string chroot_status_string;
    if (this->chroot_status)
      chroot_status_string = "ok";
    else
      chroot_status_string = "fail";

    string_list arg_list;
    arg_list.push_back(setup_type_string);
    arg_list.push_back(chroot_status_string);

    /* Get a complete list of environment variables to set.  We need to
       query the chroot here, since this can vary depending upon the
       chroot type. */
    environment env;
    session_chroot->setup_env(env);
    env.add("AUTH_USER", this->authstat->get_user());
    env.add("AUTH_RUSER", this->authstat->get_ruser());
    env.add("AUTH_RGROUP", this->authstat->get_rgroup());
    env.add("AUTH_UID", this->authstat->get_uid());
    env.add("AUTH_GID", this->authstat->get_gid());
    env.add("AUTH_RUID", this->authstat->get_ruid());
    env.add("AUTH_RGID", this->authstat->get_rgid());
    env.add("AUTH_HOME", this->authstat->get_home());
    env.add("AUTH_SHELL", this->authstat->get_shell());

    env.add("VERBOSE", session_chroot->get_verbosity_string());
    env.add("MOUNT_DIR", SCHROOT_MOUNT_DIR);
    env.add("LIBEXEC_DIR", SCHROOT_LIBEXEC_DIR);
    env.add("SYSCONF_DIR", SCHROOT_SYSCONF_DIR);
    env.add("DATA_DIR", SCHROOT_DATA_DIR);
    env.add("SETUP_DATA_DIR", SCHROOT_SETUP_DATA_DIR);
    env.add("PID", getpid());
    env.add("HOST", SBUILD_HOST);
    env.add("HOST_OS", SBUILD_HOST_OS);
    env.add("HOST_VENDOR", SBUILD_HOST_VENDOR);
    env.add("HOST_CPU", SBUILD_HOST_CPU);
    env.add("PLATFORM", SBUILD_PLATFORM);

    env.add("PATH", "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin");

    run_parts rp(SCHROOT_CONF_SETUP_D,
                 true, true, 022);
    rp.set_reverse(setup_type == chroot::chroot::SETUP_STOP ||
                   setup_type == chroot::chroot::EXEC_STOP);
    rp.set_verbose(session_chroot->get_verbosity() == chroot::chroot::VERBOSITY_VERBOSE);

    log_debug(DEBUG_INFO) << rp << std::endl;

    int exit_status = 0;
    pid_t pid;

    if ((pid = fork()) == -1)
      {
        this->chroot_status = false;
        throw error(session_chroot->get_name(), CHILD_FORK, strerror(errno));
      }
    else if (pid == 0)
      {
        try
          {
            // The setup scripts don't use our syslog fd.
            closelog();

            if (chdir("/"))
              throw error("/", CHDIR, strerror(errno));
            /* This is required to ensure the scripts run with uid=0 and gid=0,
               otherwise setuid programs such as mount(8) will fail.  This
               should always succeed, because our euid=0 and egid=0.*/
            setuid(0);
            setgid(0);
            initgroups("root", 0);

            int status = rp.run(arg_list, env);

            _exit (status);
          }
        catch (const std::exception& e)
          {
            log_exception_error(e);
          }
        catch (...)
          {
            log_error()
              << _("An unknown exception occurred") << std::endl;
          }
        _exit(EXIT_FAILURE);
      }
    else
      {
        wait_for_child(pid, exit_status);
      }

    try
      {
        session_chroot->unlock(setup_type, exit_status);
      }
    catch (const chroot::chroot::error& e)
      {
        this->chroot_status = false;
        this->lock_status = false;
        throw error(session_chroot->get_name(), CHROOT_UNLOCK, e);
      }

    if (exit_status != 0)
      {
        this->chroot_status = false;

        format fmt(_("stage=%1%"));
        fmt % setup_type_string;
        throw error(session_chroot->get_name(), CHROOT_SETUP, fmt.str());
      }
  }

  void
  session::run_child (chroot::chroot::ptr& session_chroot)
  {
    assert(!session_chroot->get_name().empty());

    assert(!this->authstat->get_user().empty());
    assert(this->authstat->is_initialised()); // PAM must be initialised

    /* Set up environment */
    environment env;
    env.set_filter(session_chroot->get_environment_filter());

    if (get_preserve_environment() || session_chroot->get_preserve_environment())
      env += this->authstat->get_complete_environment();
    else
      env += this->authstat->get_auth_environment();

    // Store before chroot call.
    this->cwd = sbuild::getcwd();
    log_debug(DEBUG_INFO) << "CWD=" << this->cwd << std::endl;

    std::string location(session_chroot->get_path());
    log_debug(DEBUG_INFO) << "location=" << location << std::endl;

    /* Set group ID and supplementary groups */
    if (setgid (this->authstat->get_gid()))
      throw error(this->authstat->get_gid(), GROUP_SET, strerror(errno));
    log_debug(DEBUG_NOTICE) << "Set GID=" << this->authstat->get_gid() << std::endl;
    if (initgroups (this->authstat->get_user().c_str(), this->authstat->get_gid()))
      throw error(GROUP_SET_SUP, strerror(errno));
    log_debug(DEBUG_NOTICE) << "Set supplementary groups" << std::endl;


#ifdef SBUILD_FEATURE_PERSONALITY
    /* Set the process execution domain. */
    /* Will throw on failure. */
    chroot::facet::personality::const_ptr pfac =
      session_chroot->get_facet<chroot::facet::personality>();
    if (pfac)
      {
        pfac->get_persona().set();
        log_debug(DEBUG_NOTICE) << "Set personality="
                                << pfac->get_persona() << std::endl;
      }
    else
      {
        log_debug(DEBUG_NOTICE) << "Personality support unavailable" << std::endl;
      }
#endif // SBUILD_FEATURE_PERSONALITY

    /* Enter the chroot */
    if (chdir (location.c_str()))
      throw error(location, CHDIR, strerror(errno));
    log_debug(DEBUG_NOTICE) << "Changed directory to " << location << std::endl;
    if (::chroot (location.c_str()))
      throw error(location, CHROOT, strerror(errno));
    log_debug(DEBUG_NOTICE) << "Changed root to " << location << std::endl;

    /* Set uid and check we are not still root */
    if (setuid (this->authstat->get_uid()))
      throw error(this->authstat->get_uid(), USER_SET, strerror(errno));
    log_debug(DEBUG_NOTICE) << "Set UID=" << this->authstat->get_uid() << std::endl;
    if (!setuid (0) && this->authstat->get_uid())
      throw error(ROOT_DROP);
    if (this->authstat->get_uid())
      log_debug(DEBUG_NOTICE) << "Dropped root privileges" << std::endl;

    std::string file;
    string_list command(this->authstat->get_command());

    string_list dlist;
    if (command.empty() ||
        command[0].empty()) // No command
      dlist = get_login_directories(session_chroot, env);
    else
      dlist = get_command_directories(session_chroot, env);
    log_debug(DEBUG_INFO)
      << format("Directory fallbacks: %1%") % string_list_to_string(dlist, ", ") << endl;

    /* Attempt to chdir to current directory. */
    for (string_list::const_iterator dpos = dlist.begin();
         dpos != dlist.end();
         ++dpos)
      {
        if (chdir ((*dpos).c_str()) < 0)
          {
            error e(*dpos, CHDIR, strerror(errno));
            e.set_reason(_("The directory does not exist inside the chroot.  Use the --directory option to run the command in a different directory."));

            if (dpos + 1 == dlist.end())
              throw e;
            else
              log_exception_warning(e);
          }
        else
          {
            log_debug(DEBUG_NOTICE) << "Changed directory to "
                                    << *dpos << std::endl;
            if (dpos != dlist.begin())
              {
                error e(CHDIR_FB, *dpos);
                log_exception_warning(e);
              }
            break;
          }
      }

    /* Fix up the command for exec. */
    get_command(session_chroot, file, command, env);
    log_debug(DEBUG_NOTICE) << "command="
                            << string_list_to_string(command, ", ")
                            << std::endl;

    // Add equivalents to sudo's SUDO_USER, SUDO_UID, SUDO_GID, and
    // SUDO_COMMAND.
    env.add(std::make_pair("SCHROOT_COMMAND",
                           string_list_to_string(command, " ")));
    env.add(std::make_pair("SCHROOT_USER", this->authstat->get_ruser()));
    env.add(std::make_pair("SCHROOT_GROUP", this->authstat->get_rgroup()));
    env.add("SCHROOT_UID", this->authstat->get_ruid());
    env.add("SCHROOT_GID", this->authstat->get_rgid());
    // Add session ID.
    chroot::facet::session::const_ptr psess =
      session_chroot->get_facet<chroot::facet::session>();
    if (psess && psess->get_original_name().length())
      env.add("SCHROOT_CHROOT_NAME", psess->get_original_name());
    else
      env.add("SCHROOT_CHROOT_NAME", session_chroot->get_name());
    if (psess && psess->get_selected_name().length())
      env.add("SCHROOT_ALIAS_NAME", psess->get_selected_name());
    else
      env.add("SCHROOT_ALIAS_NAME", session_chroot->get_name());
    env.add("SCHROOT_SESSION_ID", session_chroot->get_name());

    log_debug(DEBUG_INFO) << "Set environment:\n" << env;

    // The user's command does not use our syslog fd.
    closelog();

    // Add command prefix.
    string_list full_command(session_chroot->get_command_prefix());
    if (full_command.size() > 0)
      {
        std::string path;
        if (!env.get("PATH", path))
          path.clear();
        file = find_program_in_path(full_command[0], path, "");
        if (file.empty())
          file = full_command[0];
      }
    for (const auto& arg : command)
      full_command.push_back(arg);

    /* Execute */
    if (exec (file, full_command, env))
      throw error(file, EXEC, strerror(errno));

    /* This should never be reached */
    _exit(EXIT_FAILURE);
  }

  void
  session::wait_for_child (pid_t pid,
                           int&  child_status)
  {
    child_status = EXIT_FAILURE; // Default exit status

    int status;
    bool child_killed = false;

    while (1)
      {
        /*
         * If we (the parent process) gets SIGHUP or SIGTERM, pass this
         * signal on to the child (once).  Note that we do not handle
         * SIGINT this way, because when a user presses Ctrl-C, the
         * SIGINT is sent to all processes attached to that TTY (so the
         * child will already have gotten it).  In any case, once the
         * child gets the signal, we just have to continue waiting for
         * it to exit.
         */
        if ((sighup_called || sigterm_called) && !child_killed)
          {
            if (sighup_called)
              {
                error e(SIGNAL_CATCH, strsignal(SIGHUP),
                        _("terminating immediately"));
                log_exception_error(e);
                kill(pid, SIGHUP);
              }
            else // SIGTERM
              {
                error e(SIGNAL_CATCH, strsignal(SIGTERM),
                        _("terminating immediately"));
                log_exception_error(e);
                kill(pid, SIGTERM);
              }
            this->chroot_status = false;
            child_killed = true;
          }

        if (waitpid(pid, &status, 0) == -1)
          {
            if (errno == EINTR && (sighup_called || sigterm_called || sigint_called))
              continue; // Kill child and wait again.
            else
              throw error(CHILD_WAIT, strerror(errno));
          }
        else if (sighup_called)
          {
            sighup_called = false;
            throw error(SIGNAL_CATCH, strsignal(SIGHUP));
          }
        else if (sigterm_called)
          {
            sigterm_called = false;
            throw error(SIGNAL_CATCH, strsignal(SIGTERM));
          }
        // No need to handle the SIGINT case here; it is handled
        // correctly below
        else
          break;
      }

    if (!WIFEXITED(status))
      {
        if (WIFSIGNALED(status))
          throw error(CHILD_SIGNAL, strsignal(WTERMSIG(status)));
        else if (WCOREDUMP(status))
          throw error(CHILD_CORE);
        else
          throw error(CHILD_FAIL);
      }

    child_status = WEXITSTATUS(status);
  }

  void
  session::run_chroot (chroot::chroot::ptr& session_chroot)
  {
    assert(!session_chroot->get_name().empty());

    pid_t pid;
    if ((pid = fork()) == -1)
      {
        throw error(CHILD_FORK, strerror(errno));
      }
    else if (pid == 0)
      {
#ifdef SBUILD_DEBUG
        while (child_wait)
          ;
#endif
        try
          {
            run_child(session_chroot);
          }
        catch (const std::runtime_error& e)
          {
            log_exception_error(e);
          }
        catch (...)
          {
            log_error()
              << _("An unknown exception occurred") << std::endl;
          }
        _exit (EXIT_FAILURE);
      }
    else
      {
        wait_for_child(pid, this->child_status);
      }
  }

  void
  session::set_sighup_handler ()
  {
    set_signal_handler(SIGHUP, &this->saved_sighup_signal, sighup_handler);
  }

  void
  session::clear_sighup_handler ()
  {
    clear_signal_handler(SIGHUP, &this->saved_sighup_signal);
  }

  void
  session::set_sigint_handler ()
  {
    set_signal_handler(SIGINT, &this->saved_sigint_signal, sigint_handler);
  }

  void
  session::clear_sigint_handler ()
  {
    clear_signal_handler(SIGINT, &this->saved_sigint_signal);
  }

  void
  session::set_sigterm_handler ()
  {
    set_signal_handler(SIGTERM, &this->saved_sigterm_signal, sigterm_handler);
  }

  void
  session::clear_sigterm_handler ()
  {
    clear_signal_handler(SIGTERM, &this->saved_sigterm_signal);
  }

  void
  session::set_signal_handler (int                signal,
                               struct sigaction  *saved_signal,
                               void             (*handler)(int))
  {
    struct sigaction new_sa;
    sigemptyset(&new_sa.sa_mask);
    new_sa.sa_flags = 0;
    new_sa.sa_handler = handler;

    if (sigaction(signal, &new_sa, saved_signal) != 0)
      throw error(SIGNAL_SET, strsignal(signal), strerror(errno));
  }

  void
  session::clear_signal_handler (int               signal,
                                 struct sigaction *saved_signal)
  {
    /* Restore original handler */
    sigaction (signal, saved_signal, 0);
  }

}
