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

schroot_setupdata_DATA =		\
	etc/setup.d/common-config	\
	etc/setup.d/common-data		\
	etc/setup.d/common-functions

schroot_sysconf_setup_SCRIPTS =		\
	etc/setup.d/00check		\
	etc/setup.d/05file		\
	etc/setup.d/05btrfs		\
	etc/setup.d/05lvm		\
	etc/setup.d/05union		\
	etc/setup.d/10mount		\
	etc/setup.d/15binfmt		\
	etc/setup.d/15killprocs		\
	etc/setup.d/20copyfiles		\
	etc/setup.d/20nssdatabases	\
	etc/setup.d/50chrootname	\
	etc/setup.d/70services

install-exec-hook::
	$(MKDIR_P) "$(DESTDIR)$(schroot_sysconf_setupdir)"
	ln -sf "00check" "$(DESTDIR)$(schroot_sysconf_setupdir)/99check"

EXTRA_DIST +=					\
	$(schroot_setupdata_DATA)		\
	$(schroot_sysconf_setup_SCRIPTS)

