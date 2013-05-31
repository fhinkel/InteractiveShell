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
#include <sbuild/i18n.h>
#include <sbuild/keyfile-writer.h>

#include <test/sbuild/chroot/chroot.h>

#include <algorithm>
#include <set>

#include <cppunit/extensions/HelperMacros.h>

using namespace CppUnit;

using sbuild::_;

class test_chroot_directory : public test_chroot_base
{
  CPPUNIT_TEST_SUITE(test_chroot_directory);
  CPPUNIT_TEST(test_directory);
  CPPUNIT_TEST(test_chroot_type);
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
  CPPUNIT_TEST(test_setup_keyfile_root_session);
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

public:
  test_chroot_directory():
    test_chroot_base("directory")
  {}

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
#endif
  }

  virtual void setup_chroot_props (sbuild::chroot::chroot::chroot::ptr& chroot)
  {
    test_chroot_base::setup_chroot_props(chroot);

    sbuild::chroot::facet::directory::ptr dirfac = chroot->get_facet<sbuild::chroot::facet::directory>();
    CPPUNIT_ASSERT(dirfac);

    dirfac->set_directory("/srv/chroot/example-chroot");
  }

  void
  test_directory()
  {
    sbuild::chroot::facet::directory::ptr dirfac = chroot->get_facet<sbuild::chroot::facet::directory>();
    CPPUNIT_ASSERT(dirfac);
    dirfac->set_directory("/mnt/chroot/example");
    CPPUNIT_ASSERT(chroot->get_mount_location() == "/mnt/mount-location");
    CPPUNIT_ASSERT(dirfac->get_directory() == "/mnt/chroot/example");
    CPPUNIT_ASSERT(chroot->get_path() == "/mnt/mount-location");
  }

  void test_chroot_type()
  {
    CPPUNIT_ASSERT(chroot->get_chroot_type() == "directory");
  }

  void setup_env_gen(sbuild::environment& expected)
  {
    setup_env_chroot(expected);

    expected.add("CHROOT_TYPE",           "directory");
    expected.add("CHROOT_MOUNT_LOCATION", "/mnt/mount-location");
    expected.add("CHROOT_DIRECTORY",      "/srv/chroot/example-chroot");
    expected.add("CHROOT_PATH",           "/mnt/mount-location");
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
    expected.add("CHROOT_DESCRIPTION",     chroot->get_description() + ' ' + _("(source chroot) (session chroot)"));
    expected.add("CHROOT_SESSION_CLONE",  "false");
    expected.add("CHROOT_SESSION_CREATE", "false");
    expected.add("CHROOT_SESSION_PURGE",  "false");

    test_chroot_base::test_setup_env(session_source_union, expected);
  }
#endif // SBUILD_FEATURE_UNION

  void test_setup_keyfile()
  {
    sbuild::keyfile expected;
    const std::string group(chroot->get_name());
    setup_keyfile_chroot(expected, group);
    expected.set_value(group, "type", "directory");
    expected.set_value(group, "directory", "/srv/chroot/example-chroot");
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
    expected.set_value(group, "type", "directory");
    expected.set_value(group, "name", "test-session-name");
    expected.set_value(group, "selected-name", "test-session-name");
    expected.set_value(group, "directory", "/srv/chroot/example-chroot");
    expected.set_value(group, "mount-location", "/mnt/mount-location");
    setup_keyfile_session_clone(expected, group);
#ifdef SBUILD_FEATURE_UNION
    setup_keyfile_union_unconfigured(expected, group);
#endif // SBUILD_FEATURE_UNION

    test_chroot_base::test_setup_keyfile
      (session, expected, group);
  }

  // Note, this test is unique to the directory chroot but is
  // applicable to all.
  void test_setup_keyfile_root_session()
  {
    // Create session owned by user in root-users.
    this->session = this->chroot->clone_session("test-session-name",
                                                "test-session-name",
                                                "user3",
                                                true);
    if (this->session)
      {
        CPPUNIT_ASSERT(this->session->get_facet<sbuild::chroot::facet::session>());
      }

    sbuild::keyfile expected;
    const std::string group(session->get_name());
    setup_keyfile_session(expected, group);
    expected.set_value(group, "users", "");
    expected.set_value(group, "root-users", "user3");
    expected.set_value(group, "type", "directory");
    expected.set_value(group, "name", "test-session-name");
    expected.set_value(group, "selected-name", "test-session-name");
    expected.set_value(group, "directory", "/srv/chroot/example-chroot");
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
    expected.set_value(group, "type", "directory");
    expected.set_value(group, "directory", "/srv/chroot/example-chroot");
    setup_keyfile_union_configured(expected, group);

    test_chroot_base::test_setup_keyfile
      (chroot_union, expected, group);
  }

  void test_setup_keyfile_session_union()
  {
    sbuild::keyfile expected;
    const std::string group(session_union->get_name());
    setup_keyfile_session(expected, group);
    expected.set_value(group, "type", "directory");
    expected.set_value(group, "name", "test-union-session-name");
    expected.set_value(group, "selected-name", "test-union-session-name");
    expected.set_value(group, "directory", "/srv/chroot/example-chroot");
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
    expected.set_value(group, "type", "directory");
    expected.set_value(group, "description", chroot->get_description() + ' ' + _("(source chroot)"));
    expected.set_value(group, "directory", "/srv/chroot/example-chroot");

    test_chroot_base::test_setup_keyfile
      (source_union, expected, group);
  }

  void test_setup_keyfile_session_source_union()
  {
    sbuild::keyfile expected;
    const std::string group(source_union->get_name());
    setup_keyfile_chroot(expected, group);
    setup_keyfile_source_clone(expected, group);
    expected.set_value(group, "type", "directory");
    expected.set_value(group, "description", chroot->get_description() + ' ' + _("(source chroot)"));
    expected.set_value(group, "directory", "/srv/chroot/example-chroot");
    expected.set_value(group, "mount-location", "/mnt/mount-location");
    setup_keyfile_session_source_clone(expected, group);

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

CPPUNIT_TEST_SUITE_REGISTRATION(test_chroot_directory);
