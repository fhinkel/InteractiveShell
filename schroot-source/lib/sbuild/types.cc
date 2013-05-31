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

#include <config.h>

#include <sbuild/types.h>
#include <sbuild/i18n.h>

namespace sbuild
{

  const char *
  date_base::get_date_format () const
  {
    // TRANSLATORS: Format string for date representation:
    // %d = day (number, e.g. 14)
    // %b = month (three letters, e.g. Jul)
    // %Y = year (four digits, e.g. 2006)
    // If required, any of the standard strftime(3)
    // format specifiers may be used instead, as long as
    // the day, month and year are clearly displayed in
    // the equivalent standard method for your locale.
    return _("%d %b %Y");
  }

  const char *
  isodate::get_date_format () const
  {
    return "%Y-%m-%dT%H:%M:%SZ";
  }

}
