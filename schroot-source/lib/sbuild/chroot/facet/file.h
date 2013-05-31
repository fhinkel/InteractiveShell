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

#ifndef SBUILD_CHROOT_FACET_FILE_H
#define SBUILD_CHROOT_FACET_FILE_H

#include <sbuild/chroot/chroot.h>
#include <sbuild/chroot/facet/facet.h>
#include <sbuild/chroot/facet/source-setup.h>
#include <sbuild/chroot/facet/storage.h>

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      /**
       * A chroot stored in a file archive (tar with optional compression).
       *
       * The archive will be unpacked and repacked on demand.
       */
      class file : public facet,
                   public storage,
                   public source_setup
      {
      public:
        /// Exception type.
        typedef chroot::error error;

        /// A shared_ptr to a chroot facet object.
        typedef std::shared_ptr<file> ptr;

        /// A shared_ptr to a const chroot facet object.
        typedef std::shared_ptr<const file> const_ptr;

      protected:
        /// The constructor.
        file ();

        /// The copy constructor.
        file (const file& rhs);

        void
        set_chroot (chroot& chroot,
                    bool    copy);

        friend class chroot;

      public:
        /// The destructor.
        virtual ~file ();

        virtual std::string const&
        get_name () const;

        /**
         * Create a chroot facet.
         *
         * @returns a shared_ptr to the new chroot facet.
         */
        static ptr
        create ();

        facet::ptr
        clone () const;

        /**
         * Get the filename used by the chroot.
         *
         * @returns the filename.
         */
        std::string const&
        get_filename () const;

        /**
         * Set the filename used by the chroot.
         *
         * @param filename the filename.
         */
        void
        set_filename (const std::string& filename);

        /**
         * Get the location.  This is a path to the chroot directory
         * inside the archive (absolute path from the archive root).
         *
         * @returns the location.
         */
        virtual std::string const&
        get_location () const;

        /**
         * Set the location.  This is a path to the chroot directory
         * inside the archive (absolute path from the archive root).
         *
         * @param location the location.
         */
        virtual void
        set_location (const std::string& location);

        /**
         * Get the repack status.  This is true if the unpacked archive
         * file will be repacked.
         *
         * @returns the repack status.
         */
        bool
        get_file_repack () const;

        /**
         * Set the file repack status.  Set to true if the unpacked
         * archive file will be repacked on session cleanup, or false to
         * discard.
         *
         * @param repack the repack status.
         */
        void
        set_file_repack (bool repack);

        virtual void
        setup_env (environment& env) const;

        std::string
        get_path () const;

        virtual session_flags
        get_session_flags () const;

      protected:
        virtual void
        setup_lock (chroot::setup_type type,
                    bool               lock,
                    int                status);

        virtual void
        get_details (format_detail& detail) const;

        virtual void
        get_used_keys (string_list& used_keys) const;

        virtual void
        get_keyfile (keyfile& keyfile) const;

        virtual void
        set_keyfile (const keyfile& keyfile);

        virtual void
        chroot_source_setup (const chroot& parent);

      private:
        /// The file to use.
        std::string filename;
        /// Location inside the mount location root.
        std::string location;
        /// Should the chroot be repacked?
        bool repack;
      };

    }
  }
}

#endif /* SBUILD_CHROOT_FACET_FILE_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
