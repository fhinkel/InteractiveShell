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

#ifndef SBUILD_CHROOT_FACET_PLAIN_H
#define SBUILD_CHROOT_FACET_PLAIN_H

#include <sbuild/config.h>
#include <sbuild/chroot/facet/directory-base.h>

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      /**
       * A chroot located in the filesystem (scripts disabled).
       *
       * This doesn't run any setup scripts and doesn't provide any
       * session support.  If you need any of these functions, the
       * directory chroot type is more suited to your needs.
       */
      class plain : public directory_base
      {
      public:
        /// A shared_ptr to a chroot facet object.
        typedef std::shared_ptr<plain> ptr;

        /// A shared_ptr to a const chroot facet object.
        typedef std::shared_ptr<const plain> const_ptr;

      protected:
        /// The constructor.
        plain ();

        /// The copy constructor.
        plain (const plain& rhs);

        friend class chroot;

      public:
        /// The destructor.
        virtual ~plain ();

        virtual std::string const&
        get_name () const;

        /**
         * Create a chroot facet.
         *
         * @returns a shared_ptr to the new chroot facet.
         */
        static ptr
        create ();

        virtual facet::ptr
        clone () const;

        virtual std::string
        get_path () const;
      };

    }
  }
}

#endif /* SBUILD_CHROOT_FACET_PLAIN_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
