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

#include <sbuild/chroot/facet/btrfs-snapshot.h>
#include <sbuild/i18n.h>
#include <sbuild/keyfile-writer.h>
#include <sbuild/util.h>

#include <test/sbuild/chroot/chroot.h>

#include <algorithm>
#include <set>

#include <cppunit/extensions/HelperMacros.h>

using namespace CppUnit;

using sbuild::_;

class test_chroot_btrfs_snapshot : public test_chroot_base
{
  CPPUNIT_TEST_SUITE(test_chroot_btrfs_snapshot);
  CPPUNIT_TEST(test_source_subvolume);
  CPPUNIT_TEST(test_snapshot_directory);
  CPPUNIT_TEST(test_snapshot_name);
  CPPUNIT_TEST_EXCEPTION(test_source_subvolume_error, sbuild::chroot::chroot::error);
  CPPUNIT_TEST_EXCEPTION(test_snapshot_directory_error, sbuild::chroot::chroot::error);
  CPPUNIT_TEST_EXCEPTION(test_snapshot_name_error, sbuild::chroot::chroot::error);
  CPPUNIT_TEST(test_chroot_type);
  CPPUNIT_TEST(test_setup_env);
  CPPUNIT_TEST(test_setup_env_session);
  CPPUNIT_TEST(test_setup_env_source);
  CPPUNIT_TEST(test_setup_env_session_source);
  CPPUNIT_TEST(test_setup_keyfile);
  CPPUNIT_TEST(test_setup_keyfile_session);
  CPPUNIT_TEST(test_setup_keyfile_source);
  CPPUNIT_TEST(test_setup_keyfile_session_source);
  CPPUNIT_TEST(test_session_flags);
  CPPUNIT_TEST(test_print_details);
  CPPUNIT_TEST(test_print_config);
  CPPUNIT_TEST(test_run_setup_scripts);
  CPPUNIT_TEST_SUITE_END();

public:
  test_chroot_btrfs_snapshot():
    test_chroot_base("btrfs-snapshot")
  {}

  void setUp()
  {
    test_chroot_base::setUp();
    CPPUNIT_ASSERT(chroot);
    CPPUNIT_ASSERT(session);
    CPPUNIT_ASSERT(source);
    CPPUNIT_ASSERT(session_source);
  }

  virtual void setup_chroot_props (sbuild::chroot::chroot::ptr& chroot)
  {
    test_chroot_base::setup_chroot_props(chroot);

    sbuild::chroot::facet::btrfs_snapshot::ptr bfac = chroot->get_facet_strict<sbuild::chroot::facet::btrfs_snapshot>();
    bfac->set_source_subvolume("/srv/chroot/sid");
    bfac->set_snapshot_directory("/srv/chroot/snapshot");
  }

  void
  test_source_subvolume()
  {
    sbuild::chroot::facet::btrfs_snapshot::ptr bfac = chroot->get_facet_strict<sbuild::chroot::facet::btrfs_snapshot>();
    bfac->set_source_subvolume("/srv/chroot/chroot");
    CPPUNIT_ASSERT(bfac->get_source_subvolume() == "/srv/chroot/chroot");
  }

  void
  test_snapshot_directory()
  {
    sbuild::chroot::facet::btrfs_snapshot::ptr bfac = chroot->get_facet_strict<sbuild::chroot::facet::btrfs_snapshot>();
    bfac->set_snapshot_directory("/srv/chroot/snapshot2");
    CPPUNIT_ASSERT(bfac->get_snapshot_directory() == "/srv/chroot/snapshot2");
  }

  void
  test_snapshot_name()
  {
    sbuild::chroot::facet::btrfs_snapshot::ptr bfac = chroot->get_facet_strict<sbuild::chroot::facet::btrfs_snapshot>();
    bfac->set_snapshot_directory("/srv/chroot/snapshot2/test-session-id");
    CPPUNIT_ASSERT(bfac->get_snapshot_directory() == "/srv/chroot/snapshot2/test-session-id");
  }

  void
  test_source_subvolume_error()
  {
    sbuild::chroot::facet::btrfs_snapshot::ptr bfac = chroot->get_facet_strict<sbuild::chroot::facet::btrfs_snapshot>();
    bfac->set_source_subvolume("chroot/invalid");
  }

  void
  test_snapshot_directory_error()
  {
    sbuild::chroot::facet::btrfs_snapshot::ptr bfac = chroot->get_facet_strict<sbuild::chroot::facet::btrfs_snapshot>();
    bfac->set_snapshot_directory("chroot/invalid");
  }

  void
  test_snapshot_name_error()
  {
    sbuild::chroot::facet::btrfs_snapshot::ptr bfac = chroot->get_facet_strict<sbuild::chroot::facet::btrfs_snapshot>();
    bfac->set_snapshot_name("invalid");
  }

  void test_chroot_type()
  {
    CPPUNIT_ASSERT(chroot->get_chroot_type() == "btrfs-snapshot");
  }

  void setup_env_gen(sbuild::environment &expected)
  {
    setup_env_chroot(expected);
    expected.add("CHROOT_MOUNT_LOCATION", "/mnt/mount-location");
    expected.add("CHROOT_PATH",           "/mnt/mount-location");
  }

  void test_setup_env()
  {
    sbuild::environment expected;
    setup_env_gen(expected);
    expected.add("CHROOT_TYPE",           "btrfs-snapshot");
    expected.add("CHROOT_BTRFS_SOURCE_SUBVOLUME",       "/srv/chroot/sid");
    expected.add("CHROOT_BTRFS_SNAPSHOT_DIRECTORY", "/srv/chroot/snapshot");
    expected.add("CHROOT_SESSION_CLONE",  "true");
    expected.add("CHROOT_SESSION_CREATE", "true");
    expected.add("CHROOT_SESSION_PURGE",  "false");

    test_chroot_base::test_setup_env(chroot, expected);
  }

  void test_setup_env_session()
  {
    sbuild::environment expected;
    setup_env_gen(expected);
    expected.add("CHROOT_TYPE",           "btrfs-snapshot");
    expected.add("SESSION_ID",            "test-session-name");
    expected.add("CHROOT_ALIAS",          "test-session-name");
    expected.add("CHROOT_DESCRIPTION",     chroot->get_description() + ' ' + _("(session chroot)"));
    expected.add("CHROOT_BTRFS_SOURCE_SUBVOLUME",       "/srv/chroot/sid");
    expected.add("CHROOT_BTRFS_SNAPSHOT_DIRECTORY", "/srv/chroot/snapshot");
    expected.add("CHROOT_BTRFS_SNAPSHOT_NAME", "/srv/chroot/snapshot/test-session-name");
    expected.add("CHROOT_SESSION_CLONE",  "false");
    expected.add("CHROOT_SESSION_CREATE", "false");
    expected.add("CHROOT_SESSION_PURGE",  "true");

    test_chroot_base::test_setup_env(session, expected);
  }

  void test_setup_env_source()
  {
    sbuild::environment expected;
    setup_env_gen(expected);
    expected.add("CHROOT_TYPE",           "directory");
    expected.add("CHROOT_NAME",           "test-name");
    expected.add("CHROOT_DESCRIPTION",     chroot->get_description() + ' ' + _("(source chroot)"));
    expected.add("CHROOT_DIRECTORY",       "/srv/chroot/sid");
    expected.add("CHROOT_SESSION_CLONE",  "false");
    expected.add("CHROOT_SESSION_CREATE", "true");
    expected.add("CHROOT_SESSION_PURGE",  "false");

    test_chroot_base::test_setup_env(source, expected);
  }

  void test_setup_env_session_source()
  {
    sbuild::environment expected;
    setup_env_gen(expected);
    expected.add("CHROOT_TYPE",           "directory");
    expected.add("CHROOT_NAME",           "test-name");
    expected.add("CHROOT_DESCRIPTION",     chroot->get_description() + ' ' + _("(source chroot)"));
    expected.add("CHROOT_DIRECTORY",       "/srv/chroot/sid");
    expected.add("CHROOT_SESSION_CLONE",  "false");
    expected.add("CHROOT_SESSION_CREATE", "true");
    expected.add("CHROOT_SESSION_PURGE",  "false");

    test_chroot_base::test_setup_env(source, expected);
  }

  void setup_keyfile_btrfs(sbuild::keyfile &expected, std::string group)
  {
  }

  void test_setup_keyfile()
  {
    sbuild::keyfile expected;
    std::string group = chroot->get_name();
    setup_keyfile_chroot(expected, group);
    setup_keyfile_source(expected, group);
    setup_keyfile_btrfs(expected, group);
    expected.set_value(group, "type", "btrfs-snapshot");
    expected.set_value(group, "btrfs-source-subvolume", "/srv/chroot/sid");
    expected.set_value(group, "btrfs-snapshot-directory", "/srv/chroot/snapshot");

    test_chroot_base::test_setup_keyfile
      (chroot,expected, chroot->get_name());
  }

  void test_setup_keyfile_session()
  {
    sbuild::keyfile expected;
    const std::string group(session->get_name());
    setup_keyfile_session(expected, group);
    setup_keyfile_btrfs(expected, group);
    expected.set_value(group, "type", "btrfs-snapshot");
    expected.set_value(group, "name", "test-session-name");
    expected.set_value(group, "selected-name", "test-session-name");
    expected.set_value(group, "description", chroot->get_description() + ' ' + _("(session chroot)"));
    expected.set_value(group, "aliases", "");
    expected.set_value(group, "btrfs-snapshot-name", "/srv/chroot/snapshot/test-session-name");
    expected.set_value(group, "mount-location", "/mnt/mount-location");

    test_chroot_base::test_setup_keyfile
      (session, expected, group);
  }

  void test_setup_keyfile_source()
  {
    sbuild::keyfile expected;
    const std::string group(source->get_name());
    setup_keyfile_chroot(expected, group);
    setup_keyfile_btrfs(expected, group);
    expected.set_value(group, "type", "directory");
    expected.set_value(group, "description", chroot->get_description() + ' ' + _("(source chroot)"));
    expected.set_value(group, "aliases", "test-alias-1-source,test-alias-2-source");
    expected.set_value(group, "directory", "/srv/chroot/sid");
    setup_keyfile_source_clone(expected, group);

    test_chroot_base::test_setup_keyfile
      (source, expected, group);
  }

  void test_setup_keyfile_session_source()
  {
    sbuild::keyfile expected;
    const std::string group(source->get_name());
    setup_keyfile_chroot(expected, group);
    setup_keyfile_btrfs(expected, group);
    expected.set_value(group, "type", "directory");
    expected.set_value(group, "description", chroot->get_description() + ' ' + _("(source chroot)"));
    expected.set_value(group, "aliases", "test-alias-1-source,test-alias-2-source");
    expected.set_value(group, "directory", "/srv/chroot/sid");
    expected.set_value(group, "mount-location", "/mnt/mount-location");
    setup_keyfile_session_source_clone(expected, group);

    test_chroot_base::test_setup_keyfile
      (session_source, expected, group);
  }

  void test_session_flags()
  {
    CPPUNIT_ASSERT(chroot->get_session_flags() ==
                   (sbuild::chroot::facet::facet::SESSION_CREATE |
                    sbuild::chroot::facet::facet::SESSION_CLONE));

    CPPUNIT_ASSERT(session->get_session_flags() ==
                   (sbuild::chroot::facet::facet::SESSION_PURGE));

    /// @todo: Should return NOFLAGS?  This depends upon if source
    /// chroots need transforming into sessions as well (which should
    /// probably happen and be tested for independently).
    CPPUNIT_ASSERT(source->get_session_flags() ==
                   (sbuild::chroot::facet::facet::SESSION_CREATE));
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

CPPUNIT_TEST_SUITE_REGISTRATION(test_chroot_btrfs_snapshot);
