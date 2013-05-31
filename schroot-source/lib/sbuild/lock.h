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

#ifndef SBUILD_LOCK_H
#define SBUILD_LOCK_H

#include <sbuild/lock.h>
#include <sbuild/custom-error.h>

#include <string>

#include <sys/time.h>
#include <fcntl.h>
#include <signal.h>

namespace sbuild
{

  /**
   * Advisory locking.  This class defines a simple interface for
   * shared and exclusive locks.
   */
  class lock
  {
  public:
    /// Lock type.
    enum type
      {
        LOCK_SHARED    = F_RDLCK, ///< A shared (read) lock.
        LOCK_EXCLUSIVE = F_WRLCK, ///< An exclusive (write) lock.
        LOCK_NONE      = F_UNLCK  ///< No lock.
      };

    /// Error codes.
    enum error_code
      {
        TIMEOUT_HANDLER,      ///< Failed to set timeout handler.
        TIMEOUT_SET,          ///< Failed to set timeout.
        TIMEOUT_CANCEL,       ///< Failed to cancel timeout.
        LOCK,                 ///< Failed to lock file.
        UNLOCK,               ///< Failed to unlock file.
        LOCK_TIMEOUT,         ///< Failed to lock file (timed out).
        UNLOCK_TIMEOUT,       ///< Failed to unlock file (timed out).
        DEVICE_LOCK,          ///< Failed to lock device.
        DEVICE_LOCK_TIMEOUT,  ///< Failed to lock device (timed out).
        DEVICE_TEST,          ///< Failed to test device lock.
        DEVICE_UNLOCK,        ///< Failed to unlock device.
        DEVICE_UNLOCK_TIMEOUT ///< Failed to unlock device (timed out)
      };

    /// Exception type.
    typedef custom_error<error_code> error;

    /**
     * Acquire a lock.
     *
     * @param lock_type the type of lock to acquire.
     * @param timeout the time in seconds to wait on the lock.
     */
    virtual void
    set_lock (type         lock_type,
              unsigned int timeout) = 0;

    /**
     * Release a lock.  This is equivalent to set_lock with a
     * lock_type of LOCK_NONE and a timeout of 0.
     */
    virtual void
    unset_lock () = 0;

  protected:
    /// The constructor.
    lock ();
    /// The destructor.
    virtual ~lock ();

    /**
     * Set the SIGALARM handler.
     *
     * An error will be thrown on failure.
     */
    void
    set_alarm ();

    /**
     * Restore the state of SIGALRM prior to starting lock
     * acquisition.
     */
    void
    clear_alarm ();

    /**
     * Set up an itimer for future expiry.  This is used to interrupt
     * system calls.  This will set a handler for SIGALRM as a side
     * effect (using set_alarm).
     *
     * An error will be thrown on failure.
     *
     * @param timer the timeout to set.
     */
    void
    set_timer (const struct itimerval& timer);

    /**
     * Remove any itimer currently set up.  This will clear any
     * SIGALRM handler (using clear_alarm).
     *
     * An error will be thrown on failure.
     */
    void
    unset_timer ();

  private:
    /// Signals saved during timeout.
    struct sigaction saved_signals;
  };

  /**
   * File lock.  Simple whole-file shared and exclusive advisory
   * locking based upon POSIX fcntl byte region locks.
   */
  class file_lock : public lock
  {
  public:
    /**
     * The constructor.
     *
     * @param fd the file descriptor to lock.
     */
    file_lock (int fd);

    /// The destructor.
    virtual ~file_lock ();

    virtual void
    set_lock (lock::type   lock_type,
              unsigned int timeout);

    virtual void
    unset_lock ();

  private:
    /// The file descriptor to lock.
    int fd;
    /// Is the file locked?
    bool locked;
  };

}

#endif /* SBUILD_LOCK_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
