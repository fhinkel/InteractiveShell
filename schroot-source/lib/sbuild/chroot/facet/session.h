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

#ifndef SBUILD_CHROOT_FACET_SESSION_H
#define SBUILD_CHROOT_FACET_SESSION_H

#include <sbuild/chroot/facet/facet.h>
#include <sbuild/session.h>

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      /**
       * Chroot support for sessions.
       *
       * A chroot may offer a "session" facet to signal restorable or
       * parallel chroot environment usage.  The presence of this facet
       * indicates that the chroot is an active session.
       */
      class session : public facet
      {
      public:
        /// Exception type.
        typedef chroot::error error;

        /// A shared_ptr to a chroot facet object.
        typedef std::shared_ptr<session> ptr;

        /// A shared_ptr to a const chroot facet object.
        typedef std::shared_ptr<const session> const_ptr;

      private:
        /// The constructor.
        session ();

      public:
        /// The destructor.
        virtual ~session ();

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
         * Get the original name of the chroot (prior to session cloning).
         *
         * @returns the name.
         */
        std::string const&
        get_original_name () const;

        /**
         * Set the original name of the chroot (prior to session cloning).
         * This will also set the selected name.
         *
         * @param name the name.
         */
        void
        set_original_name (const std::string& name);

        /**
         * Get the selected name of the chroot (alias used).
         *
         * @returns the name.
         */
        std::string const&
        get_selected_name () const;

        /**
         * Set the selected name of the chroot (alias used).
         *
         * @param name the name.
         */
        void
        set_selected_name (const std::string& name);

        /**
         * Set up persistent session information.
         *
         * @param start true if starting, or false if ending a session.
         */
        void
        setup_session_info (bool start);

        virtual void
        setup_env (environment& env) const;

        virtual void
        get_details (format_detail& detail) const;

        virtual void
        get_used_keys (string_list& used_keys) const;

        virtual void
        get_keyfile (keyfile& keyfile) const;

        virtual void
        set_keyfile (const keyfile& keyfile);

      private:
        /// Original chroot name prior to session cloning.
        std::string  original_chroot_name;
        /// Selected chroot name.
        std::string  selected_chroot_name;
      };

    }
  }
}

#endif /* SBUILD_CHROOT_FACET_SESSION_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
