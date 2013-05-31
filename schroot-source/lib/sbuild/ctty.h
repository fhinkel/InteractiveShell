/* Copyright © 2006-2013  Roger Leigh <rleigh@debian.org>
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

#ifndef SBUILD_CTTY_H
#define SBUILD_CTTY_H

#include <sbuild/fdstream.h>
#include <sbuild/parse-error.h>

namespace sbuild
{

  /// Error codes.
  enum ctty_error_code
    {
      /// The controlling terminal close-on-execute flag could not be
      /// set.
      CTTY_CLOEXEC,
      /// The controlling terminal file descriptor could not be
      /// duplicated.
      CTTY_DUP
    };

  /// Exception type.
  typedef parse_error<ctty_error_code> ctty_error;

  /**
   * CTTY fd.  The fd number of the Controlling TTY, or -1 if not
   * available.
   */
  extern const int CTTY_FILENO;

  /**
   * CTTY stream.  A stream to the Controlling TTY, or standard input
   * if not available.
   */
  extern fdstream cctty;

}

#endif /* SBUILD_CTTY_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
