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

#include <sbuild/chroot/facet/directory.h>
#include <sbuild/chroot/facet/userdata.h>

#include <cppunit/extensions/HelperMacros.h>

using namespace CppUnit;

using sbuild::_;

class test_chroot_facet_userdata : public TestFixture
{
  CPPUNIT_TEST_SUITE(test_chroot_facet_userdata);
  CPPUNIT_TEST(test_data_set);
  CPPUNIT_TEST_EXCEPTION(test_data_fail1, sbuild::chroot::facet::userdata::error);
  CPPUNIT_TEST_EXCEPTION(test_data_fail2, sbuild::chroot::facet::userdata::error);
  CPPUNIT_TEST_EXCEPTION(test_data_fail3, sbuild::chroot::facet::userdata::error);
  CPPUNIT_TEST_EXCEPTION(test_data_fail4, sbuild::chroot::facet::userdata::error);
  CPPUNIT_TEST(test_user_set);
  CPPUNIT_TEST_EXCEPTION(test_user_fail1, sbuild::chroot::facet::userdata::error);
  CPPUNIT_TEST_EXCEPTION(test_user_fail2, sbuild::chroot::facet::userdata::error);
  CPPUNIT_TEST(test_root_set);
  CPPUNIT_TEST_EXCEPTION(test_root_fail, sbuild::chroot::facet::userdata::error);
  CPPUNIT_TEST_SUITE_END();

public:
  test_chroot_facet_userdata():
    chroot(),
    userdata()
  {}

  void setUp()
  {
    chroot = sbuild::chroot::chroot::create("directory");
    CPPUNIT_ASSERT(chroot);

    sbuild::chroot::facet::directory::ptr dirfac = chroot->get_facet<sbuild::chroot::facet::directory>();
    CPPUNIT_ASSERT(dirfac);
    dirfac->set_directory("/chroots/test");

    userdata = chroot->get_facet<sbuild::chroot::facet::userdata>();
    CPPUNIT_ASSERT(userdata);

    sbuild::string_set userkeys;
    userkeys.insert("sbuild.resolver");
    userkeys.insert("debian.dist");
    userkeys.insert("sbuild.purge");
    sbuild::string_set rootkeys;
    rootkeys.insert("debian.apt-update");
    userdata->set_user_modifiable_keys(userkeys);
    userdata->set_root_modifiable_keys(rootkeys);
  }

  void tearDown()
  {
    this->chroot = sbuild::chroot::chroot::ptr();
    this->userdata = sbuild::chroot::facet::userdata::ptr();
  }

  void test_data_set()
  {
    userdata->set_data("custom.test1", "testval");
    userdata->set_data("sbuild.resolver", "apt");
    userdata->set_data("setup.fstab", "custom/fstab");

    std::string t1;
    CPPUNIT_ASSERT(userdata->get_data("custom.test1", t1));
    CPPUNIT_ASSERT(t1 == "testval");

    std::string t2;
    CPPUNIT_ASSERT(userdata->get_data("sbuild.resolver", t2));
    CPPUNIT_ASSERT(t2 == "apt");

    std::string t3;
    CPPUNIT_ASSERT(userdata->get_data("setup.fstab", t3));
    CPPUNIT_ASSERT(t3 == "custom/fstab");

    std::string t4("invalid");
    CPPUNIT_ASSERT(!userdata->get_data("invalidkey", t4));
    CPPUNIT_ASSERT(t4 == "invalid");
  }

  void test_data_fail1()
  {
    userdata->set_data("custom", "testval");
  }

  void test_data_fail2()
  {
    userdata->set_data("custom.key.set", "testval1");
    userdata->set_data("custom.key_set", "testval2");
  }

  void test_data_fail3()
  {
    userdata->set_data("setup-data-dir", "testval3");
  }

  void test_data_fail4()
  {
    userdata->set_data("setup.data.dir", "testval4");
  }

  void test_user_set()
  {
    sbuild::string_map d;
    d.insert(std::make_pair("sbuild.resolver", "aptitude"));
    userdata->set_user_data(d);

    std::string t1;
    CPPUNIT_ASSERT(userdata->get_data("sbuild.resolver", t1));
    CPPUNIT_ASSERT(t1 == "aptitude");
  }

  void test_user_fail1()
  {
    sbuild::string_map d;
    d.insert(std::make_pair("sbuild.apt-update", "true"));
    userdata->set_user_data(d);
  }

  void test_user_fail2()
  {
    // Use root key.
    sbuild::string_map d;
    d.insert(std::make_pair("debian.apt-update", "false"));
    userdata->set_user_data(d);
  }

  void test_root_set()
  {
    sbuild::string_map d;
    d.insert(std::make_pair("sbuild.resolver", "aptitude"));
    d.insert(std::make_pair("debian.apt-update", "false"));
    userdata->set_root_data(d);

    std::string t1;
    CPPUNIT_ASSERT(userdata->get_data("sbuild.resolver", t1));
    CPPUNIT_ASSERT(t1 == "aptitude");

    std::string t2;
    CPPUNIT_ASSERT(userdata->get_data("debian.apt-update", t2));
    CPPUNIT_ASSERT(t2 == "false");
  }

  void test_root_fail()
  {
    sbuild::string_map d;
    d.insert(std::make_pair("invalid.key", "testv"));
    userdata->set_root_data(d);
  }

private:
  sbuild::chroot::chroot::ptr chroot;
  sbuild::chroot::facet::userdata::ptr userdata;
};

CPPUNIT_TEST_SUITE_REGISTRATION(test_chroot_facet_userdata);
