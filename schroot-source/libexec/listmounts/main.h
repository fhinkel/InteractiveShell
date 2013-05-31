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

#ifndef LIBEXEC_LISTMOUNTS_MAIN_H
#define LIBEXEC_LISTMOUNTS_MAIN_H

#include <bin-common/main.h>

#include <libexec/listmounts/options.h>

#include <sbuild/custom-error.h>

/**
 * schroot-listmounts program components
 */
namespace schroot_listmounts
{

  /**
   * Frontend for schroot.  This class is used to "run" schroot.
   */
  class main : public bin_common::main
  {
  public:
    /// Error codes.
    enum error_code
      {
        FIND ///< Failed to find file.
      };

    /// Exception type.
    typedef sbuild::custom_error<error_code> error;

    /**
     * The constructor.
     *
     * @param options the command-line options to use.
     */
    main (options::ptr& options);

    /// The destructor.
    virtual ~main ();

  private:
    /**
     * List mounts.
     */
    virtual void
    action_listmounts ();

  protected:
    /**
     * Run the program.
     *
     * @returns 0 on success, 1 on failure or the exit status of the
     * chroot command.
     */
    virtual int
    run_impl ();

  private:
    /// The program options.
    options::ptr opts;
  };

}

#endif /* LIBEXEC_LISTMOUNTS_MAIN_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
