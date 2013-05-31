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

#ifndef SBUILD_TYPES_H
#define SBUILD_TYPES_H

#include <cassert>
#include <ctime>
#include <ios>
#include <locale>
#include <map>
#include <set>
#include <string>
#include <vector>

/**
 * Debian source builder components
 */
namespace sbuild
{

  /// A string vector.
  typedef std::vector<std::string> string_list;

  /// A string set.
  typedef std::set<std::string> string_set;

  /// A string map.
  typedef std::map<std::string, std::string> string_map;

  /**
   * A date representation.
   */
  class date_base
  {
  public:
    /// Function pointer to split time into a std::tm.
    typedef std::tm *(*break_time_func)(const time_t *timep, std:: tm *result);

    /**
     * The constructor.
     *
     * @param unix_time the time.
     * @param break_time the function to split up the time.
     */
    date_base (time_t          unix_time,
               break_time_func break_time):
      unix_time(unix_time),
      break_time(break_time)
    {}

    /// The destructor.
    virtual ~date_base ()
    {}

    /**
     * Output the date to an ostream.
     *
     * @param stream the stream to output to.
     * @param dt the date to output.
     * @returns the stream.
     */
    template <class charT, class traits>
    friend
    std::basic_ostream<charT,traits>&
    operator << (std::basic_ostream<charT,traits>& stream,
                 const date_base&                  dt)
    {
      std::ios_base::iostate err = std::ios_base::goodbit;

      std::tm dtm;
      if ((dt.break_time(&dt.unix_time, &dtm)) == 0)
        {
          err = std::ios_base::badbit;
        }
      else
        {
          try
            {
              typename std::basic_ostream<charT, traits>::sentry sentry(stream);
              if (sentry)
                {
                  const std::basic_string<char>
                    nfmt(dt.get_date_format());
                  std::basic_string<charT> wfmt(nfmt.size(), 0);
                  assert(nfmt.size() == wfmt.size());
                  const char *nptr = nfmt.c_str();
                  charT *wptr = const_cast<charT *>(wfmt.c_str());

                  std::use_facet<std::ctype<charT> >(stream.getloc())
                    .widen(nptr, nptr + nfmt.size(), wptr);

                  typedef std::time_put<charT,std::ostreambuf_iterator<charT,traits> >
                    time_type;
                  if (std::use_facet<time_type>(stream.getloc())
                      .put(stream, stream, stream.fill(),
                           &dtm,
                           wptr, wptr + wfmt.size())
                      .failed())
                    {
                      err = std::ios_base::badbit;
                    }
                  stream.width(0);
                }
            }
          catch (...)
            {
              bool flag = false;
              try
                {
                  stream.setstate(std::ios::failbit);
                }
              catch (const std::ios_base::failure& discard)
                {
                  flag = true;
                }
              if (flag)
                throw;
            }
        }

      if (err)
        stream.setstate(err);

      return stream;
    }

  private:
    /**
     * Get the date formatting string.  This is used for output with
     * the locale std::time_put facet.
     *
     * @returns a localised format string.
     */
    virtual const char *
    get_date_format () const;

    /// The time.
    time_t          unix_time;
    /// The function to split up the time.
    break_time_func break_time;
  };

  /**
   * A date representation in UTC.
   */
  class gmdate : public date_base
  {
  public:
    /**
     * The constructor.
     *
     * @param unix_time the time in UTC.
     */
    gmdate (time_t          unix_time):
    date_base(unix_time, gmtime_r)
    {}

    /// The destructor.
    virtual ~gmdate ()
    {}
  };

  /**
   * A date representation in local time.
   */
  class date : public date_base
  {
  public:
    /**
     * The constructor.
     *
     * @param unix_time the time in the local timezone.
     */
    date (time_t           unix_time):
    date_base(unix_time, localtime_r)
    {}

    /// The destructor.
    virtual ~date ()
    {}
  };

  /**
   * A date representation in ISO-8601 format.
   */
  class isodate : public date_base
  {
  public:
    /**
     * The constructor.
     *
     * @param unix_time the time in UTC.
     */
    isodate (time_t        unix_time):
    date_base(unix_time, gmtime_r)
    {}

    /// The destructor.
    virtual ~isodate ()
    {}

  private:
    virtual const char *
    get_date_format () const;
  };

}

#endif /* SBUILD_TYPES_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
