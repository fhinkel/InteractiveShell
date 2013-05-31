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

#include <sbuild/chroot/config.h>
#include <sbuild/chroot/chroot.h>
#include <sbuild/chroot/facet/session.h>
#include <sbuild/chroot/facet/session-clonable.h>
#include <sbuild/chroot/facet/source-clonable.h>
#include <sbuild/fdstream.h>
#include <sbuild/keyfile-reader.h>
#include <sbuild/lock.h>

#include <cassert>
#include <cerrno>
#include <cstdlib>
#include <cstring>

#include <boost/filesystem/operations.hpp>

#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

#include <boost/format.hpp>

using std::endl;
using boost::format;

namespace sbuild
{
  namespace chroot
  {

    namespace
    {

      bool
      chroot_alphasort (const chroot::chroot::ptr& c1,
                        const chroot::chroot::ptr& c2)
      {
        return c1->get_name() < c2->get_name();
      }

    }

    template<>
    error<config::error_code>::map_type
    error<config::error_code>::error_strings =
      {
        // TRANSLATORS: %1% = chroot alias name
        // TRANSLATORS: %4% = chroot name
        {chroot::config::ALIAS_EXIST,        N_("Alias ‘%1%’ already associated with ‘%4%’ chroot")},
        // TRANSLATORS: %1% = chroot name
        {chroot::config::CHROOT_NOTFOUND,    N_("%1%: Chroot not found")},
        // TRANSLATORS: %1% = comma-separated list of chroot names
        {chroot::config::CHROOTS_NOTFOUND,   N_("%1%: Chroots not found")},
        // TRANSLATORS: %1% = chroot name
        {chroot::config::CHROOT_EXIST,       N_("A chroot or alias ‘%1%’ already exists with this name")},
        {chroot::config::FILE_NOTREG,        N_("File is not a regular file")},
        {chroot::config::FILE_OPEN,          N_("Failed to open file")},
        {chroot::config::FILE_OWNER,         N_("File is not owned by user root")},
        {chroot::config::FILE_PERMS,         N_("File has write permissions for others")},
        {chroot::config::NAME_INVALID,       N_("Invalid name")},
        {chroot::config::NAMESPACE_NOTFOUND, N_("No such namespace")}
      };

    const std::string config::namespace_separator(":");

    config::config ():
      namespaces(),
      aliases()
    {
      this->namespaces.insert(std::make_pair(std::string("chroot"), chroot_map()));
      this->namespaces.insert(std::make_pair(std::string("session"), chroot_map()));
      this->namespaces.insert(std::make_pair(std::string("source"), chroot_map()));
    }

    config::config (const std::string& chroot_namespace,
                    const std::string& file):
      namespaces(),
      aliases()
    {
      this->namespaces.insert(std::make_pair(std::string("chroot"), chroot_map()));
      this->namespaces.insert(std::make_pair(std::string("session"), chroot_map()));
      this->namespaces.insert(std::make_pair(std::string("source"), chroot_map()));

      add(chroot_namespace, file);
    }

    config::~config ()
    {
    }

    void
    config::add (const std::string& chroot_namespace,
                 const std::string& location)
    {
      /// @todo Remove and require explicit use of add_config_file or
      /// add_config_directory; the caller should be aware which is
      /// required.
      if (stat(location).is_directory())
        add_config_directory(chroot_namespace, location);
      else
        add_config_file(chroot_namespace, location);
    }

    void
    config::add_config_file (const std::string& chroot_namespace,
                             const std::string& file)
    {
      log_debug(DEBUG_NOTICE) << "Loading config file: " << file << endl;

      // Note adding a file skips filename validity checks performed by
      // add_config_directory; the caller is assumed to have verified that
      // the file is valid to load.

      load_data(chroot_namespace, file);
    }

    void
    config::add_config_directory (const std::string& chroot_namespace,
                                  const std::string& dir)
    {
      log_debug(DEBUG_NOTICE) << "Loading config directory: " << dir << endl;

      if (dir.empty())
        return;

      boost::filesystem::path dirpath(dir);
      boost::filesystem::directory_iterator end_iter;
      for (boost::filesystem::directory_iterator dirent(dirpath);
           dirent != end_iter;
           ++dirent)
        {
#if !defined(BOOST_FILESYSTEM_VERSION) || BOOST_FILESYSTEM_VERSION == 2
          std::string name(dirent->leaf());
#else
          std::string name(dirent->path().filename().string());
#endif

          // Skip common directories.
          if (name == "." || name == "..")
            continue;

          // Skip backup files and dpkg configuration backup files.
          if (!is_valid_sessionname(name))
            continue;

          std::string filename = dir + "/" + name;

          try
            {
              if (!stat(filename).is_regular())
                throw error(filename, FILE_NOTREG);
            }
          catch (const std::runtime_error& e)
            {
              log_exception_warning(e);
              continue;
            }

          load_data(chroot_namespace, filename);
        }
    }

    void
    config::add (const std::string& chroot_namespace,
                 chroot::ptr&       chroot,
                 const keyfile&     kconfig)
    {
      const std::string& name(chroot->get_name());
      const std::string& fullname(chroot_namespace + namespace_separator + chroot->get_name());

      chroot_map& chroots = find_namespace(chroot_namespace);

      // Make sure insertion will succeed.
      if (chroots.find(name) == chroots.end() &&
          this->aliases.find(fullname) == this->aliases.end())
        {
          // Set up chroot.
          chroots.insert(std::make_pair(name, chroot));
          this->aliases.insert(std::make_pair(fullname, fullname));

          // If a plain chroot, add a proxy session so that --run-session
          // works.
          if (chroot_namespace == "chroot" &&
              chroot->get_chroot_type() == "plain")
            {
              std::string session_alias = std::string("session") +
                namespace_separator + name;
              if (this->aliases.find(session_alias) == this->aliases.end())
                this->aliases.insert(std::make_pair(session_alias, fullname));
            }

          // Set up aliases.
          const string_list& aliases = chroot->get_aliases();
          for (const auto& alias : aliases)
            {
              try
                {
                  // TODO: Remove alias_namespace in 1.5.  Only needed for
                  // -source compatibility.
                  std::string alias_namespace(chroot_namespace);
                  if (this->aliases.insert(std::make_pair
                                           (alias_namespace + namespace_separator + alias,
                                            fullname))
                      .second == false)
                    {
                      string_map::const_iterator dup = this->aliases.find(alias);
                      // Don't warn if alias is for chroot of same name.
                      if (dup == this->aliases.end() ||
                          fullname != dup->first)
                        {
                          const char *const key("aliases");
                          unsigned int line = kconfig.get_line(name, key);

                          if (dup == this->aliases.end())
                            {
                              error e(alias, ALIAS_EXIST);
                              if (line)
                                throw keyfile::error(line, name, key,
                                                     keyfile::PASSTHROUGH_LGK, e);
                              else
                                throw keyfile::error(name, key,
                                                     keyfile::PASSTHROUGH_GK, e);
                            }
                          else
                            {
                              error e(dup->first, ALIAS_EXIST, dup->second);
                              if (line)
                                throw keyfile::error(line, name, key,
                                                     keyfile::PASSTHROUGH_LGK, e);
                              else
                                throw keyfile::error(name, key,
                                                     keyfile::PASSTHROUGH_GK, e);
                            }
                        }
                    }
                }
              catch (const std::runtime_error& e)
                {
                  log_exception_warning(e);
                }
              // If a source chroot, add -source compatibility alias.
              if (chroot_namespace == "source")
                {
                  std::string source_alias = std::string("chroot") +
                    namespace_separator + alias + "-source";
                  if (this->aliases.find(source_alias) == this->aliases.end())
                    this->aliases.insert(std::make_pair(source_alias, fullname));
                }
            }
        }
      else
        {
          unsigned int line = kconfig.get_line(name);

          error e(fullname, CHROOT_EXIST);

          if (line)
            {
              keyfile::error ke(line, name, keyfile::PASSTHROUGH_LG, e);
              ke.set_reason(_("Duplicate names are not allowed"));
              throw ke;
            }
          else
            {
              keyfile::error ke(name, keyfile::PASSTHROUGH_G, e);
              ke.set_reason(_("Duplicate names are not allowed"));
              throw ke;
            }
        }
    }

    config::chroot_list
    config::get_chroots (const std::string& chroot_namespace) const
    {
      chroot_list ret;
      const chroot_map& chroots = find_namespace(chroot_namespace);

      for (const auto& chroot : chroots)
        ret.push_back(chroot.second);

      std::sort(ret.begin(), ret.end(), chroot_alphasort);

      return ret;
    }

    config::chroot_map&
    config::find_namespace (const std::string& chroot_namespace)
    {
      chroot_namespace_map::iterator pos = this->namespaces.find(chroot_namespace);

      if (pos == this->namespaces.end())
        throw error(chroot_namespace, NAMESPACE_NOTFOUND);

      return pos->second;
    }

    config::chroot_map const&
    config::find_namespace (const std::string& chroot_namespace) const
    {
      chroot_namespace_map::const_iterator pos = this->namespaces.find(chroot_namespace);

      if (pos == this->namespaces.end())
        throw error(chroot_namespace, NAMESPACE_NOTFOUND);

      return pos->second;
    }

    const chroot::ptr
    config::find_chroot (const std::string& name) const
    {
      std::string chroot_namespace;
      std::string chroot_name;

      get_namespace(name, chroot_namespace, chroot_name);

      return find_chroot_in_namespace(chroot_namespace, chroot_name);
    }

    const chroot::ptr
    config::find_chroot (const std::string& namespace_hint,
                         const std::string& name) const
    {
      std::string chroot_namespace(namespace_hint);
      std::string chroot_name(name);

      get_namespace(name, chroot_namespace, chroot_name);

      if (chroot_namespace.empty())
        chroot_namespace = namespace_hint;
      if (chroot_namespace.empty())
        chroot_namespace = "chroot";

      return find_chroot_in_namespace(chroot_namespace, chroot_name);
    }

    const chroot::ptr
    config::find_chroot_in_namespace (const std::string& chroot_namespace,
                                      const std::string& name) const
    {
      const chroot_map& chroots = find_namespace(chroot_namespace);

      log_debug(DEBUG_NOTICE) << "Looking for chroot " << name << " in namespace " << chroot_namespace << std::endl;

      chroot_map::const_iterator pos = chroots.find(name);

      if (pos != chroots.end())
        return pos->second;
      else
        {
          chroot *null_chroot = 0;
          return chroot::ptr(null_chroot);
        }
    }

    const chroot::ptr
    config::find_alias (const std::string& namespace_hint,
                        const std::string& name) const
    {
      std::string chroot_namespace(namespace_hint);
      std::string alias_name(name);

      get_namespace(name, chroot_namespace, alias_name);

      if (chroot_namespace.empty())
        chroot_namespace = namespace_hint;
      if (chroot_namespace.empty())
        chroot_namespace = "chroot";

      string_map::const_iterator found = this->aliases.find(chroot_namespace + namespace_separator + alias_name);

      log_debug(DEBUG_NOTICE) << "Finding alias " << name << " with hint " << namespace_hint << std::endl;
      log_debug(DEBUG_NOTICE) << "Alias " << (found != this->aliases.end() ? "found" : "not found") << std::endl;

      if (found != this->aliases.end())
        return find_chroot(namespace_hint, found->second);
      else
        return find_chroot(namespace_hint, name);
    }

    std::string
    config::lookup_alias (const std::string& namespace_hint,
                          const std::string& name) const
    {
      std::string chroot_namespace(namespace_hint);
      std::string alias_name(name);


      get_namespace(name, chroot_namespace, alias_name);

      if (chroot_namespace.empty())
        chroot_namespace = namespace_hint;
      if (chroot_namespace.empty())
        chroot_namespace = "chroot";

      string_map::const_iterator found = this->aliases.find(chroot_namespace + namespace_separator + alias_name);

      log_debug(DEBUG_NOTICE) << "Looking for alias " << name << " with hint " << namespace_hint << std::endl;
      log_debug(DEBUG_NOTICE) << "Alias " << (found != this->aliases.end() ? "found" : "not found") << std::endl;

      if (found != this->aliases.end())
        return found->second;
      else
        return std::string();
    }

    // TODO: Only printed aliases before...  Add variant which doesn't use
    // namespaces to get all namespaces.
    string_list
    config::get_chroot_list (const std::string& chroot_namespace) const
    {
      string_list ret;
      const chroot_map& chroots = find_namespace(chroot_namespace);

      for (const auto& chroot : chroots)
        ret.push_back(chroot_namespace + namespace_separator + chroot.first);

      std::sort(ret.begin(), ret.end());

      return ret;
    }

    string_list
    config::get_alias_list (const std::string& chroot_namespace) const
    {
      string_list ret;

      // To validate namespace.
      find_namespace(chroot_namespace);

      for (const auto& alias : aliases)
        {
          std::string::size_type seppos = alias.first.find_first_of(namespace_separator);
          if (seppos != std::string::npos)
            {
              std::string alias_namespace = alias.first.substr(0, seppos);
              if (alias_namespace == chroot_namespace)
                ret.push_back(alias.first);
            }
        }

      std::sort(ret.begin(), ret.end());

      return ret;
    }

    void
    config::print_chroot_list_simple (std::ostream& stream) const
    {
      stream << _("Available chroots: ");

      const chroot_map& chroots = find_namespace("chroot");

      for (chroot_map::const_iterator pos = chroots.begin();
           pos != chroots.end();
           ++pos)
        {
          stream << pos->second->get_name();
          const string_list& aliases = pos->second->get_aliases();
          if (!aliases.empty())
            {
              stream << " [";
              for (string_list::const_iterator alias = aliases.begin();
                   alias != aliases.end();
                   ++alias)
                {
                  stream << *alias;
                  if (alias + 1 != aliases.end())
                    stream << ", ";
                }
              stream << ']';
            }
          chroot_map::const_iterator is_end(pos);
          if ((++is_end) != chroots.end())
            stream << ", ";
        }

      stream << endl;
    }

    config::chroot_map
    config::validate_chroots (const std::string& namespace_hint,
                              const string_list& chroots) const
    {
      string_list bad_chroots;
      chroot_map validated;

      for (const auto& chrootname : chroots)
        {
          chroot::ptr chrootptr = find_alias(namespace_hint, chrootname);
          if (!chrootptr)
            bad_chroots.push_back(chrootname);
          else
            validated.insert(std::make_pair(chrootname, chrootptr));
        }

      if (!bad_chroots.empty())
        throw error(string_list_to_string(bad_chroots, ", "),
                    (bad_chroots.size() == 1)
                    ? CHROOT_NOTFOUND : CHROOTS_NOTFOUND);

      return validated;
    }

    void
    config::load_data (const std::string& chroot_namespace,
                       const std::string& file)
    {
      log_debug(DEBUG_NOTICE) << "Loading data file: " << file << endl;

      // stat filename (in case it's a pipe and open(2) blocks)
      stat file_status1(file);
      if (file_status1.uid() != 0)
        throw error(file, FILE_OWNER);
      if (file_status1.check_mode(stat::PERM_OTHER_WRITE))
        throw error(file, FILE_PERMS);
      if (!file_status1.is_regular())
        throw error(file, FILE_NOTREG);

      /* Use a UNIX fd, for security (no races) */
      int fd = open(file.c_str(), O_RDONLY);
      if (fd < 0)
        throw error(file, FILE_OPEN, strerror(errno));

      // stat fd following open
      stat file_status2(fd);
      if (file_status2.uid() != 0)
        throw error(file, FILE_OWNER);
      if (file_status2.check_mode(stat::PERM_OTHER_WRITE))
        throw error(file, FILE_PERMS);
      if (!file_status2.is_regular())
        throw error(file, FILE_NOTREG);

      // Create a stream from the file descriptor.  The fd will be closed
      // when the stream is destroyed.

#ifdef BOOST_IOSTREAMS_CLOSE_HANDLE_OLD
      fdistream input(fd, true);
#else
      fdistream input(fd, boost::iostreams::close_handle);
#endif
      input.imbue(std::locale::classic());

      try
        {
          file_lock lock(fd);
          lock.set_lock(lock::LOCK_SHARED, 2);
          parse_data(chroot_namespace, input);
          lock.unset_lock();
        }
      catch (const std::runtime_error& e)
        {
          throw error(file, e);
        }
    }

    void
    config::parse_data (const std::string& chroot_namespace,
                        std::istream& stream)
    {
      /* Create key file */
      keyfile kconfig;
      keyfile_reader(kconfig, stream);

      load_keyfile(chroot_namespace, kconfig);
    }

    void
    config::load_keyfile (const std::string& chroot_namespace,
                          keyfile& kconfig)
    {
      /* Create chroot objects from key file */
      const string_list& groups = kconfig.get_groups();
      for (const auto& group : groups)
        {
          std::string type = "plain"; // "plain" is the default type.
          kconfig.get_value(group, "type", type);
          chroot::ptr chroot = chroot::create(type);

          // Set both; the keyfile load will correct them if needed.
          chroot->set_name(group);

          // If we are (re-)creating session objects, we need to re-clone
          // the session chroot object from its basic state, in order to
          // get the correct facets in place.  In the future, it would be
          // great if sessions could serialise their facet usage to allow
          // automatic reconstruction.
          log_debug(DEBUG_INFO) << "Created template chroot (type=" << type
                                << "  name/session-id=" << group
                                << "  namespace=" << chroot_namespace
                                << "  source-clonable="
                                << static_cast<bool>(chroot->get_facet<facet::session_clonable>())
                                << ")" << endl;

          // The "session" namespace is special.  We don't clone for other
          // types.  However, this special casing should probably be
          // removed.  Ideally, the chroot state should be stored in the
          // serialised session file (or chroot definition).
          if (chroot_namespace == "session" &&
              chroot->get_facet<facet::session_clonable>())
            {
              chroot = chroot->clone_session("dummy-session-name", "dummy-session-name", "", false);
              assert(chroot);
              facet::session::const_ptr psess
                (chroot->get_facet<facet::session>());
              assert(psess);
              chroot->set_name(group);
            }
          else
            {
              facet::session::const_ptr psess
                (chroot->get_facet<facet::session>());
              assert(!psess);
            }

          kconfig >> chroot;

          add(chroot_namespace, chroot, kconfig);

          {
            facet::source_clonable::const_ptr psrc
              (chroot->get_facet<facet::source_clonable>());

            if (psrc && psrc->get_source_clone() &&
                !chroot->get_facet<facet::session>())
              {
                chroot::ptr source_chroot = chroot->clone_source();
                if (source_chroot)
                  add("source", source_chroot, kconfig);
              }
          }
        }
    }

    void
    config::get_namespace(const std::string& name,
                          std::string&       chroot_namespace,
                          std::string&       chroot_name)
    {
      std::string::size_type pos =
        name.find_first_of(config::namespace_separator);

      if (pos != std::string::npos) // Found namespace
        {
          chroot_namespace = name.substr(0, pos);
          if (name.size() >= pos + 1)
            chroot_name = name.substr(pos + 1);
        }
      else // No namespace
        {
          chroot_namespace.clear();
          chroot_name = name;
        }
    }

  }
}
