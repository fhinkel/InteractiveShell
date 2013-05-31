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

schroot_mountdir=$(localstatedir)/lib/$(PACKAGE)/mount
schroot_sessiondir=$(localstatedir)/lib/$(PACKAGE)/session
schroot_file_unpackdir=$(localstatedir)/lib/$(PACKAGE)/unpack
schroot_overlaydir=$(localstatedir)/lib/$(PACKAGE)/union/overlay
schroot_underlaydir=$(localstatedir)/lib/$(PACKAGE)/union/underlay
schroot_sysconfdir=$(sysconfdir)/schroot
schroot_sysconf_chrootdir=$(schroot_sysconfdir)/chroot.d
schroot_sysconf_setupdir=$(schroot_sysconfdir)/setup.d
schroot_setupdatadir=$(pkgdatadir)/setup

SCHROOT_CONF=$(schroot_sysconfdir)/schroot.conf

# Global options for use in all Makefiles.
AM_CXXFLAGS = -I$(top_builddir)/lib -I$(top_srcdir)/lib -I$(top_srcdir)/libexec -I$(top_srcdir)/bin $(LOCAL_CXXFLAGS) $(PTHREAD_CFLAGS) -pedantic -Wall -Wcast-align -Wwrite-strings -Wswitch-default -Wcast-qual -Wunused-variable -Wredundant-decls -Wctor-dtor-privacy -Wnon-virtual-dtor -Wreorder -Wold-style-cast -Woverloaded-virtual -fstrict-aliasing

AM_LDFLAGS = $(LOCAL_LDFLAGS) $(PTHREAD_LIBS)

# Note, if new definitions are added, also update the manual page
DEFS = -D_GNU_SOURCE -D_FILE_OFFSET_BITS=64 -D_LARGEFILE_SOURCE \
-DSCHROOT_LIBEXEC_DIR=\"$(pkglibexecdir)\" \
-DSCHROOT_MOUNT_DIR=\"$(schroot_mountdir)\" \
-DSCHROOT_SESSION_DIR=\"$(schroot_sessiondir)\" \
-DSCHROOT_FILE_UNPACK_DIR=\"$(schroot_file_unpackdir)\" \
-DSCHROOT_OVERLAY_DIR=\"$(schroot_overlaydir)\" \
-DSCHROOT_UNDERLAY_DIR=\"$(schroot_underlaydir)\" \
-DSCHROOT_SYSCONF_DIR=\"$(schroot_sysconfdir)\" \
-DSCHROOT_CONF=\"$(SCHROOT_CONF)\" \
-DSCHROOT_CONF_CHROOT_D=\"$(schroot_sysconf_chrootdir)\" \
-DSCHROOT_CONF_SETUP_D=\"$(schroot_sysconf_setupdir)\" \
-DSCHROOT_SETUP_DATA_DIR=\"$(schroot_setupdatadir)\" \
-DPACKAGE_LOCALE_DIR=\"$(localedir)\" \
-DSCHROOT_DATA_DIR=\"$(schroot_datadir)\" \
-DSCHROOT_MODULE_DIR=\"$(schroot_moduledir)\" \
-DLOCALEDIR=\"$(localedir)\"
