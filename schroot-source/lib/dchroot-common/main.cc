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

#include <dchroot-common/main.h>

#include <cstdlib>
#include <iostream>
#include <locale>

#include <sys/types.h>
#include <sys/stat.h>
#include <termios.h>
#include <unistd.h>

#include <boost/format.hpp>

#include <syslog.h>

using std::endl;
using boost::format;
using sbuild::_;

namespace dchroot_common
{

  main::main (const std::string&            program_name,
              const std::string&            program_usage,
              schroot_common::options::ptr& options):
    schroot_common::main(program_name, program_usage, options, true)
  {
  }

  main::~main ()
  {
  }

  void
  main::action_list ()
  {
    this->config->print_chroot_list_simple(std::cout);
  }

}
