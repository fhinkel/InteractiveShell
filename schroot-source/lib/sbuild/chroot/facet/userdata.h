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

#ifndef SBUILD_CHROOT_FACET_USERDATA_H
#define SBUILD_CHROOT_FACET_USERDATA_H

#include <sbuild/chroot/facet/facet.h>
#include <sbuild/custom-error.h>
#include <sbuild/types.h>

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      /**
       * Chroot support for extensible user metadata.
       *
       * This facet contains user-specific configuration, both additional
       * keys in schroot.conf, and also set from the command-line.
       */
      class userdata : public facet
      {
      public:
        /// Error codes.
        enum error_code
          {
            ENV_AMBIGUOUS,   ///< Environment variable name is ambiguous.
            KEY_AMBIGUOUS,   ///< Configuration key name is ambiguous.
            KEY_DISALLOWED,  ///< Configuration key is not allowed to be modified.
            KEYNAME_INVALID, ///< Invalid name for configuration key.
            PARSE_ERROR      ///< Error parsing value.
          };

        /// Exception type.
        typedef custom_error<error_code> error;

        /// A shared_ptr to a chroot facet object.
        typedef std::shared_ptr<userdata> ptr;

        /// A shared_ptr to a const chroot facet object.
        typedef std::shared_ptr<const userdata> const_ptr;

      private:
        /// The constructor.
        userdata ();

      public:
        /// The destructor.
        virtual ~userdata ();

        /**
         * Create a chroot facet.
         *
         * @returns a shared_ptr to the new chroot facet.
         */
        static ptr
        create ();

        virtual facet::ptr
        clone () const;

        virtual std::string const&
        get_name () const;

        virtual void
        setup_env (environment& env) const;

        virtual void
        get_details (format_detail& detail) const;

        virtual void
        get_used_keys (string_list& used_keys) const;

        virtual void
        get_keyfile (keyfile& keyfile) const;

        virtual void
        set_keyfile (const keyfile& keyfile);


        template <typename T>
        bool
        get_value (const std::string& key,
                   T&                 value) const
        {
          log_debug(DEBUG_INFO) << "Getting userdata key=" << key << std::endl;
          const string_map::const_iterator found_item = this->data.find(key);
          if (found_item != this->data.end())
            {
              try
                {
                  parse_value(found_item->second, value);
                  return true;
                }
              catch (const parse_value_error& e)
                {
                  error ep(key, PARSE_ERROR, e);
                  log_exception_warning(ep);
                  return false;
                }
            }
          return false;
        }

        /**
         * Get user data as a map of key-value pairs.
         *
         * @returns a reference to a string map.
         */
        string_map const&
        get_data () const;

        /**
         * Get the value of a single user data key.
         *
         * @param key the key to search for.
         * @param value the string to store the key's value in.  Only
         * modified if the key is found.
         * @returns true if found, false if not found.
         */
        bool
        get_data (const std::string& key,
                  std::string&       value) const;

        /**
         * Set user data from a string map.  Note that this method does
         * not perform permissions checking.
         *
         * @param data the user data to set.
         */
        void
        set_data (const string_map& data);

        /**
         * Set a single key-value pair.  Note that this method does not
         * perform permissions checking.
         *
         * @param key the key to set.
         * @param value the value of the key.
         */
        void
        set_data (const std::string& key,
                  const std::string& value);

        /**
         * Set a single key-value pair.  Note that this method does not
         * perform permissions checking or key name validation.
         *
         * @param key the key to set.
         * @param value the value of the key.
         */
        void
        set_system_data (const std::string& key,
                         const std::string& value);

        /**
         * Remove a single key.  If present, the specified key is removed.
         *
         * @param key the key to remove.
         */
        void
        remove_data (const std::string& key);

        /**
         * Get the set of keys allowed to be modified by a user.
         *
         * @returns a string set of keys.
         */
        string_set const&
        get_user_modifiable_keys () const;

        /**
         * Set the set of keys allowed to be modified by a user.
         *
         * @param keys a string set of keys.
         */
        void
        set_user_modifiable_keys (const string_set& keys);

        /**
         * Get the set of keys allowed to be modified by root.
         *
         * @returns a string set of keys.
         */
        string_set const&
        get_root_modifiable_keys () const;

        /**
         * Set the set of keys allowed to be modified by root.
         *
         * @param keys a string set of keys.
         */
        void
        set_root_modifiable_keys (const string_set& keys);

        /**
         * Set data for the current user.  Only keys set using
         * set_user_modifiable_keys() are permitted to be set, otherwise
         * an exception will be thrown.
         *
         * @param string_map a map of key-value pairs.
         */
        void
        set_user_data(const string_map&  data);

        /**
         * Set data for root.  Only keys set using
         * set_user_modifiable_keys() and set_root_modifiable_keys() are
         * permitted to be set, otherwise an exception will be thrown.
         *
         * @param data a map of key-value pairs.
         */
        void
        set_root_data(const string_map&  data);

        /**
         * Set data without user or root checks.
         *
         * @param string_map a map of key-value pairs.
         */
        void
        set_system_data(const string_map&  data);

      private:
        /**
         * Generic function for setting data for any user.
         *
         * @param data a map of key-value pairs.
         * @param allowed_keys the keys which may be used.
         * @param root whether or not the user is the root user.
         */
        void
        set_data(const string_map&  data,
                 const string_set&  allowed_keys,
                 bool               root);

        /// Mapping between user keys and values.
        string_map data;
        /// Environment checking.
        string_set env;
        /// Keys modifiable by users.
        string_set user_modifiable_keys;
        /// Keys modifiable by root.
        string_set root_modifiable_keys;
      };

    }
  }
}

#endif /* SBUILD_CHROOT_FACET_USERDATA_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
