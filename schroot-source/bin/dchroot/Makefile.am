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

if BUILD_DCHROOT
dchroot = bin/dchroot/dchroot
endif

bin_PROGRAMS += $(dchroot)

bin_dchroot_dchroot_SOURCES =		\
	bin/dchroot/session.h		\
	bin/dchroot/session.cc		\
	bin/dchroot/options.h		\
	bin/dchroot/options.cc		\
	bin/dchroot/main.h		\
	bin/dchroot/main.cc		\
	bin/dchroot/dchroot.cc
bin_dchroot_dchroot_LDADD = $(top_builddir)/lib/dchroot-common/libdchroot-common.la

install-exec-hook::
# Install setuid root.
	if [ -f "$(DESTDIR)$(bindir)/dchroot" ]; then \
	  chmod 4755 "$(DESTDIR)$(bindir)/dchroot"; \
	fi
