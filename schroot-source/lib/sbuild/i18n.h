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

/**
 * @file i18n.h Internationalisation functions.  This header
 * defines the functions used to mark up and translate strings.
 */

#ifndef SBUILD_I18N_H
#define SBUILD_I18N_H

#include <sbuild/config.h>

#include <string>

#include <libintl.h>

// Undefine macros which would interfere with our functions.
#ifdef gettext
#undef gettext
#endif
#ifdef _
#undef _
#endif
#ifdef gettext_noop
#undef gettext_noop
#endif
#ifdef N_
#undef N_
#endif

namespace sbuild
{
  /**
   * Get a translated message.
   *
   * @param message the message to translate.
   * @returns the translated message.
   */
  inline const char *
  gettext (const char *message)
  {
    return dgettext (SBUILD_MESSAGE_CATALOGUE, message);
  }

  /**
   * Get a translated message.
   *
   * @param message the message to translate.
   * @returns the translated message.
   */
  inline const char *
  gettext (const std::string& message)
  {
    return gettext(message.c_str());
  }

  /**
   * Get a translated message.  This function is a shorthand for
   * gettext, which also marks up the string for translation.
   *
   * @param message the message to translate.
   * @returns the translated message.
   */
  inline const char *
  _ (const char *message)
  {
    return gettext (message);
  }

  /**
   * Get a message with no translation.
   *
   * @param message the message to not translate.
   * @returns the message.
   */
  inline const char *
  gettext_noop (const char *message)
  {
    return message;
  }

  /**
   * Get a message with no translation.  This macro is a shorthand for
   * gettext_noop, which also marks up the string for translation.
   *
   * @param message the message to not translate.
   * @returns the message.
   */
  inline const char *
  N_ (const char *message)
  {
    return gettext_noop (message);
  }

}

#endif /* SBUILD_I18N_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
