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

schroot_sysconf_DATA += \
	etc/schroot.conf

PROFILES =		\
	buildd		\
	default		\
	desktop		\
	minimal		\
	sbuild

profiles: etc/profiles-stamp
etc/profiles-stamp: etc/genprofile
	$(MKDIR_P) etc/profiles
	for profile in $(PROFILES); do 					\
	  $(srcdir)/etc/genprofile "$$profile" "$(PLATFORM)" "$(srcdir)/etc/profile-templates" "etc/profiles/$$profile";	\
	done
	touch $@

all-local:: profiles

install-data-hook::
	for profile in $(PROFILES); do 						\
	  $(MKDIR_P) "$(DESTDIR)$(schroot_sysconfdir)/$$profile";			\
	  for file in "etc/profiles/$$profile"/*; do						\
	    $(INSTALL_DATA) "$$file" "$(DESTDIR)$(schroot_sysconfdir)/$$profile";	\
	  done;									\
	done

clean-local::
	rm -rf etc/profiles
	rm -f etc/profiles-stamp

EXTRA_DIST +=			\
	$(schroot_sysconf_DATA)	\
	etc/genprofile		\
	etc/profile-templates

.PHONY: profiles
