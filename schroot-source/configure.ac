#                                                              -*- Autoconf -*-
# Copyright © 2004-2013  Roger Leigh <rleigh@debian.org>
#
# schroot is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# schroot is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see
# <http://www.gnu.org/licenses/>.
#
#####################################################################
#
# Process this file with autoconf to produce a configure script.
#
#####################################################################
dnl MAKING RELEASES (a step-by-step guide!)
dnl ===============
dnl
dnl Since the last release:
dnl 1. if only source code (not the interface) has changed, set
dnl      SBUILD_MICRO_VERSION += 1;
dnl      SBUILD_INTERFACE_AGE += 1;
dnl 2. if any functions have been added, removed, or changed, set
dnl      SBUILD_INTERFACE_AGE = 0;
dnl      SBUILD_CURRENT_INTERFACE += 1;
dnl 3. if interfaces have been added, set
dnl      SBUILD_BINARY_AGE += 1;
dnl 4. if interfaces have been removed, set
dnl      SBUILD_BINARY_AGE = 0;
dnl
dnl For more detailed information, see the libtool info documentation.
dnl
dnl m4 magic from Eric Blake <ebb9@byu.net>, prior to automake inclusion
AC_PREREQ(2.59)
dnl Quoting the first argument results in a bizarrely corrupted package tarname
AC_INIT(m4_esyscmd_s([sed -ne '/^Package:/{s/Package:[[:space:]][[:space:]]*//p;q}' VERSION]),
        m4_esyscmd_s([sed -ne '/^Version:/{s/Version:[[:space:]][[:space:]]*//p;q}' VERSION]),
        [buildd-tools-devel@lists.alioth.debian.org])
pushdef([SBUILD_CURRENT_INTERFACE], [1])
pushdef([SBUILD_INTERFACE_AGE],     [0])
pushdef([SBUILD_BINARY_AGE],        [0])
dnl For safety, check we are in the right directory by
dnl checking for a known unique file.
AC_CONFIG_SRCDIR([lib/sbuild/session.cc])
dnl Place auxilliary scripts here.
AC_CONFIG_AUX_DIR([scripts])
dnl Add config headers.
AC_CONFIG_HEADER([config.h])
AC_CONFIG_HEADER([lib/sbuild/config.h])

AC_COPYRIGHT(
[
Copyright © 2004-2013  Roger Leigh <rleigh@debian.org>

schroot is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation, either version 3 of the License, or (at your
option) any later version.

schroot is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
])

[SBUILD_CURRENT_INTERFACE]=SBUILD_CURRENT_INTERFACE
[SBUILD_INTERFACE_AGE]=SBUILD_INTERFACE_AGE
[SBUILD_BINARY_AGE]=SBUILD_BINARY_AGE
popdef([SBUILD_CURRENT_INTERFACE])
popdef([SBUILD_INTERFACE_AGE])
popdef([SBUILD_BINARY_AGE])

AC_SUBST([SBUILD_CURRENT_INTERFACE])
AC_SUBST([SBUILD_INTERFACE_AGE])
AC_SUBST([SBUILD_BINARY_AGE])

dnl Initialise automake stuff.
AM_INIT_AUTOMAKE([1.10 gnu -Wno-portability subdir-objects check-news dist-xz no-dist-gzip tar-pax])
m4_ifdef([AM_SILENT_RULES],[AM_SILENT_RULES([yes])])
RELEASE_DATE='m4_esyscmd_s(date --date='m4_esyscmd_s([sed -ne '/^Release-Date:/{s/Release-Date:[[:space:]][[:space:]]*//p;q}' VERSION])' '+%s')'
RELEASE_DATE_S='m4_esyscmd_s([sed -ne '/^Release-Date:/{s/Release-Date:[[:space:]][[:space:]]*//p;q}' VERSION])'
AC_DEFINE_UNQUOTED([RELEASE_DATE_S], ["$RELEASE_DATE_S"], [Package release date (string).])
AC_DEFINE_UNQUOTED([RELEASE_DATE], [$RELEASE_DATE], [Package release date (integer).])
AC_SUBST([RELEASE_DATE])
AC_SUBST([RELEASE_DATE_S])

AC_MSG_CHECKING([whether to enable dchroot compatibility])
AC_ARG_ENABLE([dchroot], [AS_HELP_STRING([--enable-dchroot], [Enable dchroot compatibility])],
              [ case "${enableval}" in
                yes) enable_dchroot_compat="yes" ;;
                no)  enable_dchroot_compat="no" ;;
                *) AC_MSG_RESULT([unknown])
                   AC_MSG_ERROR([bad value ${enableval} for --enable-dchroot]) ;;
                esac ],
              [ enable_dchroot_compat="no" ])
AC_MSG_RESULT([$enable_dchroot_compat])
AM_CONDITIONAL([BUILD_DCHROOT], [test "$enable_dchroot_compat" = "yes"])

AC_MSG_CHECKING([whether to enable dchroot-dsa compatibility])
AC_ARG_ENABLE([dchroot-dsa], [AS_HELP_STRING([--enable-dchroot-dsa], [Enable dchroot-dsa compatibility])],
              [ case "${enableval}" in
                yes) enable_dchroot_dsa_compat="yes" ;;
                no)  enable_dchroot_dsa_compat="no" ;;
                *) AC_MSG_RESULT([unknown])
                   AC_MSG_ERROR([bad value ${enableval} for --enable-dchroot-dsa]) ;;
                esac ],
              [ enable_dchroot_dsa_compat="no" ])
AC_MSG_RESULT([$enable_dchroot_dsa_compat])
AM_CONDITIONAL([BUILD_DCHROOT_DSA], [test "$enable_dchroot_dsa_compat" = "yes"])
AM_CONDITIONAL([BUILD_LIBDCHROOT], [test "$enable_dchroot_compat" = "yes" || test "$enable_dchroot_dsa_compat" = "yes"])

AC_MSG_CHECKING([whether to enable debugging messages])
AC_ARG_ENABLE([debug], [AS_HELP_STRING([--enable-debug], [Enable debugging messages])],
              [ case "${enableval}" in
                yes) enable_debug="yes" ;;
                no)  enable_debug="no" ;;
                *) AC_MSG_RESULT([unknown])
                   AC_MSG_ERROR([bad value ${enableval} for --enable-debug]) ;;
                esac ],
              [ enable_debug="no" ])
AC_MSG_RESULT([$enable_debug])
if test "$enable_debug" = "yes"; then
  AC_DEFINE_UNQUOTED([SBUILD_DEBUG], [1], [Enable debugging])
fi

default_environment_filter='^(BASH_ENV|CDPATH|ENV|HOSTALIASES|IFS|KRB5_CONFIG|KRBCONFDIR|KRBTKFILE|KRB_CONF|LD_.*|LOCALDOMAIN|NLSPATH|PATH_LOCALE|RES_OPTIONS|TERMINFO|TERMINFO_DIRS|TERMPATH)$'

AC_MSG_CHECKING([whether to enable environment filtering regex])
AC_ARG_ENABLE([environment-filter], [AS_HELP_STRING([--enable-environment-filter], [Enable default environment filtering (regex)])],
              [ case "${enableval}" in
                yes) enable_environment_filter="$default_environment_filter" ;;
                no)  enable_environment_filter="" ;;
                *) enable_environment_filter="${enableval}" ;;
                esac ],
              [ enable_environment_filter="$default_environment_filter" ])
AC_MSG_RESULT([$enable_environment_filter])
AH_TEMPLATE(SBUILD_DEFAULT_ENVIRONMENT_FILTER, [Default regular expression used to filter user environment])
AC_DEFINE_UNQUOTED([SBUILD_DEFAULT_ENVIRONMENT_FILTER], ["$enable_environment_filter"])

AC_MSG_CHECKING([whether to enable support for PAM authentication])
AC_ARG_ENABLE([pam], [AS_HELP_STRING([--enable-pam], [Enable support for PAM authentication (requires libpam)])],
              [ case "${enableval}" in
                yes) enable_pam="yes" ;;
                no)  enable_pam="no" ;;
                *) AC_MSG_RESULT([unknown])
                   AC_MSG_ERROR([bad value ${enableval} for --enable-pam]) ;;
                esac],
              [enable_pam="auto"])
AC_MSG_RESULT([$enable_pam])

AC_MSG_CHECKING([whether to enable support for block devices])
AC_ARG_ENABLE([block-device], [AS_HELP_STRING([--enable-block-device], [Enable support for block devices])],
              [ case "${enableval}" in
                yes) enable_blockdev="yes" ;;
                no)  enable_blockdev="no" ;;
                *) AC_MSG_RESULT([unknown])
                   AC_MSG_ERROR([bad value ${enableval} for --enable-blockdev]) ;;
                esac],
              [enable_blockdev="auto"])
AC_MSG_RESULT([$enable_blockdev])

AC_MSG_CHECKING([whether to enable support for LVM snapshots])
AC_ARG_ENABLE([lvm-snapshot], [AS_HELP_STRING([--enable-lvm-snapshot], [Enable support for LVM snapshots (requires LVM)])],
              [ case "${enableval}" in
                yes) enable_lvmsnapshot="yes"
                     enable_blockdev="yes" ;;
                no)  enable_lvmsnapshot="no" ;;
                *) AC_MSG_RESULT([unknown])
                   AC_MSG_ERROR([bad value ${enableval} for --enable-lvm-snapshot]) ;;
                esac],
              [enable_lvmsnapshot="auto"])
AC_MSG_RESULT([$enable_lvmsnapshot])

AC_MSG_CHECKING([whether to enable support for BTRFS snapshots])
AC_ARG_ENABLE([btrfs-snapshot], [AS_HELP_STRING([--enable-btrfs-snapshot], [Enable support for btrfs snapshots (requires btrfs)])],
              [ case "${enableval}" in
                yes) enable_btrfssnapshot="yes"
                     enable_blockdev="yes" ;;
                no)  enable_btrfssnapshot="no" ;;
                *) AC_MSG_RESULT([unknown])
                   AC_MSG_ERROR([bad value ${enableval} for --enable-btrfs-snapshot]) ;;
                esac],
              [enable_btrfssnapshot="auto"])
AC_MSG_RESULT([$enable_btrfssnapshot])

AC_MSG_CHECKING([whether to enable support for loopback mounts])
AC_ARG_ENABLE([loopback], [AS_HELP_STRING([--enable-loopback], [Enable support for loopback mounts])],
              [ case "${enableval}" in
                yes) enable_loopback="yes" ;;
                no)  enable_loopback="no" ;;
                *) AC_MSG_RESULT([unknown])
                   AC_MSG_ERROR([bad value ${enableval} for --enable-loopback]) ;;
                esac],
              [enable_loopback="auto"])
AC_MSG_RESULT([$enable_loopback])

AC_MSG_CHECKING([whether to enable support for union mounts])
AC_ARG_ENABLE([union], [AS_HELP_STRING([--enable-union], [Enable support for union mounts])],
              [ case "${enableval}" in
                yes) enable_union="yes" ;;
                no)  enable_union="no" ;;
                *) AC_MSG_RESULT([unknown])
                   AC_MSG_ERROR([bad value ${enableval} for --enable-union]) ;;
                esac],
              [enable_union="auto"])
AC_MSG_RESULT([$enable_union])

AC_MSG_CHECKING([whether to enable doxygen documentation])
AC_ARG_ENABLE([doxygen], [AS_HELP_STRING([--enable-doxygen], [Enable doxygen documentation])],
              [ case "${enableval}" in
                yes) enable_doxygen="yes" ;;
                no)  enable_doxygen="no" ;;
                *) AC_MSG_RESULT([unknown])
                   AC_MSG_ERROR([bad value ${enableval} for --enable-doxygen]) ;;
                esac],
              [ enable_doxygen="auto" ])
AC_MSG_RESULT([$enable_doxygen])

AC_MSG_CHECKING([for bash completion directory])
bashcompletiondir='${sysconfdir}/bash_completion.d'
AC_ARG_WITH([bash-completion-dir], [AS_HELP_STRING([--with-bash-completion-dir], [bash shell completion directory])],
              [bashcompletiondir="${withval}"])
AC_MSG_RESULT([$bashcompletiondir])
AC_SUBST([bashcompletiondir])

# Checks for programs.
AC_PROG_CXX
AC_LANG([C++])
ACX_PTHREAD([], [AC_MSG_ERROR([POSIX thread support is required for correct std::tr1::shared_ptr operation])])
AC_CANONICAL_HOST
AC_ENABLE_SHARED
AC_DISABLE_STATIC
AC_PROG_LIBTOOL
AM_GNU_GETTEXT_VERSION([0.16])
AM_GNU_GETTEXT([external])
AC_PATH_PROG([PO4A], [po4a])
AC_PATH_PROG([SOELIM], [soelim])
AC_PATH_PROG([FIND], [find])
AC_PATH_PROG([XARGS], [xargs])
HAVE_DOXYGEN="yes"
AC_PATH_PROG([DOXYGEN], [doxygen])
if test -z "$DOXYGEN"; then
  HAVE_DOXYGEN="no"
fi
HAVE_LVM="yes"
AC_PATH_PROG([LVCREATE], [lvcreate], [], [$PATH:/sbin:/usr/sbin])
AC_PATH_PROG([LVREMOVE], [lvremove], [], [$PATH:/sbin:/usr/sbin])
if test -z "$LVCREATE" || test -z "$LVREMOVE"; then
  HAVE_LVM="no"
fi
HAVE_BTRFS="yes"
AC_PATH_PROG([BTRFS], [btrfs], [], [$PATH:/sbin:/usr/sbin])
AC_PATH_PROG([BTRFSCTL], [btrfsctl], [], [$PATH:/sbin:/usr/sbin])
if test -z "$BTRFS" || test -z "$BTRFSCTL"; then
  HAVE_BTRFS="no"
fi
HAVE_LOOPBACK="yes"
AC_PATH_PROG([LOSETUP], [losetup], [], [$PATH:/sbin:/usr/sbin])
if test -z "$LOSETUP"; then
  HAVE_LOOPBACK="no"
fi


# Check for host platform
AC_MSG_CHECKING([for supported host platform type])
PLATFORM="generic"
case $host_os in
    linux*):
        PLATFORM="linux";;
    freebsd* | k*bsd*-gnu) :
        PLATFORM="freebsd";;
esac
AC_MSG_RESULT([$PLATFORM])
AC_SUBST([PLATFORM], [$PLATFORM])

AM_CONDITIONAL([PLATFORM_GENERIC], [test "$PLATFORM" = "generic"])
AM_CONDITIONAL([PLATFORM_LINUX], [test "$PLATFORM" = "linux"])
AM_CONDITIONAL([PLATFORM_FREEBSD], [test "$PLATFORM" = "freebsd"])

AH_TEMPLATE(SBUILD_PLATFORM, [Platform type, used to modify run-time platform-specific behaviour])
AC_DEFINE_UNQUOTED(SBUILD_PLATFORM, ["$PLATFORM"])

AH_TEMPLATE(SBUILD_HOST, [Host GNU architecture triplet])
AH_TEMPLATE(SBUILD_HOST_OS, [Host OS])
AH_TEMPLATE(SBUILD_HOST_VENDOR, [Host vendor])
AH_TEMPLATE(SBUILD_HOST_CPU, [Host CPU])
AC_DEFINE_UNQUOTED(SBUILD_HOST, ["$host"])
AC_DEFINE_UNQUOTED(SBUILD_HOST_OS, ["$host_os"])
AC_DEFINE_UNQUOTED(SBUILD_HOST_VENDOR, ["$host_vendor"])
AC_DEFINE_UNQUOTED(SBUILD_HOST_CPU, ["$host_cpu"])


# Checks for libraries.
AM_PATH_CPPUNIT([1.10.0], [HAVE_CPPUNIT=yes])
AM_CONDITIONAL([USE_UNIT_TESTS], [test -n "$HAVE_CPPUNIT"])

SCHROOT_CFLAGS=""
AC_SUBST([SCHROOT_CFLAGS])

# Checks for header files.
AC_CHECK_HEADERS([memory],, [AC_MSG_ERROR([std::shared_ptr (C++11) is not available, but is required by schroot])])
AC_CHECK_HEADERS([tuple],, [AC_MSG_ERROR([std::tuple (C++11) is not available, but is required by schroot])])

AC_CHECK_HEADERS([boost/format.hpp],, [AC_MSG_ERROR([Boost.Format (Boost C++ Libraries) is not installed, but is required by schroot])])
AC_CHECK_HEADERS([boost/iostreams/device/file_descriptor.hpp],, [AC_MSG_ERROR([Boost.Iostreams (Boost C++ Libraries) is not installed, but is required by schroot])])
AC_CHECK_HEADERS([boost/program_options.hpp],, [AC_MSG_ERROR([Boost.Program_options (Boost C++ Libraries) is not installed, but is required by schroot])])
AC_CHECK_HEADERS([boost/type_traits.hpp],, [AC_MSG_ERROR([Boost.TypeTraits (Boost C++ Libraries) is not installed, but is required by schroot])])


AC_CHECK_HEADERS([sched.h],
                 [UNSHARE_HEADER="yes"],
                 [UNSHARE_HEADER="no"])

AC_CHECK_HEADERS([sys/personality.h],
                 [PERSONALITY_HEADER="yes"],
                 [PERSONALITY_HEADER="no"])

AC_CHECK_HEADERS([security/pam_appl.h],
                 [PAM_HEADER="yes"],
                 [PAM_HEADER="no"])

# Checks for typedefs, structures, and compiler characteristics.

# Checks for library functions.

AC_CHECK_LIB([pam], [pam_authenticate],
             [PAM_LIBS="-lpam"
              PAM_FUNC="yes"],
             [PAM_LIBS=""
              PAM_FUNC="no"])
AC_SUBST([PAM_LIBS])

AC_CHECK_FUNC([unshare],
              [UNSHARE_FUNC="yes"],
              [UNSHARE_FUNC="no"])

# Determine which features to enable.
AC_MSG_CHECKING([whether to build unshare support])
BUILD_UNSHARE="yes"
if test "$UNSHARE_HEADER" = "no"; then
  BUILD_UNSHARE="no"
fi
if test "$UNSHARE_FUNC" = "no"; then
  BUILD_UNSHARE="no"
fi
AC_MSG_RESULT([$BUILD_UNSHARE])

AM_CONDITIONAL([BUILD_UNSHARE], [test "$BUILD_UNSHARE" = "yes"])
AH_TEMPLATE(SBUILD_FEATURE_UNSHARE, [Set if unshare support is present])
if test "$BUILD_UNSHARE" = "yes"; then
  AC_DEFINE(SBUILD_FEATURE_UNSHARE, 1)
fi

AC_CHECK_FUNC([personality],
              [PERSONALITY_FUNC="yes"],
              [PERSONALITY_FUNC="no"])

# Determine which features to enable.
AC_MSG_CHECKING([whether to build personality support])
BUILD_PERSONALITY="yes"
if test "$PERSONALITY_HEADER" = "no"; then
  BUILD_PERSONALITY="no"
fi
if test "$PERSONALITY_FUNC" = "no"; then
  BUILD_PERSONALITY="no"
fi
AC_MSG_RESULT([$BUILD_PERSONALITY])

AM_CONDITIONAL([BUILD_PERSONALITY], [test "$BUILD_PERSONALITY" = "yes"])
AH_TEMPLATE(SBUILD_FEATURE_PERSONALITY, [Set if personality support is present])
if test "$BUILD_PERSONALITY" = "yes"; then
  AC_DEFINE(SBUILD_FEATURE_PERSONALITY, 1)
fi

AC_MSG_CHECKING([whether to build PAM support])
BUILD_PAM="yes"
if test "$enable_pam" = "yes"; then
  if test "$PAM_HEADER" = "no"; then
    BUILD_PAM="no"
    AC_MSG_FAILURE([libpam (Linux-PAM) is not installed, but is required by schroot])
  fi
  if test "$PAM_FUNC" = "no"; then
    BUILD_PAM="no"
    AC_MSG_FAILURE([libpam (Linux-PAM) is not installed, but is required by schroot])
  fi
elif test "$enable_pam" = "no"; then
    BUILD_PAM="no"
elif test "$enable_pam" = "auto"; then
  if test "$PAM_HEADER" = "no"; then
    BUILD_PAM="no"
  fi
  if test "$PAM_FUNC" = "no"; then
    BUILD_PAM="no"
  fi
fi
AC_MSG_RESULT([$BUILD_PAM])

AM_CONDITIONAL([BUILD_PAM], [test "$BUILD_PAM" = "yes"])
AH_TEMPLATE(SBUILD_FEATURE_PAM, [Set if PAM support is available])
if test "$BUILD_PAM" = "yes"; then
  AC_DEFINE(SBUILD_FEATURE_PAM, 1)
else
  PAM_LIBS=""
fi

AC_MSG_CHECKING([whether to build block-device support])
BUILD_BLOCKDEV="yes"
if test "$enable_blockdev" = "no"; then
    BUILD_BLOCKDEV="no"
fi
AC_MSG_RESULT([$BUILD_BLOCKDEV])

AM_CONDITIONAL([BUILD_BLOCKDEV], [test "$BUILD_BLOCKDEV" = "yes"])
AH_TEMPLATE(SBUILD_FEATURE_BLOCKDEV, [Set if the block-device chroot type is present])
if test "$BUILD_BLOCKDEV" = "yes"; then
  AC_DEFINE(SBUILD_FEATURE_BLOCKDEV, 1)
fi

AC_MSG_CHECKING([whether to build lvm-snapshot support])
BUILD_LVMSNAP="yes"
if test "$enable_lvmsnapshot" = "yes"; then
  if test "$HAVE_LVM" = "no"; then
    BUILD_LVMSNAP="no"
    AC_MSG_FAILURE([LVM (lvm) is not installed, but is required by schroot])
  fi
elif test "$enable_lvmsnapshot" = "no"; then
    BUILD_LVMSNAP="no"
elif test "$enable_lvmsnapshot" = "auto"; then
  if test "$HAVE_LVM" = "no"; then
    BUILD_LVMSNAP="no"
  fi
fi
AC_MSG_RESULT([$BUILD_LVMSNAP])

AM_CONDITIONAL([BUILD_LVMSNAP], [test "$BUILD_LVMSNAP" = "yes"])
AH_TEMPLATE(SBUILD_FEATURE_LVMSNAP, [Set if the lvm-snapshot chroot type is present])
if test "$BUILD_LVMSNAP" = "yes"; then
  AC_DEFINE(SBUILD_FEATURE_LVMSNAP, 1)
fi

AC_MSG_CHECKING([whether to build btrfs-snapshot support])
BUILD_BTRFSSNAP="yes"
if test "$enable_btrfssnapshot" = "yes"; then
  if test "$HAVE_BTRFS" = "no"; then
    BUILD_BTRFSSNAP="no"
    AC_MSG_FAILURE([BTRFS (btrfs) is not installed, but is required by schroot])
  fi
elif test "$enable_btrfssnapshot" = "no"; then
    BUILD_BTRFSSNAP="no"
elif test "$enable_btrfssnapshot" = "auto"; then
  if test "$HAVE_BTRFS" = "no"; then
    BUILD_BTRFSSNAP="no"
  fi
fi
AC_MSG_RESULT([$BUILD_BTRFSSNAP])

AM_CONDITIONAL([BUILD_BTRFSSNAP], [test "$BUILD_BTRFSSNAP" = "yes"])
AH_TEMPLATE(SBUILD_FEATURE_BTRFSSNAP, [Set if the btrfs-snapshot chroot type is present])
if test "$BUILD_BTRFSSNAP" = "yes"; then
  AC_DEFINE(SBUILD_FEATURE_BTRFSSNAP, 1)
fi

AC_MSG_CHECKING([whether to build loopback support])
BUILD_LOOPBACK="yes"
if test "$enable_loopbackshot" = "yes"; then
  if test "$HAVE_LOOPBACK" = "no"; then
    BUILD_LOOPBACK="no"
    AC_MSG_FAILURE([Loopback support is not avilable, but is required by schroot])
  fi
elif test "$enable_loopbackshot" = "no"; then
    BUILD_LOOPBACK="no"
elif test "$enable_loopbackshot" = "auto"; then
  if test "$HAVE_LOOPBACK" = "no"; then
    BUILD_LOOPBACK="no"
  fi
fi
AC_MSG_RESULT([$BUILD_LOOPBACK])

AM_CONDITIONAL([BUILD_LOOPBACK], [test "$BUILD_LOOPBACK" = "yes"])
AH_TEMPLATE(SBUILD_FEATURE_LOOPBACK, [Set if the loopback chroot type is present])
if test "$BUILD_LOOPBACK" = "yes"; then
  AC_DEFINE(SBUILD_FEATURE_LOOPBACK, 1)
fi

AC_MSG_CHECKING([whether to build union support])
BUILD_UNION="yes"
if test "$enable_union" = "yes"; then
  :
elif test "$enable_union" = "no"; then
  BUILD_UNION="no"
elif test "$enable_union" = "auto"; then
  BUILD_UNION="yes"
fi
AC_MSG_RESULT([$BUILD_UNION])

AM_CONDITIONAL([BUILD_UNION], [test "$BUILD_UNION" = "yes"])
AH_TEMPLATE(SBUILD_FEATURE_UNION, [Set if the union filesystem type is present])
if test "$BUILD_UNION" = "yes"; then
  AC_DEFINE(SBUILD_FEATURE_UNION, 1)
fi

AC_MSG_CHECKING([whether to build doxygen documentation])
BUILD_DOXYGEN="yes"
if test "$enable_doxygen" = "yes"; then
  :
elif test "$enable_doxygen" = "no"; then
  BUILD_DOXYGEN="no"
elif test "$enable_doxygen" = "auto"; then
  if test "$HAVE_DOXYGEN" = "no"; then
    BUILD_DOXYGEN="no"
  fi
fi
AC_MSG_RESULT([$BUILD_DOXYGEN])

AM_CONDITIONAL([BUILD_DOXYGEN], [test "$BUILD_DOXYGEN" = "yes"])

AC_MSG_CHECKING([for boost::program_options::variables_map in -lboost_program_options])
saved_LIBS="${LIBS}"
LIBS="${saved_LIBS} -lboost_program_options"

AC_DEFUN([BOOST_PROGRAM_OPTIONS_TEST_HEADER],
[#include <boost/program_options.hpp>
])
AC_DEFUN([BOOST_PROGRAM_OPTIONS_TEST_BODY],
[boost::program_options::variables_map dummy()
])

AC_LINK_IFELSE([AC_LANG_PROGRAM([BOOST_PROGRAM_OPTIONS_TEST_HEADER],
                                [BOOST_PROGRAM_OPTIONS_TEST_BODY])],
               [AC_MSG_RESULT([yes])
                BOOST_LIBS="${BOOST_LIBS} -lboost_program_options"],
               [LIBS="${saved_LIBS} -lboost_program_options-mt"
                AC_LINK_IFELSE([AC_LANG_PROGRAM([BOOST_PROGRAM_OPTIONS_TEST_HEADER],
                                                [BOOST_PROGRAM_OPTIONS_TEST_BODY])],
                               [AC_MSG_RESULT([yes])
                                BOOST_LIBS="${BOOST_LIBS} -lboost_program_options-mt"],
                               [AC_MSG_RESULT([no])
                                AC_MSG_FAILURE([libboost_program_options (Boost C++ Libraries) is not installed, but is required by schroot])])])
LIBS="${saved_LIBS}"

AC_MSG_CHECKING([for boost::program_options::options_description::options() in -lboost_program_options])
saved_LIBS="${LIBS}"
LIBS="${saved_LIBS} -lboost_program_options"

AC_DEFUN([BOOST_PROGRAM_OPTIONS_TEST_HEADER],
[#include <boost/program_options.hpp>
])
AC_DEFUN([BOOST_PROGRAM_OPTIONS_DESCRIPTION_TEST_BODY],
[boost::program_options::options_description testgrp("test group");
bool notused = testgrp.options().empty();
])

AC_LINK_IFELSE([AC_LANG_PROGRAM([BOOST_PROGRAM_OPTIONS_TEST_HEADER],
                                [BOOST_PROGRAM_OPTIONS_DESCRIPTION_TEST_BODY])],
               [AC_MSG_RESULT([yes])
                BOOST_PROGRAM_OPTIONS_DESCRIPTION_METHODS="current"],
               [LIBS="${saved_LIBS} -lboost_program_options-mt"
                AC_LINK_IFELSE([AC_LANG_PROGRAM([BOOST_PROGRAM_OPTIONS_TEST_HEADER],
                                                [BOOST_PROGRAM_OPTIONS_DESCRIPTION_TEST_BODY])],
                               [AC_MSG_RESULT([yes])
                                BOOST_PROGRAM_OPTIONS_DESCRIPTION_METHODS="current"],
                               [AC_MSG_RESULT([no])
                                BOOST_PROGRAM_OPTIONS_DESCRIPTION_METHODS="old"])])
LIBS="${saved_LIBS}"
AH_TEMPLATE(BOOST_PROGRAM_OPTIONS_DESCRIPTION_OLD, [Set if boost::program_options::options_description::options() is not available])
if test "$BOOST_PROGRAM_OPTIONS_DESCRIPTION_METHODS" = "old"; then
  AC_DEFINE(BOOST_PROGRAM_OPTIONS_DESCRIPTION_OLD, 1)
fi

AC_DEFUN([BOOST_PROGRAM_OPTIONS_VALIDATION_TEST_BODY],
[boost::program_options::validation_error err(boost::program_options::validation_error::invalid_option, "error");
])
AC_DEFUN([BOOST_PROGRAM_OPTIONS_VALIDATION_TEST_BODY_OLD],
[boost::program_options::validation_error err("error");
])

AC_MSG_CHECKING([for boost::program_options::validation_error in -lboost_program_options])
saved_LIBS="${LIBS}"
LIBS="${saved_LIBS} -lboost_program_options"
AC_LINK_IFELSE([AC_LANG_PROGRAM([BOOST_PROGRAM_OPTIONS_TEST_HEADER],
                                [BOOST_PROGRAM_OPTIONS_VALIDATION_TEST_BODY])],
               [AC_MSG_RESULT([yes (Boost >= 1.42)])
                BOOST_PROGRAM_OPTIONS_VALIDATION_ERROR="current"],
               [LIBS="${saved_LIBS} -lboost_program_options-mt"
                AC_LINK_IFELSE([AC_LANG_PROGRAM([BOOST_PROGRAM_OPTIONS_TEST_HEADER],
                                                [BOOST_PROGRAM_OPTIONS_VALIDATION_TEST_BODY_OLD])],
                               [AC_MSG_RESULT([yes (Boost < 1.42)])
                                BOOST_PROGRAM_OPTIONS_VALIDATION_ERROR="old"],
                               [AC_MSG_RESULT([no])
                                AC_MSG_FAILURE([libboost_program_options (Boost C++ Libraries) is not installed, but is required by schroot])])])
LIBS="${saved_LIBS}"
AH_TEMPLATE(BOOST_PROGRAM_OPTIONS_VALIDATION_ERROR_OLD, [Set if boost::program_options::validation error uses old construction semantics])
if test "$BOOST_PROGRAM_OPTIONS_VALIDATION_ERROR" = "old"; then
  AC_DEFINE(BOOST_PROGRAM_OPTIONS_VALIDATION_ERROR_OLD, 1)
fi

dnl Note the use of quadrigraphs to quote [ and ] in regexes.

AC_DEFUN([STD_REGEX_TEST_HEADER],
[#include <regex>
])
AC_DEFUN([STD_REGEX_TEST_BODY],
[std::regex foo("^foo@<:@bar@:>@$");
std::regex bar("^foo@<:@bar@:>@$", std::regex::extended);
std::regex check("^@<:@^:/,.@:>@@<:@^:/,@:>@*$", std::regex::extended);
])
AC_DEFUN([STD_REGEX_TEST_BODY_BROKEN],
[std::regex foo("^foo@<:@bar@:>@$");
std::regex bar("^foo@<:@bar@:>@$", std::regex::extended);
])
AC_DEFUN([TR1_REGEX_TEST_HEADER],
[#include <tr1/regex>
])
AC_DEFUN([TR1_REGEX_TEST_BODY],
[std::tr1::regex foo("^foo@<:@bar@:>@$");
std::tr1::regex bar("^foo@<:@bar@:>@$", std::tr1::regex::extended);
std::tr1::regex check("^@<:@^:/,.@:>@@<:@^:/,@:>@*$", std::tr1::regex::extended);
])
AC_DEFUN([TR1_REGEX_TEST_BODY_BROKEN],
[std::tr1::regex foo("^foo@<:@bar@:>@$");
std::tr1::regex bar("^foo@<:@bar@:>@$", std::tr1::regex::extended);
])
AC_DEFUN([BOOST_REGEX_TEST_HEADER],
[#include <boost/regex.hpp>
])
AC_DEFUN([BOOST_REGEX_TEST_BODY],
[boost::regex("^foo@<:@bar@:>@$");
boost::regex bar("^foo@<:@bar@:>@$", boost::regex::extended);
])

AH_TEMPLATE(HAVE_REGEX_REGEX, [Set if the <regex> header file includes std::regex])
AC_MSG_CHECKING([for std::regex])

AC_RUN_IFELSE([AC_LANG_PROGRAM([STD_REGEX_TEST_HEADER],
                               [STD_REGEX_TEST_BODY])],
              [AC_MSG_RESULT([yes])
               AC_DEFINE(HAVE_REGEX_REGEX, 1)],
              [dnl Check if std::regex is present but broken.
               AC_LINK_IFELSE([AC_LANG_PROGRAM([STD_REGEX_TEST_HEADER],
                                               [STD_REGEX_TEST_BODY_BROKEN])],
                              [AC_MSG_RESULT([broken])],
                              [AC_MSG_RESULT([no])])
                               AC_MSG_CHECKING([for std::tr1::regex])
               AC_RUN_IFELSE([AC_LANG_PROGRAM([TR1_REGEX_TEST_HEADER],
                                              [TR1_REGEX_TEST_BODY])],
                             [AC_MSG_RESULT([yes])
                              AC_DEFINE(HAVE_REGEX_REGEX, 1)],
                             [dnl Check if std::tr1::regex is present but broken.
                              AC_LINK_IFELSE([AC_LANG_PROGRAM([TR1_REGEX_TEST_HEADER],
                                                              [TR1_REGEX_TEST_BODY_BROKEN])],
                                             [AC_MSG_RESULT([broken])],
                                             [AC_MSG_RESULT([no])])
                              AC_MSG_CHECKING([for boost::regex in -lboost_regex])
                              saved_LIBS="${LIBS}"
                              LIBS="${saved_LIBS} -lboost_regex"
                              AC_LINK_IFELSE([AC_LANG_PROGRAM([BOOST_REGEX_TEST_HEADER],
                                                              [BOOST_REGEX_TEST_BODY])],
                                             [AC_MSG_RESULT([yes])
                                              BOOST_LIBS="${BOOST_LIBS} -lboost_regex"],
                                             [LIBS="${saved_LIBS} -lboost_regex-mt"
                                              AC_LINK_IFELSE([AC_LANG_PROGRAM([BOOST_REGEX_TEST_HEADER],
                                                                              [BOOST_REGEX_TEST_BODY])],
                                                             [AC_MSG_RESULT([yes])
                                                              BOOST_LIBS="${BOOST_LIBS} -lboost_regex-mt"],
                                                             [AC_MSG_RESULT([no])
                                                              AC_MSG_FAILURE([libboost_regex (Boost C++ Libraries) is not installed, but is required by schroot])])])
                              LIBS="${saved_LIBS}"
])])

AC_DEFUN([BOOST_IOSTREAMS_TEST_HEADER],
[#include <boost/iostreams/device/file_descriptor.hpp>
#include <boost/iostreams/stream.hpp>
])
AC_DEFUN([BOOST_IOSTREAMS_TEST_BODY],
[boost::iostreams::stream<boost::iostreams::file_descriptor> fdstream;
])

AC_MSG_CHECKING([for boost::iostreams in -lboost_iostreams])
saved_LIBS="${LIBS}"
LIBS="${saved_LIBS} -lboost_iostreams"
AC_LINK_IFELSE([AC_LANG_PROGRAM([BOOST_IOSTREAMS_TEST_HEADER],
                                [BOOST_IOSTREAMS_TEST_BODY])],
               [AC_MSG_RESULT([yes])
                BOOST_LIBS="${BOOST_LIBS} -lboost_iostreams"],
               [LIBS="${saved_LIBS} -lboost_iostreams-mt"
                AC_LINK_IFELSE([AC_LANG_PROGRAM([BOOST_IOSTREAMS_TEST_HEADER],
                                                [BOOST_IOSTREAMS_TEST_BODY])],
                               [AC_MSG_RESULT([yes])
                                BOOST_LIBS="${BOOST_LIBS} -lboost_iostreams-mt"],
                               [AC_MSG_RESULT([no])
                                AC_MSG_FAILURE([libboost_iostreams (Boost C++ Libraries) is not installed, but is required by schroot])])])
LIBS="${saved_LIBS}"

AC_DEFUN([BOOST_IOSTREAMS_FILEDES_TEST_HEADER],
[#include <boost/iostreams/device/file_descriptor.hpp>
#include <boost/iostreams/stream.hpp>
#include <unistd.h>
])
AC_DEFUN([BOOST_IOSTREAMS_FILEDES_TEST_BODY],
[boost::iostreams::file_descriptor_sink dummy(STDOUT_FILENO, boost::iostreams::close_handle);
])

AC_MSG_CHECKING([for boost::iostreams::file_descriptor_source in -lboost_iostreams])
saved_LIBS="${LIBS}"
LIBS="${saved_LIBS} -lboost_iostreams"
AC_LINK_IFELSE([AC_LANG_PROGRAM([BOOST_IOSTREAMS_FILEDES_TEST_HEADER],
                                [BOOST_IOSTREAMS_FILEDES_TEST_BODY])],
               [AC_MSG_RESULT([yes (Boost >= 1.44)])
                BOOST_IOSTREAMS_CLOSE_HANDLE="current"
                BOOST_LIBS="${BOOST_LIBS} -lboost_iostreams"],
               [LIBS="${saved_LIBS} -lboost_iostreams-mt"
                AC_LINK_IFELSE([AC_LANG_PROGRAM([BOOST_IOSTREAMS_FILEDES_TEST_HEADER],
                                                [BOOST_IOSTREAMS_FILEDES_TEST_BODY])],
                               [AC_MSG_RESULT([yes (Boost >= 1.44)])
                                BOOST_IOSTREAMS_CLOSE_HANDLE="current"
                                BOOST_LIBS="${BOOST_LIBS} -lboost_iostreams-mt"],
                               [AC_MSG_RESULT([yes (Boost < 1.44)])
                                BOOST_IOSTREAMS_CLOSE_HANDLE="old"])])
LIBS="${saved_LIBS}"
AH_TEMPLATE(BOOST_IOSTREAMS_CLOSE_HANDLE_OLD, [Set if boost::iostreams::file_descriptor close_handle is not available])
if test "$BOOST_IOSTREAMS_CLOSE_HANDLE" = "old"; then
  AC_DEFINE(BOOST_IOSTREAMS_CLOSE_HANDLE_OLD, 1)
fi

AC_DEFUN([BOOST_FILESYSTEM_TEST_HEADER],
[#include <boost/filesystem.hpp>
])
AC_DEFUN([BOOST_FILESYSTEM_TEST_BODY],
[boost::filesystem::is_directory("/");
])

AC_MSG_CHECKING([for boost::filesystem in -lboost_filesystem])
saved_LIBS="${LIBS}"
LIBS="${saved_LIBS} -lboost_filesystem -lboost_system"
AC_LINK_IFELSE([AC_LANG_PROGRAM([BOOST_FILESYSTEM_TEST_HEADER],
                                [BOOST_FILESYSTEM_TEST_BODY])],
               [AC_MSG_RESULT([yes])
                BOOST_FILESYSTEM_LIBS="-lboost_filesystem -lboost_system"],
               [LIBS="${saved_LIBS} -lboost_filesystem-mt -lboost_system-mt"
                AC_LINK_IFELSE([AC_LANG_PROGRAM([BOOST_FILESYSTEM_TEST_HEADER],
                                                [BOOST_FILESYSTEM_TEST_BODY])],
                               [AC_MSG_RESULT([yes])
                                BOOST_FILESYSTEM_LIBS="-lboost_filesystem-mt -lboost_system-mt"],
                               [AC_MSG_RESULT([no])
                                AC_MSG_FAILURE([libboost_filesystem (Boost C++ Libraries) is not installed, but is required by schroot])])])
LIBS="${saved_LIBS}"

AC_SUBST([BOOST_LIBS])
AC_SUBST([BOOST_FILESYSTEM_LIBS])

dnl Configure which files to generate.
AC_CONFIG_FILES([doc/sbuild.dox])
AC_CONFIG_FILES([doc/schroot.dox])
AC_CONFIG_FILES([po/Makefile.in])
AC_CONFIG_FILES([lib/sbuild/sbuild.pc])
AC_CONFIG_FILES([scripts/po-notify])
AC_CONFIG_FILES([Makefile])
dnl Output the generated config.status script.
AC_OUTPUT
