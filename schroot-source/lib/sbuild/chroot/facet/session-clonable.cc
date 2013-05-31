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

#include <sbuild/chroot/chroot.h>
#include <sbuild/chroot/facet/factory.h>
#include <sbuild/chroot/facet/mountable.h>
#include <sbuild/chroot/facet/session.h>
#include <sbuild/chroot/facet/session-clonable.h>
#include <sbuild/chroot/facet/session-setup.h>
#include <sbuild/chroot/facet/source-clonable.h>
#include <sbuild/format-detail.h>

#include <cassert>

#include <boost/format.hpp>

using boost::format;
using std::endl;

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      namespace
      {

        const factory::facet_info session_clonable_info =
          {
            "session-clonable",
            N_("Support for session chroot cloning"),
            false,
            []() -> facet::ptr { return session_clonable::create(); }
          };

        factory session_clonable_register(session_clonable_info);

      }

      session_clonable::session_clonable ():
        facet()
      {
      }

      session_clonable::~session_clonable ()
      {
      }

      session_clonable::ptr
      session_clonable::create ()
      {
        return ptr(new session_clonable());
      }

      facet::ptr
      session_clonable::clone () const
      {
        return ptr(new session_clonable(*this));
      }

      std::string const&
      session_clonable::get_name () const
      {
        return session_clonable_info.name;
      }

      chroot::ptr
      session_clonable::clone_session (const std::string& session_id,
                                       const std::string& alias,
                                       const std::string& user,
                                       bool               root) const
      {
        chroot::ptr clone = owner->clone();

        // Disable session cloning.
        clone->remove_facet<session_clonable>();
        // Disable source cloning.
        clone->remove_facet<source_clonable>();
        clone->add_facet(session::create());

        // Disable session, delete aliases.
        session::ptr psess(clone->get_facet<session>());
        assert(psess);

        psess->set_original_name(clone->get_name());
        psess->set_selected_name(alias);
        clone->set_name(session_id);
        assert(clone->get_name() == session_id);
        clone->set_description
          (clone->get_description() + ' ' + _("(session chroot)"));

        string_list empty_list;
        string_list allowed_users;
        if (!user.empty())
          allowed_users.push_back(user);

        if (root)
          {
            clone->set_users(empty_list);
            clone->set_root_users(allowed_users);
          }
        else
          {
            clone->set_users(allowed_users);
            clone->set_root_users(empty_list);
          }
        clone->set_groups(empty_list);
        clone->set_root_groups(empty_list);
        clone->set_aliases(empty_list);

        log_debug(DEBUG_INFO)
          << format("Cloned session %1%")
          % clone->get_name() << endl;

        /* If a chroot mount location has not yet been set, set a
           mount location with the session id.  Only set for non-plain
           chroots which run setup scripts (plain chroots don't use
           this facet). */
        if (clone->get_mount_location().empty())
          {
            log_debug(DEBUG_NOTICE) << "Setting mount location" << endl;
            std::string location(std::string(SCHROOT_MOUNT_DIR) + "/" +
                                 session_id);
            clone->set_mount_location(location);
          }

        log_debug(DEBUG_NOTICE)
          << format("Mount Location: %1%") % clone->get_mount_location()
          << endl;

        chroot::facet_list& facets = clone->get_facets();

        for (chroot::facet_list::iterator facet = facets.begin();
             facet != facets.end();)
          {
            chroot::facet_list::iterator current = facet;
            ++facet;
            auto setup_facet = std::dynamic_pointer_cast<session_setup>(*current);
            if (setup_facet)
              {
                setup_facet->chroot_session_setup
                  (*owner, session_id, alias, user, root);
              }
          }

        return clone;
      }

      facet::session_flags
      session_clonable::get_session_flags () const
      {
        return SESSION_CREATE;
      }

    }
  }
}
