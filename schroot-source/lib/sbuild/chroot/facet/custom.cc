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

#include <config.h>

#include <sbuild/chroot/facet/factory.h>
#include <sbuild/chroot/facet/custom.h>
#include <sbuild/chroot/facet/mountable.h>
#include <sbuild/chroot/facet/session-clonable.h>
#include <sbuild/chroot/facet/session.h>
#include <sbuild/chroot/facet/source-clonable.h>
#include <sbuild/format-detail.h>

#include <cassert>
#include <cerrno>

#include <boost/format.hpp>

using std::endl;
using boost::format;

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      namespace
      {

        const factory::facet_info custom_info =
          {
            "custom",
            N_("Support for ‘custom’ chroots"),
            false,
            []() -> facet::ptr { return custom::create(); }
          };

        factory custom_register(custom_info);

      }

      custom::custom ():
        facet(),
        storage(),
        purgeable(false)
      {
      }

      custom::custom (const custom& rhs):
        facet(rhs),
        storage(rhs),
        purgeable(rhs.purgeable)
      {
      }

      custom::~custom ()
      {
      }

      void
      custom::set_chroot (chroot& chroot,
                          bool    copy)
      {
        facet::set_chroot(chroot, copy);

        if (!copy && !owner->get_facet<session_clonable>())
          owner->add_facet(session_clonable::create());
      }

      std::string const&
      custom::get_name () const
      {
        return custom_info.name;
      }

      custom::ptr
      custom::create ()
      {
        return ptr(new custom());
      }

      facet::ptr
      custom::clone () const
      {
        return ptr(new custom(*this));
      }

      void
      custom::set_session_cloneable (bool cloneable)
      {
        if (cloneable)
          owner->add_facet(session_clonable::create());
        else
          owner->remove_facet<session_clonable>();
      }

      void
      custom::set_session_purgeable (bool purgeable)
      {
        this->purgeable = purgeable;
      }

      bool
      custom::get_session_purgeable () const
      {
        return this->purgeable;
      }

      void
      custom::set_source_cloneable (bool cloneable)
      {
        if (cloneable)
          owner->add_facet(source_clonable::create());
        else
          owner->remove_facet<source_clonable>();
      }

      std::string
      custom::get_path () const
      {
        // TODO: Allow customisation?  Or require use of mount location?
        return owner->get_mount_location();
      }

      void
      custom::setup_lock (chroot::setup_type type,
                          bool               lock,
                          int                status)
      {
        /* By default, custom chroots do no locking. */
        /* Create or unlink session information. */
        if ((type == chroot::SETUP_START && lock == true) ||
            (type == chroot::SETUP_STOP && lock == false && status == 0))
          {

            bool start = (type == chroot::SETUP_START);
            owner->get_facet_strict<session>()->setup_session_info(start);
          }
      }

      facet::session_flags
      custom::get_session_flags () const
      {
        session_flags flags = SESSION_NOFLAGS;

        // TODO: Only set if purge is set.

        if (owner->get_facet<session>() &&
            get_session_purgeable())
          flags = SESSION_PURGE;

        return flags;
      }

      void
      custom::get_used_keys (string_list& used_keys) const
      {
        used_keys.push_back("custom-cloneable");
        used_keys.push_back("custom-purgeable");
        used_keys.push_back("custom-source-cloneable");
      }

      void
      custom::get_keyfile (keyfile& keyfile) const
      {
        keyfile::set_object_value(*this,
                                  &custom::get_session_purgeable,
                                  keyfile, owner->get_name(),
                                  "custom-session-purgeable");
      }

      void
      custom::set_keyfile (const keyfile& keyfile)
      {
        bool is_session = static_cast<bool>(owner->get_facet<session>());

        keyfile::get_object_value(*this, &custom::set_session_cloneable,
                                  keyfile, owner->get_name(), "custom-session-cloneable",
                                  is_session ?
                                  keyfile::PRIORITY_DISALLOWED :
                                  keyfile::PRIORITY_OPTIONAL);

        keyfile::get_object_value(*this, &custom::set_session_purgeable,
                                  keyfile, owner->get_name(), "custom-session-purgeable",
                                  keyfile::PRIORITY_OPTIONAL);

        keyfile::get_object_value(*this, &custom::set_source_cloneable,
                                  keyfile, owner->get_name(), "custom-source-cloneable",
                                  is_session ?
                                  keyfile::PRIORITY_DISALLOWED :
                                  keyfile::PRIORITY_OPTIONAL);
      }
    }
  }
}
