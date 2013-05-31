/* Copyright © 2008-2013  Jan-Marek Glogowski <glogow@fbihome.de>
 * Copyright © 2008-2013  Roger Leigh <rleigh@debian.org>
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

#include <algorithm>
#include <set>
#include <iostream>

#include <sbuild/chroot/facet/loopback.h>
#include <sbuild/chroot/facet/mountable.h>
#include <sbuild/i18n.h>
#include <sbuild/keyfile-writer.h>

#include <test/sbuild/chroot/chroot.h>

#include <cppunit/extensions/HelperMacros.h>

using namespace CppUnit;

using sbuild::_;

class test_chroot_loopback : public test_chroot_base
{
  CPPUNIT_TEST_SUITE(test_chroot_loopback);
  CPPUNIT_TEST(test_file);
  CPPUNIT_TEST(test_mount_options);
  CPPUNIT_TEST(test_setup_env);
  CPPUNIT_TEST(test_setup_env_session);
#ifdef SBUILD_FEATURE_UNION
  CPPUNIT_TEST(test_setup_env_union);
  CPPUNIT_TEST(test_setup_env_session_union);
  CPPUNIT_TEST(test_setup_env_source_union);
  CPPUNIT_TEST(test_setup_env_session_source_union);
#endif // SBUILD_FEATURE_UNION
  CPPUNIT_TEST(test_setup_keyfile);
  CPPUNIT_TEST(test_setup_keyfile_session);
#ifdef SBUILD_FEATURE_UNION
  CPPUNIT_TEST(test_setup_keyfile_union);
  CPPUNIT_TEST(test_setup_keyfile_session_union);
  CPPUNIT_TEST(test_setup_keyfile_source_union);
  CPPUNIT_TEST(test_setup_keyfile_session_source_union);
#endif // SBUILD_FEATURE_UNION
  CPPUNIT_TEST(test_session_flags);
  CPPUNIT_TEST(test_print_details);
  CPPUNIT_TEST(test_print_config);
  CPPUNIT_TEST(test_run_setup_scripts);
  CPPUNIT_TEST_SUITE_END();

protected:
  std::string loopback_file;

public:
  test_chroot_loopback():
    test_chroot_base("loopback"),
    loopback_file()
  {
    loopback_file = abs_testdata_dir;
    loopback_file.append("/loopback-file");
  }

  void setUp()
  {
    test_chroot_base::setUp();
    CPPUNIT_ASSERT(chroot);
    CPPUNIT_ASSERT(session);
    CPPUNIT_ASSERT(!source);
    CPPUNIT_ASSERT(!session_source);
#ifdef SBUILD_FEATURE_UNION
    CPPUNIT_ASSERT(chroot_union);
    CPPUNIT_ASSERT(session_union);
    CPPUNIT_ASSERT(source_union);
    CPPUNIT_ASSERT(session_source_union);
#endif // SBUILD_FEATURE_UNION
  }

  virtual void setup_chroot_props (sbuild::chroot::chroot::ptr& chroot)
  {
    test_chroot_base::setup_chroot_props(chroot);

    sbuild::chroot::facet::loopback::ptr loop = chroot->get_facet_strict<sbuild::chroot::facet::loopback>();

    CPPUNIT_ASSERT(loop);
    loop->set_filename(loopback_file);

    sbuild::chroot::facet::mountable::ptr pmnt(chroot->get_facet<sbuild::chroot::facet::mountable>());
    CPPUNIT_ASSERT(pmnt);

    pmnt->set_mount_options("-t jfs -o quota,rw");
    pmnt->set_location("/squeeze");
  }

  void
  test_file()
  {
    sbuild::chroot::facet::loopback::ptr loop = chroot->get_facet_strict<sbuild::chroot::facet::loopback>();
    CPPUNIT_ASSERT(loop);
    loop->set_filename("/dev/some/file");
    CPPUNIT_ASSERT(loop->get_filename() == "/dev/some/file");
  }

  void
  test_mount_options()
  {
    sbuild::chroot::facet::mountable::ptr pmnt(chroot->get_facet<sbuild::chroot::facet::mountable>());
    CPPUNIT_ASSERT(pmnt);
    pmnt->set_mount_options("-o opt1,opt2");
    CPPUNIT_ASSERT(pmnt->get_mount_options() == "-o opt1,opt2");
  }

  void setup_env_gen(sbuild::environment& expected)
  {
    setup_env_chroot(expected);

    expected.add("CHROOT_TYPE",           "loopback");
    expected.add("CHROOT_MOUNT_LOCATION", "/mnt/mount-location");
    expected.add("CHROOT_LOCATION",       "/squeeze");
    expected.add("CHROOT_PATH",           "/mnt/mount-location/squeeze");
    expected.add("CHROOT_FILE",           loopback_file);
    expected.add("CHROOT_MOUNT_OPTIONS",  "-t jfs -o quota,rw");
  }

  void test_setup_env()
  {
    sbuild::environment expected;
    setup_env_gen(expected);

    expected.add("CHROOT_SESSION_CLONE",  "false");
    expected.add("CHROOT_SESSION_CREATE", "true");
    expected.add("CHROOT_SESSION_PURGE",  "false");
#ifdef SBUILD_FEATURE_UNION
    expected.add("CHROOT_UNION_TYPE",     "none");
#endif // SBUILD_FEATURE_UNION

    test_chroot_base::test_setup_env(chroot, expected);
  }

  void test_setup_env_session()
  {
    sbuild::environment expected;
    setup_env_gen(expected);

    expected.add("SESSION_ID",            "test-session-name");
    expected.add("CHROOT_ALIAS",          "test-session-name");
    expected.add("CHROOT_DESCRIPTION",     chroot->get_description() + ' ' + _("(session chroot)"));
    expected.add("CHROOT_SESSION_CLONE",  "false");
    expected.add("CHROOT_SESSION_CREATE", "false");
    expected.add("CHROOT_SESSION_PURGE",  "false");
    expected.add("CHROOT_MOUNT_DEVICE",   loopback_file);

#ifdef SBUILD_FEATURE_UNION
    expected.add("CHROOT_UNION_TYPE",     "none");
#endif // SBUILD_FEATURE_UNION

    test_chroot_base::test_setup_env(session, expected);
  }

#ifdef SBUILD_FEATURE_UNION
  void test_setup_env_union()
  {
    sbuild::environment expected;
    setup_env_gen(expected);

    expected.add("CHROOT_SESSION_CLONE",  "true");
    expected.add("CHROOT_SESSION_CREATE", "true");
    expected.add("CHROOT_SESSION_PURGE",  "false");
    expected.add("CHROOT_UNION_TYPE",     "aufs");
    expected.add("CHROOT_UNION_MOUNT_OPTIONS",      "union-mount-options");
    expected.add("CHROOT_UNION_OVERLAY_DIRECTORY",  "/overlay");
    expected.add("CHROOT_UNION_UNDERLAY_DIRECTORY", "/underlay");

    test_chroot_base::test_setup_env(chroot_union, expected);
  }

  void test_setup_env_session_union()
  {
    sbuild::environment expected;
    setup_env_gen(expected);

    expected.add("SESSION_ID",            "test-union-session-name");
    expected.add("CHROOT_ALIAS",          "test-union-session-name");
    expected.add("CHROOT_DESCRIPTION",     chroot->get_description() + ' ' + _("(session chroot)"));
    expected.add("CHROOT_SESSION_CLONE",  "false");
    expected.add("CHROOT_SESSION_CREATE", "false");
    expected.add("CHROOT_SESSION_PURGE",  "true");
    expected.add("CHROOT_MOUNT_DEVICE",   loopback_file);
    expected.add("CHROOT_UNION_TYPE",     "aufs");
    expected.add("CHROOT_UNION_MOUNT_OPTIONS",      "union-mount-options");
    expected.add("CHROOT_UNION_OVERLAY_DIRECTORY",  "/overlay/test-union-session-name");
    expected.add("CHROOT_UNION_UNDERLAY_DIRECTORY", "/underlay/test-union-session-name");
    test_chroot_base::test_setup_env(session_union, expected);
  }

  void test_setup_env_source_union()
  {
    sbuild::environment expected;
    setup_env_gen(expected);

    expected.add("CHROOT_NAME",           "test-name");
    expected.add("CHROOT_DESCRIPTION",     chroot->get_description() + ' ' + _("(source chroot)"));
    expected.add("CHROOT_SESSION_CLONE",  "false");
    expected.add("CHROOT_SESSION_CREATE", "true");
    expected.add("CHROOT_SESSION_PURGE",  "false");

    test_chroot_base::test_setup_env(source_union, expected);
  }

  void test_setup_env_session_source_union()
  {
    sbuild::environment expected;
    setup_env_gen(expected);

    expected.add("SESSION_ID",            "test-session-name");
    expected.add("CHROOT_ALIAS",          "test-session-name");
    expected.add("CHROOT_NAME",           "test-name");
    expected.add("CHROOT_DESCRIPTION",     chroot->get_description() + ' ' + _("(source chroot) (session chroot)"));
    expected.add("CHROOT_MOUNT_DEVICE",   loopback_file);
    expected.add("CHROOT_SESSION_CLONE",  "false");
    expected.add("CHROOT_SESSION_CREATE", "false");
    expected.add("CHROOT_SESSION_PURGE",  "false");

    test_chroot_base::test_setup_env(session_source_union, expected);
  }
#endif // SBUILD_FEATURE_UNION

  void setup_keyfile_loop(sbuild::keyfile &expected, std::string group)
  {
    expected.set_value(group, "type", "loopback");
    expected.set_value(group, "file", loopback_file);
    expected.set_value(group, "location", "/squeeze");
    expected.set_value(group, "mount-options", "-t jfs -o quota,rw");
  }

  void test_setup_keyfile()
  {
    sbuild::keyfile expected;
    const std::string group(chroot->get_name());
    setup_keyfile_chroot(expected, group);
    setup_keyfile_loop(expected, group);
#ifdef SBUILD_FEATURE_UNION
    setup_keyfile_union_unconfigured(expected, group);
#endif // SBUILD_FEATURE_UNION

    test_chroot_base::test_setup_keyfile
      (chroot, expected, group);
  }

  void test_setup_keyfile_session()
  {
    sbuild::keyfile expected;
    const std::string group(session->get_name());
    setup_keyfile_session(expected, group);
    setup_keyfile_loop(expected, group);
    expected.set_value(group, "name", "test-session-name");
    expected.set_value(group, "selected-name", "test-session-name");
    expected.set_value(group, "mount-device", loopback_file);
    expected.set_value(group, "mount-location", "/mnt/mount-location");
    setup_keyfile_session_clone(expected, group);
#ifdef SBUILD_FEATURE_UNION
    setup_keyfile_union_unconfigured(expected, group);
#endif // SBUILD_FEATURE_UNION

    test_chroot_base::test_setup_keyfile
      (session, expected, group);
  }

#ifdef SBUILD_FEATURE_UNION
  void test_setup_keyfile_union()
  {
    sbuild::keyfile expected;
    const std::string group(chroot_union->get_name());
    setup_keyfile_chroot(expected, group);
    setup_keyfile_source(expected, group);
    setup_keyfile_loop(expected, group);
    setup_keyfile_union_configured(expected, group);

    test_chroot_base::test_setup_keyfile
      (chroot_union, expected, group);
  }

  void test_setup_keyfile_session_union()
  {
    sbuild::keyfile expected;
    const std::string group(session_union->get_name());
    setup_keyfile_session(expected, group);
    setup_keyfile_loop(expected, group);
    expected.set_value(group, "name", "test-union-session-name");
    expected.set_value(group, "selected-name", "test-union-session-name");
    expected.set_value(group, "mount-device", loopback_file);
    expected.set_value(group, "mount-location", "/mnt/mount-location");
    setup_keyfile_session_clone(expected, group);
    setup_keyfile_union_session(expected, group);

    test_chroot_base::test_setup_keyfile
      (session_union, expected, group);
  }

  void test_setup_keyfile_source_union()
  {
    sbuild::keyfile expected;
    const std::string group(source_union->get_name());
    setup_keyfile_chroot(expected, group);
    setup_keyfile_source_clone(expected, group);
    setup_keyfile_loop(expected, group);
    expected.set_value(group, "description", chroot->get_description() + ' ' + _("(source chroot)"));

    test_chroot_base::test_setup_keyfile
      (source_union, expected, group);
  }

  void test_setup_keyfile_session_source_union()
  {
    sbuild::keyfile expected;
    const std::string group(source_union->get_name());
    setup_keyfile_chroot(expected, group);
    setup_keyfile_session_source_clone(expected, group);
    setup_keyfile_loop(expected, group);
    expected.set_value(group, "description", chroot->get_description() + ' ' + _("(source chroot) (session chroot)"));
    expected.set_value(group, "mount-device", loopback_file);
    expected.set_value(group, "mount-location", "/mnt/mount-location");

    test_chroot_base::test_setup_keyfile
      (session_source_union, expected, group);
  }
#endif // SBUILD_FEATURE_UNION

  void test_session_flags()
  {
    CPPUNIT_ASSERT(chroot->get_session_flags() ==
                   sbuild::chroot::facet::facet::SESSION_CREATE);

    CPPUNIT_ASSERT(session->get_session_flags() ==
                   sbuild::chroot::facet::facet::SESSION_NOFLAGS);

#ifdef SBUILD_FEATURE_UNION
    CPPUNIT_ASSERT(chroot_union->get_session_flags() ==
                   (sbuild::chroot::facet::facet::SESSION_CREATE |
                    sbuild::chroot::facet::facet::SESSION_CLONE));

    CPPUNIT_ASSERT(session_union->get_session_flags() ==
                   sbuild::chroot::facet::facet::SESSION_PURGE);

    CPPUNIT_ASSERT(source_union->get_session_flags() ==
                   sbuild::chroot::facet::facet::SESSION_CREATE);
#endif // SBUILD_FEATURE_UNION
  }

  void test_print_details()
  {
    std::ostringstream os;
    os << chroot;
    // TODO: Compare output.
    CPPUNIT_ASSERT(!os.str().empty());
  }

  void test_print_config()
  {
    std::ostringstream os;
    sbuild::keyfile config;
    config << chroot;
    os << sbuild::keyfile_writer(config);
    // TODO: Compare output.
    CPPUNIT_ASSERT(!os.str().empty());
  }

  void test_run_setup_scripts()
  {
    CPPUNIT_ASSERT(chroot->get_run_setup_scripts());
  }

};

CPPUNIT_TEST_SUITE_REGISTRATION(test_chroot_loopback);
