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
#include <sbuild/chroot/facet/unshare.h>
#include <sbuild/feature.h>

#include <boost/format.hpp>

#include <sched.h>

using boost::format;


namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {


      namespace
      {

        feature feature_unshare
        ("UNSHARE",
         N_("Linux dissassociation of shared execution context"));

        const factory::facet_info unshare_info =
          {
            "unshare",
            N_("Linux dissassociation of shared execution context"),
            true,
            []() -> facet::ptr { return unshare::create(); }
          };

        factory unshare_register(unshare_info);

      }

      template<>
      error<unshare::error_code>::map_type
      error<unshare::error_code>::error_strings =
        {
          // TRANSLATORS: %1% = the name of the context being unshared
          {sbuild::chroot::facet::unshare::UNSHARE,
           N_("Could not unshare ‘%1%’ process execution context")}
        };

      unshare::unshare ():
        facet(),
        unshare_net(false),
        unshare_sysvipc(false),
        unshare_sysvsem(false),
        unshare_uts(false)
      {
      }

      unshare::~unshare ()
      {
      }

      unshare::ptr
      unshare::create ()
      {
        return ptr(new unshare());
      }

      facet::ptr
      unshare::clone () const
      {
        return ptr(new unshare(*this));
      }

      std::string const&
      unshare::get_name () const
      {
        return unshare_info.name;
      }

      bool
      unshare::get_unshare_net () const
      {
        return this->unshare_net;
      }

      void
      unshare::set_unshare_net (bool unshare_net)
      {
        this->unshare_net = unshare_net;
      }

      bool
      unshare::get_unshare_sysvipc () const
      {
        return this->unshare_sysvipc;
      }

      void
      unshare::set_unshare_sysvipc (bool unshare_sysvipc)
      {
        this->unshare_sysvipc = unshare_sysvipc;
      }

      bool
      unshare::get_unshare_sysvsem () const
      {
        return this->unshare_sysvsem;
      }

      void
      unshare::set_unshare_sysvsem (bool unshare_sysvsem)
      {
        this->unshare_sysvsem = unshare_sysvsem;
      }

      bool
      unshare::get_unshare_uts () const
      {
        return this->unshare_uts;
      }

      void
      unshare::set_unshare_uts (bool unshare_uts)
      {
        this->unshare_uts = unshare_uts;
      }

      void
      unshare::do_unshare () const
      {
#ifdef CLONE_NEWNET
        if (this->unshare_net)
          {
            log_debug(DEBUG_INFO) << "Unsharing network" << std::endl;
            if (::unshare(CLONE_NEWNET) < 0)
              throw error("NET", UNSHARE, strerror(errno));
          }
#endif
#ifdef CLONE_NEWIPC
        if (this->unshare_sysvipc)
          {
            log_debug(DEBUG_INFO) << "Unsharing System V IPC" << std::endl;
            if (::unshare(CLONE_NEWIPC) < 0)
              throw error("SYSVIPC", UNSHARE, strerror(errno));
          }
#endif
#ifdef CLONE_SYSVSEM
        if (this->unshare_sysvsem)
          {
            log_debug(DEBUG_INFO) << "Unsharing System V SEM" << std::endl;
            if (::unshare(CLONE_SYSVSEM) < 0)
              throw error("SYSVSEM", UNSHARE, strerror(errno));
          }
#endif
#ifdef CLONE_UTS
        if (this->unshare_uts)
          {
            log_debug(DEBUG_INFO) << "Unsharing UTS namespace" << std::endl;
            if (::unshare(CLONE_UTS) < 0)
              throw error("UTS", UNSHARE, strerror(errno));
          }
#endif
      }

      void
      unshare::setup_env (environment& env) const
      {
        env.add("UNSHARE_NET", get_unshare_net());
        env.add("UNSHARE_SYSVIPC", get_unshare_sysvipc());
        env.add("UNSHARE_SYSVSEM", get_unshare_sysvsem());
        env.add("UNSHARE_UTS", get_unshare_uts());
      }

      void
      unshare::get_details (format_detail& detail) const
      {
        detail.add(_("Unshare Networking"), get_unshare_net());
        detail.add(_("Unshare System V IPC"), get_unshare_sysvipc());
        detail.add(_("Unshare System V Semaphores"), get_unshare_sysvsem());
        detail.add(_("Unshare UTS namespace"), get_unshare_uts());
      }

      void
      unshare::get_used_keys (string_list& used_keys) const
      {
        used_keys.push_back("unshare.net");
        used_keys.push_back("unshare.sysvipc");
        used_keys.push_back("unshare.sysvsem");
        used_keys.push_back("unshare.uts");
      }

      void
      unshare::get_keyfile (keyfile& keyfile) const
      {
        keyfile::set_object_value(*this, &unshare::get_unshare_net,
                                  keyfile, owner->get_name(), "unshare.net");
        keyfile::set_object_value(*this, &unshare::get_unshare_sysvipc,
                                  keyfile, owner->get_name(), "unshare.sysvipc");
        keyfile::set_object_value(*this, &unshare::get_unshare_sysvsem,
                                  keyfile, owner->get_name(), "unshare.sysvsem");
        keyfile::set_object_value(*this, &unshare::get_unshare_uts,
                                  keyfile, owner->get_name(), "unshare.uts");
      }

      void
      unshare::set_keyfile (const keyfile& keyfile)
      {
        keyfile::get_object_value(*this, &unshare::set_unshare_net,
                                  keyfile, owner->get_name(), "unshare.net",
                                  keyfile::PRIORITY_OPTIONAL);
        keyfile::get_object_value(*this, &unshare::set_unshare_sysvipc,
                                  keyfile, owner->get_name(), "unshare.sysvipc",
                                  keyfile::PRIORITY_OPTIONAL);
        keyfile::get_object_value(*this, &unshare::set_unshare_sysvsem,
                                  keyfile, owner->get_name(), "unshare.sysvsem",
                                  keyfile::PRIORITY_OPTIONAL);
        keyfile::get_object_value(*this, &unshare::set_unshare_uts,
                                  keyfile, owner->get_name(), "unshare.uts",
                                  keyfile::PRIORITY_OPTIONAL);
      }

    }
  }
}
