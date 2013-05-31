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
#include <sbuild/chroot/facet/facet.h>
#include <sbuild/chroot/facet/factory.h>
#ifdef SBUILD_FEATURE_PERSONALITY
#include <sbuild/chroot/facet/personality.h>
#endif // SBUILD_FEATURE_PERSONALITY
#include <sbuild/chroot/facet/plain.h>
#include <sbuild/chroot/facet/session.h>
#include <sbuild/chroot/facet/session-clonable.h>
#include <sbuild/chroot/facet/source.h>
#include <sbuild/chroot/facet/source-clonable.h>
#include <sbuild/chroot/facet/storage.h>
#include <sbuild/chroot/facet/userdata.h>
#ifdef SBUILD_FEATURE_UNSHARE
#include <sbuild/chroot/facet/unshare.h>
#endif // SBUILD_FEATURE_UNSHARE
#include <sbuild/fdstream.h>

#include <iostream>
#include <cerrno>
#include <map>
#include <utility>

#include <boost/format.hpp>

using boost::format;

namespace sbuild
{
  namespace chroot
  {

    template<>
    error<chroot::error_code>::map_type
    error<chroot::error_code>::error_strings =
      {
        {chroot::chroot::CHROOT_CREATE,     N_("Chroot creation failed")},
        {chroot::chroot::CHROOT_DEVICE,     N_("Device name not set")},
        // TRANSLATORS: %1% = chroot type name
        {chroot::chroot::CHROOT_TYPE,       N_("Unknown chroot type ‘%1%’")},
        {chroot::chroot::DEVICE_ABS,        N_("Device must have an absolute path")},
        {chroot::chroot::DEVICE_LOCK,       N_("Failed to lock device")},
        {chroot::chroot::DEVICE_NOTBLOCK,   N_("File is not a block device")},
        {chroot::chroot::DEVICE_UNLOCK,     N_("Failed to unlock device")},
        {chroot::chroot::DIRECTORY_ABS,     N_("Directory must have an absolute path")},
        {chroot::chroot::FACET_ABSENT,      N_("Attempt to use facet ‘%1%’ which is not present")},
        {chroot::chroot::FACET_INVALID,     N_("Attempt to add object ‘%1%’ which is not a facet")},
        {chroot::chroot::FACET_PRESENT,     N_("Attempt to add facet ‘%1%’ which is already in use")},
        {chroot::chroot::FILE_ABS,          N_("File must have an absolute path")},
        {chroot::chroot::FILE_LOCK,         N_("Failed to acquire file lock")},
        {chroot::chroot::FILE_NOTREG,       N_("File is not a regular file")},
        {chroot::chroot::FILE_OWNER,        N_("File is not owned by user root")},
        {chroot::chroot::FILE_PERMS,        N_("File has write permissions for others")},
        {chroot::chroot::FILE_UNLOCK,       N_("Failed to discard file lock")},
        {chroot::chroot::LOCATION_ABS,      N_("Location must have an absolute path")},
        {chroot::chroot::NAME_INVALID,      N_("Invalid name")},
        {chroot::chroot::SCRIPT_CONFIG_CV,  N_("Could not set profile name from script configuration path ‘%1%’")},

        // TRANSLATORS: unlink refers to the C function which removes a file
        {chroot::chroot::SESSION_UNLINK,    N_("Failed to unlink session file")},
        {chroot::chroot::SESSION_WRITE,     N_("Failed to write session file")},
        {chroot::chroot::VERBOSITY_INVALID, N_("Message verbosity is invalid")}
      };

    chroot::chroot ():
      name(),
      description(),
      users(),
      groups(),
      root_users(),
      root_groups(),
      aliases(),
      preserve_environment(false),
      default_shell(),
      environment_filter(SBUILD_DEFAULT_ENVIRONMENT_FILTER),
      mount_location(),
      original(true),
      script_config(),
      profile("default"),
      command_prefix(),
      message_verbosity(VERBOSITY_NORMAL),
      facets()
    {
      for (auto& facet : facet::factory::create_auto())
        add_facet_by_name(facet);

      set_profile(get_profile());
    }

    chroot::chroot (const chroot& rhs):
      name(rhs.name),
      description(rhs.description),
      users(rhs.users),
      groups(rhs.groups),
      root_users(rhs.root_users),
      root_groups(rhs.root_groups),
      aliases(rhs.aliases),
      preserve_environment(rhs.preserve_environment),
      default_shell(rhs.default_shell),
      environment_filter(rhs.environment_filter),
      mount_location(rhs.mount_location),
      original(rhs.original),
      script_config(rhs.script_config),
      profile(rhs.profile),
      command_prefix(rhs.command_prefix),
      message_verbosity(rhs.message_verbosity),
      facets()
    {
      /// @todo Use internal version of add_facet to add chroot pointer.
      for (const auto& facet : rhs.facets)
        {
          facet_ptr fp = facet->clone();
          fp->set_chroot(*this, true);
          facets.push_back(fp);
        }
    }

    chroot::~chroot ()
    {
    }

    chroot::ptr
    chroot::create (const std::string& type)
    {
      facet::facet::ptr fac = facet::factory::create(type);
      facet::storage::ptr store = std::dynamic_pointer_cast<facet::storage>(fac);

      if (!store)
        throw error(type, CHROOT_TYPE);


      chroot::ptr new_chroot(new chroot());
      new_chroot->add_facet(store);

      return new_chroot;
    }

    chroot::ptr
    chroot::clone () const
    {
      get_facet_strict<facet::storage>();

      return ptr(new chroot(*this));
    }

    chroot::ptr
    chroot::clone_session (const std::string& session_id,
                           const std::string& alias,
                           const std::string& user,
                           bool               root) const
    {
      ptr session = 0;

      facet::session_clonable::const_ptr psess
        (get_facet<facet::session_clonable>());
      if (psess)
        session = psess->clone_session
          (session_id, alias, user, root);

      return session;
    }

    chroot::ptr
    chroot::clone_source () const
    {
      ptr source = 0;

      facet::source_clonable::const_ptr psrc
        (get_facet<facet::source_clonable>());
      if (psrc)
        source = psrc->clone_source();

      return source;
    }

    std::string const&
    chroot::get_name () const
    {
      return this->name;
    }

    void
    chroot::set_name (const std::string& name)
    {
      std::string::size_type pos = name.find_first_of(config::namespace_separator);
      if (pos != std::string::npos)
        {
          error e(name, NAME_INVALID);
          format fmt(_("Namespace separator ‘%1%’ may not be used in a chroot name"));
          fmt % config::namespace_separator;
          e.set_reason(fmt.str());
          throw e;
        }

      if (!is_valid_sessionname(name))
        {
          error e(name, NAME_INVALID);
          e.set_reason(_("Naming restrictions are documented in schroot.conf(5)"));
          throw e;
        }

      this->name = name;
    }


    std::string const&
    chroot::get_description () const
    {
      return this->description;
    }

    void
    chroot::set_description (const std::string& description)
    {
      this->description = description;
    }

    std::string const&
    chroot::get_mount_location () const
    {
      return this->mount_location;
    }

    void
    chroot::set_mount_location (const std::string& location)
    {
      if (!location.empty() && !is_absname(location))
        throw error(location, LOCATION_ABS);
      this->mount_location = location;
    }

    std::string
    chroot::get_path () const
    {
      return get_facet_strict<facet::storage>()->get_path();
    }

    string_list const&
    chroot::get_users () const
    {
      return this->users;
    }

    void
    chroot::set_users (const string_list& users)
    {
      this->users = users;
    }

    string_list const&
    chroot::get_groups () const
    {
      return this->groups;
    }

    void
    chroot::set_groups (const string_list& groups)
    {
      this->groups = groups;
    }

    string_list const&
    chroot::get_root_users () const
    {
      return this->root_users;
    }

    void
    chroot::set_root_users (const string_list& users)
    {
      this->root_users = users;
    }

    string_list const&
    chroot::get_root_groups () const
    {
      return this->root_groups;
    }

    void
    chroot::set_root_groups (const string_list& groups)
    {
      this->root_groups = groups;
    }

    string_list const&
    chroot::get_aliases () const
    {
      return this->aliases;
    }

    void
    chroot::set_aliases (const string_list& aliases)
    {
      for (const auto& alias : aliases)
        {
          std::string::size_type found = alias.find_first_of(config::namespace_separator);
          if (found != std::string::npos)
            {
              error e(alias, NAME_INVALID);
              format fmt(_("Namespace separator ‘%1%’ may not be used in an alias name"));
              fmt % config::namespace_separator;
              e.set_reason(fmt.str());
              throw e;
            }

          if (!is_valid_sessionname(alias))
            {
              error e(alias, NAME_INVALID);
              e.set_reason(_("Naming restrictions are documented in schroot.conf(5)"));
              throw e;
            }
        }

      this->aliases = aliases;
    }

    bool
    chroot::get_preserve_environment () const
    {
      return this->preserve_environment;
    }

    void
    chroot::set_preserve_environment (bool preserve_environment)
    {
      this->preserve_environment = preserve_environment;
    }

    std::string const&
    chroot::get_default_shell () const
    {
      return this->default_shell;
    }

    void
    chroot::set_default_shell (const std::string& default_shell)
    {
      this->default_shell = default_shell;
    }

    regex const&
    chroot::get_environment_filter () const
    {
      return this->environment_filter;
    }

    void
    chroot::set_environment_filter (const regex& environment_filter)
    {
      this->environment_filter = environment_filter;
    }

    bool
    chroot::get_original () const
    {
      return this->original;
    }

    void
    chroot::set_original (bool original)
    {
      this->original = original;
    }

    bool
    chroot::get_run_setup_scripts () const
    {
      facet::plain::const_ptr plain = get_facet<facet::plain>();

      return !static_cast<bool>(plain);
    }

    std::string const&
    chroot::get_script_config () const
    {
      return this->script_config;
    }

    void
    chroot::set_script_config (const std::string& script_config)
    {
      this->script_config = script_config;

      // Undo work of set_profile, so profile is completely unset.
      this->profile.clear();
      facet::userdata::ptr userdata =
        get_facet<facet::userdata>();
      if (userdata)
        {
          userdata->remove_data("setup.config");
          userdata->remove_data("setup.copyfiles");
          userdata->remove_data("setup.nssdatabases");
          userdata->remove_data("setup.fstab");
        }

    }

    std::string const&
    chroot::get_profile () const
    {
      return this->profile;
    }

    void
    chroot::set_profile (const std::string& profile)
    {
      this->profile = profile;

      facet::userdata::ptr userdata =
        get_facet<facet::userdata>();
      if (userdata)
        {
          userdata->set_system_data("setup.config", this->profile + "/config");
          userdata->set_system_data("setup.copyfiles", this->profile + "/copyfiles");
          userdata->set_system_data("setup.nssdatabases", this->profile + "/nssdatabases");
          userdata->set_system_data("setup.fstab", this->profile + "/fstab");
        }
    }

    string_list const&
    chroot::get_command_prefix () const
    {
      return this->command_prefix;
    }

    void
    chroot::set_command_prefix (const string_list& command_prefix)
    {
      this->command_prefix = command_prefix;
    }

    chroot::verbosity
    chroot::get_verbosity () const
    {
      return this->message_verbosity;
    }

    const char *
    chroot::get_verbosity_string () const
    {
      const char *verbosity = 0;

      switch (this->message_verbosity)
        {
        case chroot::VERBOSITY_QUIET:
          verbosity = "quiet";
          break;
        case chroot::VERBOSITY_NORMAL:
          verbosity = "normal";
          break;
        case chroot::VERBOSITY_VERBOSE:
          verbosity = "verbose";
          break;
        default:
          log_debug(DEBUG_CRITICAL) << format("Invalid verbosity level: %1%, falling back to 'normal'")
            % static_cast<int>(this->message_verbosity)
                                    << std::endl;
          verbosity = "normal";
          break;
        }

      return verbosity;
    }

    void
    chroot::set_verbosity (chroot::verbosity verbosity)
    {
      this->message_verbosity = verbosity;
    }

    void
    chroot::set_verbosity (const std::string& verbosity)
    {
      if (verbosity == "quiet")
        this->message_verbosity = VERBOSITY_QUIET;
      else if (verbosity == "normal")
        this->message_verbosity = VERBOSITY_NORMAL;
      else if (verbosity == "verbose")
        this->message_verbosity = VERBOSITY_VERBOSE;
      else
        throw error(verbosity, VERBOSITY_INVALID);
    }

    chroot::facet_list&
    chroot::get_facets ()
    {
      return facets;
    }

    const chroot::facet_list&
    chroot::get_facets () const
    {
      return facets;
    }

    string_list
    chroot::list_facets () const
    {
      string_list facet_names;

      for (const auto& facet : facets)
        facet_names.push_back(facet->get_name());

      return facet_names;
    }

    std::string const&
    chroot::get_chroot_type () const
    {
      facet::storage::const_ptr store = get_facet_strict<facet::storage>();
      facet::facet::const_ptr facetptr = std::dynamic_pointer_cast<const facet::facet>(store);
      return facetptr->get_name();
    }

    void
    chroot::setup_env (environment& env) const
    {
      env.add("CHROOT_TYPE", get_chroot_type());
      env.add("CHROOT_NAME", get_name());
      env.add("SESSION_ID", get_name());
      env.add("CHROOT_DESCRIPTION", get_description());
      env.add("CHROOT_MOUNT_LOCATION", get_mount_location());
      env.add("CHROOT_PATH", get_path());
      if (!get_script_config().empty())
        env.add("CHROOT_SCRIPT_CONFIG", normalname(std::string(SCHROOT_SYSCONF_DIR) +  '/' + get_script_config()));
      if (!get_profile().empty())
        {
          env.add("CHROOT_PROFILE", get_profile());
          env.add("CHROOT_PROFILE_DIR", normalname(std::string(SCHROOT_SYSCONF_DIR) +  '/' + get_profile()));
        }
      env.add("CHROOT_SESSION_CREATE",
              static_cast<bool>(get_session_flags() & facet::facet::SESSION_CREATE));
      env.add("CHROOT_SESSION_CLONE",
              static_cast<bool>(get_session_flags() & facet::facet::SESSION_CLONE));
      env.add("CHROOT_SESSION_PURGE",
              static_cast<bool>(get_session_flags() & facet::facet::SESSION_PURGE));

      for (const auto& facet : facets)
        facet->setup_env(env);
    }

    void
    chroot::lock (setup_type type)
    {
      setup_lock(type, true, 0);
    }

    void
    chroot::unlock (setup_type type,
                    int        status)
    {
      setup_lock(type, false, status);
    }

    void
    chroot::setup_lock(setup_type type,
                       bool       lock,
                       int        status)
    {
      get_facet_strict<facet::storage>()->setup_lock(type, lock, status);
    }

    facet::facet::session_flags
    chroot::get_session_flags () const
    {
      facet::facet::session_flags flags = facet::facet::SESSION_NOFLAGS;

      for (const auto& facet : facets)
        flags = flags | facet->get_session_flags();

      return flags;
    }

    void
    chroot::get_details (format_detail& detail) const
    {
      detail.add(_("Name"), get_name());

      detail
        .add(_("Description"), get_description())
        .add(_("Type"), get_chroot_type())
        .add(_("Message Verbosity"), get_verbosity_string())
        .add(_("Users"), get_users())
        .add(_("Groups"), get_groups())
        .add(_("Root Users"), get_root_users())
        .add(_("Root Groups"), get_root_groups())
        .add(_("Aliases"), get_aliases())
        .add(_("Preserve Environment"), get_preserve_environment())
        .add(_("Default Shell"), get_default_shell())
        .add(_("Environment Filter"), get_environment_filter())
        .add(_("Run Setup Scripts"), get_run_setup_scripts())
        .add(_("Configuration Profile"), get_profile())
        .add(_("Script Configuration"), get_script_config())
        .add(_("Session Managed"),
             static_cast<bool>(get_session_flags() & facet::facet::SESSION_CREATE))
        .add(_("Session Cloned"),
             static_cast<bool>(get_session_flags() & facet::facet::SESSION_CLONE))
        .add(_("Session Purged"),
             static_cast<bool>(get_session_flags() & facet::facet::SESSION_PURGE));

      if (!get_command_prefix().empty())
        detail.add(_("Command Prefix"), get_command_prefix());

      /* Non user-settable properties are listed last. */
      if (!get_mount_location().empty())
        detail.add(_("Mount Location"), get_mount_location());
      if (!get_path().empty())
        detail.add(_("Path"), get_path());

      for (const auto& facet : facets)
        facet->get_details(detail);
    }

    void
    chroot::print_details (std::ostream& stream) const
    {
      std::string title(_("Chroot"));

      if (get_facet<facet::session>())
        title = _("Session");
      if (get_facet<facet::source>())
        title = _("Source");

      format_detail fmt(title, stream.getloc());

      get_details(fmt);

      stream << fmt;
    }

    string_list
    chroot::get_used_keys () const
    {
      string_list used_keys;

      // Keys which are used elsewhere, but should be counted as "used".
      used_keys.push_back("type");

      used_keys.push_back("active");
      used_keys.push_back("run-setup-scripts");
      used_keys.push_back("run-session-scripts");
      used_keys.push_back("run-exec-scripts");
      used_keys.push_back("profile");
      used_keys.push_back("script-config");
      used_keys.push_back("priority");
      used_keys.push_back("aliases");
      used_keys.push_back("environment-filter");
      used_keys.push_back("description");
      used_keys.push_back("users");
      used_keys.push_back("groups");
      used_keys.push_back("root-users");
      used_keys.push_back("root-groups");
      used_keys.push_back("mount-location");
      used_keys.push_back("name");
      used_keys.push_back("command-prefix");
      used_keys.push_back("message-verbosity");
      used_keys.push_back("preserve-environment");
      used_keys.push_back("shell");

      for (const auto& facet : facets)
        facet->get_used_keys(used_keys);

      return used_keys;
    }

    void
    chroot::get_keyfile (keyfile& keyfile) const
    {
      keyfile.remove_group(get_name());

      bool session = static_cast<bool>(get_facet<facet::session>());

      if (session)
        keyfile::set_object_value(*this, &chroot::get_name,
                                  keyfile, get_name(),
                                  "name");

      keyfile::set_object_value(*this, &chroot::get_chroot_type,
                                keyfile, get_name(),
                                "type");

      keyfile::set_object_value(*this, &chroot::get_profile,
                                keyfile, get_name(),
                                "profile");

      if (!get_script_config().empty())
        keyfile::set_object_value(*this, &chroot::get_script_config,
                                  keyfile, get_name(),
                                  "script-config");

      keyfile::set_object_list_value(*this, &chroot::get_aliases,
                                     keyfile, get_name(),
                                     "aliases");

      keyfile::set_object_value(*this, &chroot::get_environment_filter,
                                keyfile, get_name(),
                                "environment-filter");

      keyfile::set_object_value(*this, &chroot::get_description,
                                keyfile, get_name(),
                                "description");

      keyfile::set_object_list_value(*this, &chroot::get_users,
                                     keyfile, get_name(),
                                     "users");

      keyfile::set_object_list_value(*this, &chroot::get_groups,
                                     keyfile, get_name(),
                                     "groups");

      keyfile::set_object_list_value(*this, &chroot::get_root_users,
                                     keyfile, get_name(),
                                     "root-users");

      keyfile::set_object_list_value(*this, &chroot::get_root_groups,
                                     keyfile, get_name(),
                                     "root-groups");

      if (session)
        keyfile::set_object_value(*this, &chroot::get_mount_location,
                                  keyfile, get_name(),
                                  "mount-location");

      keyfile::set_object_list_value(*this, &chroot::get_command_prefix,
                                     keyfile, get_name(),
                                     "command-prefix");

      keyfile::set_object_value(*this, &chroot::get_verbosity_string,
                                keyfile, get_name(),
                                "message-verbosity");

      keyfile::set_object_value(*this, &chroot::get_preserve_environment,
                                keyfile, get_name(),
                                "preserve-environment");

      keyfile::set_object_value(*this, &chroot::get_default_shell,
                                keyfile, get_name(),
                                "shell");

      for (const auto& facet : facets)
        facet->get_keyfile(keyfile);
    }

    void
    chroot::set_keyfile (const keyfile& keyfile)
    {
      bool session = static_cast<bool>(get_facet<facet::session>());

      keyfile::get_object_value(*this, &chroot::set_profile,
                                keyfile, get_name(),
                                "profile",
                                keyfile::PRIORITY_OPTIONAL);

      keyfile::get_object_value(*this, &chroot::set_script_config,
                                keyfile, get_name(),
                                "script-config",
                                session ?
                                keyfile::PRIORITY_OPTIONAL :
                                keyfile::PRIORITY_DEPRECATED);

      keyfile::get_object_list_value(*this, &chroot::set_aliases,
                                     keyfile, get_name(),
                                     "aliases",
                                     keyfile::PRIORITY_OPTIONAL);

      keyfile::get_object_value(*this, &chroot::set_environment_filter,
                                keyfile, get_name(),
                                "environment-filter",
                                keyfile::PRIORITY_OPTIONAL);

      keyfile::get_object_value(*this, &chroot::set_description,
                                keyfile, get_name(),
                                "description",
                                keyfile::PRIORITY_OPTIONAL);

      keyfile::get_object_list_value(*this, &chroot::set_users,
                                     keyfile, get_name(),
                                     "users",
                                     keyfile::PRIORITY_OPTIONAL);

      keyfile::get_object_list_value(*this, &chroot::set_groups,
                                     keyfile, get_name(),
                                     "groups",
                                     keyfile::PRIORITY_OPTIONAL);

      keyfile::get_object_list_value(*this, &chroot::set_root_users,
                                     keyfile, get_name(),
                                     "root-users",
                                     keyfile::PRIORITY_OPTIONAL);

      keyfile::get_object_list_value(*this, &chroot::set_root_groups,
                                     keyfile, get_name(),
                                     "root-groups",
                                     keyfile::PRIORITY_OPTIONAL);

      keyfile::get_object_value(*this, &chroot::set_mount_location,
                                keyfile, get_name(),
                                "mount-location",
                                session ?
                                keyfile::PRIORITY_REQUIRED :
                                keyfile::PRIORITY_DISALLOWED);

      keyfile::get_object_value(*this, &chroot::set_name,
                                keyfile, get_name(),
                                "name",
                                session ?
                                keyfile::PRIORITY_OPTIONAL :
                                keyfile::PRIORITY_DISALLOWED);

      keyfile::get_object_list_value(*this, &chroot::set_command_prefix,
                                     keyfile, get_name(),
                                     "command-prefix",
                                     keyfile::PRIORITY_OPTIONAL);

      keyfile::get_object_value(*this, &chroot::set_verbosity,
                                keyfile, get_name(),
                                "message-verbosity",
                                keyfile::PRIORITY_OPTIONAL);

      keyfile::get_object_value(*this, &chroot::set_preserve_environment,
                                keyfile, get_name(),
                                "preserve-environment",
                                keyfile::PRIORITY_OPTIONAL);

      keyfile::get_object_value(*this, &chroot::set_default_shell,
                                keyfile, get_name(),
                                "shell",
                                keyfile::PRIORITY_OPTIONAL);

      for (const auto& facet : facets)
        facet->set_keyfile(keyfile);
    }

  }
}
