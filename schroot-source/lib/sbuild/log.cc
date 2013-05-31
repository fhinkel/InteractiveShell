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

#include <sbuild/ctty.h>
#include <sbuild/error.h>
#include <sbuild/i18n.h>
#include <sbuild/log.h>
#include <sbuild/nostream.h>
#include <sbuild/util.h>

#include <iostream>

#include <boost/format.hpp>

using boost::format;

namespace sbuild
{

  namespace
  {

    /**
     * Log an exception reason.  Log the reason an exception was thrown,
     * if the exception contains reason information.
     *
     * @param e the exception to log.
     * @param ctty true to log to the CTTY or false to log to cerr.
     */
    void
    log_reason (const std::exception& e,
                bool                  ctty)
    {
      try
        {
          const error_base& eb(dynamic_cast<error_base const&>(e));
          string_list lines = split_string(eb.why(), "\n");
          for (const auto& line : lines)
            ctty ? log_ctty_info() : log_info()
              << line << std::endl;
        }
      catch (const std::bad_cast& discard)
        {
        }
    }

    /**
     * Log an exception reason as an informational message.
     *
     * @param e the exception to log.
     */
    void
    log_exception_reason (const std::exception& e)
    {
      log_reason(e, false);
    }

    /**
     * Log an exception reason as as an informational message to the
     * Controlling TTY.
     *
     * @param e the exception to log.
     */
    void
    log_ctty_exception_reason (const std::exception& e)
    {
      log_reason(e, true);
    }
  }

  std::ostream&
  log_info ()
  {
    // TRANSLATORS: "I" is an abbreviation of "Information"
    return std::cerr << _("I: ");
  }

  std::ostream&
  log_warning ()
  {
    // TRANSLATORS: "W" is an abbreviation of "Warning"
    return std::cerr << _("W: ");
  }

  std::ostream&
  log_error ()
  {
    // TRANSLATORS: "E" is an abbreviation of "Error"
    return std::cerr << _("E: ");
  }

  std::ostream&
  log_debug (debug_level level)
  {
    if (debug_log_level > 0 &&
        level >= debug_log_level)
      // TRANSLATORS: %1% = integer debug level
      // TRANSLATORS: "D" is an abbreviation of "Debug"
      return std::cerr << format(_("D(%1%): ")) % level;
    else
      return cnull;
  }

  std::ostream&
  log_ctty_info ()
  {
    // TRANSLATORS: "I" is an abbreviation of "Information"
    return cctty << _("I: ");
  }

  std::ostream&
  log_ctty_warning ()
  {
    // TRANSLATORS: "W" is an abbreviation of "Warning"
    return cctty << _("W: ");
  }

  std::ostream&
  log_ctty_error ()
  {
    // TRANSLATORS: "E" is an abbreviation of "Error"
    return cctty << _("E: ");
  }

  void
  log_exception_warning (const std::exception& e)
  {
    log_warning() << e.what() << std::endl;
    log_exception_reason(e);
  }

  void
  log_exception_error (const std::exception& e)
  {
    log_error() << e.what() << std::endl;
    log_exception_reason(e);
  }

  void
  log_ctty_exception_warning (const std::exception& e)
  {
    log_ctty_warning() << e.what() << std::endl;
    log_ctty_exception_reason(e);
  }

  void
  log_ctty_exception_error (const std::exception& e)
  {
    log_ctty_error() << e.what() << std::endl;
    log_ctty_exception_reason(e);
  }

  void
  log_unknown_exception_error ()
  {
    log_error() << _("An unknown exception occurred") << std::endl;
  }

  debug_level debug_log_level = DEBUG_NONE;

}
