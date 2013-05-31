/* Copyright © 2011-2013  Roger Leigh <rleigh@debian.org>
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

#ifndef SBUILD_FDSTREAM_H
#define SBUILD_FDSTREAM_H

#include <boost/iostreams/device/file_descriptor.hpp>
#include <boost/iostreams/stream.hpp>

namespace sbuild
{

  // Stream type.
  typedef boost::iostreams::stream<boost::iostreams::file_descriptor> fdstream;

  // Stream type.
  typedef boost::iostreams::stream<boost::iostreams::file_descriptor_source> fdistream;

  // Stream type.
  typedef boost::iostreams::stream<boost::iostreams::file_descriptor_sink> fdostream;

}

#endif /* SBUILD_FDSTREAM_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
