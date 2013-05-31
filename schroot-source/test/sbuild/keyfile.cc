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

#include <sbuild/keyfile.h>
#include <sbuild/keyfile-reader.h>
#include <sbuild/keyfile-writer.h>

#include <fstream>
#include <sstream>
#include <vector>

#include <cppunit/extensions/HelperMacros.h>

using namespace CppUnit;

class test_keyfile : public TestFixture
{
  CPPUNIT_TEST_SUITE(test_keyfile);
  CPPUNIT_TEST(test_construction_file);
  CPPUNIT_TEST(test_construction_stream);
  CPPUNIT_TEST_EXCEPTION(test_construction_fail, sbuild::keyfile::error);
  CPPUNIT_TEST(test_get_groups);
  CPPUNIT_TEST(test_get_keys);
  CPPUNIT_TEST(test_get_value);
  CPPUNIT_TEST(test_get_value_fail);
  CPPUNIT_TEST(test_get_list_value);
  CPPUNIT_TEST(test_get_list_value_fail);
  CPPUNIT_TEST(test_get_line);
  CPPUNIT_TEST(test_set_value);
  CPPUNIT_TEST(test_set_list_value);
  CPPUNIT_TEST(test_remove_group);
  CPPUNIT_TEST(test_remove_key);
  CPPUNIT_TEST(test_output);
  CPPUNIT_TEST_SUITE_END();

protected:
  sbuild::keyfile *kf;

public:
  test_keyfile():
    TestFixture(),
    kf()
  {}

  virtual ~test_keyfile()
  {}

  void setUp()
  {
    std::istringstream is("# Comment\n"
                          "[group1]\n"
                          "name=Fred Walker\n"
                          "age=32\n"
                          "# Test item comment\n"
                          "#\n"
                          "# spanning multiple lines\n"
                          "numbers=1,2,3,4,5,6\n"
                          "\n"
                          "[group2]\n"
                          "name=Mary King\n"
                          "age=43\n"
                          "photo=mary.jpeg\n");
    this->kf = new sbuild::keyfile;
    sbuild::keyfile_reader kp(*this->kf);
    is >> kp;
  }

  void tearDown()
  {
    delete this->kf;
  }

  void
  test_construction_file()
  {
    sbuild::keyfile k;
    sbuild::keyfile_reader(k, TESTDATADIR "/keyfile.ex1");
  }

  void
  test_construction_stream()
  {
    std::ifstream strm(TESTDATADIR "/keyfile.ex1");
    CPPUNIT_ASSERT(strm);
    sbuild::keyfile k;
    sbuild::keyfile_reader(k, strm);
  }

  void
  test_construction_fail()
  {
    sbuild::keyfile k;
    sbuild::keyfile_reader(k, TESTDATADIR "/nonexistent-keyfile-will-throw-exception");
  }

  void test_get_groups()
  {
    sbuild::string_list l = this->kf->get_groups();
    CPPUNIT_ASSERT(l.size() == 2);
    CPPUNIT_ASSERT(l[0] == "group1");
    CPPUNIT_ASSERT(l[1] == "group2");

    CPPUNIT_ASSERT(this->kf->has_group("group1") == true);
    CPPUNIT_ASSERT(this->kf->has_group("nonexistent") == false);
  }

  void test_get_keys()
  {
    sbuild::string_list l = this->kf->get_keys("group2");
    CPPUNIT_ASSERT(l.size() == 3);
    CPPUNIT_ASSERT(l[0] == "age");
    CPPUNIT_ASSERT(l[1] == "name");
    CPPUNIT_ASSERT(l[2] == "photo");

    CPPUNIT_ASSERT(this->kf->has_key("group2", "name") == true);
    CPPUNIT_ASSERT(this->kf->has_key("nonexistent", "name") == false);
    CPPUNIT_ASSERT(this->kf->has_key("group1", "nonexistent") == false);
  }

  void test_get_value()
  {
    std::string sval;
    int ival;

    CPPUNIT_ASSERT(this->kf->get_value("group2", "name", sval) == true);
    CPPUNIT_ASSERT(sval == "Mary King");
    CPPUNIT_ASSERT(this->kf->get_value("group2", "age", ival) == true);
    CPPUNIT_ASSERT(ival == 43);

    // Check failure does not alter value.
    ival = 11;
    CPPUNIT_ASSERT(this->kf->get_value("group2", "nonexistent", ival) == false);
    CPPUNIT_ASSERT(ival == 11);
  }

  void test_get_value_fail()
  {
    bool bval = false;

    // Expect a warning here.
    CPPUNIT_ASSERT(this->kf->get_value("group2", "age", bval) == false);
    CPPUNIT_ASSERT(bval == false);
  }

  void test_get_list_value()
  {
    std::vector<int> expected;
    expected.push_back(1);
    expected.push_back(2);
    expected.push_back(3);
    expected.push_back(4);
    expected.push_back(5);
    expected.push_back(6);

    std::vector<int> found;
    CPPUNIT_ASSERT(this->kf->get_list_value("group1", "numbers", found) == true);
    CPPUNIT_ASSERT(found == expected);
  }

  void test_get_list_value_fail()
  {
    std::vector<int> expected;
    expected.push_back(1);
    expected.push_back(2);
    expected.push_back(3);
    expected.push_back(4);
    expected.push_back(5);
    expected.push_back(6);

    std::vector<bool> found;

    // Expect a warning here.
    CPPUNIT_ASSERT(this->kf->get_list_value("group1", "numbers", found) == false);
    CPPUNIT_ASSERT(found.size() == 1); // 1 converts to bool.
  }

  // TODO: Test priority.
  // TODO: Test comments, when available.

  void test_get_line()
  {
    CPPUNIT_ASSERT(this->kf->get_line("group2") == 10);
    CPPUNIT_ASSERT(this->kf->get_line("group1", "age") == 4);
    CPPUNIT_ASSERT(this->kf->get_line("group2", "name") == 11);
  }

  void test_set_value()
  {
    this->kf->set_value("group1", "name", "Adam Smith");
    this->kf->set_value("group1", "age", 27);
    this->kf->set_value("group1", "interests", "Ice Hockey,GNU/Linux");
    this->kf->set_value("newgroup", "newitem", 89);

    std::string result;
    int number = 0;
    CPPUNIT_ASSERT(this->kf->get_value("group1", "name", result) == true);
    CPPUNIT_ASSERT(result == "Adam Smith");
    CPPUNIT_ASSERT(this->kf->get_value("group1", "age", number) == true);
    CPPUNIT_ASSERT(number == 27);
    CPPUNIT_ASSERT(this->kf->get_value("group1", "interests", result) == true);
    CPPUNIT_ASSERT(result == "Ice Hockey,GNU/Linux");
    CPPUNIT_ASSERT(this->kf->get_value("newgroup", "newitem", number) == true);
    CPPUNIT_ASSERT(number == 89);
  }

  void test_set_list_value()
  {
    std::vector<int> expected;
    expected.push_back(1);
    expected.push_back(2);
    expected.push_back(3);
    expected.push_back(4);
    expected.push_back(5);
    expected.push_back(6);

    std::vector<int> found;

    this->kf->set_list_value("listgroup", "numbers2",
                             expected.begin(), expected.end());
    CPPUNIT_ASSERT(this->kf->get_list_value("listgroup", "numbers2", found) == true);
    CPPUNIT_ASSERT(found == expected);
  }

  void test_remove_group()
  {
    CPPUNIT_ASSERT(this->kf->get_groups().size() == 2);

    this->kf->set_value("newgroup", "newitem", 89);

    CPPUNIT_ASSERT(this->kf->get_groups().size() == 3);

    this->kf->remove_group("group1");

    sbuild::string_list l = this->kf->get_groups();
    CPPUNIT_ASSERT(l.size() == 2);
    CPPUNIT_ASSERT(l[0] == "group2");
    CPPUNIT_ASSERT(l[1] == "newgroup");
  }

  void test_remove_key()
  {
    CPPUNIT_ASSERT(this->kf->get_keys("group2").size() == 3);

    this->kf->remove_key("group2", "photo");

    sbuild::string_list l = this->kf->get_keys("group2");
    CPPUNIT_ASSERT(l.size() == 2);
    CPPUNIT_ASSERT(l[0] == "age");
    CPPUNIT_ASSERT(l[1] == "name");
  }

#include <iostream>

  void test_output()
  {
    // TODO: Add comments, when available.
    std::ostringstream os;

    std::cerr << sbuild::keyfile_writer(*this->kf);

    os << sbuild::keyfile_writer(*this->kf);

    CPPUNIT_ASSERT(os.str() ==
                   "# Comment\n"
                   "[group1]\n"
                   "age=32\n"
                   "name=Fred Walker\n"
                   "# Test item comment\n"
                   "#\n"
                   "# spanning multiple lines\n"
                   "numbers=1,2,3,4,5,6\n"
                   "\n"
                   "[group2]\n"
                   "age=43\n"
                   "name=Mary King\n"
                   "photo=mary.jpeg\n");
  }

};

CPPUNIT_TEST_SUITE_REGISTRATION(test_keyfile);
