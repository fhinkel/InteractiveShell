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

#ifndef SBUILD_LOG_H
#define SBUILD_LOG_H

#include <ostream>

namespace sbuild
{

  /// Debugging level.
  enum debug_level
    {
      DEBUG_NONE = -1,   ///< No debugging.
      DEBUG_NOTICE = 1,  ///< Notification messages.
      DEBUG_INFO = 2,    ///< Informational messages.
      DEBUG_WARNING = 3, ///< Warning messages.
      DEBUG_CRITICAL = 4 ///< Critical messages.
    };

  /**
   * Log an informational message.
   *
   * @returns an ostream.
   */
  std::ostream&
  log_info ();

  /**
   * Log a warning message.
   *
   * @returns an ostream.
   */
  std::ostream&
  log_warning ();

  /**
   * Log an error message.
   *
   * @returns an ostream.
   */
  std::ostream&
  log_error ();

  /**
   * Log a debug message.
   *
   * @param level the debug level of the message being logged.
   * @returns an ostream.  This will be a valid stream if level is
   * greater or equal to debug_level, or else a null stream will be
   * returned, resulting in no output.
   */
  std::ostream&
  log_debug (debug_level level);

  /**
   * Log an informational message to the Controlling TTY.
   *
   * @returns an ostream.
   */
  std::ostream&
  log_ctty_info ();

  /**
   * Log a warning message to the Controlling TTY.
   *
   * @returns an ostream.
   */
  std::ostream&
  log_ctty_warning ();

  /**
   * Log an error message to the Controlling TTY.
   *
   * @returns an ostream.
   */
  std::ostream&
  log_ctty_error ();

  /**
   * Log an exception as a warning.
   *
   * @param e the exception to log.
   */
  void
  log_exception_warning (const std::exception& e);

  /**
   * Log an exception as an error.
   *
   * @param e the exception to log.
   */
  void
  log_exception_error (const std::exception& e);

  /**
   * Log an exception as a warning to the Controlling TTY.
   *
   * @param e the exception to log.
   */
  void
  log_ctty_exception_warning (const std::exception& e);

  /**
   * Log an exception as an error to the Controlling TTY.
   *
   * @param e the exception to log.
   */
  void
  log_ctty_exception_error (const std::exception& e);

  /**
   * Log an unknown exception as an error.
   */
  void
  log_unknown_exception_error ();

  /// The debugging level in use.
  extern debug_level debug_log_level;

}

#endif /* SBUILD_LOG_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
