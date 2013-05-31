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

#ifndef SBUILD_KEYFILE_READER_H
#define SBUILD_KEYFILE_READER_H

#include <istream>

#include <sbuild/keyfile.h>

namespace sbuild
{

  /**
   * Keyfile reader.
   */
  class keyfile_reader
  {
  public:
    /// Exception type.
    typedef keyfile::error error;

    /**
     * The constructor.
     *
     * @param store the keyfile to operate with.
     */
    keyfile_reader(keyfile& store);

    /**
     * The constructor.
     *
     * @param store the keyfile to operate with.
     * @param file the file to load the configuration from.
     */
    keyfile_reader (keyfile&           store,
                    const std::string& file);

    /**
     * The constructor.
     *
     * @param store the keyfile to operate with.
     * @param stream the stream to load the configuration from.
     */
    keyfile_reader (keyfile&       store,
                    std::istream&  stream);

    /// The destructor.
    virtual ~keyfile_reader();

    /**
     * Parse keyfile from a stream.  The keyfile specified during
     * construction will be used to store the parsed data.
     *
     * @param stream the stream to read from.
     */
    virtual void
    read_stream(std::istream& stream);

  protected:
    /**
     * Start processing input.
     * Any setup may be done here.
     */
    virtual void
    begin();

    /**
     * Parse a line of input.  This function will be called for every
     * line of input in the source file.  The input line, line, is
     * parsed appropriately.  Any of the group, key, value, and
     * comment members are set as required.  If any of these members
     * are ready for insertion into the keyfile, then the
     * corresponding _set member must be set to true to signal the
     * fact to the caller.
     * @param line the line to parse.
     */
    virtual void
    parse_line (const std::string& line);

    /**
     * Stop processing input.  Any cleanup may be done here.  For
     * example, any cached group or item may be set here.
     */
    virtual void
    end();

    /// The keyfile to operate with.
    keyfile& store;

    /// Group name.
    keyfile::group_name_type group;

    /// Group name is set.
    bool group_set;

    /// Key name.
    keyfile::key_type key;

    /// Key name is set.
    bool key_set;

    /// Value.
    keyfile::value_type value;

    /// Value is set.
    bool value_set;

    /// Comment.
    keyfile::comment_type comment;

    /// Comment is set.
    bool         comment_set;

    /// Line number.
    keyfile::size_type line_number;

    /**
     * keyfile initialisation from an istream.
     *
     * @param stream the stream to input from.
     * @param kf the keyfile to set.
     * @returns the stream.
     */
    friend
    std::istream&
    operator >> (std::istream&   stream,
                 keyfile_reader& kp)
    {
      kp.read_stream(stream);
      return stream;
    }
  };


}

#endif /* SBUILD_KEYFILE_READER_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
