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

#include <sbuild/chroot/facet/storage.h>

namespace sbuild
{
  namespace chroot
  {
    namespace facet
    {

      storage::storage ()
      {
      }

      storage::~storage ()
      {
      }

      void
      storage::setup_lock(chroot::setup_type type,
                          bool               lock,
                          int                status)
      {
      }

    }
  }
}
