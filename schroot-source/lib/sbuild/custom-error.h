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

#ifndef SBUILD_CUSTOM_ERROR_H
#define SBUILD_CUSTOM_ERROR_H

#include <sbuild/error.h>

namespace sbuild
{

  /**
   * Custom error.
   */
  template <typename T>
  class custom_error : public error<T>
  {
  public:
    /// The enum type providing the error codes for this type.
    typedef typename error<T>::error_type error_type;

    /**
     * The constructor.
     *
     * @param error the error code.
     */
    custom_error (error_type error):
    sbuild::error<T>(this->format_error(nullptr, nullptr, nullptr, error, nullptr, nullptr, nullptr),
                     this->format_reason(nullptr, nullptr, nullptr, error, nullptr, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param context the context of the error.
     * @param error the error code.
     */
    template<typename C>
    custom_error (C const&   context,
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
    custom_error (error_type error,
                  D const&   detail):
      sbuild::error<T>(this->format_error(nullptr, nullptr, nullptr, error, detail, nullptr, nullptr),
                       this->format_reason(nullptr, nullptr, nullptr, error, detail, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param error the error code.
     * @param detail the details of the error.
     * @param detail2 additional details of the error.
     */
    template<typename D, typename E>
    custom_error (error_type error,
                  D const&   detail,
                  E const&   detail2):
      sbuild::error<T>(this->format_error(nullptr, nullptr, nullptr, error, detail, detail2, nullptr),
                       this->format_reason(nullptr, nullptr, nullptr, error, detail, detail2, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param error the error code.
     * @param detail the details of the error.
     * @param detail2 additional details of the error.
     * @param detail3 additional details of the error.
     */
    template<typename D, typename E, typename F>
    custom_error (error_type error,
                  D const&   detail,
                  E const&   detail2,
                  F const&   detail3):
      sbuild::error<T>(this->format_error(nullptr, nullptr, nullptr, error, detail, detail2, detail3),
                       this->format_reason(nullptr, nullptr, nullptr, error, detail, detail2, detail3))
    {
    }

    /**
     * The constructor.
     *
     * @param context the context of the error.
     * @param error the error code.
     * @param detail the details of the error.
     */
    template<typename C, typename D>
    custom_error (C const&   context,
                  error_type error,
                  D const&   detail):
      sbuild::error<T>(this->format_error(context, nullptr, nullptr, error, detail, nullptr, nullptr),
                       this->format_reason(context, nullptr, nullptr, error, detail, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param context the context of the error.
     * @param error the error code.
     * @param detail the details of the error.
     * @param detail2 additional details of the error.
     */
    template<typename C, typename D, typename E>
    custom_error (C const&   context,
                  error_type error,
                  D const&   detail,
                  E const&   detail2):
      sbuild::error<T>(format_error(context, nullptr, nullptr, error, detail, detail2, nullptr),
                       format_reason(context, nullptr, nullptr, error, detail, detail2, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param context1 the context of the error.
     * @param context2 additional context of the error.
     * @param error the error code.
     * @param detail the details of the error.
     */
    template<typename C, typename D, typename E>
    custom_error (C const&   context1,
                  D const&   context2,
                  error_type error,
                  E const&   detail):
      sbuild::error<T>(this->format_error(context1, context2, nullptr, error, detail, nullptr, nullptr),
                       this->format_reason(context1, context2, nullptr, error, detail, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param context1 the context of the error.
     * @param context2 additional context of the error.
     * @param error the error code.
     * @param detail the details of the error.
     * @param detail2 additional details of the error.
     */
    template<typename C, typename D, typename E, typename F>
    custom_error (C const&   context1,
                  D const&   context2,
                  error_type error,
                  E const&   detail,
                  F const&   detail2):
      sbuild::error<T>(format_error(context1, context2, nullptr, error, detail, detail2, nullptr),
                       format_reason(context1, context2, nullptr, error, detail, detail2, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param error the error.
     */
    custom_error (const std::runtime_error& error):
      sbuild::error<T>(sbuild::error<T>::format_error(nullptr, nullptr, nullptr, error, nullptr, nullptr, nullptr),
                       sbuild::error<T>::format_reason(nullptr, nullptr, nullptr, error, nullptr, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param error the error.
     */
    custom_error (const error_base& error):
    sbuild::error<T>(sbuild::error<T>::format_error(nullptr, nullptr, nullptr, error, nullptr, nullptr, nullptr),
                     sbuild::error<T>::format_reason(nullptr, nullptr, nullptr, error, nullptr, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param context the context of the error.
     * @param error the error.
     */
    template<typename C>
    custom_error (C const&                  context,
                  const std::runtime_error& error):
      sbuild::error<T>(sbuild::error<T>::format_error(context, nullptr, nullptr, error, nullptr, nullptr, nullptr),
                       sbuild::error<T>::format_reason(context, nullptr, nullptr, error, nullptr, nullptr, nullptr))
    {
    }

    /**
     * The constructor.
     *
     * @param context the context of the error.
     * @param error the error.
     */
    template<typename C>
    custom_error (C const&          context,
                  const error_base& error):
      sbuild::error<T>(sbuild::error<T>::format_error(context, nullptr, nullptr, error, nullptr, nullptr, nullptr),
                       sbuild::error<T>::format_reason(context, nullptr, nullptr, error, nullptr, nullptr, nullptr))
    {
    }

    /// The destructor.
    virtual ~custom_error () throw ()
    {}
  };

}

#endif /* SBUILD_CUSTOM_ERROR_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
