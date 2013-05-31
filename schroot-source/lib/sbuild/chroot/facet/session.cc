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
#include <sbuild/chroot/config.h>
#include <sbuild/chroot/facet/factory.h>
#include <sbuild/chroot/facet/session.h>
#include <sbuild/keyfile-writer.h>
#include <sbuild/lock.h>
#include <sbuild/fdstream.h>
#include <sbuild/format-detail.h>

#include <cassert>

#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

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

        const factory::facet_info session_info =
          {
            "session",
            N_("Support for session chroots"),
            false,
            []() -> facet::ptr { return session::create(); }
          };

        factory session_register(session_info);

      }

      session::session ():
        facet(),
        original_chroot_name(),
        selected_chroot_name()
      {
      }

      session::~session ()
      {
      }

      session::ptr
      session::create ()
      {
        return ptr(new session());
      }

      facet::ptr
      session::clone () const
      {
        return ptr(new session(*this));
      }

      std::string const&
      session::get_name () const
      {
        return session_info.name;
      }

      std::string const&
      session::get_original_name () const
      {
        return this->original_chroot_name;
      }

      void
      session::set_original_name (const std::string& name)
      {
        this->original_chroot_name = name;
        this->selected_chroot_name = name;
      }

      std::string const&
      session::get_selected_name () const
      {
        return this->selected_chroot_name;
      }

      void
      session::set_selected_name (const std::string& name)
      {
        std::string ns, shortname;
        config::get_namespace(name, ns, shortname);
        this->selected_chroot_name = shortname;
      }

      void
      session::setup_session_info (bool start)
      {
        /* Create or unlink session information. */
        std::string file = std::string(SCHROOT_SESSION_DIR) + "/" + owner->get_name();

        if (start)
          {
            int fd = open(file.c_str(), O_CREAT|O_EXCL|O_WRONLY, 0664);
            if (fd < 0)
              throw error(file, chroot::SESSION_WRITE, strerror(errno));

            // Create a stream from the file descriptor.  The fd will be
            // closed when the stream is destroyed.
#ifdef BOOST_IOSTREAMS_CLOSE_HANDLE_OLD
            fdostream output(fd, true);
#else
            fdostream output(fd, boost::iostreams::close_handle);
#endif
            output.imbue(std::locale::classic());

            file_lock lock(fd);
            try
              {
                lock.set_lock(lock::LOCK_EXCLUSIVE, 2);
              }
            catch (const lock::error& e)
              {
                throw error(file, chroot::FILE_LOCK, e);
              }

            keyfile details;
            owner->get_keyfile(details);
            output << keyfile_writer(details);

            try
              {
                lock.unset_lock();
              }
            catch (const lock::error& e)
              {
                throw error(file, chroot::FILE_UNLOCK, e);
              }
          }
        else /* start == false */
          {
            if (unlink(file.c_str()) != 0)
              throw error(file, chroot::SESSION_UNLINK, strerror(errno));
          }
      }

      void
      session::setup_env (environment& env) const
      {
        // Add original name to environment, but only if set (otherwise
        // defaults to session ID).
        if (!get_original_name().empty())
          env.add("CHROOT_NAME", get_original_name());

        if (!get_selected_name().empty())
          env.add("CHROOT_ALIAS", get_selected_name());
      }

      void
      session::get_details (format_detail& detail) const
      {
        if (!get_original_name().empty())
          detail.add(_("Original Chroot Name"), get_original_name());
        if (!get_original_name().empty())
          detail.add(_("Selected Chroot Name"), get_selected_name());
        if (!owner->get_name().empty())
          detail.add(_("Session ID"), owner->get_name());
      }

      void
      session::get_used_keys (string_list& used_keys) const
      {
        used_keys.push_back("active");
        used_keys.push_back("source-users");
        used_keys.push_back("source-groups");
        used_keys.push_back("source-root-users");
        used_keys.push_back("source-root-groups");
        used_keys.push_back("original-name");
        used_keys.push_back("selected-name");
      }

      void
      session::get_keyfile (keyfile& keyfile) const
      {
        keyfile::set_object_value(*this, &session::get_original_name,
                                  keyfile, owner->get_name(),
                                  "original-name");

        keyfile::set_object_value(*this, &session::get_selected_name,
                                  keyfile, owner->get_name(),
                                  "selected-name");
      }

      void
      session::set_keyfile (const keyfile& keyfile)
      {
        keyfile::get_object_value(*this, &session::set_original_name,
                                  keyfile, owner->get_name(),
                                  "original-name",
                                  keyfile::PRIORITY_OPTIONAL);

        keyfile::get_object_value(*this, &session::set_selected_name,
                                  keyfile, owner->get_name(),
                                  "selected-name",
                                  keyfile::PRIORITY_OPTIONAL);
      }

    }
  }
}
