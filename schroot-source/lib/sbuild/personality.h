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

#ifndef SBUILD_PERSONALITY_H
#define SBUILD_PERSONALITY_H

#include <sbuild/custom-error.h>

#include <map>
#include <ostream>
#include <string>

namespace sbuild
{

  /**
   * Chroot personality.  A chroot may have a personality (also knows
   * as a process execution domain) which is used to run non-native
   * binaries.  For example, running 32-bit Linux binaries on a 64-bit
   * Linux system, or an SVR4 binary on a 32-bit Linux system.  This
   * is currently a Linux only feature; it does nothing on non-Linux
   * systems.  This is a wrapper around the personality(2) system
   * call.
   */
  class personality
  {
  public:
    /// Personality type.
    typedef unsigned long type;

    /// Error codes.
    enum error_code
      {
        BAD, ///< Personality is unknown.
        SET  ///< Could not set personality.
      };

    /// Exception type.
    typedef custom_error<error_code> error;

    /**
     * The constructor.  On Linux systems, this is initialised with
     * the current process' personality.  On non-Linux systems, it is
     * initialised as "undefined".
     */
    personality ();

    /**
     * The constructor.
     *
     * @param persona the persona to set.
     */
    personality (const std::string& persona);

    ///* The destructor.
    ~personality ();

    /**
     * Get the name of the personality.
     *
     * @returns the personality name.
     */
    const std::string& get_name () const;

    /**
     * Set the name of the personality.
     *
     * @param persona the persona to set.
     * @returns the personality name.
     */
    void set_name (const std::string& persona);

    /**
     * Get the personality.
     *
     * @returns the personality.
     */
    type
    get () const;

    /**
     * Set the process personality.  This sets the personality (if valid) using
     * the personality(2) system call.  If setting the personality
     * fails, an error is thown.
     */
    void
    set () const;

    /**
     * Print a list of the available personalities.
     *
     * @returns a string of the available personalities.
     */
    static std::string
    get_personalities ();

    /**
     * Get the personality name from a stream.
     *
     * @param stream the stream to get input from.
     * @param rhs the personality to set.
     * @returns the stream.
     */
    template <class charT, class traits>
    friend
    std::basic_istream<charT,traits>&
    operator >> (std::basic_istream<charT,traits>& stream,
                 personality&                      rhs)
    {
      std::string personality_name;

      if (std::getline(stream, personality_name))
        {
          rhs.set_name(personality_name);
        }

      return stream;
    }

    /**
     * Print the personality name to a stream.
     *
     * @param stream the stream to output to.
     * @param rhs the personality to output.
     * @returns the stream.
     */
    template <class charT, class traits>
    friend
    std::basic_ostream<charT,traits>&
    operator << (std::basic_ostream<charT,traits>& stream,
                 const personality&                rhs)
    {
      return stream << find_personality(rhs.persona);
    }

  private:
    /**
     * Find a personality by name.
     *
     * @param persona the personality to find.
     * @returns the personality type; this is -1 if the personality
     * was undefined, or -2 if the personality was unknown (not
     * found).
     */
    static type
    find_personality (const std::string& persona);

    /**
     * Find a personality by number.
     *
     * @param persona the personality to find.
     * @returns the personality name, "undefined" if the personality was
     * not defined, or "unknown" if the personality was not found.
     */
    static std::string const&
    find_personality (type persona);

    /// The name of the current personality.
    std::string persona_name;

    /// The personality type.
    type persona;

    /// Mapping between personality name and type.
    static std::map<std::string,type> personalities;
  };

}

#endif /* SBUILD_PERSONALITY_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
