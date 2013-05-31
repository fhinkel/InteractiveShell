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
#include <sbuild/chroot/facet/mountable.h>
#include <sbuild/chroot/facet/session.h>

#include <cassert>

#include <boost/format.hpp>

using boost::format;
using std::endl;

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      namespace
      {

        const factory::facet_info mountable_info =
          {
            "mountable",
            N_("Support for filesystem mounting"),
            false,
            []() -> facet::ptr { return mountable::create(); }
          };

        factory mountable_register(mountable_info);

      }

      mountable::mountable ():
        facet(),
        mount_device(),
        mount_options(),
        location()
      {
      }

      mountable::~mountable ()
      {
      }

      mountable::ptr
      mountable::create ()
      {
        return ptr(new mountable());
      }

      facet::ptr
      mountable::clone () const
      {
        return ptr(new mountable(*this));
      }

      std::string const&
      mountable::get_name () const
      {
        return mountable_info.name;
      }

      std::string const&
      mountable::get_mount_device () const
      {
        return this->mount_device;
      }

      void
      mountable::set_mount_device (const std::string& mount_device)
      {
        this->mount_device = mount_device;
      }

      std::string const&
      mountable::get_mount_options () const
      {
        return this->mount_options;
      }

      void
      mountable::set_mount_options (const std::string& mount_options)
      {
        this->mount_options = mount_options;
      }

      std::string const&
      mountable::get_location () const
      {
        return this->location;
      }

      void
      mountable::set_location (const std::string& location)
      {
        if (!location.empty() && !is_absname(location))
          throw chroot::error(location, chroot::LOCATION_ABS);

        this->location = location;
      }

      void
      mountable::setup_env (environment& env) const
      {
        env.add("CHROOT_MOUNT_DEVICE", get_mount_device());
        env.add("CHROOT_MOUNT_OPTIONS", get_mount_options());
        env.add("CHROOT_LOCATION", get_location());
      }

      void
      mountable::get_details (format_detail& detail) const
      {
        if (!get_mount_device().empty())
          detail.add(_("Mount Device"), get_mount_device());
        if (!get_mount_options().empty())
          detail.add(_("Mount Options"), get_mount_options());
        if (!get_location().empty())
          detail.add(_("Location"), get_location());
      }

      void
      mountable::get_used_keys (string_list& used_keys) const
      {
        used_keys.push_back("mount-device");
        used_keys.push_back("mount-options");
        used_keys.push_back("location");
      }

      void
      mountable::get_keyfile (keyfile& keyfile) const
      {
        bool issession = static_cast<bool>(owner->get_facet<session>());

        if (issession)
          keyfile::set_object_value(*this, &mountable::get_mount_device,
                                    keyfile, owner->get_name(),
                                    "mount-device");

        keyfile::set_object_value(*this, &mountable::get_mount_options,
                                  keyfile, owner->get_name(),
                                  "mount-options");

        keyfile::set_object_value(*this, &mountable::get_location,
                                  keyfile, owner->get_name(),
                                  "location");
      }

      void
      mountable::set_keyfile (const keyfile& keyfile)
      {
        bool issession = static_cast<bool>(owner->get_facet<session>());

        keyfile::get_object_value(*this, &mountable::set_mount_device,
                                  keyfile, owner->get_name(),
                                  "mount-device",
                                  issession ?
                                  keyfile::PRIORITY_REQUIRED :
                                  keyfile::PRIORITY_DISALLOWED);

        keyfile::get_object_value(*this, &mountable::set_mount_options,
                                  keyfile, owner->get_name(),
                                  "mount-options",
                                  keyfile::PRIORITY_OPTIONAL);

        keyfile::get_object_value(*this, &mountable::set_location,
                                  keyfile, owner->get_name(),
                                  "location",
                                  keyfile::PRIORITY_OPTIONAL);
      }

    }
  }
}
