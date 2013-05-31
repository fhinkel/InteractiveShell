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

#ifndef BIN_COMMON_MAIN_H
#define BIN_COMMON_MAIN_H

#include <bin-common/options.h>

#include <string>

/**
 * schroot generic program components.
 *
 * Common infrastructure used by all programs.  This includes options
 * parsing and common options, top-level error handling and a generic
 * method for program instantiation.
 */
namespace bin_common
{

  /**
   * Frontend base for schroot programs.  This class is used to "run"
   * schroot programs.  It contains functionality common to all
   * programs, such as help and version output.
   */
  class main
  {
  public:
    /**
     * The constructor.
     *
     * @param program_name the program name.
     * @param program_usage the program usage message.
     * @param program_options the command-line options to use.
     * @param use_syslog whether to open a connection to the system
     * logger.
     */
    main (const std::string&  program_name,
          const std::string&  program_usage,
          const options::ptr& program_options,
          bool                use_syslog);

    /// The destructor.
    virtual ~main ();

    /**
     * Run the program.
     *
     * @param argc the number of arguments
     * @param argv argument vector
     * @returns 0 on success, 1 on failure or the exit status of the
     * chroot command.
     */
    int
    run (int   argc,
         char *argv[]);

    /**
     * Print help information.
     *
     * @param stream the stream to output to.
     */
    virtual void
    action_help (std::ostream& stream);

    /**
     * Print version information.
     *
     * @param stream the stream to output to.
     */
    virtual void
    action_version (std::ostream& stream);

  protected:
    /**
     * Run the program.  This is the program-specific run method which
     * must be implemented in a derived class.
     *
     * @returns 0 on success, 1 on failure or the exit status of the
     * chroot command.
     */
    virtual int
    run_impl () = 0;

    /// The name of the program.
    std::string  program_name;
    /// The usage text of the program.
    std::string  program_usage;
    /// The program options.
    options::ptr program_options;
    /// Use syslog for message logging>
    bool         use_syslog;
  };

}

#endif /* BIN_COMMON_MAIN_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
