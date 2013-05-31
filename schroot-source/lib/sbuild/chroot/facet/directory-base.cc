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

#include <sbuild/chroot/facet/directory-base.h>
#include <sbuild/format-detail.h>
#include <sbuild/lock.h>
#include <sbuild/util.h>

#include <cerrno>
#include <cstring>
#include <iostream>

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      directory_base::directory_base ():
        facet(),
        storage(),
        directory()
      {
      }

      directory_base::directory_base (const directory_base& rhs):
        facet(rhs),
        storage(rhs),
        directory(rhs.directory)
      {
      }

      directory_base::~directory_base ()
      {
      }

      std::string const&
      directory_base::get_directory () const
      {
        return this->directory;
      }

      void
      directory_base::set_directory (const std::string& directory)
      {
        if (!is_absname(directory))
          throw chroot::error(directory, chroot::DIRECTORY_ABS);

        this->directory = directory;
      }

      void
      directory_base::setup_env (environment& env) const
      {
        env.add("CHROOT_DIRECTORY", get_directory());
      }

      void
      directory_base::get_details (format_detail& detail) const
      {
        detail.add(_("Directory"), get_directory());
      }

      void
      directory_base::get_used_keys (string_list& used_keys) const
      {
        used_keys.push_back("directory");
        used_keys.push_back("location");
      }

      void
      directory_base::get_keyfile (keyfile& keyfile) const
      {
        keyfile::set_object_value(*this, &directory_base::get_directory,
                                  keyfile, owner->get_name(), "directory");
      }

      void
      directory_base::set_keyfile (const keyfile& keyfile)
      {
        // "directory" should be required, but we also accept "location" as
        // an alternative (but deprecated) variant.  Therefore, ensure by
        // hand that one of them is defined, but not both.

        bool directory_key = keyfile.has_key(owner->get_name(), "directory");
        bool location_key = keyfile.has_key(owner->get_name(), "location");

        keyfile::priority directory_priority = keyfile::PRIORITY_OPTIONAL;
        keyfile::priority location_priority = keyfile::PRIORITY_OBSOLETE;

        if (!directory_key && !location_key)
          throw keyfile::error(owner->get_name(), keyfile::MISSING_KEY_NL, "directory");

        // Using both keys is not allowed (which one is the correct one?),
        // so force an exception to be thrown when reading the old location
        // key.
        if (directory_key && location_key)
          location_priority = keyfile::PRIORITY_DISALLOWED;

        keyfile::get_object_value(*this, &directory_base::set_directory,
                                  keyfile, owner->get_name(), "directory",
                                  directory_priority);

        keyfile::get_object_value(*this, &directory_base::set_directory,
                                  keyfile, owner->get_name(), "location",
                                  location_priority);
      }

    }
  }
}
