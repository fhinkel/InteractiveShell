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

#include <sbuild/personality.h>

#include <iostream>
#include <sstream>

#include <cppunit/extensions/HelperMacros.h>

using namespace CppUnit;

class test_personality : public TestCase
{
  CPPUNIT_TEST_SUITE(test_personality);
  CPPUNIT_TEST(test_construction);
  CPPUNIT_TEST_EXCEPTION(test_construction_fail, sbuild::personality::error);
  CPPUNIT_TEST(test_output);
  CPPUNIT_TEST(test_input);
  CPPUNIT_TEST_EXCEPTION(test_input_fail, sbuild::personality::error);
  CPPUNIT_TEST(test_set);
  CPPUNIT_TEST_EXCEPTION(test_set_fail, sbuild::personality::error);
  CPPUNIT_TEST_SUITE_END();

public:
  test_personality()
  {}

  virtual ~test_personality()
  {}

  void
  test_construction()
  {
    sbuild::personality p1;
    CPPUNIT_ASSERT(p1.get_name() == "undefined");

#if defined(SBUILD_FEATURE_PERSONALITY) && defined (__linux__)
    sbuild::personality p4("linux");
    CPPUNIT_ASSERT(p4.get_name() == "linux");
#endif
  }

  void
  test_construction_fail()
  {
    sbuild::personality p3("invalid_personality");
  }

  void
  test_output()
  {
#if defined(SBUILD_FEATURE_PERSONALITY) && defined (__linux__)
    sbuild::personality p4("linux");
#else
    sbuild::personality p4;
#endif

    std::ostringstream ps4;
    ps4 << p4;

#if defined(SBUILD_FEATURE_PERSONALITY) && defined (__linux__)
    CPPUNIT_ASSERT(ps4.str() == "linux");
#else
    CPPUNIT_ASSERT(ps4.str() == "undefined");
#endif
  }

  void
  test_input()
  {
    sbuild::personality p2;
    std::istringstream ps2("undefined");
    ps2 >> p2;
    CPPUNIT_ASSERT(p2.get_name() == "undefined");

    sbuild::personality p4;
#if defined(SBUILD_FEATURE_PERSONALITY) && defined (__linux__)
    std::istringstream ps4("linux");
#else
    std::istringstream ps4("undefined");
#endif
    ps4 >> p4;
#if defined(SBUILD_FEATURE_PERSONALITY) && defined (__linux__)
    CPPUNIT_ASSERT(p4.get_name() == "linux");
#else
    CPPUNIT_ASSERT(p4.get_name() == "undefined");
#endif
  }

  void
  test_input_fail()
  {
    sbuild::personality p3;
    std::istringstream ps3("invalid_personality");
    ps3 >> p3;
  }

  void
  test_set()
  {
    sbuild::personality p2;
    p2.set_name("undefined");
    CPPUNIT_ASSERT(p2.get_name() == "undefined");

    sbuild::personality p4;
#if defined(SBUILD_FEATURE_PERSONALITY) && defined (__linux__)
    p4.set_name("linux");
    CPPUNIT_ASSERT(p4.get_name() == "linux");
#else
    p4.set_name("undefined");
    CPPUNIT_ASSERT(p4.get_name() == "undefined");
#endif
  }

  void
  test_set_fail()
  {
    sbuild::personality p3;
    p3.set_name("invalid_personality");
  }

};

CPPUNIT_TEST_SUITE_REGISTRATION(test_personality);
