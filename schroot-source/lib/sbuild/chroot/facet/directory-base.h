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

#ifndef SBUILD_CHROOT_FACET_DIRECTORY_BASE_H
#define SBUILD_CHROOT_FACET_DIRECTORY_BASE_H

#include <sbuild/chroot/chroot.h>
#include <sbuild/chroot/facet/facet.h>
#include <sbuild/chroot/facet/storage.h>

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      /**
       * A base class for chroots located in a local directory.
       *
       * This class doesn't implement a chroot (get_chroot_type is not
       * implemented).  plain and directory chroots inherit from this
       * class.
       *
       * Originally plain inherited from the directory chroot, but this
       * had to be changed when union support was introduced.  As plain
       * chroots don't run any setup scripts and basically just call
       * 'chroot' on a directory, they can't support union based sessions.
       */
      class directory_base : public facet,
                             public storage
      {
      public:
        /// Exception type.
        typedef chroot::error error;

      protected:
        /// The constructor.
        directory_base ();

        /// The copy constructor.
        directory_base (const directory_base& rhs);

        friend class chroot;

      public:
        /// The destructor.
        virtual ~directory_base ();

      public:
        /**
         * Get the directory containing the chroot.
         *
         * @returns the location.
         */
        std::string const&
        get_directory () const;

        /**
         * Set the directory containing the chroot.
         *
         * @param directory the directory.
         */
        void
        set_directory (const std::string& directory);

        virtual void
        setup_env (environment& env) const;

      protected:
        virtual void
        get_details (format_detail& detail) const;

        virtual void
        get_used_keys (string_list& used_keys) const;

        virtual void
        get_keyfile (keyfile& keyfile) const;

        virtual void
        set_keyfile (const keyfile& keyfile);

        /// The directory to use.
        std::string directory;
      };

    }
  }
}

#endif /* SBUILD_CHROOT_FACET_DIRECTORY_BASE_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
