/* Copyright © 2008-2013  Jan-Marek Glogowski <glogow@fbihome.de>
 * Copyright © 2009-2013  Roger Leigh <rleigh@debian.org>
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
#include <sbuild/chroot/facet/session.h>
#include <sbuild/chroot/facet/fsunion.h>
#include <sbuild/chroot/facet/source-clonable.h>
#include <sbuild/feature.h>

#include <cassert>

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

        feature feature_union("UNION", N_("Support for filesystem unioning"));

        const factory::facet_info fsunion_info =
          {
            "filesystem-union",
            N_("Support for filesystem unioning"),
            false,
            []() -> facet::ptr { return fsunion::create(); }
          };

        factory fsunion_register(fsunion_info);

      }

      template<>
      error<fsunion::error_code>::map_type
      error<fsunion::error_code>::error_strings =
        {
          // TRANSLATORS: %1% = chroot fs type
          {chroot::facet::fsunion::FSUNION_TYPE_UNKNOWN, N_("Unknown filesystem union type ‘%1%’")},
          {chroot::facet::fsunion::FSUNION_OVERLAY_ABS,  N_("Union overlay must have an absolute path")},
          {chroot::facet::fsunion::FSUNION_UNDERLAY_ABS, N_("Union underlay must have an absolute path")}
        };

      fsunion::fsunion ():
        facet(),
        union_type("none"),
        union_overlay_directory(SCHROOT_OVERLAY_DIR),
        union_underlay_directory(SCHROOT_UNDERLAY_DIR)
      {
      }

      fsunion::~fsunion ()
      {
      }

      fsunion::ptr
      fsunion::create ()
      {
        return ptr(new fsunion());
      }

      facet::ptr
      fsunion::clone () const
      {
        return ptr(new fsunion(*this));
      }

      std::string const&
      fsunion::get_name () const
      {
        return fsunion_info.name;
      }

      bool
      fsunion::get_union_configured () const
      {
        return get_union_type() != "none";
      }

      std::string const&
      fsunion::get_union_overlay_directory () const
      {
        return this->union_overlay_directory;
      }

      void
      fsunion::set_union_overlay_directory
      (const std::string& directory)
      {
        if (!is_absname(directory))
          throw error(directory, FSUNION_OVERLAY_ABS);

        this->union_overlay_directory = directory;
      }

      std::string const&
      fsunion::get_union_underlay_directory () const
      {
        return this->union_underlay_directory;
      }

      void
      fsunion::set_union_underlay_directory
      (const std::string& directory)
      {
        if (!is_absname(directory))
          throw error(directory, FSUNION_UNDERLAY_ABS);

        this->union_underlay_directory = directory;
      }

      std::string const&
      fsunion::get_union_type () const
      {
        return this->union_type;
      }

      void
      fsunion::set_union_type (const std::string& type)
      {
        if (type == "aufs" ||
            type == "overlayfs" ||
            type == "unionfs" ||
            type == "none")
          this->union_type = type;
        else
          throw error(type, FSUNION_TYPE_UNKNOWN);

        chroot *base = dynamic_cast<chroot *>(this->owner);
        assert(base);

        if (this->union_type != "none")
          {
            if (!base->get_facet<source_clonable>())
              base->add_facet(source_clonable::create());
          }
        else
          base->remove_facet<source_clonable>();
      }

      std::string const&
      fsunion::get_union_mount_options () const
      {
        return union_mount_options;
      }

      void
      fsunion::set_union_mount_options
      (const std::string& union_mount_options)
      {
        this->union_mount_options = union_mount_options;
      }

      void
      fsunion::setup_env (environment& env) const
      {
        env.add("CHROOT_UNION_TYPE", get_union_type());
        if (get_union_configured())
          {
            env.add("CHROOT_UNION_MOUNT_OPTIONS",
                    get_union_mount_options());
            env.add("CHROOT_UNION_OVERLAY_DIRECTORY",
                    get_union_overlay_directory());
            env.add("CHROOT_UNION_UNDERLAY_DIRECTORY",
                    get_union_underlay_directory());
          }
      }

      facet::session_flags
      fsunion::get_session_flags () const
      {
        session_flags flags = SESSION_NOFLAGS;

        if (get_union_configured() && owner->get_facet<session>())
          flags = SESSION_PURGE;

        return flags;
      }

      void
      fsunion::get_details (format_detail& detail) const
      {
        detail.add(_("Filesystem Union Type"), get_union_type());
        if (get_union_configured())
          {
            if (!this->union_mount_options.empty())
              detail.add(_("Filesystem Union Mount Options"),
                         get_union_mount_options());
            if (!this->union_overlay_directory.empty())
              detail.add(_("Filesystem Union Overlay Directory"),
                         get_union_overlay_directory());
            if (!this->union_underlay_directory.empty())
              detail.add(_("Filesystem Union Underlay Directory"),
                         get_union_underlay_directory());
          }
      }

      void
      fsunion::get_used_keys (string_list& used_keys) const
      {
        used_keys.push_back("union-type");
        used_keys.push_back("union-mount-options");
        used_keys.push_back("union-overlay-directory");
        used_keys.push_back("union-underlay-directory");
      }

      void
      fsunion::get_keyfile (keyfile& keyfile) const
      {
        keyfile::set_object_value(*this, &fsunion::get_union_type,
                                  keyfile, owner->get_name(), "union-type");

        if (get_union_configured())
          {
            keyfile::set_object_value(*this,
                                      &fsunion::get_union_mount_options,
                                      keyfile, owner->get_name(),
                                      "union-mount-options");

            keyfile::set_object_value(*this,
                                      &fsunion::get_union_overlay_directory,
                                      keyfile, owner->get_name(),
                                      "union-overlay-directory");

            keyfile::set_object_value(*this,
                                      &fsunion::get_union_underlay_directory,
                                      keyfile, owner->get_name(),
                                      "union-underlay-directory");
          }
      }

      void
      fsunion::set_keyfile (const keyfile& keyfile)
      {
        bool is_session = static_cast<bool>(owner->get_facet<session>());

        keyfile::get_object_value(*this, &fsunion::set_union_type,
                                  keyfile, owner->get_name(), "union-type",
                                  keyfile::PRIORITY_OPTIONAL);

        keyfile::get_object_value(*this,
                                  &fsunion::set_union_mount_options,
                                  keyfile, owner->get_name(), "union-mount-options",
                                  keyfile::PRIORITY_OPTIONAL);

        keyfile::get_object_value(*this,
                                  &fsunion::set_union_overlay_directory,
                                  keyfile, owner->get_name(),
                                  "union-overlay-directory",
                                  (is_session && get_union_configured()) ?
                                  keyfile::PRIORITY_REQUIRED :
                                  keyfile::PRIORITY_OPTIONAL);

        keyfile::get_object_value(*this,
                                  &fsunion::set_union_underlay_directory,
                                  keyfile, owner->get_name(),
                                  "union-underlay-directory",
                                  (is_session && get_union_configured()) ?
                                  keyfile::PRIORITY_REQUIRED :
                                  keyfile::PRIORITY_OPTIONAL);
      }

      void
      fsunion::chroot_session_setup (const chroot&      parent,
                                     const std::string& session_id,
                                     const std::string& alias,
                                     const std::string& user,
                                     bool               root)
      {
        // If the parent did not have a union facet, then neither should we.
        fsunion::const_ptr pparentuni(parent.get_facet<fsunion>());
        if (!pparentuni)
          {
            owner->remove_facet<fsunion>();
            return;
          }

        // Filesystem unions need the overlay directory specifying.
        std::string overlay = get_union_overlay_directory();
        overlay += "/" + owner->get_name();
        set_union_overlay_directory(overlay);

        std::string underlay = get_union_underlay_directory();
        underlay += "/" + owner->get_name();
        set_union_underlay_directory(underlay);
      }

      void
      fsunion::chroot_source_setup (const chroot& parent)
      {
        owner->remove_facet<fsunion>();
      }

    }
  }
}
