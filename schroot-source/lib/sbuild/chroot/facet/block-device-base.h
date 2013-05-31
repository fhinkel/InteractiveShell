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

#ifndef SBUILD_CHROOT_FACET_BLOCK_DEVICE_BASE_H
#define SBUILD_CHROOT_FACET_BLOCK_DEVICE_BASE_H

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
       * A base class for block-device chroots.
       *
       * This class doesn't implement a chroot (get_chroot_type
       * is not implemented).
       *
       * Originally lvm-snapshot inherited from the block-device chroot,
       * but this was changed when union support was introduced.  This
       * design prevents lvm-snapshot offering union based sessions.
       */
      class block_device_base : public facet,
                                public storage
      {
      public:
        /// Exception type.
        typedef chroot::error error;

      protected:
        /// The constructor.
        block_device_base ();

        /// The copy constructor.
        block_device_base (const block_device_base& rhs);

        friend class chroot;

      public:
        /// The destructor.
        virtual ~block_device_base ();

      protected:
        void
        set_chroot (chroot& chroot,
                    bool    copy);

      public:
        /**
         * Get the block device of the chroot.
         *
         * @returns the device.
         */
        std::string const&
        get_device () const;

        /**
         * Set the block device of the chroot.  This is the "source" device.
         * It may be the case that the real device is different (for
         * example, an LVM snapshot PV), but by default will be the device
         * to mount.
         *
         * @param device the device.
         */
        void
        set_device (const std::string& device);

        virtual std::string
        get_path () const;

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

        /// The block device to use.
        std::string device;
      };

    }
  }
}

#endif /* SBUILD_CHROOT_FACET_BLOCK_DEVICE_BASE_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
