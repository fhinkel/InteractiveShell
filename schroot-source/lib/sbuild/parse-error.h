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

#ifndef SBUILD_PARSE_ERROR_H
#define SBUILD_PARSE_ERROR_H

#include <sbuild/custom-error.h>

#include <map>
#include <string>

namespace sbuild
{

  /**
   * Parse error.
   */
  template<typename T>
  class parse_error : public error<T>
  {
  public:
    typedef typename error<T>::error_type error_type;

    /**
     * The constructor.
     *
     * @param context the context of the error.
     * @param error the error code.
     */
    template<typename C>
    parse_error (C const&   context,
                 error_type error):
      sbuild::error<T>(this->format_error(context, nullptr, nullptr, error, nullptr, nullptr, nullptr),
                       this->format_reason(context, nullptr, nullptr, error, nullptr, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param error the error code.
     * @param detail the details of the error.
     */
    template<typename D>
    parse_error (error_type error,
                 D const&   detail):
      sbuild::error<T>(this->format_error(nullptr, nullptr, nullptr, error, detail, nullptr, nullptr),
                       this->format_reason(nullptr, nullptr, nullptr, error, detail, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param line the line the error occurred on.
     * @param error the error code.
     * @param detail the details of the error.
     */
    template<typename D>
    parse_error (size_t     line,
                 error_type error,
                 D const&   detail):
      sbuild::error<T>(this->format_error(line, nullptr, nullptr, error, detail, nullptr, nullptr),
                       this->format_reason(line, nullptr, nullptr, error, detail, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param line the line the error occurred on.
     * @param group the group the error occurred within.
     * @param error the error code.
     * @param detail the details of the error.
     */
    template<typename D>
    parse_error (size_t             line,
                 const std::string& group,
                 error_type         error,
                 D const&           detail):
      sbuild::error<T>(this->format_error(line, group, nullptr, error, detail, nullptr, nullptr),
                       this->format_reason(line, group, nullptr, error, detail, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param line the line the error occurred on.
     * @param group the group the error occurred within.
     * @param key the key the error occurred within.
     * @param error the error code.
     * @param detail the details of the error.
     */
    template<typename D>
    parse_error (size_t             line,
                 const std::string& group,
                 const std::string& key,
                 error_type         error,
                 D const&           detail):
      sbuild::error<T>(this->format_error(line, group, key, error, detail, nullptr, nullptr),
                       this->format_reason(line, group, key, error, detail, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param group the group the error occurred within.
     * @param error the error code.
     * @param detail the details of the error.
     */
    template<typename D>
    parse_error (const std::string& group,
                 error_type         error,
                 D const&           detail):
      sbuild::error<T>(this->format_error(group, nullptr, nullptr, error, detail, nullptr, nullptr),
                       this->format_reason(group, nullptr, nullptr, error, detail, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param group the group the error occurred within.
     * @param key the key the error occurred within.
     * @param error the error code.
     * @param detail the details of the error.
     */
    template<typename D>
    parse_error (const std::string& group,
                 const std::string& key,
                 error_type         error,
                 D const&           detail):
      sbuild::error<T>(this->format_error(group, key, nullptr, error, detail, nullptr, nullptr),
                       this->format_reason(group, key, nullptr, error, detail, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param context the context of the error.
     * @param error the error.
     */
    template<typename C>
    parse_error (C const&                  context,
                 const std::runtime_error& error):
      sbuild::error<T>(sbuild::error<T>::format_error(context, nullptr, nullptr, error, nullptr, nullptr, nullptr),
                       sbuild::error<T>::format_reason(context, nullptr, nullptr, error, nullptr, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param line the line the error occurred on.
     * @param error the error.
     */
    parse_error (size_t                    line,
                 const std::runtime_error& error):
      sbuild::error<T>(sbuild::error<T>::format_error(line, nullptr, nullptr, error, nullptr, nullptr, nullptr),
                       sbuild::error<T>::format_reason(line, nullptr, nullptr, error, nullptr, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param line the line the error occurred on.
     * @param group the group the error occurred within.
     * @param error the error.
     */
    parse_error (size_t                    line,
                 const std::string&        group,
                 const std::runtime_error& error):
      sbuild::error<T>(sbuild::error<T>::format_error(line, group, nullptr, error, nullptr, nullptr, nullptr),
                       sbuild::error<T>::format_reason(line, group, nullptr, error, nullptr, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param line the line the error occurred on.
     * @param group the group the error occurred within.
     * @param key the key the error occurred within.
     * @param error the error.
     */
    parse_error (size_t                    line,
                 const std::string&        group,
                 const std::string&        key,
                 const std::runtime_error& error):
      sbuild::error<T>(sbuild::error<T>::format_error(line, group, key, error, nullptr, nullptr, nullptr),
                       sbuild::error<T>::format_reason(line, group, key, error, nullptr, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param group the group the error occurred within.
     * @param error the error.
     */
    parse_error (const std::string&        group,
                 const std::runtime_error& error):
      sbuild::error<T>(sbuild::error<T>::format_error(group, nullptr, nullptr, error, nullptr, nullptr, nullptr),
                       sbuild::error<T>::format_reason(group, nullptr, nullptr, error, nullptr, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param group the group the error occurred within.
     * @param key the key the error occurred within.
     * @param error the error.
     */
    parse_error (const std::string&        group,
                 const std::string&        key,
                 const std::runtime_error& error):
      sbuild::error<T>(sbuild::error<T>::format_error(group, key, nullptr, error, nullptr, nullptr, nullptr),
                       sbuild::error<T>::format_reason(group, key, nullptr, error, nullptr, nullptr, nullptr))
    {
    }

  };

}

#endif /* SBUILD_PARSE_ERROR_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
