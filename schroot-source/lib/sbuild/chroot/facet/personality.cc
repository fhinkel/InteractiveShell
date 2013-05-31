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

#include <sbuild/chroot/chroot.h>
#include <sbuild/chroot/facet/factory.h>
#include <sbuild/chroot/facet/personality.h>

#include <boost/format.hpp>

using boost::format;

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      namespace
      {

        const factory::facet_info personality_info =
          {
            "personality",
            N_("Linux kernel Application Binary Interface switching"),
            true,
            []() -> facet::ptr { return personality::create(); }
          };

        factory personality_register(personality_info);

      }

      personality::personality ():
        facet(),
        persona()
      {
      }

      personality::~personality ()
      {
      }

      personality::ptr
      personality::create ()
      {
        return ptr(new personality());
      }

      facet::ptr
      personality::clone () const
      {
        return ptr(new personality(*this));
      }

      std::string const&
      personality::get_name () const
      {
        return personality_info.name;
      }

      sbuild::personality const&
      personality::get_persona () const
      {
        return this->persona;
      }

      void
      personality::set_persona (const sbuild::personality& persona)
      {
        this->persona = persona;
      }

      void
      personality::get_details (format_detail& detail) const
      {
        // TRANSLATORS: "Personality" is the Linux kernel personality
        // (process execution domain).  See schroot.conf(5).
        detail.add(_("Personality"), get_persona().get_name());
      }

      void
      personality::get_used_keys (string_list& used_keys) const
      {
        used_keys.push_back("personality");
      }

      void
      personality::get_keyfile (keyfile& keyfile) const
      {
        // Only set if defined.
        if (get_persona().get_name() != "undefined")
          keyfile::set_object_value(*this, &personality::get_persona,
                                    keyfile, owner->get_name(), "personality");
      }

      void
      personality::set_keyfile (const keyfile& keyfile)
      {
        keyfile::get_object_value(*this, &personality::set_persona,
                                  keyfile, owner->get_name(), "personality",
                                  keyfile::PRIORITY_OPTIONAL);
      }

    }
  }
}
