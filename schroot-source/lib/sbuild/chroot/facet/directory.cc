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

#include <sbuild/chroot/facet/directory.h>
#include <sbuild/chroot/facet/factory.h>
#include <sbuild/chroot/facet/fsunion.h>
#include <sbuild/chroot/facet/session.h>
#include <sbuild/chroot/facet/session-clonable.h>
#include <sbuild/format-detail.h>
#include <sbuild/util.h>

#include <cassert>
#include <cerrno>
#include <cstring>

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

        const factory::facet_info directory_info =
          {
            "directory",
            N_("Support for ‘directory’ chroots"),
            false,
            []() -> facet::ptr { return directory::create(); }
          };

        factory directory_register(directory_info);

      }

      directory::directory ():
        directory_base()
      {
      }

      directory::~directory ()
      {
      }

      directory::directory (const directory& rhs):
        directory_base(rhs)
      {
      }

#ifdef SBUILD_FEATURE_BTRFSSNAP
      directory::directory (const btrfs_snapshot& rhs):
        directory_base()
      {
        set_directory(rhs.get_source_subvolume());
      }
#endif // SBUILD_FEATURE_BTRFSSNAP

      void
      directory::set_chroot (chroot& chroot,
                             bool    copy)
      {
        directory_base::set_chroot(chroot, copy);

        if (!copy && !owner->get_facet<session_clonable>())
          owner->add_facet(session_clonable::create());

#ifdef SBUILD_FEATURE_UNION
        if (!copy && !owner->get_facet<fsunion>())
          owner->add_facet(fsunion::create());
#endif // SBUILD_FEATURE_UNION
      }

      std::string const&
      directory::get_name () const
      {
        return directory_info.name;
      }

      directory::ptr
      directory::create ()
      {
        return ptr(new directory());
      }

#ifdef SBUILD_FEATURE_BTRFSSNAP
      directory::ptr
      directory::create (const btrfs_snapshot& rhs)
      {
        return ptr(new directory(rhs));
      }
#endif // SBUILD_FEATURE_BTRFSSNAP

      facet::ptr
      directory::clone () const
      {
        return ptr(new directory(*this));
      }

      std::string
      directory::get_path () const
      {
        return owner->get_mount_location();
      }

      void
      directory::setup_lock (chroot::setup_type type,
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

    }
  }
}
