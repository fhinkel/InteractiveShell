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

#include <sbuild/chroot/config.h>
#include <sbuild/nostream.h>

#include <fstream>
#include <sstream>
#include <vector>

#include <cppunit/extensions/HelperMacros.h>

using namespace CppUnit;

class test_config : public TestFixture
{
  CPPUNIT_TEST_SUITE(test_config);
  CPPUNIT_TEST(test_construction_file);
  CPPUNIT_TEST(test_construction_dir);
  CPPUNIT_TEST_EXCEPTION(test_construction_fail, sbuild::error_base);
  CPPUNIT_TEST(test_add_file);
  CPPUNIT_TEST(test_add_dir);
  CPPUNIT_TEST_EXCEPTION(test_add_fail, sbuild::error_base);
  CPPUNIT_TEST(test_get_chroots);
  CPPUNIT_TEST(test_find_chroot);
  CPPUNIT_TEST(test_find_alias);
  CPPUNIT_TEST(test_get_chroot_list);
  CPPUNIT_TEST(test_get_alias_list);
  CPPUNIT_TEST(test_validate_chroots);
  CPPUNIT_TEST_EXCEPTION(test_validate_chroots_fail, sbuild::error_base);
  CPPUNIT_TEST_EXCEPTION(test_config_fail, sbuild::error_base);
  CPPUNIT_TEST(test_config_deprecated);
  CPPUNIT_TEST(test_config_valid);
  CPPUNIT_TEST_SUITE_END();

protected:
  sbuild::chroot::config *cf;

public:
  test_config():
    TestFixture(),
    cf()
  {}

  virtual ~test_config()
  {}

  void setUp()
  {
    this->cf = new sbuild::chroot::config("chroot", TESTDATADIR "/config.ex1");
  }

  void tearDown()
  {
    delete this->cf;
  }

  void test_construction_file()
  {
    sbuild::chroot::config c("chroot", TESTDATADIR "/config.ex1");
  }

  void test_construction_dir()
  {
    sbuild::chroot::config c("chroot", TESTDATADIR "/config.ex2");
  }

  void test_construction_fail()
  {
    sbuild::chroot::config c("chroot", TESTDATADIR "/config.nonexistent");
  }

  void test_construction_fail_wrong()
  {
    sbuild::chroot::config c("chroot", TESTDATADIR "/config.ex3");
  }

  void test_add_file()
  {
    sbuild::chroot::config c;
    c.add("chroot", TESTDATADIR "/config.ex1");
  }

  void test_add_dir()
  {
    sbuild::chroot::config c;
    c.add("chroot", TESTDATADIR "/config.ex2");
  }

  void test_add_fail()
  {
    sbuild::chroot::config c;
    c.add("chroot", TESTDATADIR "/config.nonexistent");
  }

  void test_get_chroots()
  {
    CPPUNIT_ASSERT(this->cf->get_chroots("chroot").size() == 4);
  }

  void test_find_chroot()
  {
    sbuild::chroot::chroot::ptr chroot;

    chroot = this->cf->find_chroot("chroot", "sid");
    CPPUNIT_ASSERT((chroot));
    CPPUNIT_ASSERT(chroot->get_name() == "sid");

    chroot = this->cf->find_chroot("chroot", "stable");
    CPPUNIT_ASSERT((!chroot));

    chroot = this->cf->find_chroot("chroot", "invalid");
    CPPUNIT_ASSERT((!chroot));
  }

  void test_find_alias()
  {
    sbuild::chroot::chroot::ptr chroot;

    chroot = this->cf->find_alias("chroot", "sid");
    CPPUNIT_ASSERT((chroot));
    CPPUNIT_ASSERT(chroot->get_name() == "sid");

    chroot = this->cf->find_alias("chroot", "stable");
    CPPUNIT_ASSERT((chroot));
    CPPUNIT_ASSERT(chroot->get_name() == "sarge");

    chroot = this->cf->find_alias("chroot", "invalid");
    CPPUNIT_ASSERT((!chroot));
  }

  void test_get_chroot_list()
  {
    sbuild::string_list chroots = this->cf->get_chroot_list("chroot");
    CPPUNIT_ASSERT(chroots.size() == 4);
    CPPUNIT_ASSERT(chroots[0] == "chroot:experimental");
    CPPUNIT_ASSERT(chroots[1] == "chroot:sarge");
    CPPUNIT_ASSERT(chroots[2] == "chroot:sid");
    CPPUNIT_ASSERT(chroots[3] == "chroot:sid-local");
  }

  void test_get_alias_list()
  {
    sbuild::string_list chroots = this->cf->get_alias_list("chroot");
    CPPUNIT_ASSERT(chroots.size() == 7);
    CPPUNIT_ASSERT(chroots[0] == "chroot:default");
    CPPUNIT_ASSERT(chroots[1] == "chroot:experimental");
    CPPUNIT_ASSERT(chroots[2] == "chroot:sarge");
    CPPUNIT_ASSERT(chroots[3] == "chroot:sid");
    CPPUNIT_ASSERT(chroots[4] == "chroot:sid-local");
    CPPUNIT_ASSERT(chroots[5] == "chroot:stable");
    CPPUNIT_ASSERT(chroots[6] == "chroot:unstable");
  }

  void test_validate_chroots()
  {
    sbuild::string_list chroots;
    chroots.push_back("default");
    chroots.push_back("sarge");
    chroots.push_back("unstable");

    sbuild::chroot::config::chroot_map m = this->cf->validate_chroots("chroot", chroots);
    assert(m.size() == 3);
  }

  void test_validate_chroots_fail()
  {
    sbuild::string_list chroots;
    chroots.push_back("default");
    chroots.push_back("invalid");
    chroots.push_back("invalid2");
    chroots.push_back("sarge");
    chroots.push_back("unstable");

    this->cf->validate_chroots("chroot", chroots);
  }

  void test_config_fail()
  {
    sbuild::chroot::config c("chroot", TESTDATADIR "/config-directory-fail.ex");
  }

  void test_config_deprecated()
  {
    sbuild::chroot::config c("chroot", TESTDATADIR "/config-directory-deprecated.ex");
  }

  void test_config_valid()
  {
    sbuild::chroot::config c("chroot", TESTDATADIR "/config-directory-valid.ex");
  }

};

CPPUNIT_TEST_SUITE_REGISTRATION(test_config);
