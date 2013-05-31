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

#include <sbuild/chroot/facet/btrfs-snapshot.h>
#include <sbuild/chroot/facet/directory.h>
#include <sbuild/chroot/facet/factory.h>
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

        const factory::facet_info btrfs_snapshot_info =
          {
            "btrfs-snapshot",
            N_("Support for ‘btrfs-snapshot’ chroots"),
            false,
            []() -> facet::ptr { return btrfs_snapshot::create(); }
          };

        factory btrfs_snapshot_register(btrfs_snapshot_info);

      }

      btrfs_snapshot::btrfs_snapshot ():
        facet(),
        storage(),
        source_subvolume(),
        snapshot_directory(),
        snapshot_name()
      {
      }

      btrfs_snapshot::btrfs_snapshot (const btrfs_snapshot& rhs):
        facet(rhs),
        storage(rhs),
        session_setup(rhs),
        source_setup(rhs),
        source_subvolume(rhs.source_subvolume),
        snapshot_directory(rhs.snapshot_directory),
        snapshot_name(rhs.snapshot_name)
      {
      }

      btrfs_snapshot::~btrfs_snapshot ()
      {
      }

      void
      btrfs_snapshot::set_chroot (chroot& chroot,
                                  bool    copy)
      {
        facet::set_chroot(chroot, copy);

        if (!copy && !owner->get_facet<session_clonable>())
          owner->add_facet(session_clonable::create());

        if (!copy && !owner->get_facet<source_clonable>())
          owner->add_facet(source_clonable::create());
      }

      std::string const&
      btrfs_snapshot::get_name () const
      {
        return btrfs_snapshot_info.name;
      }

      btrfs_snapshot::ptr
      btrfs_snapshot::create ()
      {
        return ptr(new btrfs_snapshot());
      }

      facet::ptr
      btrfs_snapshot::clone () const
      {
        return ptr(new btrfs_snapshot(*this));
      }

      std::string const&
      btrfs_snapshot::get_source_subvolume () const
      {
        return this->source_subvolume;
      }

      void
      btrfs_snapshot::set_source_subvolume (const std::string& source_subvolume)
      {
        if (!is_absname(source_subvolume))
          throw error(source_subvolume, chroot::DIRECTORY_ABS);

        this->source_subvolume = source_subvolume;
      }

      std::string const&
      btrfs_snapshot::get_snapshot_directory () const
      {
        return this->snapshot_directory;
      }

      void
      btrfs_snapshot::set_snapshot_directory (const std::string& snapshot_directory)
      {
        if (!is_absname(snapshot_directory))
          throw error(source_subvolume, chroot::DIRECTORY_ABS);

        this->snapshot_directory = snapshot_directory;
      }

      std::string const&
      btrfs_snapshot::get_snapshot_name () const
      {
        return this->snapshot_name;
      }

      void
      btrfs_snapshot::set_snapshot_name (const std::string& snapshot_name)
      {
        if (!is_absname(snapshot_name))
          throw error(source_subvolume, chroot::DIRECTORY_ABS);

        this->snapshot_name = snapshot_name;
      }

      std::string
      btrfs_snapshot::get_path () const
      {
        return owner->get_mount_location();
      }

      void
      btrfs_snapshot::setup_env (environment& env) const
      {
        env.add("CHROOT_BTRFS_SOURCE_SUBVOLUME", get_source_subvolume());
        env.add("CHROOT_BTRFS_SNAPSHOT_DIRECTORY", get_snapshot_directory());
        env.add("CHROOT_BTRFS_SNAPSHOT_NAME", get_snapshot_name());
      }

      void
      btrfs_snapshot::setup_lock (chroot::setup_type type,
                                  bool               lock,
                                  int                status)
      {
        /* Create or unlink session information. */
        if ((type == chroot::SETUP_START && lock == true) ||
            (type == chroot::SETUP_STOP && lock == false && status == 0))
          {
            bool start = (type == chroot::SETUP_START);
            owner->get_facet_strict<session>()->setup_session_info(start);
          }
      }

      facet::session_flags
      btrfs_snapshot::get_session_flags () const
      {
        session_flags flags = SESSION_NOFLAGS;

        if (owner->get_facet<session>())
          flags = flags | SESSION_PURGE;

        return flags;
      }

      void
      btrfs_snapshot::get_details (format_detail& detail) const
      {
        if (!this->get_source_subvolume().empty())
          detail.add(_("Btrfs Source Subvolume"), get_source_subvolume());
        if (!this->get_snapshot_directory().empty())
          detail.add(_("Btrfs Snapshot Directory"), get_snapshot_directory());
        if (!this->get_snapshot_name().empty())
          detail.add(_("Btrfs Snapshot Name"), get_snapshot_name());
      }

      void
      btrfs_snapshot::get_used_keys (string_list& used_keys) const
      {
        used_keys.push_back("btrfs-source-subvolume");
        used_keys.push_back("btrfs-snapshot-directory");
        used_keys.push_back("btrfs-snapshot-name");
      }

      void
      btrfs_snapshot::get_keyfile (keyfile& keyfile) const
      {
        bool issession = static_cast<bool>(owner->get_facet<session>());

        if (!issession)
          keyfile::set_object_value(*this,
                                    &btrfs_snapshot::get_source_subvolume,
                                    keyfile, owner->get_name(),
                                    "btrfs-source-subvolume");

        if (!issession)
          keyfile::set_object_value(*this,
                                    &btrfs_snapshot::get_snapshot_directory,
                                    keyfile, owner->get_name(),
                                    "btrfs-snapshot-directory");

        if (issession)
          keyfile::set_object_value(*this,
                                    &btrfs_snapshot::get_snapshot_name,
                                    keyfile, owner->get_name(),
                                    "btrfs-snapshot-name");
      }

      void
      btrfs_snapshot::set_keyfile (const keyfile& keyfile)
      {
        bool issession = static_cast<bool>(owner->get_facet<session>());

        keyfile::get_object_value(*this, &btrfs_snapshot::set_source_subvolume,
                                  keyfile, owner->get_name(), "btrfs-source-subvolume",
                                  issession ?
                                  keyfile::PRIORITY_DISALLOWED :
                                  keyfile::PRIORITY_REQUIRED
                                  ); // Only needed for creating snapshot, not using snapshot

        keyfile::get_object_value(*this, &btrfs_snapshot::set_snapshot_directory,
                                  keyfile, owner->get_name(), "btrfs-snapshot-directory",
                                  issession ?
                                  keyfile::PRIORITY_DISALLOWED :
                                  keyfile::PRIORITY_REQUIRED
                                  ); // Only needed for creating snapshot, not using snapshot

        keyfile::get_object_value(*this, &btrfs_snapshot::set_snapshot_name,
                                  keyfile, owner->get_name(), "btrfs-snapshot-name",
                                  issession ?
                                  keyfile::PRIORITY_REQUIRED :
                                  keyfile::PRIORITY_DISALLOWED);
      }

      void
      btrfs_snapshot::chroot_session_setup (const chroot&      parent,
                                            const std::string& session_id,
                                            const std::string& alias,
                                            const std::string& user,
                                            bool               root)
      {
        // Btrfs snapshots need the snapshot name specifying.
        if (!get_snapshot_directory().empty())
          {
            std::string snapname(get_snapshot_directory());
            snapname += "/" + owner->get_name();
            set_snapshot_name(snapname);
          }
      }

      void
      btrfs_snapshot::chroot_source_setup (const chroot& parent)
      {
        storage::ptr source_directory(directory::create(*this));
        owner->replace_facet<storage>(source_directory);
      }

    }
  }
}
