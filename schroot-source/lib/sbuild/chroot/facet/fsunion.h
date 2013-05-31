/* Copyright © 2008-2013  Jan-Marek Glogowski <glogow@fbihome.de>
 * Copyright © 2005-2013  Roger Leigh <rleigh@debian.org>
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

#ifndef SBUILD_CHROOT_FACET_FSUNION_H
#define SBUILD_CHROOT_FACET_FSUNION_H

#include <sbuild/chroot/chroot.h>
#include <sbuild/chroot/facet/facet.h>
#include <sbuild/chroot/facet/session-setup.h>
#include <sbuild/chroot/facet/source-setup.h>

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      /**
       * Chroot support for filesystem union based sessions.
       *
       * A chroot may offer session support using a filesystem union like
       * aufs or unionfs.  A new union type may need to adapt the 10mount
       * or 05union script to properly populate the underlay and mount
       * directory.  The overlay directory and union setup is already
       * handled.
       */
      class fsunion : public facet,
                      public session_setup,
                      public source_setup
      {
      public:
        /// Error codes.
        enum error_code
          {
            FSUNION_TYPE_UNKNOWN, ///< Unknown filesystem union type.
            FSUNION_OVERLAY_ABS,  ///< Union overlay must have an absolute path.
            FSUNION_UNDERLAY_ABS  ///< Union underlay must have an absolute path.
          };

        /// Exception type.
        typedef custom_error<error_code> error;

        /// A shared_ptr to a chroot facet object.
        typedef std::shared_ptr<fsunion> ptr;

        /// A shared_ptr to a const chroot facet object.
        typedef std::shared_ptr<const fsunion> const_ptr;

      private:
        /// The constructor.
        fsunion ();

      public:
        /// The destructor.
        virtual ~fsunion ();

        /**
         * Create a chroot facet.
         *
         * @returns a shared_ptr to the new chroot facet.
         */
        static ptr
        create ();

        virtual facet::ptr
        clone () const;

        std::string const&
        get_name () const;

        /**
         * Get fs union configured state.
         *
         * @returns if fs union is configured
         */
        bool
        get_union_configured () const;

        /**
         * Get the filesystem union type.
         *
         * @see set_union_type
         * @returns the union filesytem type.
         */
        virtual std::string const&
        get_union_type () const;

        /**
         * Set the filesystem union type.
         *
         * Currently supported values are aufs, unionfs and none.
         *
         * @param union_type the filesystem type.
         **/
        virtual void
        set_union_type (const std::string& union_type);

        /**
         * Get the filesystem union mount options (branch configuration).
         *
         * @see set_union_mount_options
         * @returns the filesystem union branch configuration.
         */
        virtual std::string const&
        get_union_mount_options () const;

        /**
         * Set the filesystem union mount options (branch configuration).
         *
         * Normally a temporary directory is used as the writeable branch,
         * which is removed on session end. This allows the building of a
         * complex union which can merge multiple branches. The string has
         * to be constructed as expected by the filesystem union type and
         * is directly used as the mount '-o' option string.
         *
         * @param union_mount_options a union filesystem-specific branch
         * description
         **/
        virtual void
        set_union_mount_options (const std::string& union_mount_options);

        /**
         * Get the union overlay directory.
         *
         * @returns the writeable overlay directory.
         */
        virtual std::string const&
        get_union_overlay_directory () const;

        /**
         * Set the union overlay directory.
         *
         * @param directory the writeable overlay directory.
         */
        virtual void
        set_union_overlay_directory (const std::string& directory);

        /**
         * Get the union underlay directory.
         *
         * @returns the writeable underlay directory.
         */
        virtual std::string const&
        get_union_underlay_directory () const;

        /**
         * Set the union underlay directory.
         *
         * @param directory the writeable underlay directory.
         */
        virtual void
        set_union_underlay_directory (const std::string& directory);

        virtual void
        setup_env (environment& env) const;

        virtual session_flags
        get_session_flags () const;

        virtual void
        get_details (format_detail& detail) const;

        virtual void
        get_used_keys (string_list& used_keys) const;

        virtual void
        get_keyfile (keyfile& keyfile) const;

        virtual void
        set_keyfile (const keyfile& keyfile);

        virtual void
        chroot_session_setup (const chroot&      parent,
                              const std::string& session_id,
                              const std::string& alias,
                              const std::string& user,
                              bool               root);

        virtual void
        chroot_source_setup (const chroot& parent);

      private:
        /// filesystem union type.
        std::string union_type;
        /// Union mount options (branch configuration).
        std::string union_mount_options;
        /// Union read-write overlay directory.
        std::string union_overlay_directory;
        /// Union read-only underlay directory.
        std::string union_underlay_directory;
      };

    }
  }
}

#endif /* SBUILD_CHROOT_FACET_FSUNION_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
