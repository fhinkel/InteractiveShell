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

#ifndef SBUILD_CHROOT_FACET_PERSONALITY_H
#define SBUILD_CHROOT_FACET_PERSONALITY_H

#include <sbuild/chroot/facet/facet.h>
#include <sbuild/personality.h>

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      /**
       * Chroot support for kernel personalities (execution domains).
       */
      class personality : public facet
      {
      public:
        /// A shared_ptr to a chroot facet object.
        typedef std::shared_ptr<personality> ptr;

        /// A shared_ptr to a const chroot facet object.
        typedef std::shared_ptr<const personality> const_ptr;

      private:
        /// The constructor.
        personality ();

      public:
        /// The destructor.
        virtual ~personality ();

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

        /**
         * Get the process execution domain for the chroot.
         *
         * @returns the personality.
         */
        sbuild::personality const&
        get_persona () const;

        /**
         * Set the process execution domain for the chroot.
         *
         * @param persona the personality.
         */
        void
        set_persona (const sbuild::personality& persona);

        virtual void
        get_details (format_detail& detail) const;

        virtual void
        get_used_keys (string_list& used_keys) const;

        virtual void
        get_keyfile (keyfile& keyfile) const;

        virtual void
        set_keyfile (const keyfile& keyfile);

      private:
        /// Process execution domain (Linux only).
        sbuild::personality  persona;
      };

    }
  }
}

#endif /* SBUILD_CHROOT_FACET_PERSONALITY_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
