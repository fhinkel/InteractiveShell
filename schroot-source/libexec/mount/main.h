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

#ifndef LIBEXEC_MOUNT_MAIN_H
#define LIBEXEC_MOUNT_MAIN_H

#include <bin-common/main.h>

#include <libexec/mount/options.h>

#include <sbuild/custom-error.h>
#include <sbuild/environment.h>

/**
 * schroot-mount program components
 */
namespace schroot_mount
{

  /**
   * Frontend for schroot-mount.  This class is used to "run" schroot-mount.
   */
  class main : public bin_common::main
  {
  public:
    /// Error codes.
    enum error_code
      {
        CHILD_FORK, ///< Failed to fork child.
        CHILD_WAIT, ///< Wait for child failed.
        EXEC,       ///< Failed to execute.
        REALPATH    ///< Failed to resolve path.
      };

    /// Exception type.
    typedef sbuild::custom_error<error_code> error;

    /**
     * The constructor.
     *
     * @param options the command-line options to use.
     */
    main (options::ptr& options);

    /// The destructor.
    virtual ~main ();

  private:
    /**
     * Mount filesystems.
     */
    virtual void
    action_mount ();

    /**
     * Run the command specified by file (an absolute pathname), using
     * command and env as the argv and environment, respectively.
     *
     * @param file the program to execute.
     * @param command the arguments to pass to the executable.
     * @param env the environment.
     * @returns the return value of the execve system call on failure.
     */
    int
    run_child(const std::string& file,
              const sbuild::string_list& command,
              const sbuild::environment& env);

    /**
     * Ensure that the mountpoint is a valid absolute path inside the
     * chroot.  This is to avoid absolute or relative symlinks
     * pointing outside the chroot causing filesystems to be mounted
     * on the host.  An exception will be thrown if it is not possible
     * to resolve the path.
     *
     * @param mountpoint the mountpoint to check,
     * @returns the validated path.
     */

    std::string
    resolve_path (const std::string& mountpoint);

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

  protected:
    /**
     * Run the program.
     *
     * @returns 0 on success, 1 on failure or the exit status of the
     * chroot command.
     */
    virtual int
    run_impl ();

  private:
    /// The program options.
    options::ptr opts;
  };

}

#endif /* LIBEXEC_MOUNT_MAIN_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
