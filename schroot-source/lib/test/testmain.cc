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

#include <config.h>

#include <sbuild/log.h>

#include <cstdlib>

#include <cppunit/ui/text/TestRunner.h>
#include <cppunit/extensions/TestFactoryRegistry.h>

using namespace CppUnit;

int
main()
{
#ifdef SBUILD_DEBUG
  sbuild::debug_log_level = sbuild::DEBUG_NOTICE;
#else
  sbuild::debug_log_level = sbuild::DEBUG_NONE;
#endif

  TextUi::TestRunner runner;

  TestFactoryRegistry &registry = CppUnit::TestFactoryRegistry::getRegistry();
  runner.addTest(registry.makeTest());

  bool ok = runner.run();

  return (ok) ? EXIT_SUCCESS : EXIT_FAILURE;
}
