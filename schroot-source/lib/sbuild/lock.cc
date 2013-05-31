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

#include <sbuild/lock.h>
#include <sbuild/log.h>
#include <sbuild/feature.h>

#include <cerrno>
#include <cstdlib>
#include <cstring>

#include <unistd.h>

#include <boost/format.hpp>

using boost::format;

namespace sbuild
{

  template<>
  error<lock::error_code>::map_type
  error<lock::error_code>::error_strings =
    {
      {lock::TIMEOUT_HANDLER,        N_("Failed to set timeout handler")},
      {lock::TIMEOUT_SET,            N_("Failed to set timeout")},
      {lock::TIMEOUT_CANCEL,         N_("Failed to cancel timeout")},
      {lock::LOCK,                   N_("Failed to lock file")},
      {lock::UNLOCK,                 N_("Failed to unlock file")},
      // TRANSLATORS: %4% = time in seconds
      {lock::LOCK_TIMEOUT,           N_("Failed to lock file (timed out after %4% seconds)")},
      // TRANSLATORS: %4% = time in seconds
      {lock::UNLOCK_TIMEOUT,         N_("Failed to unlock file (timed out after %4% seconds)")},
      {lock::DEVICE_LOCK,            N_("Failed to lock device")},
      // TRANSLATORS: %4% = time in seconds
      // TRANSLATORS: %5% = integer process ID
      {lock::DEVICE_LOCK_TIMEOUT,    N_("Failed to lock device (timed out after %4% seconds; lock held by PID %5%)")},
      {lock::DEVICE_TEST,            N_("Failed to test device lock")},
      {lock::DEVICE_UNLOCK,         N_("Failed to unlock device")},
      // TRANSLATORS: %4% = time in seconds
      // TRANSLATORS: %5% = integer process ID
      {lock::DEVICE_UNLOCK_TIMEOUT, N_("Failed to unlock device (timed out after %4% seconds; lock held by PID %5%)")}
    };

  namespace
  {
    /**
     * Handle the SIGALRM signal.  This exists so that system calls get
     * interrupted.
     *
     * @param ignore the signal number.
     */
    void
    alarm_handler (int ignore)
    {
    }
  }

  lock::lock ():
    saved_signals()
  {
  }

  lock::~lock ()
  {
  }

  void
  lock::set_alarm ()
  {
    struct sigaction new_sa;
    sigemptyset(&new_sa.sa_mask);
    new_sa.sa_flags = 0;
    new_sa.sa_handler = alarm_handler;

    if (sigaction(SIGALRM, &new_sa, &this->saved_signals) != 0)
      throw error(TIMEOUT_HANDLER, strerror(errno));
  }

  void
  lock::clear_alarm ()
  {
    /* Restore original handler */
    sigaction (SIGALRM, &this->saved_signals, 0);
  }

  void
  lock::set_timer(const struct itimerval& timer)
  {
    set_alarm();

    if (setitimer(ITIMER_REAL, &timer, 0) == -1)
      {
        clear_alarm();
        throw error(TIMEOUT_SET, strerror(errno));
      }
  }

  void
  lock::unset_timer ()
  {
    struct itimerval disable_timer;
    disable_timer.it_interval.tv_sec = disable_timer.it_interval.tv_usec = 0;
    disable_timer.it_value.tv_sec = disable_timer.it_value.tv_usec = 0;

    if (setitimer(ITIMER_REAL, &disable_timer, 0) == -1)
      {
        clear_alarm();
        throw error(TIMEOUT_CANCEL, strerror(errno));
      }

    clear_alarm();
  }

  file_lock::file_lock (int fd):
    lock(),
    fd(fd),
    locked(false)
  {
  }

  file_lock::~file_lock ()
  {
    // Release a lock if held.  Note that the code is duplicated from
    // set_lock because we don't want to throw an exception in a
    // destructor under any circumstances.  Any error is logged.
    if (locked)
      {
        struct flock read_lock;
        read_lock.l_type = LOCK_NONE;
        read_lock.l_whence = SEEK_SET;
        read_lock.l_start = 0;
        read_lock.l_len = 0; // Lock entire file
        read_lock.l_pid = 0;

        if (fcntl(this->fd, F_SETLK, &read_lock) == -1)
          log_exception_warning(error(UNLOCK, strerror(errno)));
      }
  }

  void
  file_lock::set_lock (lock::type   lock_type,
                       unsigned int timeout)
  {
    try
      {
        struct itimerval timeout_timer;
        timeout_timer.it_interval.tv_sec = timeout_timer.it_interval.tv_usec = 0;
        timeout_timer.it_value.tv_sec = timeout;
        timeout_timer.it_value.tv_usec = 0;
        set_timer(timeout_timer);

        /* Now the signal handler and itimer are set, the function can't
           return without stopping the timer and restoring the signal
           handler to its original state. */

        /* Wait on lock until interrupted by a signal if a timeout was set,
           otherwise return immediately. */
        struct flock read_lock;
        read_lock.l_type = lock_type;
        read_lock.l_whence = SEEK_SET;
        read_lock.l_start = 0;
        read_lock.l_len = 0; // Lock entire file
        read_lock.l_pid = 0;

        if (fcntl(this->fd,
                  (timeout != 0) ? F_SETLKW : F_SETLK,
                  &read_lock) == -1)
          {
            if (errno == EINTR)
              throw error((lock_type == LOCK_SHARED ||
                           lock_type == LOCK_EXCLUSIVE)
                          ? LOCK_TIMEOUT : UNLOCK_TIMEOUT,
                          timeout);
            else
              throw error((lock_type == LOCK_SHARED ||
                           lock_type == LOCK_EXCLUSIVE) ? LOCK : UNLOCK,
                          strerror(errno));
          }

        if (lock_type == LOCK_SHARED || lock_type == LOCK_EXCLUSIVE)
          this->locked = true;
        else
          this->locked = false;

        unset_timer();
      }
    catch (const error& e)
      {
        unset_timer();
        throw;
      }
  }

  void
  file_lock::unset_lock ()
  {
    set_lock(LOCK_NONE, 0);
  }

}
