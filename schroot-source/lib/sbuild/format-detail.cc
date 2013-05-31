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

#include <sbuild/format-detail.h>
#include <sbuild/i18n.h>
#include <sbuild/log.h>

#include <boost/format.hpp>

namespace sbuild
{

  format_detail::format_detail (const std::string& title,
                                std::locale        locale):
    title(title),
    locale(locale),
    items()
  {
  }

  format_detail::~format_detail ()
  {
  }

  format_detail&
  format_detail::add (const std::string& name,
                      const std::string& value)
  {
    for (const auto& item : this->items)
      {
        if (item.first == name)
          {
            log_debug(DEBUG_WARNING) << "format_detail: name \""
                                     << name << "\" is already added"
                                     << std::endl;
            return *this;
          }
      }

    this->items.push_back(value_type(name, value));
    log_debug(DEBUG_INFO) << "format_detail: added name \""
                          << name << "\""
                          << std::endl;

    return *this;
  }

  format_detail&
  format_detail::add (const std::string& name,
                      bool               value)
  {
    const char *desc = 0;
    if (value)
      desc =  _("true");
    else
      desc = _("false");

    return add(name, std::string(desc));
  }

  format_detail&
  format_detail::add (const std::string& name,
                      const string_list& value)
  {
    return add(name, string_list_to_string(value, " "));
  }

  std::string
  format_detail::get_title () const
  {
    // TRANSLATORS: %1% = title of section
    // TRANSLATORS: Please format the --- as a continuous line, e.g. U+2500
    boost::format fmt(_("─── %1% ───"));
    fmt %this->title;

    return fmt.str();
  }

}
