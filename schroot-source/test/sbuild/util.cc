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

#include <sbuild/util.h>

#include <cstdlib>

#include <cppunit/extensions/HelperMacros.h>

using namespace CppUnit;

class test_util : public TestCase
{
  CPPUNIT_TEST_SUITE(test_util);
  CPPUNIT_TEST(test_basename);
  CPPUNIT_TEST(test_dirname);
  CPPUNIT_TEST(test_string_list_to_string);
  CPPUNIT_TEST(test_split_string);
  CPPUNIT_TEST(test_find_program_in_path);
  CPPUNIT_TEST_SUITE_END();

public:
  test_util()
  {}

  void test_basename()
  {
    CPPUNIT_ASSERT(sbuild::basename("/usr/bin/perl") == "perl");
    CPPUNIT_ASSERT(sbuild::basename("/usr/lib") == "lib");
    CPPUNIT_ASSERT(sbuild::basename("/usr/") == "usr");
    CPPUNIT_ASSERT(sbuild::basename("usr") == "usr");
    CPPUNIT_ASSERT(sbuild::basename("/") == "/");
    CPPUNIT_ASSERT(sbuild::basename(".") == ".");
    CPPUNIT_ASSERT(sbuild::basename("..") == "..");
  }

  void test_dirname()
  {
    CPPUNIT_ASSERT(sbuild::dirname("/usr/bin/perl") == "/usr/bin");
    CPPUNIT_ASSERT(sbuild::dirname("/usr/lib") == "/usr");
    CPPUNIT_ASSERT(sbuild::dirname("/usr/") == "/");
    CPPUNIT_ASSERT(sbuild::dirname("usr") == ".");
    CPPUNIT_ASSERT(sbuild::dirname("/") == "/");
    CPPUNIT_ASSERT(sbuild::dirname(".") == ".");
    CPPUNIT_ASSERT(sbuild::dirname("..") == ".");
  }

  void test_string_list_to_string()
  {
    sbuild::string_list items;
    items.push_back("foo");
    items.push_back("bar");
    items.push_back("baz");

    CPPUNIT_ASSERT(sbuild::string_list_to_string(items, "--") ==
                   "foo--bar--baz");
  }

  void test_split_string()
  {
    sbuild::string_list items =
      sbuild::split_string("/usr/share/info", "/");

    CPPUNIT_ASSERT(items.size() == 3 &&
                   items[0] == "usr" &&
                   items[1] == "share" &&
                   items[2] == "info");
  }

  void test_find_program_in_path()
  {
    std::string path("/usr/local/bin:/usr/bin:/bin");
    CPPUNIT_ASSERT(sbuild::find_program_in_path("sh", path, "") == "/bin/sh");
    CPPUNIT_ASSERT(sbuild::find_program_in_path("sed", path, "") == "/bin/sed");
  }

};

CPPUNIT_TEST_SUITE_REGISTRATION(test_util);
