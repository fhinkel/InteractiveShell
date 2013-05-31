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

#ifndef TEST_SBUILD_CHROOT_H
#define TEST_SBUILD_CHROOT_H

#include <sbuild/config.h>
#include <sbuild/chroot/chroot.h>
#ifdef SBUILD_FEATURE_PERSONALITY
#include <sbuild/chroot/facet/personality.h>
#endif // SBUILD_FEATURE_PERSONALITY
#include <sbuild/chroot/facet/session.h>
#include <sbuild/chroot/facet/session-clonable.h>
#include <sbuild/chroot/facet/source.h>
#include <sbuild/chroot/facet/source-clonable.h>
#ifdef SBUILD_FEATURE_UNION
#include <sbuild/chroot/facet/fsunion.h>
#endif // SBUILD_FEATURE_UNION
#ifdef SBUILD_FEATURE_UNSHARE
#include <sbuild/chroot/facet/unshare.h>
#endif // SBUILD_FEATURE_UNSHARE
#include <sbuild/chroot/facet/userdata.h>
#include <sbuild/i18n.h>
#include <sbuild/types.h>
#include <sbuild/util.h>

#include <algorithm>
#include <iostream>
#include <set>

#include <cppunit/extensions/HelperMacros.h>

using namespace CppUnit;
using sbuild::_;

class test_chroot_base : public TestFixture
{
protected:
  std::string                 type;
  sbuild::chroot::chroot::ptr chroot;
  sbuild::chroot::chroot::ptr session;
  sbuild::chroot::chroot::ptr source;
  sbuild::chroot::chroot::ptr session_source;
#ifdef SBUILD_FEATURE_UNION
  sbuild::chroot::chroot::ptr chroot_union;
  sbuild::chroot::chroot::ptr session_union;
  sbuild::chroot::chroot::ptr source_union;
  sbuild::chroot::chroot::ptr session_source_union;
#endif // SBUILD_FEATURE_UNION
  std::string abs_testdata_dir;

public:
  test_chroot_base(const std::string& type):
    TestFixture(),
    type(type),
    chroot(),
    session(),
    source(),
    session_source(),
#ifdef SBUILD_FEATURE_UNION
    chroot_union(),
    session_union(),
    source_union(),
    session_source_union(),
#endif // SBUILD_FEATURE_UNION
    abs_testdata_dir()
  {
    abs_testdata_dir = sbuild::getcwd();
    abs_testdata_dir.append("/" TESTDATADIR);
  }

  virtual ~test_chroot_base()
  {}

  void setUp()
  {
    // Create new chroot
    this->chroot = sbuild::chroot::chroot::create(type);
    CPPUNIT_ASSERT(this->chroot);
    CPPUNIT_ASSERT(!(static_cast<bool>(this->chroot->get_facet<sbuild::chroot::facet::session>())));

    setup_chroot_props(this->chroot);

    CPPUNIT_ASSERT(this->chroot->get_name().length());

    // Create new source chroot.
    sbuild::chroot::facet::session_clonable::const_ptr psess
      (this->chroot->get_facet<sbuild::chroot::facet::session_clonable>());
    if (psess)
      {
        this->session = this->chroot->clone_session("test-session-name",
                                                    "test-session-name",
                                                    "user1",
                                                    false);
        if (this->session)
          {
            CPPUNIT_ASSERT(this->session->get_facet<sbuild::chroot::facet::session>());
          }
      }

    sbuild::chroot::facet::source_clonable::const_ptr psrc
      (this->chroot->get_facet<sbuild::chroot::facet::source_clonable>());
    if (psrc)
      this->source = this->chroot->clone_source();
    if (this->source)
      {
        sbuild::chroot::facet::source_clonable::const_ptr pfsrcc
          (this->source->get_facet<sbuild::chroot::facet::source_clonable>());
        CPPUNIT_ASSERT(!pfsrcc);
        sbuild::chroot::facet::source::const_ptr pfsrc
          (this->source->get_facet<sbuild::chroot::facet::source>());
        CPPUNIT_ASSERT(pfsrc);
      }

    if (source)
      {
        sbuild::chroot::facet::session_clonable::const_ptr psess_src
          (this->source->get_facet<sbuild::chroot::facet::session_clonable>());
        if (psess_src)
          {
            this->session_source = this->source->clone_session("test-session-name",
                                                               "test-session-name",
                                                               "user1",
                                                               false);
            if (this->session_source)
              {
                CPPUNIT_ASSERT(this->session_source->get_facet<sbuild::chroot::facet::session>());
              }
          }
      }

#ifdef SBUILD_FEATURE_UNION
    this->chroot_union = sbuild::chroot::chroot::create(type);
    sbuild::chroot::facet::fsunion::ptr un =
      this->chroot_union->get_facet<sbuild::chroot::facet::fsunion>();
    if (!un)
      {
        this->chroot_union.reset();
      }
    else
      {
        un->set_union_type("aufs");

        setup_chroot_props(this->chroot_union);
        CPPUNIT_ASSERT(!(this->chroot_union->get_facet<sbuild::chroot::facet::session>()));
        CPPUNIT_ASSERT(this->chroot_union->get_name().length());

        un->set_union_overlay_directory("/overlay");
        un->set_union_underlay_directory("/underlay");
        un->set_union_mount_options("union-mount-options");

        this->session_union =
          this->chroot_union->clone_session("test-union-session-name",
                                            "test-union-session-name",
                                            "user1",
                                            false);
        this->source_union = chroot_union->clone_source();

        sbuild::chroot::facet::session_clonable::const_ptr puni_sess_src
          (this->source_union->get_facet<sbuild::chroot::facet::session_clonable>());
        if (puni_sess_src)
          {
            this->session_source_union = this->source_union->clone_session("test-session-name",
                                                                           "test-session-name",
                                                                           "user1",
                                                                           false);
          }

        CPPUNIT_ASSERT(this->session_union);
        CPPUNIT_ASSERT(this->session_union->get_facet<sbuild::chroot::facet::session>());
        CPPUNIT_ASSERT(this->source_union);
        CPPUNIT_ASSERT(this->session_source_union);
        CPPUNIT_ASSERT(this->session_source_union->get_facet<sbuild::chroot::facet::session>());
      }
#endif // SBUILD_FEATURE_UNION

  }

  virtual void setup_chroot_props (sbuild::chroot::chroot::ptr& chroot)
  {
    chroot->set_name("test-name");
    chroot->set_description("test-description");
    chroot->set_aliases(sbuild::split_string("test-alias-1,test-alias-2", ","));
    chroot->set_description("test-description");
    chroot->set_mount_location("/mnt/mount-location");
    chroot->set_environment_filter(SBUILD_DEFAULT_ENVIRONMENT_FILTER);
    chroot->set_users(sbuild::split_string("user1,user2", ","));
    chroot->set_root_users(sbuild::split_string("user3,user4", ","));
    chroot->set_groups(sbuild::split_string("group1,group2", ","));
    chroot->set_root_groups(sbuild::split_string("group3,group4", ","));
    chroot->set_verbosity("quiet");
    chroot->set_preserve_environment(false);
    chroot->set_default_shell("/bin/testshell");

#ifdef SBUILD_FEATURE_PERSONALITY
    sbuild::chroot::facet::personality::ptr pfac
      (chroot->get_facet<sbuild::chroot::facet::personality>());
    if (pfac)
      pfac->set_persona(sbuild::personality("undefined"));
#endif // SBUILD_FEATURE_PERSONALITY

    sbuild::chroot::facet::source_clonable::ptr usrc
      (chroot->get_facet<sbuild::chroot::facet::source_clonable>());
    if (usrc)
      {
        usrc->set_source_users(sbuild::split_string("suser1,suser2", ","));
        usrc->set_source_root_users(sbuild::split_string("suser3,suser4", ","));
        usrc->set_source_groups(sbuild::split_string("sgroup1,sgroup2", ","));
        usrc->set_source_root_groups(sbuild::split_string("sgroup3,sgroup4", ","));
      }

    sbuild::chroot::facet::userdata::ptr pusr
      (chroot->get_facet<sbuild::chroot::facet::userdata>());
    if (pusr)
      {
        pusr->set_data("custom.test1", "testval");
        sbuild::string_set userkeys;
        userkeys.insert("sbuild.resolver");
        userkeys.insert("debian.dist");
        userkeys.insert("sbuild.purge");
        sbuild::string_set rootkeys;
        rootkeys.insert("debian.apt-update");
        pusr->set_user_modifiable_keys(userkeys);
        pusr->set_root_modifiable_keys(rootkeys);
      }
  }

  void tearDown()
  {
    this->chroot = sbuild::chroot::chroot::ptr();
  }

  void setup_env_chroot (sbuild::environment& env)
  {
    env.add("CHROOT_NAME",           "test-name");
    env.add("SESSION_ID",            "test-name");
    env.add("CHROOT_DESCRIPTION",    "test-description");
    //    env.add("CHROOT_SCRIPT_CONFIG",  sbuild::normalname(std::string(SCHROOT_SYSCONF_DIR) + "/default/config"));
    env.add("CHROOT_PROFILE",        "default");
    env.add("CHROOT_PROFILE_DIR",    sbuild::normalname(std::string(SCHROOT_SYSCONF_DIR) + "/default"));
    env.add("CUSTOM_TEST1",          "testval");
    env.add("SETUP_CONFIG", "default/config");
    env.add("SETUP_COPYFILES", "default/copyfiles");
    env.add("SETUP_FSTAB", "default/fstab");
    env.add("SETUP_NSSDATABASES", "default/nssdatabases");
#ifdef SBUILD_FEATURE_UNSHARE
    env.add("UNSHARE_NET", "false");
    env.add("UNSHARE_SYSVIPC", "false");
    env.add("UNSHARE_SYSVSEM", "false");
    env.add("UNSHARE_UTS", "false");
#endif // SBUILD_FEATURE_UNSHARE
  }

  void setup_keyfile_chroot (sbuild::keyfile&   keyfile,
                             const std::string& group)
  {
    keyfile.set_value(group, "description", "test-description");
    keyfile.set_value(group, "aliases", "test-alias-1,test-alias-2");
    keyfile.set_value(group, "users", "user1,user2");
    keyfile.set_value(group, "root-users", "user3,user4");
    keyfile.set_value(group, "groups", "group1,group2");
    keyfile.set_value(group, "root-groups", "group3,group4");
    keyfile.set_value(group, "environment-filter",
                      SBUILD_DEFAULT_ENVIRONMENT_FILTER);
    keyfile.set_value(group, "command-prefix", "");
    keyfile.set_value(group, "profile", "default");
    keyfile.set_value(group, "message-verbosity", "quiet");
    keyfile.set_value(group, "preserve-environment", "false");
    keyfile.set_value(group, "shell", "/bin/testshell");
    keyfile.set_value(group, "user-modifiable-keys", "debian.dist,sbuild.purge,sbuild.resolver");
    keyfile.set_value(group, "root-modifiable-keys", "debian.apt-update");
    keyfile.set_value(group, "setup.config", "default/config");
    keyfile.set_value(group, "setup.copyfiles", "default/copyfiles");
    keyfile.set_value(group, "setup.fstab", "default/fstab");
    keyfile.set_value(group, "setup.nssdatabases", "default/nssdatabases");
    keyfile.set_value(group, "custom.test1", "testval");
#ifdef SBUILD_FEATURE_UNSHARE
    keyfile.set_value(group, "unshare.net", "false");
    keyfile.set_value(group, "unshare.sysvipc", "false");
    keyfile.set_value(group, "unshare.sysvsem", "false");
    keyfile.set_value(group, "unshare.uts", "false");
#endif // SBUILD_FEATURE_UNSHARE
  }

  void setup_keyfile_session (sbuild::keyfile&   keyfile,
                              const std::string& group)
  {
    setup_keyfile_chroot(keyfile, group);
    keyfile.set_value(group, "original-name", "test-name");
    keyfile.set_value(group, "users", "user1");
    keyfile.set_value(group, "root-users", "");
    keyfile.set_value(group, "groups", "");
    keyfile.set_value(group, "root-groups", "");
  }

#ifdef SBUILD_FEATURE_UNION
  void setup_keyfile_union_unconfigured (sbuild::keyfile&   keyfile,
                                         const std::string& group)
  {
    keyfile.set_value(group, "union-type", "none");
  }

  void setup_keyfile_union_configured (sbuild::keyfile&   keyfile,
                                       const std::string& group)
  {
    keyfile.set_value(group, "union-type", "aufs");
    keyfile.set_value(group, "union-mount-options", "union-mount-options");
    keyfile.set_value(group, "union-overlay-directory", "/overlay");
    keyfile.set_value(group, "union-underlay-directory", "/underlay");
  }

  void setup_keyfile_union_session (sbuild::keyfile&   keyfile,
                                    const std::string& group)
  {
    keyfile.set_value(group, "union-type", "aufs");
    keyfile.set_value(group, "union-mount-options", "union-mount-options");
    keyfile.set_value(group, "union-overlay-directory", "/overlay/test-union-session-name");
    keyfile.set_value(group, "union-underlay-directory", "/underlay/test-union-session-name");
  }
#endif // SBUILD_FEATURE_UNION

  void setup_keyfile_session_clone (sbuild::keyfile&   keyfile,
                                    const std::string& group)
  {
    keyfile.set_value(group, "description", chroot->get_description() + ' ' + _("(session chroot)"));
    keyfile.set_value(group, "aliases", "");
  }

  void setup_keyfile_source (sbuild::keyfile&   keyfile,
                             const std::string& group)
  {
    keyfile.set_value(group, "source-clone", "true");
    keyfile.set_value(group, "source-users", "suser1,suser2");
    keyfile.set_value(group, "source-root-users", "suser3,suser4");
    keyfile.set_value(group, "source-groups", "sgroup1,sgroup2");
    keyfile.set_value(group, "source-root-groups", "sgroup3,sgroup4");
  }

  void setup_keyfile_source_clone (sbuild::keyfile&   keyfile,
                                   const std::string& group)
  {
    keyfile.set_value(group, "description", chroot->get_description() + ' ' + _("(source chroot)"));
    keyfile.set_value(group, "users", "suser1,suser2");
    keyfile.set_value(group, "root-users", "suser3,suser4");
    keyfile.set_value(group, "groups", "sgroup1,sgroup2");
    keyfile.set_value(group, "root-groups", "sgroup3,sgroup4");
    keyfile.set_value(group, "aliases", "test-alias-1,test-alias-2");
  }

  void setup_keyfile_source_clone (sbuild::keyfile& keyfile)
  {
    setup_keyfile_source_clone(keyfile, chroot->get_name());
  }

  void setup_keyfile_session_source_clone (sbuild::keyfile&   keyfile,
                                           const std::string& group)
  {
    setup_keyfile_chroot(keyfile, group);
    keyfile.set_value(group, "name", "test-session-name");
    keyfile.set_value(group, "original-name", "test-name");
    keyfile.set_value(group, "selected-name", "test-session-name");
    keyfile.set_value(group, "aliases", "");
    keyfile.set_value(group, "description", chroot->get_description() + ' ' + _("(source chroot) (session chroot)"));
    keyfile.set_value(group, "original-name", "test-name");
    keyfile.set_value(group, "users", "user1");
    keyfile.set_value(group, "root-users", "");
    keyfile.set_value(group, "groups", "");
    keyfile.set_value(group, "root-groups", "");
  }

  void test_setup_env(const sbuild::environment& observed_environment,
                      const sbuild::environment& expected_environment)
  {
    CPPUNIT_ASSERT(observed_environment.size() != 0);
    CPPUNIT_ASSERT(expected_environment.size() != 0);

    std::set<std::string> expected;
    for (const auto& env : expected_environment)
      expected.insert(env.first);

    std::set<std::string> found;
    for (const auto& env : observed_environment)
      found.insert(env.first);

    sbuild::string_list missing;
    set_difference(expected.begin(), expected.end(),
                   found.begin(), found.end(),
                   std::back_inserter(missing));
    if (!missing.empty())
      {
        std::string value;
        for (const auto& env : missing)
          {
            expected_environment.get(env, value);
            std::cout << "Missing environment: "
                      << env << "=" << value << std::endl;
          }
      }
    CPPUNIT_ASSERT(missing.empty());

    sbuild::string_list extra;
    set_difference(found.begin(), found.end(),
                   expected.begin(), expected.end(),
                   std::back_inserter(extra));
    if (!extra.empty())
      {
        std::string value;
        for (const auto&  env : extra)
          {
            observed_environment.get(env, value);
            std::cout << "Additional environment: "
                      << env << "=" << value << std::endl;
          }
      }
    CPPUNIT_ASSERT(extra.empty());

    for (const auto& env : expected_environment)
      {
        std::string checkval;
        CPPUNIT_ASSERT(observed_environment.get(env.first, checkval) == true);

        if (checkval != env.second)
          std::cout << "Environment error (" << env.first << "): "
                    << checkval << " [observed] != "
                    << env.second << " [expected]"
                    << std::endl;
        CPPUNIT_ASSERT(checkval == env.second);
      }
  }

  void test_setup_env(sbuild::chroot::chroot::ptr& chroot,
                      const sbuild::environment&   expected_environment)
  {
    sbuild::environment observed_environment;
    chroot->setup_env(observed_environment);

    CPPUNIT_ASSERT(observed_environment.size() != 0);

    test_setup_env(observed_environment, expected_environment);
  }

  void test_setup_keyfile(const sbuild::keyfile& observed_keyfile,
                          const std::string&     observed_group,
                          const sbuild::keyfile& expected_keyfile,
                          const std::string&     expected_group)
  {
    CPPUNIT_ASSERT(observed_keyfile.get_keys(observed_group).size() != 0);
    CPPUNIT_ASSERT(expected_keyfile.get_keys(expected_group).size() != 0);


    sbuild::string_list expected_keys =
      expected_keyfile.get_keys(expected_group);
    std::set<std::string> expected(expected_keys.begin(), expected_keys.end());

    sbuild::string_list observed_keys =
      observed_keyfile.get_keys(observed_group);
    std::set<std::string> observed(observed_keys.begin(), observed_keys.end());

    sbuild::string_list missing;
    set_difference(expected.begin(), expected.end(),
                   observed.begin(), observed.end(),
                   std::back_inserter(missing));
    if (!missing.empty())
      {
        std::string value;
        for (const auto& key : missing)
          {
            expected_keyfile.get_value(expected_group, key, value);
            std::cout << "Missing keys: "
                      << key << "=" << value << std::endl;
          }
      }
    CPPUNIT_ASSERT(missing.empty());

    sbuild::string_list extra;
    set_difference(observed.begin(), observed.end(),
                   expected.begin(), expected.end(),
                   std::back_inserter(extra));
    if (!extra.empty())
      {
        std::string value;
        for (const auto& key : extra)
          {
            observed_keyfile.get_value(observed_group, key, value);
            std::cout << "Additional keys: "
                      << key << "=" << value << std::endl;
          }
      }
    CPPUNIT_ASSERT(extra.empty());

    for (const auto& key : expected_keys)
      {
        std::string expected_val;
        CPPUNIT_ASSERT(expected_keyfile.get_value(expected_group,
                                                  key, expected_val) == true);

        std::string observed_val;
        CPPUNIT_ASSERT(observed_keyfile.get_value(observed_group,
                                                  key, observed_val) == true);

        if (expected_val != observed_val)
          std::cout << "Keyfile error (" << key << "): "
                    << observed_val << " [observed] != "
                    << expected_val << " [expected]"
                    << std::endl;
        CPPUNIT_ASSERT(expected_val == observed_val);
      }
  }

  void test_setup_keyfile(sbuild::chroot::chroot::ptr& chroot,
                          const sbuild::keyfile&       expected_keyfile,
                          const std::string&           group)
  {
    sbuild::keyfile keys;
    chroot->get_keyfile(keys);

    test_setup_keyfile(keys, chroot->get_name(),
                       expected_keyfile, group);
  }

  // TODO: All chroot types should check text output matches.  If
  // possible, test chroot locking functions, but this is going to be
  // tricky without having root in many cases.

};

template<class T>
void test_list(T&                         itype,
               const sbuild::string_list& list,
               const sbuild::string_list& (T::*getter)(void) const,
               void (T::*setter)(sbuild::string_list const&))
{
  // Set items from list.
  (itype.*setter)(list);

  // Check set items exist, but make no assumptions about ordering.
  sbuild::string_list set_items = (itype.*getter)();

  sbuild::string_list orig_list = list;
  sort(orig_list.begin(), orig_list.end());
  sort(set_items.begin(), set_items.end());

  sbuild::string_list missing;
  set_symmetric_difference(orig_list.begin(), orig_list.end(),
                           set_items.begin(), set_items.end(),
                           std::back_inserter(missing));

  if (!missing.empty())
    for (const auto& item : missing)
      {
        std::cout << "Missing list item: " << item << std::endl;
      }
  // Ensure the test is working.
  CPPUNIT_ASSERT(missing.empty());
  CPPUNIT_ASSERT(set_items.size() == list.size());
}

#endif /* TEST_SBUILD_CHROOT_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
