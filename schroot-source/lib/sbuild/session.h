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

#ifndef SBUILD_SESSION_H
#define SBUILD_SESSION_H

#include <sbuild/auth/auth.h>
#include <sbuild/chroot/chroot.h>
#include <sbuild/custom-error.h>

#include <string>

#include <signal.h>
#include <sys/types.h>
#include <termios.h>
#include <unistd.h>

namespace sbuild
{

  /**
   * Session handler.
   *
   * This class provides the session handling for schroot.  It uses
   * auth, which performs all the necessary PAM actions.  This allows
   * more sophisticated handling of user authorisation (users, groups,
   * root-users and root-groups membership in the configuration file)
   * and session management (setting up the session, entering the
   * chroot and running the requested command or shell).
   */
  class session
  {
  public:
    struct chroot_list_entry
    {
      /// Name used to initially identify the chroot.
      std::string         alias;
      /// Pointer to chroot object.
      chroot::chroot::ptr chroot;
    };

    /// A list of chroots.
    typedef std::vector<chroot_list_entry> chroot_list;

    /// Session operations.
    enum operation
      {
        OPERATION_AUTOMATIC, ///< Begin, end and run a session automatically.
        OPERATION_BEGIN,     ///< Begin a session.
        OPERATION_RECOVER,   ///< Recover an existing (but inactive) session.
        OPERATION_END,       ///< End a session.
        OPERATION_RUN        ///< Run a command in an existing session.
      };

    /// Error codes.
    enum error_code
      {
        CHDIR,          ///< Failed to change to directory.
        CHDIR_FB,       ///< Falling back to directory.
        CHILD_CORE,     ///< Child dumped core.
        CHILD_FAIL,     ///< Child exited abnormally (reason unknown)
        CHILD_FORK,     ///< Failed to fork child.
        CHILD_SIGNAL,   ///< Child terminated by signal.
        CHILD_WAIT,     ///< Wait for child failed.
        CHROOT,         ///< Failed to change root to directory.
        CHROOT_ALIAS,   ///< No chroot found matching alias.
        CHROOT_LOCK,    ///< Failed to lock chroot.
        CHROOT_NOTFOUND,///< Chroot not found.
        CHROOT_SETUP,   ///< Setup failed.
        CHROOT_UNLOCK,  ///< Failed to unlock chroot.
        COMMAND_ABS,    ///< Command must have an absolute path.
        EXEC,           ///< Failed to execute.
        GROUP_GET_SUP,  ///< Failed to get supplementary groups.
        GROUP_GET_SUPC, ///< Failed to get supplementary group count
        GROUP_SET,      ///< Failed to set group.
        GROUP_SET_SUP,  ///< Failed to set supplementary groups.
        GROUP_UNKNOWN,  ///< Group not found.
        PAM,            ///< PAM error.
        ROOT_DROP,      ///< Failed to drop root permissions.
        SET_SESSION_ID, ///< Chroot does not support setting a session ID.
        SHELL,          ///< Shell not available.
        SHELL_FB,       ///< Falling back to shell.
        SIGNAL_CATCH,   ///< Caught signal.
        SIGNAL_SET,     ///< Failed to set signal handler.
        USER_SET,       ///< Failed to set user.
        USER_SWITCH     ///< User switching is not permitted.
      };

    /// Exception type.
    typedef custom_error<error_code> error;

    /// A shared_ptr to a session object.
    typedef std::shared_ptr<session> ptr;

    /**
     * The constructor.
     *
     * @param service the PAM service name.
     * @param operation the session operation to perform.
     * @param chroots the chroots to act upon.
     */
    session (const std::string& service,
             operation          operation,
             const chroot_list& chroots);

    /// The destructor.
    virtual ~session ();

    /**
     * Get the authentication state associated with this session.
     *
     * @returns a shared_ptr to the authentication state.
     */
    auth::auth::ptr const&
    get_auth () const;

    /**
     * Set the authentication state associated with this session.
     *
     * @param auth a shared_ptr to the authentication state.
     */
    void
    set_auth (auth::auth::ptr& auth);

    /**
     * Get the chroots to use in this session.
     *
     * @returns a list of chroots.
     */
    chroot_list const&
    get_chroots () const;

    /**
     * Set the chroots to use in this session.
     *
     * @param chroots a list of chroots.
     */
    void
    set_chroots (const chroot_list& chroots);

    /**
     * Get the operation this session will perform.
     *
     * @returns the operation.
     */
    operation
    get_operation () const;

    /**
     * Set the operation this session will perform.
     *
     * @param operation the operation.
     */
    void
    set_operation (operation operation);

    /**
     * Get the session identifier.  The session identifier is a unique
     * string to identify a session.
     *
     * @returns the session id.
     */
    std::string const&
    get_session_id () const;

    /**
     * Set the session identifier.  The session identifier is a unique
     * string to identify a session.
     *
     * @param session_id the session id.
     */
    void
    set_session_id (const std::string& session_id);

    /**
     * Get the message verbosity.
     *
     * @returns the message verbosity.
     */
    std::string const&
    get_verbosity () const;

    /**
     * Set the message verbosity.  This will override the chroot
     * message verbosity if set.
     *
     * @param verbosity the message verbosity.
     */
    void
    set_verbosity (const std::string& verbosity);

    /**
     * Check if the environment should be preserved in the chroot.
     *
     * @returns true to preserve or false to clean.
     */
    bool
    get_preserve_environment () const;

    /**
     * Set if the environment should be preserved in the chroot.
     *
     * @param preserve_environment true to preserve or false to clean.
     */
    void
    set_preserve_environment (bool preserve_environment);

    /**
     * Get user-specified login shell.
     *
     * @returns true to preserve or false to clean.
     */
    std::string const&
    get_shell_override () const;

    /**
     * Set user-specified login shell.
     *
     * @param shell true to preserve or false to clean.
     */
    void
    set_shell_override (const std::string& shell);

    /**
     * Get user options.
     *
     * @returns map of user options.
     */
    string_map const&
    get_user_options () const;

    /**
     * Set user options.
     *
     * @param user_options map of user options.
     */
    void
    set_user_options (const string_map& user_options);

    /**
     * Get the force status of this session.
     *
     * @returns true if operation will be forced, otherwise false.
     */
    bool
    get_force () const;

    /**
     * Set the force status of this session.
     *
     * @param force true to force operation, otherwise false.
     */
    void
    set_force (bool force);

    /**
     * Save terminal state.
     */
    void
    save_termios ();

    /**
     * Restore terminal state.
     */
    void
    restore_termios ();

    /**
     * Get the exit (wait) status of the last child process to run in this
     * session.
     *
     * @returns the exit status.
     */
    int
    get_child_status () const;

    /**
     * Check group membership.
     *
     * @param groupname the group to check for.
     * @returns true if the user is a member of group, otherwise false.
     */
    bool
    is_group_member (const std::string& groupname) const;

  protected:
    /**
     * Get the chroot authentication properties the user is included in.
     */
    void
    get_chroot_membership (const chroot::chroot::ptr& chroot,
                           bool&                      in_users,
                           bool&                      in_root_users,
                           bool&                      in_groups,
                           bool&                      in_root_groups) const;

    /**
     * Check if authentication is required for a single chroot, taking
     * users, groups, root-users and root-groups membership into
     * account.
     */
    virtual auth::auth::status
    get_chroot_auth_status (auth::auth::status         status,
                            const chroot::chroot::ptr& chroot) const;

  public:
    /**
     * Check if authentication is required, taking users, groups,
     * root-users and root-groups membership of all chroots specified
     * into account.
     */
    virtual auth::auth::status
    get_auth_status () const;

    /**
     * Run a session.  The user will be asked for authentication if
     * required, and then the run_impl virtual method will be called.
     *
     * An auth::auth::error will be thrown on failure.
     */
    void
    run ();

  protected:
    /**
     * Run a session.  If a command has been specified, this will be
     * run in each of the specified chroots.  If no command has been
     * specified, a login shell will run in the specified chroot.
     *
     * An error will be thrown on failure.
     */
    virtual void
    run_impl ();

    /**
     * Get a list of directories to change to when running a login
     * shell.  Multiple directories are used as fallbacks.
     *
     * @param session_chroot the chroot to setup.
     * @param env the environment to use for HOME
     * @returns a list of directories
     */
    virtual string_list
    get_login_directories (chroot::chroot::ptr& session_chroot,
                           const environment&   env) const;

    /**
     * Get a list of directories to change to when running a command
     * Multiple directories are used as fallbacks.
     *
     * @param session_chroot the chroot to setup.
     * @param env the environment to use for HOME
     * @returns a list of directories
     */
    virtual string_list
    get_command_directories (chroot::chroot::ptr& session_chroot,
                             const environment&   env) const;

    /**
     * Get a list of candidate shells to run.  This is typically the
     * user login shell, plus /bin/bash and/or /bin/sh if these are
     * not already present as the user's login shell.
     *
     * @param session_chroot the chroot to setup.
     * @returns a list of shells.
     */
    virtual string_list
    get_shells (chroot::chroot::ptr& session_chroot) const;

    /**
     * Get the shell to run.  This finds a suitable shell to run in
     * the chroot, falling back to /bin/sh if necessary.  Note that it
     * assumes it is inside the chroot when called.
     *
     * @param session_chroot the chroot to setup.
     * @returns the shell.
     */
    virtual std::string
    get_shell (chroot::chroot::ptr& session_chroot) const;

    /**
     * Get the command to run.
     *
     * @param session_chroot the chroot to setup.
     * @param file the filename to pass to execve(2).
     * @param command the argv to pass to execve(2).
     * @param env the environment to use for PATH.
     */
    virtual void
    get_command (chroot::chroot::ptr& session_chroot,
                 std::string&         file,
                 string_list&         command,
                 environment&         env) const;

    /**
     * Get the command to run a login shell.
     *
     * @param session_chroot the chroot to setup.
     * @param file the filename to pass to execve(2).
     * @param command the argv to pass to execve(2).
     * @param env the environment to set SHELL.
     */
    virtual void
    get_login_command (chroot::chroot::ptr& session_chroot,
                       std::string&         file,
                       string_list&         command,
                       environment&         env) const;

    /**
     * Get the command to run a user command.
     *
     * @param session_chroot the chroot to setup.
     * @param file the filename to pass to execve(2).
     * @param command the argv to pass to execve(2).
     * @param env the environment to use for PATH
     */
    virtual void
    get_user_command (chroot::chroot::ptr& session_chroot,
                      std::string&         file,
                      string_list&         command,
                      const environment&   env) const;

  private:
    /**
     * Setup a chroot.  This runs all of the commands in setup.d or run.d.
     *
     * The environment variables CHROOT_NAME, CHROOT_DESCRIPTION,
     * CHROOT_LOCATION, AUTH_USER and AUTH_VERBOSITY are set for use in
     * setup scripts.  See schroot-setup(5) for a complete list.
     *
     * An error will be thrown on failure.
     *
     * @param session_chroot the chroot to setup.
     * @param setup_type the type of setup to perform.
     */
    void
    setup_chroot (chroot::chroot::ptr&       session_chroot,
                  chroot::chroot::setup_type setup_type);

    /**
     * Run command or login shell in the specified chroot.
     *
     * An error will be thrown on failure.
     *
     * @param session_chroot the chroot to setup.
     */
    void
    run_chroot (chroot::chroot::ptr& session_chroot);

    /**
     * Run a command or login shell as a child process in the
     * specified chroot.  This method is only ever to be run in a
     * child process, and will never return.
     *
     * @param session_chroot the chroot to setup.
     */
    void
    run_child (chroot::chroot::ptr& session_chroot);

    /**
     * Wait for a child process to complete, and check its exit status.
     *
     * An error will be thrown on failure.
     *
     * @param pid the pid to wait for.
     * @param child_status the place to store the child exit status.
     */
    void
    wait_for_child (pid_t pid,
                    int&  child_status);

    /**
     * Set the SIGHUP handler.
     *
     * An error will be thrown on failure.
     */
    void
    set_sighup_handler ();

    /**
     * Restore the state of SIGHUP prior to setting the handler.
     */
    void
    clear_sighup_handler ();

    /**
     * Set the SIGINT handler.
     *
     * An error will be thrown on failure.
     */
    void
    set_sigint_handler ();

    /**
     * Restore the state of SIGINT prior to setting the handler.
     */
    void
    clear_sigint_handler ();

    /**
     * Set the SIGTERM handler.
     *
     * An error will be thrown on failure.
     */
    void
    set_sigterm_handler ();

    /**
     * Restore the state of SIGTERM prior to setting the handler.
     */
    void
    clear_sigterm_handler ();

    /**
     * Set a signal handler.
     * An error will be thrown on failure.
     *
     * @param signal the signal number.
     * @param saved_signal the location to save the current handler.
     * @param handler the signal handler to install.
     */
    void
    set_signal_handler (int                signal,
                        struct sigaction  *saved_signal,
                        void             (*handler)(int));

    /**
     * Restore the state of the signal prior to setting the handler.
     *
     * @param signal the signal number.
     * @param saved_signal the location from which to restore the
     * saved handler.
     */
    void
    clear_signal_handler (int               signal,
                          struct sigaction *saved_signal);

    /// Authentication state.
    auth::auth::ptr  authstat;
    /// The chroots to run the session operation in.
    chroot_list      chroots;
    /// The current chroot status.
    int              chroot_status;
    /// Lock status for locks acquired during chroot setup.
    bool lock_status;
    /// The child exit status.
    int              child_status;
    /// The session operation to perform.
    operation        session_operation;
    /// The session identifier.
    std::string      session_id;
    /// The session force status.
    bool             force;
    /// Signal saved while sighup handler is set.
    struct sigaction saved_sighup_signal;
    /// Signal saved while sigint handler is set.
    struct sigaction saved_sigint_signal;
    /// Signal saved while sigterm handler is set.
    struct sigaction saved_sigterm_signal;
    /// Saved terminal settings.
    struct termios saved_termios;
    /// Are the saved terminal settings valid?
    bool termios_ok;
    /// Message verbosity.
    std::string verbosity;
    /// Preserve environment?
    bool        preserve_environment;
    /// Login shell.
    std::string shell;
    /// User-defined options.
    string_map  user_options;

  protected:
    /// Current working directory.
    std::string      cwd;
  };

}

#endif /* SBUILD_SESSION_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
