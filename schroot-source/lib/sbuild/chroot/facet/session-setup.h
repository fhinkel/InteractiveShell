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

#ifndef SBUILD_CHROOT_FACET_SESSION_SETUP_H
#define SBUILD_CHROOT_FACET_SESSION_SETUP_H

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
      class session_setup
      {
      public:
        /// A shared_ptr to a chroot session_setup object.
        typedef std::shared_ptr<session_setup> ptr;

        /// A shared_ptr to a const chroot session_setup object.
        typedef std::shared_ptr<const session_setup> const_ptr;

      protected:
        /// The constructor.
        session_setup ();

      public:
        /// The destructor.
        virtual ~session_setup ();

        /**
         * Set up a newly-cloned session chroot.
         *
         * @param parent the parent of the cloned chroot.
         * @param session_id the identifier (session_id) for the new session.
         * @param alias used to initially identify the chroot.
         * @param user the user creating the session.
         * @param root true if the user has root access, otherwise false.
         */
        virtual void
        chroot_session_setup (const chroot&      parent,
                              const std::string& session_id,
                              const std::string& alias,
                              const std::string& user,
                              bool               root) = 0;

      };

    }
  }
}

#endif /* SBUILD_CHROOT_FACET_SESSION_SETUP_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
