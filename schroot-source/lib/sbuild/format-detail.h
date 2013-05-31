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

#ifndef SBUILD_FORMAT_DETAIL_H
#define SBUILD_FORMAT_DETAIL_H

#include <sbuild/types.h>
#include <sbuild/util.h>

#include <cwchar>
#include <iomanip>
#include <locale>
#include <ostream>
#include <sstream>
#include <string>

namespace sbuild
{

  /**
   * Format names and values for output.
   */
  class format_detail
  {
  public:
    /**
     * The constructor.
     *
     * @param title the title of the set of name and value pairs.
     * @param locale the locale to use for formatting the values.
     */
    format_detail (const std::string& title,
                   std::locale        locale);

    virtual ~format_detail ();

    /**
     * Add a name-value pair (string specialisation).
     *
     * @param name the name.
     * @param value the string value.
     * @returns a reference to the format_detail object.
     */
    format_detail&
    add (const std::string& name,
         const std::string& value);

    /**
     * Add a name-value pair (bool specialisation).
     *
     * @param name the name.
     * @param value the bool value.
     * @returns a reference to the format_detail object.
     */
    format_detail&
    add (const std::string& name,
         bool               value);

    /**
     * Add a name-value pair (string_list specialisation).
     *
     * @param name the name.
     * @param value the string_list value.
     * @returns a reference to the format_detail object.
     */
    format_detail&
    add (const std::string& name,
         const string_list& value);

    /**
     * Add a name-value pair.
     *
     * @param name the name.
     * @param value the value.
     * @returns a reference to the format_detail object.
     */
    template<typename T>
    format_detail&
    add (const std::string& name,
         T const&           value)
    {
      std::ostringstream varstring;
      varstring.imbue(this->locale);
      varstring << value;
      return add(name, varstring.str());
    }

  private:
    /**
     * Get the title of the chroot.  The title is formatted for
     * output.
     *
     * @returns the formatted title.
     */
    std::string
    get_title () const;

    /**
     * Output the format_detail to an ostream.
     *
     * @param stream the stream to output to.
     * @param rhs the format_detail to output.
     * @returns the stream.
     */
    template <class charT, class traits>
    friend
    std::basic_ostream<charT,traits>&
    operator << (std::basic_ostream<charT,traits>& stream,
                 const format_detail& rhs)
    {
      std::locale loc = stream.getloc();
      int max_width = 0;

      for (const auto& item : rhs.items)
        {
          std::wstring wide = widen_string(item.first, loc);
          int width = wcswidth(wide.c_str(), wide.length());

          if (max_width < width)
            max_width = width;
        }

      if (max_width < 20)
        max_width = 20;
      // To ensure 2 spaces of separation between name and value
      max_width += 2;

      stream << "  " << rhs.get_title() << '\n';

      for (const auto& item : rhs.items)
        {
          std::wostringstream ws;
          ws.imbue(loc);

          std::wstring wide = widen_string(item.first, loc);
          ws << L"  " << std::setw(max_width) << std::left << wide;

          stream << narrow_string(ws.str(), loc) << item.second << '\n';
        }

      return stream;
    }

  private:
    /// Name and value pairs.
    typedef std::pair<std::string,std::string> value_type;
    /// List of name and value pairs.
    typedef std::vector<value_type> list_type;

    /// The title of the items to format.
    std::string title;
    /// The locale to use for output.
    std::locale locale;
    /// The items to format;
    list_type   items;
  };

}

#endif /* SBUILD_FORMAT_DETAIL_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
