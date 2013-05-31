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

if BUILD_DOXYGEN
doc: doc/sbuild doc/schroot
else
doc:
endif

doc/schroot: doc/schroot.log
doc/sbuild: doc/sbuild.log

doc/sbuild.log: doc/sbuild.dox $(top_srcdir)/configure
	rm -rf doc/sbuild/html
	$(DOXYGEN) doc/sbuild.dox
	touch $@
	@UNDOCUMENTED=$$(cat $@); \
	if [ -n "$$UNDOCUMENTED" ]; then \
	  echo "---------- UNDOCUMENTED CODE ----------"; \
	  echo "$$UNDOCUMENTED"; \
	fi

doc/schroot.log: doc/sbuild.log doc/schroot.dox $(top_srcdir)/configure
	rm -rf doc/schroot/html
	$(DOXYGEN) doc/schroot.dox
	touch $@
	@UNDOCUMENTED=$$(cat $@); \
	if [ -n "$$UNDOCUMENTED" ]; then \
	  echo "---------- UNDOCUMENTED CODE ----------"; \
	  echo "$$UNDOCUMENTED"; \
	fi


CLEANFILES +=		\
	doc/sbuild.log	\
	doc/schroot.log

clean-local::
	rm -rf doc/sbuild
	rm -rf doc/schroot

.PHONY: doc doc/sbuild doc/schroot
