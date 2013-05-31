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
#include <sbuild/chroot/facet/block-device.h>
#include <sbuild/chroot/facet/lvm-snapshot.h>
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

        const factory::facet_info lvm_snapshot_info =
          {
            "lvm-snapshot",
            N_("Support for ‘lvm-snapshot’ chroots"),
            false,
            []() -> facet::ptr { return lvm_snapshot::create(); }
          };

        factory lvm_snapshot_register(lvm_snapshot_info);

      }

      lvm_snapshot::lvm_snapshot ():
        block_device_base(),
        session_setup(),
        source_setup(),
        snapshot_device(),
        snapshot_options()
      {
      }

      lvm_snapshot::lvm_snapshot (const lvm_snapshot& rhs):
        block_device_base(rhs),
        session_setup(rhs),
        source_setup(rhs),
        snapshot_device(rhs.snapshot_device),
        snapshot_options(rhs.snapshot_options)
      {
      }

      lvm_snapshot::~lvm_snapshot ()
      {
      }

      void
      lvm_snapshot::set_chroot (chroot& chroot,
                                bool    copy)
      {
        block_device_base::set_chroot(chroot, copy);

        if (!copy && !owner->get_facet<session_clonable>())
          owner->add_facet(session_clonable::create());

        if (!copy && !owner->get_facet<source_clonable>())
          owner->add_facet(source_clonable::create());
      }

      std::string const&
      lvm_snapshot::get_name () const
      {
        return lvm_snapshot_info.name;
      }

      lvm_snapshot::ptr
      lvm_snapshot::create ()
      {
        return ptr(new lvm_snapshot());
      }

      facet::ptr
      lvm_snapshot::clone () const
      {
        return ptr(new lvm_snapshot(*this));
      }

      std::string const&
      lvm_snapshot::get_snapshot_device () const
      {
        return this->snapshot_device;
      }

      void
      lvm_snapshot::set_snapshot_device (const std::string& snapshot_device)
      {
        if (!is_absname(snapshot_device))
          throw error(snapshot_device, chroot::DEVICE_ABS);

        this->snapshot_device = snapshot_device;

        mountable::ptr pmnt
          (owner->get_facet<mountable>());
        if (pmnt)
          pmnt->set_mount_device(this->snapshot_device);
      }

      std::string const&
      lvm_snapshot::get_snapshot_options () const
      {
        return this->snapshot_options;
      }

      void
      lvm_snapshot::set_snapshot_options (const std::string& snapshot_options)
      {
        this->snapshot_options = snapshot_options;
      }

      void
      lvm_snapshot::setup_env (environment& env) const
      {
        block_device_base::setup_env(env);

        env.add("CHROOT_LVM_SNAPSHOT_NAME", sbuild::basename(get_snapshot_device()));
        env.add("CHROOT_LVM_SNAPSHOT_DEVICE", get_snapshot_device());
        env.add("CHROOT_LVM_SNAPSHOT_OPTIONS", get_snapshot_options());
      }

      void
      lvm_snapshot::setup_lock (chroot::setup_type type,
                                bool               lock,
                                int                status)
      {
        std::string device;

        /* Lock is removed by setup script on setup stop.  Unlocking here
           would fail: the LVM snapshot device no longer exists. */
        if (!(type == chroot::SETUP_STOP && lock == false))
          {
            if (type == chroot::SETUP_START)
              device = get_device();
            else
              device = get_snapshot_device();

            if (device.empty())
              throw error(chroot::CHROOT_DEVICE);

            try
              {
                stat file_status(device);
                if (!file_status.is_block())
                  {
                    throw error(get_device(), chroot::DEVICE_NOTBLOCK);
                  }
              }
            catch (const sbuild::stat::error& e) // Failed to stat
              {
                // Don't throw if stopping a session and the device stat
                // failed.  This is because the setup scripts shouldn't fail
                // to be run if the LVM snapshot no longer exists, which
                // would prevent the session from being ended.
                if (type != chroot::SETUP_STOP)
                  throw;
              }
          }

        /* Create or unlink session information. */
        if ((type == chroot::SETUP_START && lock == true) ||
            (type == chroot::SETUP_STOP && lock == false && status == 0))
          {
            bool start = (type == chroot::SETUP_START);
            owner->get_facet_strict<session>()->setup_session_info(start);
          }
      }

      facet::session_flags
      lvm_snapshot::get_session_flags () const
      {
        session_flags flags = SESSION_NOFLAGS;

        if (owner->get_facet<session>())
          flags = flags | SESSION_PURGE;

        return flags;
      }

      void
      lvm_snapshot::get_details (format_detail& detail) const
      {
        block_device_base::get_details(detail);

        if (!this->snapshot_device.empty())
          detail.add(_("LVM Snapshot Device"), get_snapshot_device());
        if (!this->snapshot_options.empty())
          detail.add(_("LVM Snapshot Options"), get_snapshot_options());
      }

      void
      lvm_snapshot::get_used_keys (string_list& used_keys) const
      {
        block_device_base::get_used_keys(used_keys);

        used_keys.push_back("lvm-snapshot-device");
        used_keys.push_back("lvm-snapshot-options");
      }

      void
      lvm_snapshot::get_keyfile (keyfile& keyfile) const
      {
        block_device_base::get_keyfile(keyfile);

        session::const_ptr is_session = owner->get_facet<session>();

        if (is_session)
          keyfile::set_object_value(*this,
                                    &lvm_snapshot::get_snapshot_device,
                                    keyfile, owner->get_name(),
                                    "lvm-snapshot-device");

        if (!is_session)
          keyfile::set_object_value(*this,
                                    &lvm_snapshot::get_snapshot_options,
                                    keyfile, owner->get_name(),
                                    "lvm-snapshot-options");
      }

      void
      lvm_snapshot::set_keyfile (const keyfile& keyfile)
      {
        block_device_base::set_keyfile(keyfile);

        session::const_ptr is_session = owner->get_facet<session>();

        keyfile::get_object_value(*this, &lvm_snapshot::set_snapshot_device,
                                  keyfile, owner->get_name(), "lvm-snapshot-device",
                                  is_session ?
                                  keyfile::PRIORITY_REQUIRED :
                                  keyfile::PRIORITY_DISALLOWED);

        keyfile::get_object_value(*this, &lvm_snapshot::set_snapshot_options,
                                  keyfile, owner->get_name(), "lvm-snapshot-options",
                                  is_session ?
                                  keyfile::PRIORITY_DEPRECATED :
                                  keyfile::PRIORITY_REQUIRED); // Only needed for creating snapshot, not using snapshot
      }

      void
      lvm_snapshot::chroot_session_setup (const chroot&      parent,
                                          const std::string& session_id,
                                          const std::string& alias,
                                          const std::string& user,
                                          bool               root)
      {
        // LVM devices need the snapshot device name specifying.
        if (!get_device().empty())
          {
            std::string device(dirname(get_device()));
            device += "/" + owner->get_name();
            set_snapshot_device(device);
          }
      }

      void
      lvm_snapshot::chroot_source_setup (const chroot& parent)
      {
        storage::ptr source_block(block_device::create(*this));
        owner->replace_facet<storage>(source_block);
      }

    }
  }
}
