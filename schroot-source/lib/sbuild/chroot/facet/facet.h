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

#ifndef SBUILD_CHROOT_FACET_FACET_H
#define SBUILD_CHROOT_FACET_FACET_H

#include <sbuild/environment.h>
#include <sbuild/format-detail.h>
#include <sbuild/keyfile.h>
#include <sbuild/types.h>
#include <sbuild/chroot/chroot.h>

#include <string>

namespace sbuild
{
  namespace chroot
  {
    class chroot;

    /**
     * Facets of functionality and state of individual chroots
     */
    namespace facet
    {

      /**
       * Base class for all facets.  This class provides the basic
       * interfaces and properties required for all facets.  All
       * facets must be derived from this type.  Note that this class
       * can not be used independently of a chroot, and most methods
       * can not be called until the instance is installed in a chroot
       * instance using chroot::add_facet() or related methods.
       */
      class facet
      {
      public:
        /// Chroot session properties.
        enum session_flags
          {
            SESSION_NOFLAGS = 0,      ///< No flags are set.
            SESSION_CREATE  = 1 << 0, ///< The chroot supports session creation.
            SESSION_CLONE   = 1 << 1, ///< The chroot supports cloning.
            SESSION_PURGE   = 1 << 2  ///< The chroot should be purged.
          };

        /// A shared_ptr to a chroot facet object.
        typedef std::shared_ptr<facet> ptr;

        /// A shared_ptr to a const chroot facet object.
        typedef std::shared_ptr<const facet> const_ptr;

      protected:
        /// The constructor.
        facet ();

        /**
         * Set containing chroot.  The copy parameter is used to
         * inform the facet if it is new or a copy; this is intended
         * to allow additional facets to only be added if the facet is
         * new, for example, to avoid re-adding removed facets when
         * copying a chroot.
         *
         * @param chroot the chroot containing this facet.
         * @param copy true if the facet has been copied, or false if
         * this is a new instance.
         */
        virtual void
        set_chroot (chroot& chroot,
                    bool    copy = false);

        friend class ::sbuild::chroot::chroot;

      public:
        /// The destructor.
        virtual ~facet ();

        /**
         * Copy the chroot facet.  This is a virtual copy constructor.
         *
         * @returns a shared_ptr to the new copy of the chroot facet.
         */
        virtual ptr
        clone () const = 0;

        /**
         * Get the name of the chroot facet.
         *
         * @returns the chroot facet name.
         */
        virtual std::string const&
        get_name () const = 0;

        /**
         * Set environment.  Set the environment that the setup scripts
         * will see during execution.
         *
         * @param env the environment to set.
         */
        virtual void
        setup_env (environment& env) const;

        /**
         * Get the session flags of the chroot.  These determine how the
         * Session controlling the chroot will operate.
         *
         * @param chroot the chroot to use.
         * @returns the session flags.
         */
        virtual session_flags
        get_session_flags () const;

        /**
         * Get detailed information about the chroot for output.
         *
         * @param detail the details to output to.
         */
        virtual void
        get_details (format_detail& detail) const;

        /**
         * Get a list of the keys used during keyfile parsing.
         *
         * @returns a list of key names.
         */
        virtual void
        get_used_keys (string_list& used_keys) const;

        /**
         * Copy the chroot properties into a keyfile.  The keyfile group
         * with the name of the chroot will be set; if it already exists,
         * it will be removed before setting it.
         *
         * @param keyfile the keyfile to use.
         */
        virtual void
        get_keyfile (keyfile& keyfile) const;

        /**
         * Set the chroot properties from a keyfile.  The chroot name must
         * have previously been set, so that the correct keyfile group may
         * be determined.
         *
         * @param keyfile the keyfile to get the properties from.
         */
        virtual void
        set_keyfile (const keyfile& keyfile);

      protected:
        /// Chroot owning this facet.
        chroot *owner;
      };

      /**
       * Bitwise-OR of specifed session properties
       * @param lhs session properties
       * @param rhs session properties
       * @returns result of OR.
       */
      facet::session_flags
      inline operator | (const facet::session_flags& lhs,
                         const facet::session_flags& rhs)
      {
        return static_cast<facet::session_flags>
          (static_cast<int>(lhs) | static_cast<int>(rhs));
      }

      /**
       * Bitwise-AND of specifed session properties
       * @param lhs session properties
       * @param rhs session properties
       * @returns result of AND.
       */
      facet::session_flags
      inline operator & (const facet::session_flags& lhs,
                         const facet::session_flags& rhs)
      {
        return static_cast<facet::session_flags>
          (static_cast<int>(lhs) & static_cast<int>(rhs));
      }

    }
  }
}

#endif /* SBUILD_CHROOT_FACET_FACET_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
