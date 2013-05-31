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

noinst_LTLIBRARIES += lib/bin-common/libbin-common.la

lib_bin_common_libbin_common_la_SOURCES =	\
	lib/bin-common/main.h			\
	lib/bin-common/main.cc			\
	lib/bin-common/option-action.h		\
	lib/bin-common/option-action.cc		\
	lib/bin-common/options.h		\
	lib/bin-common/options.cc		\
	lib/bin-common/run.h
lib_bin_common_libbin_common_la_LIBADD = $(top_builddir)/lib/sbuild/libsbuild.la
