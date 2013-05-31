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

#ifndef SBUILD_CHROOT_FACET_SOURCE_SETUP_H
#define SBUILD_CHROOT_FACET_SOURCE_SETUP_H

#include <sbuild/chroot/chroot.h>

#include <memory>
#include <string>

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      /**
       * Common chroot data.  This class contains all of the metadata
       * associated with a single chroot, for all chroot types.  This is
       * the in-core representation of a chroot definition in the
       * configuration file, and may be initialised directly from an open
       * keyfile.
       */
      class source_setup
      {
      public:
        /// A shared_ptr to a chroot source_setup object.
        typedef std::shared_ptr<source_setup> ptr;

        /// A shared_ptr to a const chroot source_setup object.
        typedef std::shared_ptr<const source_setup> const_ptr;

      protected:
        /// The constructor.
        source_setup ();

      public:
        /// The destructor.
        virtual ~source_setup ();

        /**
         * Set up a newly-cloned source chroot.
         *
         * @param parent the parent of the cloned chroot.
         */
        virtual void
        chroot_source_setup (const chroot& parent) = 0;

      };

    }
  }
}

#endif /* SBUILD_CHROOT_FACET_SOURCE_SETUP_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
