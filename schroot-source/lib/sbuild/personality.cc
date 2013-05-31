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

#include <sbuild/config.h>
#include <sbuild/personality.h>
#include <sbuild/feature.h>

#include <cstring>
#include <cerrno>
#include <utility>

#include <sys/personality.h>

#include <boost/format.hpp>

using boost::format;

namespace sbuild
{

  namespace
  {

    sbuild::feature feature_personality
    ("PERSONALITY",
     N_("Linux kernel Application Binary Interface switching"));

  }

  template<>
  error<sbuild::personality::error_code>::map_type
  error<sbuild::personality::error_code>::error_strings =
    {
      // TRANSLATORS: %1% = integer personality ID
      {sbuild::personality::BAD, N_("Personality ‘%1%’ is unknown")},
      // TRANSLATORS: %1% = personality name
      {sbuild::personality::SET, N_("Failed to set personality ‘%1%’")}
    };

  std::map<std::string,sbuild::personality::type>
  sbuild::personality::personalities =
    {
      {"undefined", 0xffffffff},
      {"linux", PER_LINUX},
      {"linux_32bit", PER_LINUX_32BIT},
      {"svr4", PER_SVR4},
      {"scorvr3", PER_SCOSVR3},
      {"osr5", PER_OSR5},
      {"wysev386", PER_WYSEV386},
      {"iscr4", PER_ISCR4},
      {"bsd", PER_BSD},
      {"sunos", PER_SUNOS},
      {"xenix", PER_XENIX},
      {"linux32", PER_LINUX32},
      {"irix32", PER_IRIX32},
      {"irixn32", PER_IRIXN32},
      {"irix64", PER_IRIX64},
      {"riscos", PER_RISCOS},
      {"solaris", PER_SOLARIS},
      {"uw7", PER_UW7},
      {"hpux", PER_HPUX},
      {"osf4", PER_OSF4}
    };

  sbuild::personality::personality ():
    persona_name("undefined"),
    persona(find_personality("undefined"))
  {
    set_name("undefined");
  }

  sbuild::personality::personality (const std::string& persona):
    persona_name("undefined"),
    persona(find_personality("undefined"))
  {
    set_name(persona);
  }

  sbuild::personality::~personality ()
  {
  }

  sbuild::personality::type
  sbuild::personality::find_personality (const std::string& persona)
  {
    std::map<std::string,type>::const_iterator pos =
      personalities.find(persona);

    if (pos != personalities.end())
      return pos->second;

    return 0xffffffff;
  }

  std::string const&
  sbuild::personality::find_personality (type persona)
  {
    static const std::string unknown("unknown");

    for (std::map<std::string,type>::const_iterator pos = personalities.begin();
         pos != personalities.end();
         ++pos)
      if (pos->second == persona)
        return pos->first;

    return unknown;
  }

  std::string const&
  sbuild::personality::get_name () const
  {
    return this->persona_name;
  }

  void
  sbuild::personality::set_name (const std::string& persona)
  {
    this->persona_name = persona;
    this->persona = find_personality(persona);

    if (this->persona_name != "undefined" &&
        this->persona == find_personality("undefined"))
      {
        this->persona_name = "undefined";
        this->persona = find_personality("undefined");

        personality::error e(persona, personality::BAD);
        e.set_reason(personality::get_personalities());
        throw e;
      }
  }

  sbuild::personality::type
  sbuild::personality::get () const
  {
    return this->persona;
  }

  void
  sbuild::personality::set () const
  {
    /* Set the process execution domain using personality(2). */
    if (this->persona != find_personality("undefined") &&
        ::personality (this->persona) < 0)
      {
        throw error(get_name(), SET, strerror(errno));
      }
  }

  std::string
  sbuild::personality::get_personalities ()
  {
    // TRANSLATORS: %1% = a comma-separated list of personality names
    format fmt(_("Valid personalities: %1%\n"));
    std::string ps;

    for (std::map<std::string,type>::const_iterator pos = personalities.begin();
         pos != personalities.end();
         ++pos)
      {
        ps += pos->first;
        std::map<std::string,type>::const_iterator stpos = pos;
        if (++stpos != personalities.end())
          ps += ", ";
      }

    fmt % ps;

    return fmt.str();
  }

}
