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

#include <algorithm>
#include <set>

#include <sbuild/keyfile.h>

#include <boost/format.hpp>

using boost::format;

namespace sbuild
{

  template<>
  error<keyfile::error_code>::map_type
  error<keyfile::error_code>::error_strings =
    {
      // TRANSLATORS: %1% = file
      {keyfile::BAD_FILE,
       N_("Can't open file ‘%1%’")},
      // TRANSLATORS: %1% = line number in configuration file
      // TRANSLATORS: %2% = group name ("[groupname]" in configuration file)
      // TRANSLATORS: %4% = key name ("keyname=value" in configuration file)
      {keyfile::DEPRECATED_KEY,
       N_("line %1% [%2%]: Deprecated key ‘%4%’ used")},
      // TRANSLATORS: %1% = group name ("[groupname]" in configuration file)
      // TRANSLATORS: %4% = key name ("keyname=value" in configuration file)
      {keyfile::DEPRECATED_KEY_NL,
       N_("[%1%]: Deprecated key ‘%4%’ used")},
      // TRANSLATORS: %1% = line number in configuration file
      // TRANSLATORS: %2% = group name ("[groupname]" in configuration file)
      // TRANSLATORS: %4% = key name ("keyname=value" in configuration file)
      {keyfile::DISALLOWED_KEY,
       N_("line %1% [%2%]: Disallowed key ‘%4%’ used")},
      // TRANSLATORS: %1% = group name ("[groupname]" in configuration file)
      // TRANSLATORS: %4% = key name ("keyname=value" in configuration file)
      {keyfile::DISALLOWED_KEY_NL,
       N_("[%1%]: Disallowed key ‘%4%’ used")},
      // TRANSLATORS: %1% = line number in configuration file
      // TRANSLATORS: %4% = group name ("[groupname]" in configuration file)
      {keyfile::DUPLICATE_GROUP,
       N_("line %1%: Duplicate group ‘%4%’")},
      // TRANSLATORS: %1% = line number in configuration file
      // TRANSLATORS: %2% = group name ("[groupname]" in configuration file)
      // TRANSLATORS: %4% = key name ("keyname=value" in configuration file)
      {keyfile::DUPLICATE_KEY,
       N_("line %1% [%2%]: Duplicate key ‘%4%’")},
      // TRANSLATORS: %1% = line number in configuration file
      // TRANSLATORS: %4% = line contents as read from the configuration file
      {keyfile::INVALID_GROUP,
       N_("line %1%: Invalid group: “%4%”")},
      // TRANSLATORS: %1% = line number in configuration file
      // TRANSLATORS: %2% = group name ("[groupname]" in configuration file)
      // TRANSLATORS: %4% = key name ("keyname=value" in configuration file)
      {keyfile::INVALID_KEY,
       N_("line %1% [%2%]: Invalid key ‘%4%’ used")},
      // TRANSLATORS: %1% = line number in configuration file
      // TRANSLATORS: %4% = line contents as read from the configuration file
      {keyfile::INVALID_LINE,
       N_("line %1%: Invalid line: “%4%”")},
      // TRANSLATORS: %1% = line number in configuration file
      // TRANSLATORS: %2% = group name ("[groupname]" in configuration file)
      // TRANSLATORS: %4% = key name ("keyname=value" in configuration file)
      {keyfile::MISSING_KEY,
       N_("line %1% [%2%]: Required key ‘%4%’ is missing")},
      // TRANSLATORS: %1% = group name ("[groupname]" in configuration file)
      // TRANSLATORS: %4% = key name ("keyname=value" in configuration file)
      {keyfile::MISSING_KEY_NL,
       N_("[%1%]: Required key ‘%4%’ is missing")},
      // TRANSLATORS: %1% = line number in configuration file
      // TRANSLATORS: %4% = line contents as read from the configuration file
      {keyfile::NO_GROUP,
       N_("line %1%: No group specified: “%4%”")},
      // TRANSLATORS: %1% = line number in configuration file
      // TRANSLATORS: %4% = line contents as read from the configuration file
      {keyfile::NO_KEY,
       N_("line %1%: No key specified: “%4%”")},
      // TRANSLATORS: %1% = line number in configuration file
      // TRANSLATORS: %2% = group name ("[groupname]" in configuration file)
      // TRANSLATORS: %4% = key name ("keyname=value" in configuration file)
      {keyfile::OBSOLETE_KEY,
       N_("line %1% [%2%]: Obsolete key ‘%4%’ used")},
      // TRANSLATORS: %1% = group name ("[groupname]" in configuration file)
      // TRANSLATORS: %4% = key name ("keyname=value" in configuration file)
      {keyfile::OBSOLETE_KEY_NL,
       N_("[%1%]: Obsolete key ‘%4%’ used")},
      // TRANSLATORS: %1% = group name ("[groupname]" in configuration file)
      // TRANSLATORS: %4% = additional details
      {keyfile::PASSTHROUGH_G,
       N_("[%1%]: %4%")},
      // TRANSLATORS: %1% = group name ("[groupname]" in configuration file)
      // TRANSLATORS: %2% = key name ("keyname=value" in configuration file)
      // TRANSLATORS: %4% = additional details
      {keyfile::PASSTHROUGH_GK,
       N_("[%1%] %2%: %4%")},
      // TRANSLATORS: %1% = line number in configuration file
      // TRANSLATORS: %2% = group name ("[groupname]" in configuration file)
      // TRANSLATORS: %4% = additional details
      {keyfile::PASSTHROUGH_LG,
       N_("line %1% [%2%]: %4%")},
      // TRANSLATORS: %1% = line number in configuration file
      // TRANSLATORS: %2% = group name ("[groupname]" in configuration file)
      // TRANSLATORS: %3% = key name ("keyname=value" in configuration file)
      // TRANSLATORS: %4% = additional details
      {keyfile::PASSTHROUGH_LGK,
       N_("line %1% [%2%] %3%: %4%")},
      // TRANSLATORS: %1% = line number in configuration file
      // TRANSLATORS: %2% = group name ("[groupname]" in configuration file)
      // TRANSLATORS: %4% = key name ("keyname=value" in configuration file)
      {keyfile::UNKNOWN_KEY,
       N_("line %1% [%2%]: Unknown key ‘%4%’ used")}
    };

  sbuild::keyfile::keyfile ():
    groups(),
    separator(",")
  {
  }

  sbuild::keyfile::~keyfile()
  {
  }

  sbuild::keyfile::group_list
  sbuild::keyfile::get_groups () const
  {
    group_list ret;

    for (const auto& group : this->groups)
      ret.push_back(group.first);

    return ret;
  }

  sbuild::keyfile::key_list
  sbuild::keyfile::get_keys (const group_name_type& group) const
  {
    key_list ret;

    const group_type *found_group = find_group(group);
    if (found_group)
      {
        const item_map_type& items(std::get<1>(*found_group));
        for (const auto& item : items)
          ret.push_back(item.first);
      }

    return ret;
  }

  void
  sbuild::keyfile::check_keys (const group_name_type& group,
                               const key_list&        keys) const
  {
    const string_list total(get_keys(group));

    const string_set a(total.begin(), total.end());
    const string_set b(keys.begin(), keys.end());

    string_set unused;

    set_difference(a.begin(), a.end(),
                   b.begin(), b.end(),
                   inserter(unused, unused.begin()));

    for (const auto& item : unused)
      {
        size_type line = get_line(group, item);
        error e(line, group, UNKNOWN_KEY, item);
        e.set_reason(_("This option may be present in a newer version"));
        log_exception_warning(e);
      }
  }

  bool
  sbuild::keyfile::has_group (const group_name_type& group) const
  {
    return (find_group(group) != 0);
  }

  bool
  sbuild::keyfile::has_key (const group_name_type& group,
                            const key_type&        key) const
  {
    return (find_item(group, key) != 0);
  }

  void
  sbuild::keyfile::set_group (const group_name_type& group,
                              const comment_type&    comment)
  {
    set_group(group, comment, 0);
  }

  void
  sbuild::keyfile::set_group (const group_name_type& group,
                              const comment_type&    comment,
                              size_type              line)
  {
    if (!has_group(group))
      this->groups.insert
        (group_map_type::value_type(group,
                                    group_type(group,
                                               item_map_type(),
                                               comment,
                                               line)));
  }

  sbuild::keyfile::comment_type
  sbuild::keyfile::get_comment (const group_name_type& group) const
  {
    const group_type *found_group = find_group(group);
    if (found_group)
      return std::get<2>(*found_group);
    else
      return comment_type();
  }

  sbuild::keyfile::comment_type
  sbuild::keyfile::get_comment (const group_name_type& group,
                                const key_type&        key) const
  {
    const item_type *found_item = find_item(group, key);
    if (found_item)
      return std::get<2>(*found_item);
    else
      return comment_type();
  }

  sbuild::keyfile::size_type
  sbuild::keyfile::get_line (const group_name_type& group) const
  {
    const group_type *found_group = find_group(group);
    if (found_group)
      return std::get<3>(*found_group);
    else
      return 0;
  }

  sbuild::keyfile::size_type
  sbuild::keyfile::get_line (const group_name_type& group,
                             const key_type&        key) const
  {
    const item_type *found_item = find_item(group, key);
    if (found_item)
      return std::get<3>(*found_item);
    else
      return 0;
  }

  bool
  sbuild::keyfile::get_locale_string (const group_name_type& group,
                                      const key_type&        key,
                                      value_type&            value) const
  {
    std::string localename;
    try
      {
        localename = std::locale("").name();
      }
    catch (const std::runtime_error& e) // Invalid locale
      {
        localename = std::locale::classic().name();
      }
    std::string::size_type pos;
    bool status = false;

    // Strip off any charset.
    if ((pos = localename.find_first_of('.')) != std::string::npos)
      localename = localename.substr(0, pos);
    status = get_locale_string(group, key, localename, value);

    // Strip off territory.
    if (status == false &&
        (pos = localename.find_first_of('_')) != std::string::npos)
      {
        localename = localename.substr(0, pos);
        status = get_locale_string(group, key, localename, value);
      }

    // Fall back to non-localised version.
    if (status == false)
      status = get_value(group, key, value);

    return status;
  }

  bool
  sbuild::keyfile::get_locale_string (const group_name_type& group,
                                      const key_type&        key,
                                      priority               priority,
                                      value_type&            value) const
  {
    bool status = get_locale_string(group, key, value);
    check_priority(group, key, priority, status);
    return status;
  }

  bool
  sbuild::keyfile::get_locale_string (const group_name_type& group,
                                      const key_type&        key,
                                      const std::string&     locale,
                                      value_type&            value) const
  {
    std::string lkey = key + '[' + locale + ']';
    return get_value(group, lkey, value);
  }

  bool
  sbuild::keyfile::get_locale_string (const group_name_type& group,
                                      const key_type&        key,
                                      const std::string&     locale,
                                      priority               priority,
                                      value_type&            value) const
  {
    bool status = get_locale_string(group, key, locale, value);
    check_priority(group, key, priority, status);
    return status;
  }

  void
  sbuild::keyfile::remove_group (const group_name_type& group)
  {
    group_map_type::iterator pos = this->groups.find(group);
    if (pos != this->groups.end())
      this->groups.erase(pos);
  }

  void
  sbuild::keyfile::remove_key (const group_name_type& group,
                               const key_type&        key)
  {
    group_type *found_group = find_group(group);
    if (found_group)
      {
        item_map_type& items = std::get<1>(*found_group);
        item_map_type::iterator pos = items.find(key);
        if (pos != items.end())
          items.erase(pos);
      }
  }

  sbuild::keyfile&
  sbuild::keyfile::operator += (const keyfile& rhs)
  {
    for (const auto& gp : rhs.groups)
      {
        const group_type& group = gp.second;
        const group_name_type& groupname = std::get<0>(group);
        const comment_type& comment = std::get<2>(group);
        const size_type& line = std::get<3>(group);
        set_group(groupname, comment, line);

        const item_map_type& items(std::get<1>(group));
        for (const auto& it : items)
          {
            const item_type& item = it.second;
            const key_type& key(std::get<0>(item));
            const internal_value_type& value(std::get<1>(item));
            const comment_type& comment(std::get<2>(item));
            const size_type& line(std::get<3>(item));
            set_value(groupname, key, value, comment, line);
          }
      }
    return *this;
  }

  sbuild::keyfile
  operator + (const sbuild::keyfile& lhs,
              const sbuild::keyfile& rhs)
  {
    sbuild::keyfile ret(lhs);
    ret += rhs;
    return ret;
  }

  const sbuild::keyfile::group_type *
  sbuild::keyfile::find_group (const group_name_type& group) const
  {
    group_map_type::const_iterator pos = this->groups.find(group);
    if (pos != this->groups.end())
      return &pos->second;

    return 0;
  }

  sbuild::keyfile::group_type *
  sbuild::keyfile::find_group (const group_name_type& group)
  {
    group_map_type::iterator pos = this->groups.find(group);
    if (pos != this->groups.end())
      return &pos->second;

    return 0;
  }

  const sbuild::keyfile::item_type *
  sbuild::keyfile::find_item (const group_name_type& group,
                              const key_type&        key) const
  {
    const group_type *found_group = find_group(group);
    if (found_group)
      {
        const item_map_type& items = std::get<1>(*found_group);
        item_map_type::const_iterator pos = items.find(key);
        if (pos != items.end())
          return &pos->second;
      }

    return 0;
  }

  sbuild::keyfile::item_type *
  sbuild::keyfile::find_item (const group_name_type& group,
                              const key_type&        key)
  {
    group_type *found_group = find_group(group);
    if (found_group)
      {
        item_map_type& items = std::get<1>(*found_group);
        item_map_type::iterator pos = items.find(key);
        if (pos != items.end())
          return &pos->second;
      }

    return 0;
  }

  void
  sbuild::keyfile::check_priority (const group_name_type& group,
                                   const key_type&        key,
                                   priority               priority,
                                   bool                   valid) const
  {
    if (valid == false)
      {
        size_type gline = get_line(group);

        switch (priority)
          {
          case PRIORITY_REQUIRED:
            {
              if (gline)
                throw error(gline, group, MISSING_KEY, key);
              else
                throw error(group, MISSING_KEY_NL, key);
            }
            break;
          default:
            break;
          }
      }
    else
      {
        size_type line = get_line(group, key);

        switch (priority)
          {
          case PRIORITY_DEPRECATED:
            {
              if (line)
                {
                  error e(line, group, DEPRECATED_KEY, key);
                  e.set_reason(_("This option will be removed in the future; please update your configuration"));
                  log_exception_warning(e);
                }
              else
                {
                  error e(group, DEPRECATED_KEY_NL, key);
                  e.set_reason(_("This option will be removed in the future; please update your configuration"));
                  log_exception_warning(e);
                }
            }
            break;
          case PRIORITY_OBSOLETE:
            {
              if (line)
                {
                  error e(line, group, OBSOLETE_KEY, key);
                  e.set_reason(_("This option has been removed, and no longer has any effect"));
                  log_exception_warning(e);
                }
              else
                {
                  error e(group, OBSOLETE_KEY_NL, key);
                  e.set_reason(_("This option has been removed, and no longer has any effect"));
                  log_exception_warning(e);
                }
            }
            break;
          case PRIORITY_DISALLOWED:
            {
              if (line)
                throw error(line, group, DISALLOWED_KEY, key);
              else
                throw error(group, DISALLOWED_KEY_NL, key);
            }
            break;
          default:
            break;
          }
      }
  }

}
