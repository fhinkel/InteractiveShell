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

#include <sbuild/parse-value.h>

#include <cppunit/extensions/HelperMacros.h>

using namespace CppUnit;

class test_parse_value : public TestCase
{
  CPPUNIT_TEST_SUITE(test_parse_value);
  CPPUNIT_TEST(test_bool);
  CPPUNIT_TEST(test_bool_fail);
  CPPUNIT_TEST(test_int);
  CPPUNIT_TEST(test_int_fail);
  CPPUNIT_TEST(test_string);
  CPPUNIT_TEST_SUITE_END();

public:
  test_parse_value()
  {}

  void test_bool()
  {
    bool result;

    result = false;
    sbuild::parse_value("true", result);
    CPPUNIT_ASSERT(result == true);
    result = false;
    sbuild::parse_value("yes", result);
    CPPUNIT_ASSERT(result == true);
    result = false;
    sbuild::parse_value("1", result);
    CPPUNIT_ASSERT(result == true);

    result = true;
    sbuild::parse_value("false", result);
    CPPUNIT_ASSERT(result == false);
    result = true;
    sbuild::parse_value("no", result);
    CPPUNIT_ASSERT(result == false);
    result = true;
    sbuild::parse_value("0", result);
    CPPUNIT_ASSERT(result == false);
  }

  void test_bool_fail()
  {
    bool result = true;

    try
      {
        sbuild::parse_value("invalid", result);
      }
    catch (const sbuild::parse_value_error& e)
      {
        // Exception thown, and original value unmodified.
        CPPUNIT_ASSERT(result == true);
        return;
      }
    // Should never be reached
    CPPUNIT_ASSERT(false);
  }

  void test_int()
  {
    int result = 0;
    sbuild::parse_value("23", result);
    CPPUNIT_ASSERT(result == 23);
  }

  void test_int_fail()
  {
    int result = 22;

    try
      {
        sbuild::parse_value("invalid", result);
      }
    catch (const sbuild::parse_value_error& e)
      {
        // Exception thown, and original value unmodified.
        CPPUNIT_ASSERT(result == 22);
        return;
      }
    // Should never be reached
    CPPUNIT_ASSERT(false);
  }

  void test_string()
  {
    std::string result;

    sbuild::parse_value("test string", result);
    CPPUNIT_ASSERT(result == "test string");
  }
};

CPPUNIT_TEST_SUITE_REGISTRATION(test_parse_value);
