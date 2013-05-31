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

#include <dchroot-dsa/main.h>
#include <dchroot-dsa/session.h>

#include <cstdlib>
#include <iostream>
#include <locale>

#include <sys/types.h>
#include <sys/stat.h>
#include <termios.h>
#include <unistd.h>

#include <boost/format.hpp>

using std::endl;
using sbuild::_;
using boost::format;

namespace dchroot_dsa
{

  main::main (schroot_common::options::ptr& options):
    dchroot_common::main("dchroot-dsa",
                         // TRANSLATORS: '...' is an ellipsis e.g. U+2026, and '-'
                         // is an em-dash.
                         _("[OPTION…] chroot [COMMAND] — run command or shell in a chroot"),
                         options)
  {
  }

  main::~main ()
  {
  }

  void
  main::create_session(sbuild::session::operation sess_op)
  {
    sbuild::log_debug(sbuild::DEBUG_INFO)
      << "Creating dchroot-dsa session" << endl;

    this->session = sbuild::session::ptr
      (new dchroot_dsa::session("schroot",
                                sess_op,
                                this->chroot_objects));
  }

}
