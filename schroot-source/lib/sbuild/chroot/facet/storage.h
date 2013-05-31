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

#ifndef SBUILD_CHROOT_FACET_STORAGE_H
#define SBUILD_CHROOT_FACET_STORAGE_H

#include <sbuild/chroot/chroot.h>
#include <sbuild/chroot/facet/facet.h>

#include <string>

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      /**
       * Chroot storage.  This base class is used by all facets
       * implementing storage methods, for example directories, LVM
       * snapshots, files, etc.
       */
      class storage
      {
      public:
        /// A shared_ptr to a chroot storage object.
        typedef std::shared_ptr<storage> ptr;

        /// A shared_ptr to a const chroot storage object.
        typedef std::shared_ptr<const storage> const_ptr;

      protected:
        /// The constructor.
        storage();

      public:
        /// The destructor.
        virtual ~storage ();

        /**
         * Get the path to the chroot.  This is the absolute path to the
         * root of the chroot, and is typically the same as the mount
         * location and location concatenated together, but is overridden
         * by the chroot type if required.
         *
         * @returns the path.
         */
        virtual std::string
        get_path () const = 0;

        virtual void
        setup_lock(chroot::setup_type type,
                   bool               lock,
                   int                status);

      };

    }
  }
}

#endif /* SBUILD_CHROOT_FACET_STORAGE_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
