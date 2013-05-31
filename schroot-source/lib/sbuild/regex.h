/* Copyright © 2006-2013  Roger Leigh <rleigh@debian.org>
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

#ifndef SBUILD_REGEX_H
#define SBUILD_REGEX_H

#include <istream>
#include <ostream>
#include <string>

#include <sbuild/config.h>
#ifdef HAVE_REGEX_REGEX
# include <regex>
#elif HAVE_TR1_REGEX_REGEX
# include <tr1/regex>
namespace std {
  using std::tr1::regex;
  using std::tr1::regex_error;
  using std::tr1::regex_search;
}
#else
# include <boost/regex.hpp>
namespace std {
  using boost::regex;
  using boost::regex_error;
  using boost::regex_search;
}
#endif

namespace sbuild
{

  /**
   * POSIX extended regular expression.  Note that this extends the
   * C++ std::regex type to provide the stream interface needed by the
   * keyfile class.  Not all methods are overloaded, so this is not
   * safe enough to be generally usable.  For example, it's possible
   * to use non-overloaded assignment operators which will not update
   * the stored string (which is required due to the C++ regex class
   * not providing str() and compare() methods, while the Boost
   * version does.  This class provides these methods in order to be
   * compatible with both the C++11 and Boost regex classes.
   * Additionally, this class always uses extended regexes, which
   * using non-overloaded methods would permit this expectation to be
   * broken.
   */
  class regex
  {
  public:
    /// The constructor
    regex ():
      comp(),
      rstr()
    {}

    /**
     * The constructor.
     *
     * May throw if the regex is invalid.
     *
     * @param pattern a regex
     */
    regex (const std::string& pattern):
      comp(pattern, std::regex::extended),
      rstr(pattern)
    {}

    /**
     * The constructor.
     *
     * May throw if the regex is invalid.
     *
     * @param pattern a regex
     */
    regex (const char *pattern):
    comp(pattern, std::regex::extended),
    rstr(pattern)
    {}

    ///* The destructor.
    ~regex ()
    {}

    /**
     * The copy constructor.
     *
     * May throw if the regex is invalid.
     *
     * @param pattern a regex
     */
    regex (const regex& rhs):
    comp(rhs.comp),
    rstr(rhs.rstr)
    {}

    std::string const&
    str() const
    {
      return rstr;
    }

    bool
    compare (const regex& rhs) const
    {
      return this->rstr != rhs.rstr;
    }

    bool
    search (const std::string& str) const
    {
      return std::regex_search(str, this->comp);
    }

    /**
     * Get the regex name from a stream.
     *
     * May throw if the regex is invalid.
     *
     * @param stream the stream to get input from.
     * @param rhs the regex to set.
     * @returns the stream.
     */
    template <class charT, class traits>
    friend
    std::basic_istream<charT,traits>&
    operator >> (std::basic_istream<charT,traits>& stream,
                 regex&                            rhs)
    {
      std::string regex;

      if (std::getline(stream, regex))
        {
          rhs.comp.assign(regex, std::regex::extended);
          rhs.rstr = regex;
        }

      return stream;
    }

    /**
     * Print the regex name to a stream.
     *
     * @param stream the stream to output to.
     * @param rhs the regex to output.
     * @returns the stream.
     */
    template <class charT, class traits>
    friend
    std::basic_ostream<charT,traits>&
    operator << (std::basic_ostream<charT,traits>& stream,
                 const regex&                rhs)
    {
      return stream << rhs.str();
    }

  private:
    /// Compiled regular expression.
    std::regex comp;
    /// String containing the regex.
    std::string rstr;
  };

  /**
   * Search using the regular expression.
   */
  inline bool
  regex_search (const std::string& str,
                const regex& regex)
  {
    return regex.search(str);
  }

}

#endif /* SBUILD_REGEX_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
