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

#ifndef SBUILD_CHROOT_CONFIG_H
#define SBUILD_CHROOT_CONFIG_H

#include <sbuild/chroot/chroot.h>
#include <sbuild/custom-error.h>

#include <map>
#include <ostream>
#include <vector>
#include <string>

namespace sbuild
{
  namespace chroot
  {

    /**
     * Chroot configuration.
     *
     * This class holds the configuration details from the configuration
     * file.  Conceptually, it's an opaque container of chroot objects.
     *
     * Methods are provided to query the available chroots and find
     * specific chroots.
     */
    class config
    {
    public:
      /// A list of chroots.
      typedef std::vector<chroot::chroot::ptr> chroot_list;
      /// A map between key-value string pairs.
      typedef std::map<std::string, std::string> string_map;
      /// A map between a chroot name and a chroot object.
      typedef std::map<std::string, chroot::chroot::ptr> chroot_map;
      /// A map between a chroot namespace and a chroot map object.
      typedef std::map<std::string, chroot_map> chroot_namespace_map;

      /// Namespace separating character.
      static const std::string namespace_separator;

      /// Error codes.
      enum error_code
        {
          ALIAS_EXIST,       ///< Alias already associated with chroot.
          CHROOT_NOTFOUND,   ///< Chroot not found.
          CHROOTS_NOTFOUND,  ///< Chroots not found.
          CHROOT_EXIST,      ///< A chroot or alias already exists with this name.
          FILE_NOTREG,       ///< File is not a regular file.
          FILE_OPEN,         ///< Failed to open file.
          FILE_OWNER,        ///< File is not owned by user root.
          FILE_PERMS,        ///< File has write permissions for others.
          NAME_INVALID,      ///< Invalid name.
          NAMESPACE_NOTFOUND ///< No such namespace.
        };

      /// Exception type.
      typedef custom_error<error_code> error;

      /// A shared_ptr to a config object.
      typedef std::shared_ptr<config> ptr;

      /// The constructor.
      config ();

      /**
       * The constructor.
       *
       * @param chroot_namespace the namespace to use for initialised
       * configuration.
       * @param file initialise using a configuration file or a whole
       * directory containing configuration files.
       */
      config (const std::string& chroot_namespace,
              const std::string& file);

      /// The destructor.
      virtual ~config ();

      /**
       * Add a configuration file or directory.  The configuration file
       * or directory specified will be loaded.
       *
       * @param chroot_namespace the namespace to use for initialised
       * configuration.
       * @param location initialise using a configuration file or a
       * whole directory containing configuration files.
       */
      void
      add (const std::string& chroot_namespace,
           const std::string& location);

    private:
      /**
       * Add a configuration file.  The configuration file specified
       * will be loaded.
       *
       * @param chroot_namespace the namespace to use for initialised
       * configuration.
       * @param file the file to load.
       */
      void
      add_config_file (const std::string& chroot_namespace,
                       const std::string& file);

      /**
       * Add a configuration directory.  The configuration files in the
       * directory specified will all be loaded.
       *
       * @param chroot_namespace the namespace to use for initialised
       * configuration.
       * @param dir the directory containing the files to load.
       */
      void
      add_config_directory (const std::string& chroot_namespace,
                            const std::string& dir);

    protected:
      /**
       * Add a chroot.  The lists of chroots and aliases will be
       * updated.  If a chroot or alias by the same name exists, the
       * chroot will not be added, and a warning will be logged.  Af any
       * of the aliases already exist, a warning will be logged, and the
       * alias will not be added.
       *
       * @param chroot_namespace the namespace to use for the chroot.
       * @param chroot the chroot to add.
       * @param kconfig the chroot configuration.
       */
      void
      add (const std::string&   chroot_namespace,
           chroot::chroot::ptr& chroot,
           const keyfile&       kconfig);

    public:
      /**
       * Get a list of available chroots.
       *
       * @param chroot_namespace the chroot namespace to use.
       * @returns a list of available chroots.  The list will be empty
       * if no chroots are available.
       */
      chroot_list
      get_chroots (const std::string& chroot_namespace) const;

    protected:
      /**
       * Find a chroot namespace.  If the namespace is not found, and
       * exception will be thrown.
       *
       * @param chroot_namespace the chroot namespace.
       * @returns the namespace.
       */
      chroot_map&
      find_namespace (const std::string& chroot_namespace);

      /**
       * Find a chroot namespace.  If the namespace is not found, and
       * exception will be thrown.
       *
       * @param chroot_namespace the chroot namespace.
       * @returns the namespace.
       */
      chroot_map const&
      find_namespace (const std::string& chroot_namespace) const;

    public:
      /**
       * Split a chroot name into a namespace and name.
       *
       * @param name the name to split
       * @param chroot_namespace the namespace (cleared if no namespace)
       * @param chroot_name the name without any namespace
       */
      static void
      get_namespace(const std::string& name,
                    std::string&       chroot_namespace,
                    std::string&       chroot_name);

      /**
       * Find a chroot by its name.  The name must be fully qualified
       * with a namespace.
       *
       * @param name the chroot name
       * @returns the chroot if found, otherwise 0.
       */
      const chroot::chroot::ptr
      find_chroot (const std::string& name) const;

      /**
       * Find a chroot by its name.
       *
       * @param namespace_hint the namespace to use if non was
       * explicitly specified.
       * @param name the chroot name
       * @returns the chroot if found, otherwise 0.
       */
      const chroot::chroot::ptr
      find_chroot (const std::string& namespace_hint,
                   const std::string& name) const;

      /**
       * Find a chroot by its name in a specific namespace.
       *
       * @param chroot_namespace the namespace to search.
       * @param name the chroot name
       * @returns the chroot if found, otherwise 0.
       */
      const chroot::chroot::ptr
      find_chroot_in_namespace (const std::string& chroot_namespace,
                                const std::string& name) const;

      /**
       * Find a chroot by its name or an alias.
       *
       * @param namespace_hint the namespace to use if non was
       * explicitly specified.
       * @param name the chroot name or alias.
       * @returns the chroot if found, otherwise 0.
       */
      const chroot::chroot::ptr
      find_alias (const std::string& namespace_hint,
                  const std::string& name) const;

      /**
       * Find the chroot name referred to by an alias.
       *
       * @param namespace_hint the namespace to use if non was
       * explicitly specified.
       * @param name the chroot name or alias.
       * @returns the chroot name if found, otherwise an empty string.
       */
      std::string
      lookup_alias (const std::string& namespace_hint,
                    const std::string& name) const;

      /**
       * Get the names (including aliases) of all the available chroots,
       * sorted in alphabetical order.
       *
       * @param chroot_namespace the namespace to use.
       * @returns the list.  The list will be empty if no chroots are
       * available.
       */
      string_list
      get_chroot_list (const std::string& chroot_namespace) const;

      /**
       * Get the names (including aliases) of all the available chroots,
       * sorted in alphabetical order.
       *
       * @param chroot_namespace the namespace to use.
       * @returns the list.  The list will be empty if no chroots are
       * available.
       */
      string_list
      get_alias_list (const std::string& chroot_namespace) const;

      /**
       * Print a single line of all the available chroots to the
       * specified stream.
       *
       * @param stream the stream to output to.
       */
      void
      print_chroot_list_simple (std::ostream& stream) const;

      /**
       * Check that all the chroots specified exist.  The specified
       * chroot names will also be canonicalised so that they are all
       * referenced absolutely by namespace, using chroot_namespace as a
       * namespace hint for chroots without a namespace.  If validation
       * fails, and exception will be thrown.
       *
       * @param namespace_hint the namespace to use if non was
       * explicitly specified.
       * @param chroots a list of chroots to validate.
       * @returns an alias-chroot mapping.
       */
      chroot_map
      validate_chroots (const std::string& namespace_hint,
                        const string_list& chroots) const;

    private:
      /**
       * Load a configuration file.  If there are problems with the
       * configuration file, an error will be thrown.  The file must be
       * owned by root, not writable by other, and be a regular file.
       *
       * @param chroot_namespace the namespace to use for the
       * configuration.
       * @param file the file to load.
       */
      void
      load_data (const std::string& chroot_namespace,
                 const std::string& file);

    protected:
      /**
       * Parse a loaded configuration file.  If there are problems with
       * the configuration file, an error will be thrown.
       *
       * @param chroot_namespace the namespace to use for the
       * configuration.
       * @param stream the data stream to parse.
       */
      virtual void
      parse_data (const std::string& chroot_namespace,
                  std::istream& stream);

      /**
       * Load a keyfile.  If there are problems with the configuration
       * file, an error will be thrown.
       *
       * @param chroot_namespace the namespace to use for the
       * configuration.
       * @param kconfig the chroot configuration.
       */
      virtual void
      load_keyfile (const std::string& chroot_namespace,
                    keyfile& kconfig);

      /// A list of chroots (name->chroot mapping).
      chroot_namespace_map namespaces;
      /// A list of aliases (alias->name mapping).
      string_map aliases;
    };

  }
}

#endif /* SBUILD_CHROOT_CONFIG_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
