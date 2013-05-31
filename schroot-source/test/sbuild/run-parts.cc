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

#include <sbuild/nostream.h>
#include <sbuild/run-parts.h>
#include <sbuild/util.h>

#include <iostream>
#include <sstream>

#include <boost/filesystem/operations.hpp>

#include <cppunit/extensions/HelperMacros.h>

using namespace CppUnit;

class test_run_parts : public TestFixture
{
  CPPUNIT_TEST_SUITE(test_run_parts);
  CPPUNIT_TEST(test_construction);
  CPPUNIT_TEST_EXCEPTION(test_construction_fail, boost::filesystem::filesystem_error);
  CPPUNIT_TEST(test_run);
  CPPUNIT_TEST(test_run2);
  CPPUNIT_TEST(test_run3);
  CPPUNIT_TEST_SUITE_END();

  std::streambuf           *saved;
  sbuild::basic_nbuf<char> *monitor;

public:
  test_run_parts():
    TestFixture()
  {}

  void setUp()
  {
    this->monitor = new sbuild::basic_nbuf<char>();
    this->saved = std::cerr.std::ios::rdbuf(this->monitor);
  }

  void tearDown()
  {
    std::cerr.std::ios::rdbuf(this->saved);
    delete this->monitor;
  }


  virtual ~test_run_parts()
  {}

  void
  test_construction()
  {
    sbuild::run_parts rp(TESTDATADIR "/run-parts.ex1");
  }

  void
  test_construction_fail()
  {
    sbuild::run_parts rp(TESTDATADIR "/invalid_dir");
  }

  void test_run()
  {
    sbuild::run_parts rp(TESTDATADIR "/run-parts.ex1");

    int status;

    sbuild::string_list command;
    sbuild::environment env(environ);

    command.push_back("ok");
    status = rp.run(command, env);
    CPPUNIT_ASSERT(status == EXIT_SUCCESS);

    command.clear();
    command.push_back("fail");
    status = rp.run(command, env);
    CPPUNIT_ASSERT(status == EXIT_FAILURE);

    command.clear();
    command.push_back("fail2");
    status = rp.run(command, env);
    CPPUNIT_ASSERT(status == EXIT_FAILURE);
  }

  void test_run2()
  {
    sbuild::run_parts rp(TESTDATADIR "/run-parts.ex2");

    int status;

    sbuild::string_list command;
    sbuild::environment env(environ);

    command.push_back("ok");
    status = rp.run(command, env);
    CPPUNIT_ASSERT(status == EXIT_SUCCESS);
  }

  void test_run3()
  {
    sbuild::run_parts rp(TESTDATADIR "/run-parts.ex3");

    int status;

    sbuild::string_list command;
    sbuild::environment env(environ);

    command.push_back("ok");
    status = rp.run(command, env);
    CPPUNIT_ASSERT(status == EXIT_FAILURE);
  }

};

CPPUNIT_TEST_SUITE_REGISTRATION(test_run_parts);
