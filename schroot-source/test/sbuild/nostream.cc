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

#include <sbuild/nostream.h>

#include <cstdlib>

#include <cppunit/extensions/HelperMacros.h>

using namespace CppUnit;

class test_nostream : public TestCase
{
  CPPUNIT_TEST_SUITE(test_nostream);
  CPPUNIT_TEST(test_stream);
  CPPUNIT_TEST_SUITE_END();

public:
  test_nostream()
  {}

  void test_stream()
  {
    sbuild::cnull << "Discard";
  }
};

CPPUNIT_TEST_SUITE_REGISTRATION(test_nostream);
