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

#ifndef SBUILD_CUSTOM_ERROR_TCC
#define SBUILD_CUSTOM_ERROR_TCC

#include <sbuild/i18n.h>
#include <sbuild/custom-error.h>

template <typename T>
template <typename A, typename B, typename C,
          typename D, typename E, typename F>
inline std::string
sbuild::error<T>::format_error (A const&   context1,
                                B const&   context2,
                                C const&   context3,
                                error_type error,
                                D const&   detail1,
                                E const&   detail2,
                                F const&   detail3)
{
  std::string format;
  std::string msg(get_error(error));
  unsigned int nargs(0);

  if (msg.find("%1%") != std::string::npos)
    {
      nargs = 1;
    }
  else if(typeid(context1) != typeid(nullptr))
    {
      format += "%1%: ";
      nargs = 1;
    }

  if (msg.find("%2%") != std::string::npos)
    {
      nargs = 2;
    }
  else if (typeid(context2) != typeid(nullptr))
    {
      format += "%2%: ";
      nargs = 2;
    }

  if (msg.find("%3%") != std::string::npos)
    {
      nargs = 3;
    }
  else if (typeid(context3) != typeid(nullptr))
    {
      format += "%3%: ";
      nargs = 3;
    }

  format += msg;

  if (msg.find("%4%") != std::string::npos)
    {
      nargs = 4;
    }
  else if (typeid(detail1) != typeid(nullptr))
    {
      if (msg.empty())
        format += "%4%";
      else
        format += ": %4%";
      nargs = 4;
    }

  if (msg.find("%5%") != std::string::npos)
    {
      nargs = 5;
    }
  else if (typeid(detail2) != typeid(nullptr))
    {
      if (msg.empty() && nargs < 4)
        format += "%5%";
      else
        format += ": %5%";
      nargs = 5;
    }

  if (msg.find("%6%") != std::string::npos)
    {
      nargs = 6;
    }
  else if (typeid(detail3) != typeid(nullptr))
    {
      if (msg.empty() && nargs < 4)
        format += "%6%";
      else
        format += ": %6%";
      nargs = 6;
    }

  boost::format fmt(format);
  if (nargs >= 1)
    add_detail(fmt, context1);
  if (nargs >= 2)
    add_detail(fmt, context2);
  if (nargs >= 3)
    add_detail(fmt, context3);
  if (nargs >= 4)
    add_detail(fmt, detail1);
  if (nargs >= 5)
    add_detail(fmt, detail2);
  if (nargs >= 6)
    add_detail(fmt, detail3);

  return fmt.str();
}

template <typename T>
template <typename A, typename B, typename C,
          typename D, typename E, typename F>
inline std::string
sbuild::error<T>::format_error (A const&   context1,
                                B const&   context2,
                                C const&   context3,
                                const std::runtime_error& error,
                                D const&   detail1,
                                E const&   detail2,
                                F const&   detail3)
{
  std::string format;
  std::string msg(error.what());
  unsigned int nargs(0);

  if (typeid(context1) != typeid(nullptr))
    {
      format += "%1%: ";
      nargs = 1;
    }

  if (typeid(context2) != typeid(nullptr))
    {
      format += "%2%: ";
      nargs = 2;
    }

  if (typeid(context3) != typeid(nullptr))
    {
      format += "%3%: ";
      nargs = 3;
    }

  format += msg;

  if (typeid(detail1) != typeid(nullptr))
    {
      if (msg.empty())
        format += "%4%";
      else
        format += ": %4%";
      nargs = 4;

    }

  if (typeid(detail2) != typeid(nullptr))
    {
      if (msg.empty() && nargs < 4)
        format += "%5%";
      else
        format += ": %5%";
      nargs = 5;
    }

  if (typeid(detail3) != typeid(nullptr))
    {
      if (msg.empty() && nargs < 4)
        format += "%6%";
      else
        format += ": %6%";
      nargs = 6;
    }

  boost::format fmt(format);
  if (nargs >= 1)
    add_detail(fmt, context1);
  if (nargs >= 2)
    add_detail(fmt, context2);
  if (nargs >= 3)
    add_detail(fmt, context3);
  if (nargs >= 4)
    add_detail(fmt, detail1);
  if (nargs >= 5)
    add_detail(fmt, detail2);
  if (nargs >= 6)
    add_detail(fmt, detail3);

  return fmt.str();
}

template<typename T>
inline void
sbuild::error<T>::add_detail(boost::format&        fmt,
                             const std::nullptr_t& value)
{
  // Current versions of boost::format don't like being passed
  // nullptr.  Hence this specialisation.
  fmt % "";
}

template<typename T>
template<typename A>
inline void
sbuild::error<T>::add_detail(boost::format& fmt,
                             A const&       value)
{
  add_detail_helper<A, boost::is_base_and_derived<std::exception, A>::value>
    (fmt, value);
}

template <typename T>
template <typename A, typename B, typename C, typename R,
          typename D, typename E, typename F>
inline std::string
sbuild::error<T>::format_reason (A const&   context1,
                                 B const&   context2,
                                 C const&   context3,
                                 R const&   error,
                                 D const&   detail1,
                                 E const&   detail2,
                                 F const&   detail3)
{
  std::string reason;

  add_reason(reason, context1);
  add_reason(reason, context2);
  add_reason(reason, context3);
  add_reason(reason, error);
  add_reason(reason, detail1);
  add_reason(reason, detail2);
  add_reason(reason, detail3);

  return reason;
}

template<typename T>
template<typename A>
inline void
sbuild::error<T>::add_reason(std::string& reason,
                             A const&     value)
{
  add_reason_helper<A, boost::is_base_and_derived<std::exception, A>::value>
    (reason, value);
}

template <typename T>
inline const char *
sbuild::error<T>::get_error (error_type error)
{
  typename map_type::const_iterator pos = error_strings.find(error);

  if (pos != error_strings.end())
    return gettext(pos->second);

  // Untranslated: it's a programming error to get this message.
  return "Unknown error";
}

#endif /* SBUILD_CUSTOM_ERROR_TCC */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
