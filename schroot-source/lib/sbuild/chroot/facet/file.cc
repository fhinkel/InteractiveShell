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

#include <sbuild/chroot/facet/factory.h>
#include <sbuild/chroot/facet/file.h>
#include <sbuild/chroot/facet/mountable.h>
#include <sbuild/chroot/facet/session-clonable.h>
#include <sbuild/chroot/facet/session.h>
#include <sbuild/chroot/facet/source-clonable.h>
#include <sbuild/format-detail.h>

#include <cassert>
#include <cerrno>

#include <boost/format.hpp>

using std::endl;
using boost::format;

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      namespace
      {

        const factory::facet_info file_info =
          {
            "file",
            N_("Support for ‘file’ chroots"),
            false,
            []() -> facet::ptr { return file::create(); }
          };

        factory file_register(file_info);

      }

      file::file ():
        facet(),
        storage(),
        filename(),
        location(),
        repack(false)
      {
      }

      file::file (const file& rhs):
        facet(rhs),
        storage(rhs),
        source_setup(rhs),
        filename(rhs.filename),
        location(rhs.location),
        repack(rhs.repack)
      {
      }

      file::~file ()
      {
      }

      void
      file::set_chroot (chroot& chroot,
                        bool    copy)
      {
        facet::set_chroot(chroot, copy);

        if (!copy && !owner->get_facet<session_clonable>())
          owner->add_facet(session_clonable::create());

        if (!copy && !owner->get_facet<source_clonable>())
          owner->add_facet(source_clonable::create());
      }

      std::string const&
      file::get_name () const
      {
        return file_info.name;
      }

      file::ptr
      file::create ()
      {
        return ptr(new file());
      }

      facet::ptr
      file::clone () const
      {
        return ptr(new file(*this));
      }

      std::string const&
      file::get_filename () const
      {
        return this->filename;
      }

      void
      file::set_filename (const std::string& filename)
      {
        if (!is_absname(filename))
          throw error(filename, chroot::FILE_ABS);

        this->filename = filename;
      }

      std::string const&
      file::get_location () const
      {
        return this->location;
      }

      void
      file::set_location (const std::string& location)
      {
        if (!location.empty() && !is_absname(location))
          throw chroot::error(location, chroot::LOCATION_ABS);

        this->location = location;
      }

      bool
      file::get_file_repack () const
      {
        return this->repack;
      }

      void
      file::set_file_repack (bool repack)
      {
        this->repack = repack;
      }

      std::string
      file::get_path () const
      {
        std::string path(owner->get_mount_location());

        if (!get_location().empty())
          path += get_location();

        return path;
      }

      void
      file::setup_env (environment& env) const
      {
        env.add("CHROOT_FILE", get_filename());
        env.add("CHROOT_LOCATION", get_location());
        env.add("CHROOT_FILE_REPACK", this->repack);
        env.add("CHROOT_FILE_UNPACK_DIR", SCHROOT_FILE_UNPACK_DIR);
      }

      void
      file::setup_lock (chroot::setup_type type,
                        bool               lock,
                        int                status)
      {
        // Check ownership and permissions.
        if (type == chroot::SETUP_START && lock == true)
          {
            stat file_status(this->filename);

            // NOTE: taken from chroot_config::check_security.
            if (file_status.uid() != 0)
              throw error(this->filename, chroot::FILE_OWNER);
            if (file_status.check_mode(stat::PERM_OTHER_WRITE))
              throw error(this->filename, chroot::FILE_PERMS);
            if (!file_status.is_regular())
              throw error(this->filename, chroot::FILE_NOTREG);
          }

        /* By default, file chroots do no locking. */
        /* Create or unlink session information. */
        if ((type == chroot::SETUP_START && lock == true) ||
            (type == chroot::SETUP_STOP && lock == false && status == 0))
          {

            bool start = (type == chroot::SETUP_START);
            owner->get_facet_strict<session>()->setup_session_info(start);
          }
      }

      facet::session_flags
      file::get_session_flags () const
      {
        session_flags flags = SESSION_NOFLAGS;

        if (owner->get_facet<session>())
          flags = SESSION_PURGE;

        return flags;
      }

      void
      file::get_details (format_detail& detail) const
      {
        if (!this->filename.empty())
          detail
            .add(_("File"), get_filename())
            .add(_("File Repack"), this->repack);
        if (!get_location().empty())
          detail.add(_("Location"), get_location());
      }

      void
      file::get_used_keys (string_list& used_keys) const
      {
        used_keys.push_back("file");
        used_keys.push_back("location");
        used_keys.push_back("file-repack");
      }

      void
      file::get_keyfile (keyfile& keyfile) const
      {
        bool is_session = static_cast<bool>(owner->get_facet<session>());

        keyfile::set_object_value(*this, &file::get_filename,
                                  keyfile, owner->get_name(), "file");

        keyfile::set_object_value(*this, &file::get_location,
                                  keyfile, owner->get_name(),
                                  "location");

        if (is_session)
          keyfile::set_object_value(*this, &file::get_file_repack,
                                    keyfile, owner->get_name(), "file-repack");
      }

      void
      file::set_keyfile (const keyfile& keyfile)
      {
        bool is_session = static_cast<bool>(owner->get_facet<session>());

        keyfile::get_object_value(*this, &file::set_filename,
                                  keyfile, owner->get_name(), "file",
                                  keyfile::PRIORITY_REQUIRED);

        keyfile::get_object_value(*this, &file::set_location,
                                  keyfile, owner->get_name(),
                                  "location",
                                  keyfile::PRIORITY_OPTIONAL);

        keyfile::get_object_value(*this, &file::set_file_repack,
                                  keyfile, owner->get_name(), "file-repack",
                                  is_session ?
                                  keyfile::PRIORITY_REQUIRED :
                                  keyfile::PRIORITY_DISALLOWED);
      }

      void
      file::chroot_source_setup (const chroot& parent)
      {
        set_file_repack(true);
      }

    }
  }
}
