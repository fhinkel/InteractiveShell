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

#include <sbuild/mntstream.h>
#include <sbuild/util.h>

#include <libexec/listmounts/main.h>

#include <cerrno>
#include <climits>
#include <cstdio>
#include <cstdlib>
#include <ctime>
#include <iostream>
#include <locale>

#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

#include <boost/format.hpp>

using std::endl;
using boost::format;
using sbuild::_;
using sbuild::N_;

namespace schroot_listmounts
{

  template<>
  sbuild::error<main::error_code>::map_type
  sbuild::error<main::error_code>::error_strings =
    {
      // TRANSLATORS: %1% = file
      {schroot_listmounts::main::FIND,  N_("Failed to find ‘%1%’")}
    };

  main::main (options::ptr& options):
    bin_common::main("schroot-listmounts",
                     // TRANSLATORS: '...' is an ellipsis e.g. U+2026,
                     // and '-' is an em-dash.
                     _("[OPTION…] — list mount points"),
                     options,
                     false),
    opts(options)
  {
  }

  main::~main ()
  {
  }

  void
  main::action_listmounts ()
  {
    std::string to_find = sbuild::normalname(this->opts->mountpoint);

    {
      // NOTE: This is a non-standard GNU extension.
      char *rpath = realpath(to_find.c_str(), NULL);
      if (rpath == 0)
        throw error(to_find, FIND, strerror(errno));

      to_find = rpath;
      free(rpath);
      rpath = 0;
    }

    // Check mounts.
    sbuild::mntstream mounts("/proc/mounts");
    sbuild::mntstream::mntentry entry;
    sbuild::string_list mountlist;

    while (mounts >> entry)
      {
        std::string mount_dir(entry.directory);
        if (to_find == "/" ||
            (mount_dir.find(to_find) == 0 &&
             (// Names are the same.
              mount_dir.size() == to_find.size() ||
              // Must have a following /, or not the same directory.
              (mount_dir.size() > to_find.size() &&
               mount_dir[to_find.size()] == '/'))))
          mountlist.push_back(mount_dir);
      }

    for (sbuild::string_list::const_reverse_iterator mount = mountlist.rbegin();
         mount != mountlist.rend();
         ++mount)
      std::cout << *mount << '\n';
    std::cout << std::flush;
  }

  int
  main::run_impl ()
  {
    if (this->opts->action == options::ACTION_HELP)
      action_help(std::cerr);
    else if (this->opts->action == options::ACTION_VERSION)
      action_version(std::cerr);
    else if (this->opts->action == options::ACTION_LISTMOUNTS)
      action_listmounts();
    else
      assert(0); // Invalid action.

    return EXIT_SUCCESS;
  }

}
