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

pkglibexec_PROGRAMS += libexec/listmounts/listmounts

libexec_listmounts_listmounts_SOURCES =	\
	libexec/listmounts/main.h	\
	libexec/listmounts/main.cc	\
	libexec/listmounts/options.h	\
	libexec/listmounts/options.cc	\
	libexec/listmounts/listmounts.cc
libexec_listmounts_listmounts_LDADD = \
	$(top_builddir)/lib/bin-common/libbin-common.la
