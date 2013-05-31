/* Copyright © 2003-2013  Roger Leigh <rleigh@debian.org>
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

#ifndef SBUILD_MNTSTREAM_H
#define SBUILD_MNTSTREAM_H

#include <sbuild/custom-error.h>

#include <iostream>
#include <deque>
#include <string>

#include <stdio.h>
#include <sys/types.h>
#include <mntent.h>

namespace sbuild
{

  /**
   * Access mounts.  This is a wrapper around the setmntent(3),
   * getmntent(3) and endmntent(3) functions, which are used to read a
   * stream of "mntents" through multiple getmntent() calls.
   *
   * mntstream calls setmntent() and endmntent() automatically, and
   * represents each mntent as a mntstream::mntentry.  Like reading
   * from and istream by pulling data out with the >> "extraction
   * operator", mntentries are also extracted from the mntstream with
   * the >> operator.
   */
  class mntstream
  {
  public:
    /// Error codes.
    enum error_code
      {
        MNT_OPEN, ///< Failed to open mount file.
        MNT_READ  ///< Failed to read mount file.
      };

    /// Exception type.
    typedef sbuild::custom_error<error_code> error;

    /**
     * An entry in a mntstream.  It is a wrapper around the mntent
     * structure declared in mntent.h.  Unlike a mntent pointer returned
     * by getmntent(3), a mntentry does not become invalid when the
     * mntstream it was extracted from is destroyed.
     */
    struct mntentry
    {
      /// The constructor.
      mntentry ()
      {};

      /**
       * The contructor.
       *
       * @param entry the mntent structure to wrap.
       */
      mntentry (const struct mntent&  entry);

      /// Name of mounted filesystem.
      std::string  filesystem_name;
      /// File system path prefix.
      std::string  directory;
      /// Mount type.
      std::string  type;
      /// Mount options.
      std::string  options;
      /// Dump frequency (days).
      int          dump_frequency;
      /// Parallel fsck pass number.
      int          fsck_pass;
    };

    /**
     * The constructor.
     *
     * @param file the file to read.
     */
    mntstream(const std::string& file);

    /// The destructor.
    virtual ~mntstream();

    /**
     * Open a mount file for reading.  This uses the openmnt(3) call
     * to open the underlying FILE stream.  Any previously open
     * mount file is closed before opening the new one.  The
     * mntstream error state is set if the open fails, and an
     * exception will be thrown.
     *
     * @param file the file to read.
     * @see close()
     */
    void open(const std::string& file);

    /**
     * Close the mount file.  This uses the closemnt(3) call to
     * close the underlying FILE stream.  All cached data is deleted
     * and the error state set until open() is called.
     *
     * @see open()
     */
    void close();

    /**
     * Check for End Of File.  Note that the end of file status is
     * only set adter a read fails, so this should be checked after
     * each read.
     *
     * @returns true if the mntstream is empty, otherwise false.
     */
    bool eof() const;

    /**
     * Check for errors.  If there is an error, the mntstream is
     * unusable until the next open() call.
     *
     * @returns true if the mntstream is in an error state, otherwise
     * false.
     */
    bool bad() const;

    /**
     * Check if the mntstream status is good.
     *
     * @returns true if the status is good (eof() and bad() both
     * return false).
     */
    operator bool ();

    /**
     * Check if the mntstream status is bad.
     *
     * @returns true if the status is bad (eof() or bad() return
     * true).
     */
    bool
    operator ! ();

    friend mntstream&
    operator >> (mntstream& stream,
                 mntentry&  entry);

  private:
    /**
     * Read mntents from the underlying FILE stream into the data
     * deque.  If the read fails, the error state will be set, and
     * an exception will be thrown.
     *
     * @param quantity the number of mntents to read.
     *
     * @todo Add mntentry constructor to do automatic struct mntent
     * to mntentry conversion.
     */
    void read (int quantity=1);

    /// The file name.
    std::string file;

    /// The underlying FILE stream.
    FILE *mntfile;

    /**
     * A list of mntentries represents the mount file stream as a
     * LIFO stack.
     */
    std::deque<mntentry> data;

    /// Error status.
    bool error_status;

    /// End of File status.
    bool eof_status;
  };

  /**
   * The overloaded extraction operator.  This is used to pull
   * mntentries from a mntstream.
   *
   * @param stream the mntstream to get input from.
   * @param entry the mntentry to set.
   * @returns the mntstream.
   */
  mntstream&
  operator >> (mntstream&            stream,
               mntstream::mntentry&  entry);

}

#endif /* SBUILD_MNTSTREAM_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
