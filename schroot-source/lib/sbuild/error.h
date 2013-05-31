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

#ifndef SBUILD_ERROR_H
#define SBUILD_ERROR_H

#include <map>
#include <stdexcept>
#include <string>
#include <typeinfo>

#include <boost/format.hpp>
#include <boost/type_traits.hpp>

namespace sbuild
{

  /**
   * Error exception base class.
   */
  class error_base : public std::runtime_error
  {
  protected:
    /**
     * The constructor.
     *
     * @param error the error message.
     */
    error_base(const std::string& error):
      runtime_error(error),
      reason()
    {
    }

    /**
     * The constructor.
     *
     * @param error the error message.
     * @param reason further information about the error
     */
    error_base(const std::string& error,
               const std::string& reason):
      runtime_error(error),
      reason(reason)
    {
    }

  public:
    /// The destructor.
    virtual ~error_base () throw ()
    {}

    /**
     * Get the reason for the error.
     *
     * @returns the reason.
     */
    virtual const char *
    why () const throw ()
    {
      return this->reason.c_str();
    }

    /**
     * Get the reason for the error.
     *
     * @returns the reason.
     */
    std::string const&
    get_reason () const
    {
      return this->reason;
    }

    /**
     * Set the reason for the error.
     *
     * @param reason further information about the error
     */
    void
    set_reason (const std::string& reason)
    {
      this->reason = reason;
    }

  private:
    /// The reason for the error.
    std::string reason;
  };

  /**
   * Error exception class.
   */
  template <typename T>
  class error : public error_base
  {
  public:
    /// The enum type providing the error codes for this type.
    typedef T error_type;
    /// Mapping between error code and error description.
    typedef std::map<error_type,const char *> map_type;

    /**
     * The constructor.
     *
     * @param error the error message.
     */
    error(const std::string& error):
      error_base(error)
    {
    }

    /**
     * The constructor.
     *
     * @param error the error message.
     * @param reason further information about the error
     */
    error(const std::string& error,
          const std::string& reason):
      error_base(error, reason)
    {
    }

    /// The destructor.
    virtual ~error () throw ()
    {}

  private:
    /// Mapping between error code and string.
    static map_type error_strings;

    /**
     * Get a translated error string.
     *
     * @param error the error code.
     * @returns a translated error string.
     */
    static const char *
    get_error (error_type error);

  protected:
    /**
     * Format an error message.
     *
     * @param context1 context of the error.
     * @param context2 additional context of the error.
     * @param context3 additional context of the error.
     * @param error the error code.
     * @param detail1 details of the error.
     * @param detail2 additional details of the error.
     * @param detail3 additional details of the error.
     * @returns a translated error message.
     *
     * @todo Merge the logic shared between the two specialisations to
     * prevent code duplication.
     */
    template <typename A, typename B, typename C,
              typename D, typename E, typename F>
    static std::string
    format_error (A const&   context1,
                  B const&   context2,
                  C const&   context3,
                  error_type error,
                  D const&   detail1,
                  E const&   detail2,
                  F const&   detail3);

    /**
     * Format an error message.
     *
     * @param context1 context of the error.
     * @param context2 additional context of the error.
     * @param context3 additional context of the error.
     * @param error the error code.
     * @param detail1 details of the error.
     * @param detail2 additional details of the error.
     * @param detail3 additional details of the error.
     * @returns a translated error message.
     */
    template <typename A, typename B, typename C,
              typename D, typename E, typename F>
    static std::string
    format_error (A const&                  context1,
                  B const&                  context2,
                  C const&                  context3,
                  const std::runtime_error& error,
                  D const&                  detail1,
                  E const&                  detail2,
                  F const&                  detail3);

    /**
     * Format an reason string.
     *
     * @param context1 context of the error.
     * @param context2 additional context of the error.
     * @param context3 additional context of the error.
     * @param error the error or error code.
     * @param detail1 details of the error.
     * @param detail2 additional details of the error.
     * @param detail3 additional details of the error.
     * @returns a translated error message.
     */
    template <typename A, typename B, typename C,
              typename R, typename D, typename E, typename F>
    static std::string
    format_reason (A const&   context1,
                   B const&   context2,
                   C const&   context3,
                   R const&   error,
                   D const&   detail1,
                   E const&   detail2,
                   F const&   detail3);

    /**
     * Add detail to format string.  Specialised for nullptr.  Current
     * versions of boost::format don't like nullptr.
     *
     * @param fmt the format string.
     * @param value the value to add.
     */
    static void
    add_detail(boost::format&        fmt,
               const std::nullptr_t& value);

    /**
     * Add detail to format string.
     *
     * @param fmt the format string.
     * @param value the value to add.
     */
    template<typename A>
    static void
    add_detail(boost::format& fmt,
               A const&       value);

    /**
     * Helper class to add detail to format string.
     * Used for non-exception types.
     */
    template<typename A, bool b>
    struct add_detail_helper
    {
      /**
       * The constructor.
       *
       * @param fmt the format string to add to.
       * @param value the value to add.
       */
      add_detail_helper(boost::format& fmt,
                        A const&       value)
      {
        fmt % value;
      }
    };

    /**
     * Helper class to add detail to format string.
     * Used for exception types.
     */
    template<typename A>
    struct add_detail_helper<A, true>
    {
      /**
       * The constructor.
       *
       * @param fmt the format string to add to.
       * @param value the exception to add.
       */
      add_detail_helper(boost::format& fmt,
                        A const&       value)
      {
        fmt % value.what();
      }
    };

    /**
     * Add reason to reason string.
     *
     * @param reason the reason string.
     * @param value the value to add.
     */
    template<typename A>
    static void
    add_reason(std::string& reason,
               A const&     value);

    /**
     * Helper class to add reason to reason string.
     * Used for non-exception types.
     */
    template<typename A, bool b>
    struct add_reason_helper
    {
      /**
       * The constructor.
       *
       * @param reason the reason to add to.
       * @param value the value to add.
       */
      add_reason_helper(std::string& reason,
                        A const&     value)
      {
      }
    };

    /**
     * Helper class to add reason to reason string.
     * Used for exception types.
     */
    template<typename A>
    struct add_reason_helper<A, true>
    {
      /**
       * The constructor.
       *
       * @param reason the reason to add to.
       * @param value the exception to add.
       */
      add_reason_helper(std::string& reason,
                        A const&     value)
      {
        try
          {
            const sbuild::error_base& eb(dynamic_cast<sbuild::error_base const&>(value));
            if (!reason.empty())
              reason += '\n';
            reason += eb.why();
          }
        catch (const std::bad_cast& discard)
          {
          }
      }
    };

  };

}

#include <sbuild/error.tcc>

#endif /* SBUILD_ERROR_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
