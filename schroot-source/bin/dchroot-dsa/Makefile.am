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

if BUILD_DCHROOT_DSA
dchroot_dsa = bin/dchroot-dsa/dchroot-dsa
endif

bin_PROGRAMS += $(dchroot_dsa)

bin_dchroot_dsa_dchroot_dsa_SOURCES =	\
	bin/dchroot-dsa/session.h	\
	bin/dchroot-dsa/session.cc	\
	bin/dchroot-dsa/options.h	\
	bin/dchroot-dsa/options.cc	\
	bin/dchroot-dsa/main.h		\
	bin/dchroot-dsa/main.cc		\
	bin/dchroot-dsa/dchroot-dsa.cc
bin_dchroot_dsa_dchroot_dsa_LDADD = $(top_builddir)/lib/dchroot-common/libdchroot-common.la

install-exec-hook::
# Install setuid root.
	if [ -f "$(DESTDIR)$(bindir)/dchroot-dsa" ]; then \
	  chmod 4755 "$(DESTDIR)$(bindir)/dchroot-dsa"; \
	fi
