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

#ifndef SBUILD_CHROOT_FACET_SOURCE_H
#define SBUILD_CHROOT_FACET_SOURCE_H

#include <sbuild/chroot/facet/facet.h>

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      /**
       * Chroot support for clonable sources.
       *
       * A chroot may offer a "source" facet in addition to its normal
       * "session" copy, to allow for maintenence of the source data.
       * This facet is installed into source chroots to identify them
       * as such, and so modify their session behaviour.
       */
      class source : public facet
      {
      public:
        /// A shared_ptr to a chroot facet object.
        typedef std::shared_ptr<source> ptr;

        /// A shared_ptr to a const chroot facet object.
        typedef std::shared_ptr<const source> const_ptr;

      private:
        /// The constructor.
        source ();

      public:
        /// The destructor.
        virtual ~source ();

        /**
         * Create a chroot facet.
         *
         * @returns a shared_ptr to the new chroot facet.
         */
        static ptr
        create ();

        virtual facet::ptr
        clone () const;

        virtual std::string const&
        get_name () const;
      };

    }
  }
}

#endif /* SBUILD_CHROOT_FACET_SOURCE_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
