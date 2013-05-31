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

#include <sbuild/lock.h>

#include <iostream>

#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

#include <cppunit/extensions/HelperMacros.h>

using namespace CppUnit;

class test_file_lock : public TestFixture
{
  CPPUNIT_TEST_SUITE(test_file_lock);
  CPPUNIT_TEST(test_none_none_lock);
  CPPUNIT_TEST(test_none_shr_lock);
  CPPUNIT_TEST(test_none_excl_lock);
  CPPUNIT_TEST(test_shr_none_lock);
  CPPUNIT_TEST(test_shr_shr_lock);
  CPPUNIT_TEST_EXCEPTION(test_shr_excl_lock, sbuild::lock::error);
  CPPUNIT_TEST(test_excl_none_lock);
  CPPUNIT_TEST_EXCEPTION(test_excl_shr_lock, sbuild::lock::error);
  CPPUNIT_TEST_EXCEPTION(test_excl_excl_lock, sbuild::lock::error);
  CPPUNIT_TEST_SUITE_END();

protected:
  int fd;
  sbuild::file_lock *lck;

public:
  test_file_lock():
    TestFixture(),
    fd(-1),
    lck(0)
  {
    // Remove test file if it exists.
    unlink(TESTDATADIR "/filelock.ex1");
  }

  virtual ~test_file_lock()
  {}

  void setUp()
  {
    this->fd = open(TESTDATADIR "/filelock.ex1", O_RDWR|O_EXCL|O_CREAT, 0600);
    CPPUNIT_ASSERT(this->fd >= 0);

    ssize_t wsize = write(this->fd,
                          "This file exists in order to test "
                          "sbuild::file_lock locking.\n", 61);
    CPPUNIT_ASSERT(wsize == 61);

    this->lck = new sbuild::file_lock(this->fd);
    CPPUNIT_ASSERT(lck != 0);
  }

  void tearDown()
  {
    CPPUNIT_ASSERT(lck != 0);
    this->lck->unset_lock();
    delete this->lck;

    CPPUNIT_ASSERT(close(this->fd) == 0);
    CPPUNIT_ASSERT(unlink(TESTDATADIR "/filelock.ex1") == 0);
  }

  void test(sbuild::lock::type initial,
            sbuild::lock::type establish)
  {
    this->lck->unset_lock();
    int pid = fork();
    CPPUNIT_ASSERT(pid >= 0);
    if (pid == 0)
      {
        try
          {
            this->lck->set_lock(initial, 1);
            // Note: can cause unexpected success if < 4.  Set to 8 to
            // allow for slow or heavily-loaded machines.
            sleep(4);
            this->lck->unset_lock();
          }
        catch (const std::exception& e)
          {
            try
              {
                this->lck->unset_lock();
              }
            catch (const std::exception& ignore)
              {
              }
            std::cerr << "Child fail: " << e.what() << std::endl;
            _exit(EXIT_FAILURE);
          }
        _exit(EXIT_SUCCESS);
      }
    else
      {
        try
          {
            sleep(2);
            this->lck->set_lock(establish, 1);

            int status;
            CPPUNIT_ASSERT(waitpid(pid, &status, 0) >= 0);
            CPPUNIT_ASSERT(WIFEXITED(status) && WEXITSTATUS(status) == 0);
          }
        catch (const std::exception& e)
          {
            int status;
            waitpid(pid, &status, 0);
            throw;
          }
      }
  }

  void test_none_none_lock()
  {
    test(sbuild::lock::LOCK_NONE, sbuild::lock::LOCK_NONE);
  }

  void test_none_shr_lock()
  {
    test(sbuild::lock::LOCK_NONE, sbuild::lock::LOCK_SHARED);
  }

  void test_none_excl_lock()
  {
    test(sbuild::lock::LOCK_NONE, sbuild::lock::LOCK_EXCLUSIVE);
  }

  void test_shr_none_lock()
  {
    test(sbuild::lock::LOCK_SHARED, sbuild::lock::LOCK_NONE);
  }

  void test_shr_shr_lock()
  {
    test(sbuild::lock::LOCK_SHARED, sbuild::lock::LOCK_SHARED);
  }

  void test_shr_excl_lock()
  {
    test(sbuild::lock::LOCK_SHARED, sbuild::lock::LOCK_EXCLUSIVE);
  }

  void test_excl_none_lock()
  {
    test(sbuild::lock::LOCK_EXCLUSIVE, sbuild::lock::LOCK_NONE);
  }

  void test_excl_shr_lock()
  {
    test(sbuild::lock::LOCK_EXCLUSIVE, sbuild::lock::LOCK_SHARED);
  }

  void test_excl_excl_lock()
  {
    test(sbuild::lock::LOCK_EXCLUSIVE, sbuild::lock::LOCK_EXCLUSIVE);
  }
};

CPPUNIT_TEST_SUITE_REGISTRATION(test_file_lock);
