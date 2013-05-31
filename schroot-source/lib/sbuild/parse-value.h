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

#ifndef SBUILD_PARSE_VALUE_H
#define SBUILD_PARSE_VALUE_H

#include <sbuild/parse-error.h>
#include <sbuild/log.h>

#include <string>
#include <sstream>

namespace sbuild
{

  /// Error codes.
  enum parse_value_error_code
    {
      BAD_VALUE ///< The value could not be parsed.
    };

  /// Exception type.
  typedef parse_error<parse_value_error_code> parse_value_error;

  /**
   * Parse a boolean value.
   * @param value the value to parse.
   * @param parsed_value the variable to store the parsed value.
   * @returns true on success, false on failure.
   */
  void
  parse_value (const std::string& value,
               bool&              parsed_value);

  /**
   * Parse a string value.
   * @param value the value to parse.
   * @param parsed_value the variable to store the parsed value.
   * @returns true on success, false on failure.
   */
  void
  parse_value (const std::string& value,
               std::string&       parsed_value);

  /**
   * Parse a value of type T.
   * @param value the value to parse.
   * @param parsed_value the variable to store the parsed value.
   * @returns true on success, false on failure.
   */
  template <typename T>
  void
  parse_value (const std::string& value,
               T& parsed_value)
  {
    std::istringstream is(value);
    is.imbue(std::locale::classic());
    T tmpval;
    if (is >> tmpval)
      {
        parsed_value = tmpval;
        log_debug(DEBUG_NOTICE) << "value=" << parsed_value << std::endl;
      }
    else
      {
        log_debug(DEBUG_NOTICE) << "parse error" << std::endl;
        throw parse_value_error(value, BAD_VALUE);
      }
  }

}

#endif /* SBUILD_PARSE_VALUE_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
