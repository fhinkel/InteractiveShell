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

#ifndef SBUILD_KEYFILE_H
#define SBUILD_KEYFILE_H

#include <sbuild/i18n.h>
#include <sbuild/log.h>
#include <sbuild/parse-error.h>
#include <sbuild/parse-value.h>
#include <sbuild/types.h>
#include <sbuild/util.h>

#include <cassert>
#include <map>
#include <string>
#include <sstream>
#include <tuple>

#include <boost/format.hpp>
#include <boost/any.hpp>

namespace sbuild
{

  /**
   * Configuration file parser.  This class loads an INI-style
   * configuration file from a file or stream.  The format is
   * documented in schroot.conf(5).
   */
  class keyfile
  {
  public:
    /// Configuration parameter priority.
    enum priority
      {
        PRIORITY_OPTIONAL,   ///< The parameter is optional.
        PRIORITY_REQUIRED,   ///< The parameter is required.
        PRIORITY_DISALLOWED, ///< The parameter is not allowed in this context.
        PRIORITY_DEPRECATED, ///< The parameter is deprecated, but functional.
        PRIORITY_OBSOLETE    ///< The parameter is obsolete, and not functional.
      };

    /// Error codes.
    enum error_code
      {
        BAD_FILE,          ///< The file to parse couldn't be opened.
        DEPRECATED_KEY,    ///< The key is deprecated.
        DEPRECATED_KEY_NL, ///< The key is deprecated (no line specified).
        DISALLOWED_KEY,    ///< The key is not allowed.
        DISALLOWED_KEY_NL, ///< The key is not allowed (no line specified).
        DUPLICATE_GROUP,   ///< The group is a duplicate.
        DUPLICATE_KEY,     ///< The key is a duplicate.
        INVALID_GROUP,     ///< The group is invalid.
        INVALID_KEY,       ///< The key is invalid.
        INVALID_LINE,      ///< The line is invalid.
        MISSING_KEY,       ///< The key is missing.
        MISSING_KEY_NL,    ///< The key is missing (no line specified).
        NO_GROUP,          ///< No group was specified.
        NO_KEY,            ///< No key was specified.
        OBSOLETE_KEY,      ///< The key is obsolete.
        OBSOLETE_KEY_NL,   ///< The key is obsolete (no line specified).
        PASSTHROUGH_G,     ///< Pass through exception with group.
        PASSTHROUGH_GK,    ///< Pass through exception with group and key.
        PASSTHROUGH_LG,    ///< Pass through exception with line and group.
        PASSTHROUGH_LGK,   ///< Pass through exception with line, group and key.
        UNKNOWN_KEY        ///< The key is unknown.
      };

    /// Exception type.
    typedef parse_error<error_code> error;

    /// Group name.
    typedef std::string group_name_type;

    /// Key name.
    typedef std::string key_type;

    /// Value.
    typedef std::string value_type;

    /// Comment.
    typedef std::string comment_type;

    /// Line number.
    typedef unsigned int size_type;

    /// Vector of groups
    typedef std::vector<group_name_type> group_list;

    /// Vector of values
    typedef std::vector<value_type> value_list;

  protected:
    /// Internal value.
    typedef boost::any internal_value_type;

    /// Key-value-comment-line tuple.
    typedef std::tuple<key_type,internal_value_type,comment_type,size_type>
    item_type;

    /// Map between key name and key-internal_value-comment tuple.
    typedef std::map<key_type,item_type> item_map_type;

    /// Group-items-comment-line tuple.
    typedef std::tuple<group_name_type,item_map_type,comment_type,size_type> group_type;

    /// Map between group name and group-items-comment tuple.
    typedef std::map<group_name_type,group_type> group_map_type;

    /// Vector of keys
    typedef std::vector<key_type> key_list;

  public:
    /// The constructor.
    keyfile ();

    /// The destructor.
    virtual ~keyfile ();

    /**
     * Get a list of groups.
     *
     * @returns a list of groups in the keyfile.  If no groups exist,
     * the list will be empty.
     */
    group_list
    get_groups () const;

    /**
     * Get a list of keys in a group.
     *
     * @param group the group to use.
     * @returns a list of keys in a group.  If no keys exist in the
     * group, or the group does not exist, the list will be empty.
     */
    key_list
    get_keys (const group_name_type& group) const;

    /**
     * Check for unused keys in a group.  If keys other than the
     * specified keys exist in the specified group, print a warning
     * about unknown keys having been used.
     *
     * @param group the group to use.
     * @param keys the keys which have been used.
     */
    void
    check_keys (const group_name_type& group,
                const key_list&        keys) const;

    /**
     * Check if a group exists.
     *
     * @param group the group to check for.
     * @returns true if the group exists, otherwise false.
     */
    bool
    has_group (const group_name_type& group) const;

    /**
     * Check if a key exists.
     *
     * @param group the group the key is in.
     * @param key the key to check for.
     * @returns true if the key exists, otherwise false.
     */
    bool
    has_key (const group_name_type& group,
             const key_type&        key) const;

    /**
     * Set a group.  The group will be created (and the comment set)
     * only if the group does not already exist.
     *
     * @param group the group to set.
     * @param comment the comment to set.
     */
    void
    set_group (const group_name_type& group,
               const comment_type&    comment);

    /**
     * Set a group.  The group will be created (and the comment set)
     * only if the group does not already exist.
     *
     * @param group the group to set.
     * @param comment the comment to set.
     * @param line the line number in the input file, or 0 otherwise.
     */
    void
    set_group (const group_name_type& group,
               const comment_type&    comment,
               size_type              line);

    /**
     * Get a group comment.
     *
     * @param group the group to find.
     * @returns the comment.
     */
    comment_type
    get_comment (const group_name_type& group) const;

    /**
     * Get a key comment.
     *
     * @param group the group to find.
     * @param key the key to find.
     * @returns the comment.
     */
    comment_type
    get_comment (const group_name_type& group,
                 const key_type&        key) const;

    /**
     * Get a group line number.
     *
     * @param group the group to find.
     * @returns the line number, or 0 if not available.
     */
    size_type
    get_line (const group_name_type& group) const;

    /**
     * Get a key line number.
     *
     * @param group the group to find.
     * @param key the key to find.
     * @returns the line number, or 0 if not available.
     */
    size_type
    get_line (const group_name_type& group,
              const key_type&        key) const;

    /**
     * Get a key value.
     *
     * @param group the group the key is in.
     * @param key the key to get.
     * @param value the value to store the key's value in.  This must
     * be settable from an istream and be copyable.
     * @returns true if the key was found, otherwise false (in which
     * case value will be unchanged).
     */
    template <typename T>
    bool
    get_value (const group_name_type& group,
               const key_type&        key,
               T&                     value) const
    {
      log_debug(DEBUG_INFO) << "Getting keyfile group=" << group
                            << ", key=" << key << std::endl;
      const item_type *found_item = find_item(group, key);
      if (found_item)
        {
          const internal_value_type& strval(std::get<1>(*found_item));
          try
            {
              parse_value(boost::any_cast<std::string const&>(strval), value);
              return true;
            }
          catch (const parse_value_error& e)
            {
              size_type line = get_line(group, key);
              if (line)
                {
                  error ep(line, group, key, PASSTHROUGH_LGK, e);
                  log_exception_warning(ep);
                }
              else
                {
                  error ep(group, key, PASSTHROUGH_GK, e);
                  log_exception_warning(ep);
                }
              return false;
            }
        }
      log_debug(DEBUG_NOTICE) << "key not found" << std::endl;
      return false;
    }

    /**
     * Get a key value.  If the value does not exist, is deprecated or
     * obsolete, warn appropriately.
     *
     * @param group the group the key is in.
     * @param key the key to get.
     * @param priority the priority of the option.
     * @param value the value to store the key's value in.  This must
     * be settable from an istream and be copyable.
     * @returns true if the key was found, otherwise false (in which
     * case value will be unchanged).
     */
    template <typename T>
    bool
    get_value (const group_name_type& group,
               const key_type&        key,
               priority               priority,
               T&                     value) const
    {
      bool status = get_value(group, key, value);
      check_priority(group, key, priority, status);
      return status;
    }

    /**
     * Get a localised key string value.
     *
     * @param group the group the key is in.
     * @param key the key to get.
     * @param value the string to store the key's localised value in.
     * @returns true if the key was found, otherwise false (in which
     * case value will be unchanged).
     */
    bool
    get_locale_string (const group_name_type& group,
                       const key_type&        key,
                       value_type&            value) const;

    /**
     * Get a localised key string value.  If the value does not exist,
     * is deprecated or obsolete, warn appropriately.
     *
     * @param group the group the key is in.
     * @param key the key to get.
     * @param priority the priority of the option.
     * @param value the string to store the key's localised value in.
     * @returns true if the key was found, otherwise false (in which
     * case value will be unchanged).
     */
    bool
    get_locale_string (const group_name_type& group,
                       const key_type&        key,
                       priority               priority,
                       value_type&            value) const;

    /**
     * Get a localised key string value for a specific locale.
     *
     * @param group the group the key is in.
     * @param key the key to get.
     * @param locale the locale to use.
     * @param value the string to store the key's localised value in.
     * @returns true if the key was found, otherwise false (in which
     * case value will be unchanged).
     */
    bool
    get_locale_string (const group_name_type& group,
                       const key_type&        key,
                       const std::string&     locale,
                       value_type&            value) const;

    /**
     * Get a localised key string value for a specific locale.  If the
     * value does not exist, is deprecated or obsolete, warn
     * appropriately.
     *
     * @param group the group the key is in.
     * @param key the key to get.
     * @param locale the locale to use.
     * @param priority the priority of the option.
     * @param value the string to store the key's localised value in.
     * @returns true if the key was found, otherwise false (in which
     * case value will be unchanged).
     */
    bool
    get_locale_string (const group_name_type& group,
                       const key_type&        key,
                       const std::string&     locale,
                       priority               priority,
                       value_type&            value) const;

    /**
     * Get a key value as a list.
     *
     * @param group the group the key is in.
     * @param key the key to get.
     * @param container the container to store the key's value in.
     * The value type must be settable from an istream and be
     * copyable.  The list must be a container with a standard insert
     * method.
     * @returns true if the key was found, otherwise false (in which
     * case value will be undefined).
     */
    template <typename C>
    bool
    get_list_value (const group_name_type& group,
                    const key_type&        key,
                    C&                     container) const
    {
      value_type item_value;
      if (get_value(group, key, item_value))
        {
          value_list items = split_string(item_value,
                                          this->separator);
          for (const auto& item : items)
            {
              typename C::value_type tmp;

              try
                {
                  parse_value(item, tmp);
                }
              catch (const parse_value_error& e)
                {
                  size_type line = get_line(group, key);
                  if (line)
                    {
                      error ep(line, group, key, PASSTHROUGH_LGK, e);
                      log_exception_warning(ep);
                    }
                  else
                    {
                      error ep(group, key, PASSTHROUGH_GK, e);
                      log_exception_warning(ep);
                    }
                  return false;
                }

              container.push_back(tmp);
            }
          return true;
        }
      return false;
    }

    /**
     * Get a key value as a list.  If the value does not exist, is
     * deprecated or obsolete, warn appropriately.
     *
     * @param group the group the key is in.
     * @param key the key to get.
     * @param priority the priority of the option.
     * @param container the container to store the key's value in.
     * The value type must be settable from an istream and be
     * copyable.  The list must be a container with a standard insert
     * method.
     * @returns true if the key was found, otherwise false (in which
     * case value will be undefined).
     */
    template <typename C>
    bool
    get_list_value (const group_name_type& group,
                    const key_type&        key,
                    priority               priority,
                    C&                     container) const
    {
      bool status = get_list_value(group, key, container);
      check_priority(group, key, priority, status);
      return status;
    }

    /**
     * Get a key value as a set.
     *
     * @param group the group the key is in.
     * @param key the key to get.
     * @param container the container to store the key's value in.
     * The value type must be settable from an istream and be
     * copyable.  The set must be a container with a standard insert
     * method.
     * @returns true if the key was found, otherwise false (in which
     * case value will be undefined).
     */
    template <typename C>
    bool
    get_set_value (const group_name_type& group,
                   const key_type&        key,
                   C&                     container) const
    {
      value_type item_value;
      if (get_value(group, key, item_value))
        {
          value_list items = split_string(item_value,
                                          this->separator);
          for (const auto& item : items)
            {
              typename C::value_type tmp;

              try
                {
                  parse_value(item, tmp);
                }
              catch (const parse_value_error& e)
                {
                  size_type line = get_line(group, key);
                  if (line)
                    {
                      error ep(line, group, key, PASSTHROUGH_LGK, e);
                      log_exception_warning(ep);
                    }
                  else
                    {
                      error ep(group, key, PASSTHROUGH_GK, e);
                      log_exception_warning(ep);
                    }
                  return false;
                }

              container.insert(tmp);
            }
          return true;
        }
      return false;
    }

    /**
     * Get a key value as a set.  If the value does not exist, is
     * deprecated or obsolete, warn appropriately.
     *
     * @param group the group the key is in.
     * @param key the key to get.
     * @param priority the priority of the option.
     * @param container the container to store the key's value in.
     * The value type must be settable from an istream and be
     * copyable.  The set must be a container with a standard insert
     * method.
     * @returns true if the key was found, otherwise false (in which
     * case value will be undefined).
     */
    template <typename C>
    bool
    get_set_value (const group_name_type& group,
                   const key_type&        key,
                   priority               priority,
                   C&                     container) const
    {
      bool status = get_set_value(group, key, container);
      check_priority(group, key, priority, status);
      return status;
    }

    /**
     * Set a key value.
     *
     * @param group the group the key is in.
     * @param key the key to set.
     * @param value the value to get the key's value from.  This must
     * allow output to an ostream.
     */
    template <typename T>
    void
    set_value (const group_name_type& group,
               const key_type&        key,
               T const&               value)
    {
      set_value(group, key, value, comment_type());
    }

    /**
     * Set a key value.
     *
     * @param group the group the key is in.
     * @param key the key to set.
     * @param value the value to get the key's value from.  This must
     * allow output to an ostream.
     * @param comment the comment for this key.
     */
    template <typename T>
    void
    set_value (const group_name_type& group,
               const key_type&        key,
               T const&               value,
               const comment_type&    comment)
    {
      set_value(group, key, value, comment, 0);
    }

  protected:
    /**
     * Set a key value.
     *
     * @param group the group the key is in.
     * @param key the key to set.
     * @param value the value to get the key's value from.
     * @param comment the comment for this key.
     * @param line the line number in the input file, or 0 otherwise.
     */
    void
    set_value (const group_name_type&     group,
               const key_type&            key,
               const internal_value_type& value,
               const comment_type&        comment,
               size_type                  line)
    {
      set_group(group, "");
      group_type *found_group = find_group(group);
      assert (found_group != 0); // should not fail

      item_map_type& items = std::get<1>(*found_group);

      typename item_map_type::iterator pos = items.find(key);
      if (pos != items.end())
        items.erase(pos);
      items.insert
        (typename item_map_type::value_type(key,
                                            item_type(key, value,
                                                      comment, line)));
    }
  public:

    /**
     * Set a key value.
     *
     * @param group the group the key is in.
     * @param key the key to set.
     * @param value the value to get the key's value from.  This must
     * allow output to an ostream.
     * @param comment the comment for this key.
     * @param line the line number in the input file, or 0 otherwise.
     */
    template <typename T>
    void
    set_value (const group_name_type& group,
               const key_type&        key,
               T const&               value,
               const comment_type&    comment,
               size_type              line)
    {
      std::ostringstream os;
      os.imbue(std::locale::classic());
      os << std::boolalpha << value;

      set_group(group, "");
      group_type *found_group = find_group(group);
      assert (found_group != 0); // should not fail

      item_map_type& items = std::get<1>(*found_group);

      typename item_map_type::iterator pos = items.find(key);
      if (pos != items.end())
        items.erase(pos);
      items.insert
        (typename item_map_type::value_type(key,
                                            item_type(key, os.str(),
                                                      comment, line)));
    }

    /**
     * Set a key value from a list.
     *
     * @param group the group the key is in.
     * @param key the key to set.
     * @param begin an iterator referring to the start of the
     * list. The value type must allow output to an ostream.
     * @param end an iterator referring to the end of the list.
     */
    template <typename I>
    void
    set_list_value (const group_name_type& group,
                    const key_type&        key,
                    I                      begin,
                    I                      end)
    {
      set_list_value(group, key, begin, end, comment_type());
    }

    /**
     * Set a key value from a list.
     *
     * @param group the group the key is in.
     * @param key the key to set.
     * @param begin an iterator referring to the start of the
     * list. The value type must allow output to an ostream.
     * @param end an iterator referring to the end of the list.
     * @param comment the comment for this key.
     */
    template <typename I>
    void
    set_list_value (const group_name_type& group,
                    const key_type&        key,
                    I                      begin,
                    I                      end,
                    const comment_type&    comment)
    {
      set_list_value (group, key, begin, end, comment, 0);
    }

    /**
     * Set a key value from a list.
     *
     * @param group the group the key is in.
     * @param key the key to set.
     * @param begin an iterator referring to the start of the
     * list. The value type must allow output to an ostream.
     * @param end an iterator referring to the end of the list.
     * @param comment the comment for this key.
     * @param line the line number in the input file, or 0 otherwise.
     */
    template <typename I>
    void
    set_list_value (const group_name_type& group,
                    const key_type&        key,
                    I                      begin,
                    I                      end,
                    const comment_type&    comment,
                    size_type              line)
    {
      value_type strval;

      for (I pos = begin; pos != end;)
        {
          std::ostringstream os;
          os.imbue(std::locale::classic());
          os << std::boolalpha << *pos;
          if (os)
            {
              strval += os.str();
              if (++pos != end)
                strval += this->separator;
            }
        }

      set_value (group, key, strval, comment, line);
    }

    /**
     * Set a key value from a set.
     *
     * @param group the group the key is in.
     * @param key the key to set.
     * @param begin an iterator referring to the start of the
     * set. The value type must allow output to an ostream.
     * @param end an iterator referring to the end of the set.
     */
    template <typename I>
    void
    set_set_value (const group_name_type& group,
                   const key_type&        key,
                   I                      begin,
                   I                      end)
    {
      std::vector<typename std::iterator_traits<I>::value_type> l(begin, end);
      std::sort(l.begin(), l.end());
      set_list_value(group, key, l.begin(), l.end());
    }

    /**
     * Set a key value from a set.
     *
     * @param group the group the key is in.
     * @param key the key to set.
     * @param begin an iterator referring to the start of the
     * set. The value type must allow output to an ostream.
     * @param end an iterator referring to the end of the set.
     * @param comment the comment for this key.
     */
    template <typename I>
    void
    set_set_value (const group_name_type& group,
                   const key_type&        key,
                   I                      begin,
                   I                      end,
                   const comment_type&    comment)
    {
      std::vector<typename std::iterator_traits<I>::value_type> l(begin, end);
      std::sort(l.begin(), l.end());
      set_list_value(group, key, l.begin(), l.end(), comment);
    }

    /**
     * Set a key value from a set.
     *
     * @param group the group the key is in.
     * @param key the key to set.
     * @param begin an iterator referring to the start of the
     * set. The value type must allow output to an ostream.
     * @param end an iterator referring to the end of the set.
     * @param comment the comment for this key.
     * @param line the line number in the input file, or 0 otherwise.
     */
    template <typename I>
    void
    set_set_value (const group_name_type& group,
                   const key_type&        key,
                   I                      begin,
                   I                      end,
                   const comment_type&    comment,
                   size_type              line)
    {
      std::vector<typename std::iterator_traits<I>::value_type> l(begin, end);
      std::sort(l.begin(), l.end());
      set_list_value(group, key, l.begin(), l.end(), comment, line);
    }

    /**
     * Remove a group.
     *
     * @param group the group to remove.
     */
    void
    remove_group (const group_name_type& group);

    /**
     * Remove a key.
     *
     * @param group the group the key is in.
     * @param key the key to remove.
     */
    void
    remove_key (const group_name_type& group,
                const key_type&        key);

    /**
     * Add a keyfile to the keyfile.
     *
     * @param rhs the keyfile to add.
     * @returns the modified keyfile.
     */
    keyfile&
    operator += (const keyfile& rhs);

    /**
     * Add a keyfile to the keyfile.
     *
     * @param lhs the keyfile to add to.
     * @param rhs the values to add.
     * @returns the new keyfile.
     */
    friend keyfile
    operator + (const keyfile& lhs,
                const keyfile& rhs);

  protected:
    /**
     * Find a group by it's name.
     *
     * @param group the group to find.
     * @returns the group, or 0 if not found.
     */
    const group_type *
    find_group (const group_name_type& group) const;

    /**
     * Find a group by it's name.
     *
     * @param group the group to find.
     * @returns the group, or 0 if not found.
     */
    group_type *
    find_group (const group_name_type& group);

    /**
     * Find a key by it's group and name.
     *
     * @param group the group the key is in.
     * @param key the key to find
     * @returns the key, or 0 if not found.
     */
    const item_type *
    find_item (const group_name_type& group,
               const key_type&        key) const;

    /**
     * Find a key by it's group and name.
     *
     * @param group the group the key is in.
     * @param key the key to find
     * @returns the key, or 0 if not found.
     */
    item_type *
    find_item (const group_name_type& group,
               const key_type&        key);

    /**
     * Check if a key is missing or present when not permitted.
     *
     * @param group the group the key is in.
     * @param key the key to get.
     * @param priority the key priority.
     * @param valid true if key exists, false if not existing.
     */
    void
    check_priority (const group_name_type& group,
                    const key_type&        key,
                    priority               priority,
                    bool                   valid) const;

    /// The top-level groups.
    group_map_type groups;
    /// The separator used as a list item delimiter.
    value_type     separator;

  public:
    /**
     * Set a key value from an object method return value.  This is
     * the same as calling set_value directly, but handles exceptions
     * being thrown by the object method, which are turned into error
     * exceptions.
     *
     * @param object the object to use.
     * @param method the object method to call.
     * @param keyfile the keyfile to use.
     * @param group the group the key is in.
     * @param key the key to set.
     */
    template<class C, typename T>
    static void
    set_object_value (C const&               object,
                      T                (C::* method)() const,
                      keyfile&               keyfile,
                      const group_name_type& group,
                      const key_type&        key)
    {
      try
        {
          if (method)
            keyfile.set_value(group, key, (object.*method)());
        }
      catch (const std::runtime_error& e)
        {
          throw error(group, key, PASSTHROUGH_GK, e);
        }
    }

    /**
     * Set a key value from an object method return value reference.
     * This is the same as calling set_value directly, but handles
     * exceptions being thrown by the object method, which are turned
     * into error exceptions.
     *
     * @param object the object to use.
     * @param method the object method to call.
     * @param keyfile the keyfile to use.
     * @param group the group the key is in.
     * @param key the key to set.
     */
    template<class C, typename T>
    static void
    set_object_value (C const&               object,
                      T const&         (C::* method)() const,
                      keyfile&               keyfile,
                      const group_name_type& group,
                      const key_type&        key)
    {
      try
        {
          if (method)
            keyfile.set_value(group, key, (object.*method)());
        }
      catch (const std::runtime_error& e)
        {
          throw error(group, key, PASSTHROUGH_GK, e);
        }
    }

    /**
     * Set a key list value from an object method return value.  The
     * method must return a container with begin() and end() methods
     * which return forward iterators.  This is the same as calling
     * set_list_value directly, but handles exceptions being thrown by
     * the object method, which are turned into error exceptions.
     *
     * @param object the object to use.
     * @param method the object method to call.
     * @param keyfile the keyfile to use.
     * @param group the group the key is in.
     * @param key the key to set.
     */
    template<class C, typename T>
    static void
    set_object_list_value (C const&               object,
                           T                (C::* method)() const,
                           keyfile&               keyfile,
                           const group_name_type& group,
                           const key_type&        key)
    {
      try
        {
          if (method)
            keyfile.set_list_value(group, key,
                                   (object.*method)().begin(),
                                   (object.*method)().end());
        }
      catch (const std::runtime_error& e)
        {
          throw error(group, key, PASSTHROUGH_GK, e);
        }
    }

    /**
     * Set a key list value from an object method return value.  The
     * method must return a container reference with begin() and end()
     * methods which return forward iterators.  This is the same as
     * calling set_list_value directly, but handles exceptions being
     * thrown by the object method, which are turned into error
     * exceptions.
     *
     * @param object the object to use.
     * @param method the object method to call.
     * @param keyfile the keyfile to use.
     * @param group the group the key is in.
     * @param key the key to set.
     */
    template<class C, typename T>
    static void
    set_object_list_value (C const&               object,
                           T const&         (C::* method)() const,
                           keyfile&               keyfile,
                           const group_name_type& group,
                           const key_type&        key)
    {
      try
        {
          if (method)
            keyfile.set_list_value(group, key,
                                   (object.*method)().begin(),
                                   (object.*method)().end());
        }
      catch (const std::runtime_error& e)
        {
          throw error(group, key, PASSTHROUGH_GK, e);
        }
    }

    /**
     * Set a key set value from an object method return value.  The
     * method must return a container with begin() and end() methods
     * which return forward iterators.  This is the same as calling
     * set_set_value directly, but handles exceptions being thrown by
     * the object method, which are turned into error exceptions.
     *
     * @param object the object to use.
     * @param method the object method to call.
     * @param keyfile the keyfile to use.
     * @param group the group the key is in.
     * @param key the key to set.
     */
    template<class C, typename T>
    static void
    set_object_set_value (C const&               object,
                          T                (C::* method)() const,
                          keyfile&               keyfile,
                          const group_name_type& group,
                          const key_type&        key)
    {
      try
        {
          if (method)
            keyfile.set_set_value(group, key,
                                  (object.*method)().begin(),
                                  (object.*method)().end());
        }
      catch (const std::runtime_error& e)
        {
          throw error(group, key, PASSTHROUGH_GK, e);
        }
    }

    /**
     * Set a key set value from an object method return value.  The
     * method must return a container reference with begin() and end()
     * methods which return forward iterators.  This is the same as
     * calling set_set_value directly, but handles exceptions being
     * thrown by the object method, which are turned into error
     * exceptions.
     *
     * @param object the object to use.
     * @param method the object method to call.
     * @param keyfile the keyfile to use.
     * @param group the group the key is in.
     * @param key the key to set.
     */
    template<class C, typename T>
    static void
    set_object_set_value (C const&               object,
                          T const&         (C::* method)() const,
                          keyfile&               keyfile,
                          const group_name_type& group,
                          const key_type&        key)
    {
      try
        {
          if (method)
            keyfile.set_set_value(group, key,
                                  (object.*method)().begin(),
                                  (object.*method)().end());
        }
      catch (const std::runtime_error& e)
        {
          throw error(group, key, PASSTHROUGH_GK, e);
        }
    }

    /**
     * Get a key value and set it in an object using an object method.
     * This is the same as calling get_value directly, but handles
     * exceptions being thrown by the object method, and
     * deserialisation errors, which are turned into error exceptions
     * pointing to the group, key and line number in the input file.
     *
     * @param object the object to use.
     * @param method the object method to call.
     * @param keyfile the keyfile to use.
     * @param group the group the key is in.
     * @param key the key to set.
     * @param priority the key priority.
     */
    template<class C, typename T>
    static void
    get_object_value (C&                      object,
                      void              (C::* method)(T param),
                      const keyfile&          keyfile,
                      const group_name_type&  group,
                      const key_type&         key,
                      keyfile::priority priority)
    {
      try
        {
          T value;
          if (keyfile.get_value(group, key, priority, value)
              && method)
            (object.*method)(value);
        }
      catch (const std::runtime_error& e)
        {
          size_type line = keyfile.get_line(group, key);
          if (line)
            throw error(line, group, key, PASSTHROUGH_LGK, e);
          else
            throw error(group, key, PASSTHROUGH_GK, e);
        }
    }

    /**
     * Get a key value and set it by reference in an object using an
     * object method.  This is the same as calling get_value directly,
     * but handles exceptions being thrown by the object method, and
     * deserialisation errors, which are turned into error exceptions
     * pointing to the group, key and line number in the input file.
     *
     * @param object the object to use.
     * @param method the object method to call.
     * @param keyfile the keyfile to use.
     * @param group the group the key is in.
     * @param key the key to set.
     * @param priority the key priority.
     */
    template<class C, typename T>
    static void
    get_object_value (C&                      object,
                      void              (C::* method)(T const& param),
                      const keyfile&          keyfile,
                      const group_name_type&  group,
                      const key_type&         key,
                      keyfile::priority priority)
    {
      try
        {
          T value;
          if (keyfile.get_value(group, key, priority, value)
              && method)
            (object.*method)(value);
        }
      catch (const std::runtime_error& e)
        {
          size_type line = keyfile.get_line(group, key);
          if (line)
            throw error(line, group, key, PASSTHROUGH_LGK, e);
          else
            throw error(group, key, PASSTHROUGH_GK, e);
        }
    }

    /**
     * Get a key list value and set it in an object using an object
     * method.  This is the same as calling get_list_value directly,
     * but handles exceptions being thrown by the object method, and
     * deserialisation errors, which are turned into error exceptions
     * pointing to the group, key and line number in the input file.
     *
     * @param object the object to use.
     * @param method the object method to call.
     * @param keyfile the keyfile to use.
     * @param group the group the key is in.
     * @param key the key to set.
     * @param priority the key priority.
     */
    template<class C, typename T>
    static void
    get_object_list_value (C&                      object,
                           void              (C::* method)(T param),
                           const keyfile&          keyfile,
                           const group_name_type&  group,
                           const key_type&         key,
                           keyfile::priority priority)
    {
      try
        {
          T value;
          if (keyfile.get_list_value(group, key, priority, value)
              && method)
            (object.*method)(value);
        }
      catch (const std::runtime_error& e)
        {
          size_type line = keyfile.get_line(group, key);
          if (line)
            throw error(line, group, key, PASSTHROUGH_LGK, e);
          else
            throw error(group, key, PASSTHROUGH_GK, e);
          throw error(keyfile.get_line(group, key),
                      group, key, e);
        }
    }

    /**
     * Get a key list value and set it by reference in an object using
     * an object method.  This is the same as calling get_list_value
     * directly, but handles exceptions being thrown by the object
     * method, and deserialisation errors, which are turned into error
     * exceptions pointing to the group, key and line number in the
     * input file.
     *
     * @param object the object to use.
     * @param method the object method to call.
     * @param keyfile the keyfile to use.
     * @param group the group the key is in.
     * @param key the key to set.
     * @param priority the key priority.
     */
    template<class C, typename T>
    static void
    get_object_list_value (C&                      object,
                           void              (C::* method)(T const& param),
                           const keyfile&          keyfile,
                           const group_name_type&  group,
                           const key_type&         key,
                           keyfile::priority priority)
    {
      try
        {
          T value;
          if (keyfile.get_list_value(group, key, priority, value)
              && method)
            (object.*method)(value);
        }
      catch (const std::runtime_error& e)
        {
          size_type line = keyfile.get_line(group, key);
          if (line)
            throw error(line, group, key, PASSTHROUGH_LGK, e);
          else
            throw error(group, key, PASSTHROUGH_GK, e);
          throw error(keyfile.get_line(group, key),
                      group, key, e);
        }
    }

    /**
     * Get a key set value and set it in an object using an object
     * method.  This is the same as calling get_set_value directly,
     * but handles exceptions being thrown by the object method, and
     * deserialisation errors, which are turned into error exceptions
     * pointing to the group, key and line number in the input file.
     *
     * @param object the object to use.
     * @param method the object method to call.
     * @param keyfile the keyfile to use.
     * @param group the group the key is in.
     * @param key the key to set.
     * @param priority the key priority.
     */
    template<class C, typename T>
    static void
    get_object_set_value (C&                      object,
                          void              (C::* method)(T param),
                          const keyfile&          keyfile,
                          const group_name_type&  group,
                          const key_type&         key,
                          keyfile::priority priority)
    {
      try
        {
          T value;
          if (keyfile.get_set_value(group, key, priority, value)
              && method)
            (object.*method)(value);
        }
      catch (const std::runtime_error& e)
        {
          size_type line = keyfile.get_line(group, key);
          if (line)
            throw error(line, group, key, PASSTHROUGH_LGK, e);
          else
            throw error(group, key, PASSTHROUGH_GK, e);
          throw error(keyfile.get_line(group, key),
                      group, key, e);
        }
    }

    /**
     * Get a key set value and set it by reference in an object using
     * an object method.  This is the same as calling get_set_value
     * directly, but handles exceptions being thrown by the object
     * method, and deserialisation errors, which are turned into error
     * exceptions pointing to the group, key and line number in the
     * input file.
     *
     * @param object the object to use.
     * @param method the object method to call.
     * @param keyfile the keyfile to use.
     * @param group the group the key is in.
     * @param key the key to set.
     * @param priority the key priority.
     */
    template<class C, typename T>
    static void
    get_object_set_value (C&                      object,
                          void              (C::* method)(T const& param),
                          const keyfile&          keyfile,
                          const group_name_type&  group,
                          const key_type&         key,
                          keyfile::priority priority)
    {
      try
        {
          T value;
          if (keyfile.get_set_value(group, key, priority, value)
              && method)
            (object.*method)(value);
        }
      catch (const std::runtime_error& e)
        {
          size_type line = keyfile.get_line(group, key);
          if (line)
            throw error(line, group, key, PASSTHROUGH_LGK, e);
          else
            throw error(group, key, PASSTHROUGH_GK, e);
          throw error(keyfile.get_line(group, key),
                      group, key, e);
        }
    }
  };

}

#endif /* SBUILD_KEYFILE_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
