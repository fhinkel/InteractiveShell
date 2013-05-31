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

#ifndef SBUILD_CHROOT_FACET_DIRECTORY_H
#define SBUILD_CHROOT_FACET_DIRECTORY_H

#include <sbuild/config.h>
#include <sbuild/chroot/facet/directory-base.h>
#ifdef SBUILD_FEATURE_BTRFSSNAP
#include <sbuild/chroot/facet/btrfs-snapshot.h>
#endif

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      /**
       * A chroot located in the filesystem.
       *
       * It runs setup scripts and can provide multiple sessions
       * using the union facet.
       */
      class directory : public directory_base
      {
      public:
        /// A shared_ptr to a chroot facet object.
        typedef std::shared_ptr<directory> ptr;

        /// A shared_ptr to a const chroot facet object.
        typedef std::shared_ptr<const directory> const_ptr;

      protected:
        /// The constructor.
        directory ();

        /// The copy constructor.
        directory (const directory& rhs);

#ifdef SBUILD_FEATURE_BTRFSSNAP
        /// The copy constructor.
        directory (const btrfs_snapshot& rhs);
#endif // SBUILD_FEATURE_BTRFSSNAP

        void
        set_chroot (chroot& chroot,
                    bool    copy);

        friend class chroot;
#ifdef SBUILD_FEATURE_BTRFSSNAP
        friend class btrfs_snapshot;
#endif // SBUILD_FEATURE_BTRFSSNAP

      public:
        /// The destructor.
        virtual ~directory ();

        virtual std::string const&
        get_name () const;

        /**
         * Create a chroot facet.
         *
         * @returns a shared_ptr to the new chroot facet.
         */
        static ptr
        create ();

#ifdef SBUILD_FEATURE_BTRFSSNAP
        /**
         * Create a chroot facet from a btrfs snapshot.
         *
         * @returns a shared_ptr to the new chroot facet.
         */
        static ptr
        create (const btrfs_snapshot& rhs);
#endif // SBUILD_FEATURE_BTRFSSNAP

        virtual facet::ptr
        clone () const;

        virtual std::string
        get_path () const;

      protected:
        virtual void
        setup_lock (chroot::setup_type type,
                    bool               lock,
                    int                status);
      };

    }
  }
}

#endif /* SBUILD_CHROOT_FACET_DIRECTORY_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
