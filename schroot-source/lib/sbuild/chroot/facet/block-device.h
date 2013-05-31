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

#ifndef SBUILD_CHROOT_FACET_BLOCK_DEVICE_H
#define SBUILD_CHROOT_FACET_BLOCK_DEVICE_H

#include <sbuild/config.h>
#include <sbuild/chroot/facet/block-device-base.h>
#include <sbuild/chroot/facet/lvm-snapshot.h>
#include <sbuild/chroot/facet/mountable.h>
#include <sbuild/chroot/facet/session-setup.h>

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      /**
       * A chroot stored on an unmounted block device.
       *
       * The device will be mounted on demand.
       */
      class block_device : public block_device_base,
                           public session_setup
      {
      public:
        /// A shared_ptr to a chroot facet object.
        typedef std::shared_ptr<block_device> ptr;

        /// A shared_ptr to a const chroot facet object.
        typedef std::shared_ptr<const block_device> const_ptr;

      protected:
        /// The constructor.
        block_device ();

        /// The copy constructor.
        block_device (const block_device& rhs);

#ifdef SBUILD_FEATURE_LVMSNAP
        /// The copy constructor.
        block_device (const lvm_snapshot& rhs);
#endif

        void
        set_chroot (chroot& chroot,
                    bool    copy);

        friend class chroot;
#ifdef SBUILD_FEATURE_LVMSNAP
        friend class lvm_snapshot;
#endif

      public:
        /// The destructor.
        virtual ~block_device ();

        virtual std::string const&
        get_name () const;

        /**
         * Create a chroot facet.
         *
         * @returns a shared_ptr to the new chroot facet.
         */
        static ptr
        create ();

        /**
         * Create a chroot facet copied from an LVM snapshot.
         *
         * @param rhs the LVM snapshot to copy.
         * @returns a shared_ptr to the new chroot facet.
         */
#ifdef SBUILD_FEATURE_LVMSNAP
        static ptr
        create (const lvm_snapshot& rhs);
#endif // SBUILD_FEATURE_LVMSNAP

        virtual facet::ptr
        clone () const;

        virtual void
        chroot_session_setup (const chroot&      parent,
                              const std::string& session_id,
                              const std::string& alias,
                              const std::string& user,
                              bool               root);

      protected:
        virtual void
        setup_lock (chroot::setup_type type,
                    bool               lock,
                    int                status);
      };

    }
  }
}

#endif /* SBUILD_CHROOT_FACET_BLOCK_DEVICE_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
