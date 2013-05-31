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

#ifndef SBUILD_NOSTREAM_H
#define SBUILD_NOSTREAM_H

#include <streambuf>
#include <ostream>

namespace sbuild
{

  /**
   * Null stream buffer.  This stream buffer acts as a bit-bucket,
   * discarding all input.
   */
  template <class cT, class traits = std::char_traits<cT> >
  class basic_nbuf: public std::basic_streambuf<cT, traits>
  {
    /**
     * Output buffer.  EOF is never returned.
     *
     * @param c the character to output.
     * @returns traits::not_eof is always returned, never traits::eof.
     */
    typename traits::int_type
    overflow (typename traits::int_type c)
    {
      return traits::not_eof(c); // indicate success
    }
  };

  /**
   * Null output stream.  This ostream discards all input, because it
   * uses a basic_nbuf stream buffer.
   */
  template <class cT, class traits = std::char_traits<cT> >
  class basic_nostream: public std::basic_ostream<cT, traits>
  {
  public:
    /// The constructor.
    basic_nostream ():
      std::basic_ios<cT, traits>(&nbuf),
      std::basic_ostream<cT, traits>(&nbuf)
    {
      this->init(&nbuf);
    }

  private:
    /// The stream buffer.
    basic_nbuf<cT, traits> nbuf;
  };

  /// A null ostream.
  typedef basic_nostream<char> nostream;
  /// A wide null ostream.
  typedef basic_nostream<wchar_t> wnostream;

  /// A null ostream.
  extern nostream cnull;

}

#endif /* SBUILD_NOSTREAM_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
