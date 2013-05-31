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

if BUILD_LIBDCHROOT
noinst_LTLIBRARIES += lib/dchroot-common/libdchroot-common.la
endif

lib_dchroot_common_libdchroot_common_la_SOURCES =	\
	lib/dchroot-common/main.h			\
	lib/dchroot-common/main.cc			\
	lib/dchroot-common/session.h			\
	lib/dchroot-common/session.cc
lib_dchroot_common_libdchroot_common_la_LIBADD = $(top_builddir)/lib/schroot-common/libschroot-common.la
