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

#ifndef SBUILD_KEYFILE_WRITER_H
#define SBUILD_KEYFILE_WRITER_H

#include <ostream>

#include <sbuild/keyfile.h>

namespace sbuild
{

  /**
   * Keyfile writer.
   */
  class keyfile_writer
  {
  public:
    /// Exception type.
    typedef keyfile::error error;

    /**
     * The constructor.
     *
     * @param store the keyfile to operate with.
     */
    keyfile_writer(const keyfile& store);

    /**
     * The constructor.
     *
     * @param store the keyfile to operate with.
     * @param file the file to load the configuration from.
     */
    keyfile_writer (const keyfile&     store,
                    const std::string& file);

    /**
     * The constructor.
     *
     * @param store the keyfile to operate with.
     * @param stream the stream to load the configuration from.
     */
    keyfile_writer (const keyfile& store,
                    std::ostream&  stream);

    /// The destructor.
    virtual ~keyfile_writer();

    /**
     * Write keyfile to a stream.  The keyfile specified during
     * construction will be used as the source of data.
     *
     * @param stream the stream to write to.
     */
    virtual void
    write_stream(std::ostream& stream) const;

  protected:
    /// The keyfile to operate with.
    const keyfile& store;

    /**
     * Print a comment to a stream.  The comment will have hash ('#')
     * marks printed at the start of each line.
     *
     * @param comment the comment to print.
     * @param stream the stream to output to.
     *
     * @todo Use split string or some general iterator/algorithm
     * instead of custom string manipulation.  This could be reused by
     * log_exception_* functions and split_string.
     */
    static void
    print_comment (const keyfile::comment_type& comment,
                   std::ostream&                stream);

    /**
     * keyfile output to an ostream.
     *
     * @param stream the stream to output to.
     * @param kf the keyfile to output.
     * @returns the stream.
     */
    friend
    std::ostream&
    operator << (std::ostream& stream,
                 const keyfile_writer& kp)
    {
      kp.write_stream(stream);
      return stream;
    }
  };

}

#endif /* SBUILD_KEYFILE_WRITER_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
