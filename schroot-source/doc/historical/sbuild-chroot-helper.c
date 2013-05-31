/*
 * This program file is included solely for sentimental and historical
 * reasons.  It should not be used.
 *
 * This C program is the earliest available incarnation of schroot,
 * dating from 11/05/2005, from before it was put under version
 * control (GNU Arch back then, rather than git today) and before the
 * initial 0.1.0 release.  In fact, it was then known as
 * "sbuild-chroot-helper", until it was renamed to the shorter and
 * less unwieldy "schroot" a few weeks later.  At this point, schroot
 * is an incomplete but partly-functional work-in-progress:
 *
 * • The chroot location is hard-coded
 * • The configuration file is hard-coded
 * • The configuration file is read but not actually used
 * • The command-line options are mostly non-functional
 * • Running commands is not permitted; only a login shell
 * • It lacks sessions
 * • No PAM support
 * • No setup scripts (no filesystem mounting and other setup)
 * • Only "plain" type chroots are supported
 * • Written in plain C using GLib (we live and learn from our mistakes)
 *
 * From this humble start, schroot rapidly took off.  Over the next
 * year it acquired most of the core features seen today.  Just six
 * months after writing in GLib/GObject-based C, it was converted
 * entirely to C++ using Boost, which vastly improved both the code
 * quality and its maintainability.
 *
 * This version is just 231 lines of C, while 0.1.0 is 2064 lines of
 * C.  In comparison, the current version of schroot (1.4.19 at the
 * time of writing) weighs in at 19880 lines of C++.  The current
 * schroot is not as fast as it was back then, but nowadays it does so
 * much more, and is used as an indispensable tool for the daily work
 * of thousands of people, including playing a critical role in the
 * Debian build dæmon network, where it is used to maintain and build
 * Debian packages in dedicated build chroots.
 *
 * It's been an interesting and enjoyable 5½ years creating a tool
 * initially just for my own use with sbuild, but which really caught
 * people's imaginations, and was put to all sorts of exciting and
 * novel uses.  Without the valuable input from lots of different
 * people who all wanted schroot to do something different, its
 * quality and feature set would never have become so great.  I hope
 * that schroot will continue to be used and improve over the coming
 * years!
 *
 *         Roger Leigh
 *         15/01/2011
 *
 *****************************************************************************/

/*
 * sbuild-chroot-helper.c:
 * Securely enter a chroot and exec a login shell or user command
 * Copyright © 2002,2005  Roger Leigh <rleigh@debian.org>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307 USA
 *
 *****************************************************************************/

#define _GNU_SOURCE
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <errno.h>
#include <stdio.h>

#include <sys/types.h>
#include <sys/stat.h>
#include <grp.h>
#include <pwd.h>
#include <fcntl.h>
#include <unistd.h>

#include <glib.h>

#define SBUILD_GROUP "sbuild"
#define CHROOT "/usr/local/chroot/unstable"

typedef struct _SbuildChroot SbuildChroot;

struct SbuildChroot
{
  char *name;
  char *path;
};

typedef enum
{
  SBUILD_CONFIG_FILE_ERROR_STAT_FAIL,
  SBUILD_CONFIG_FILE_ERROR_OWNERSHIP,
  SBUILD_CONFIG_FILE_ERROR_PERMISSIONS,
  SBUILD_CONFIG_FILE_ERROR_NOT_REGULAR
} SbuildConfigFileError;

#define SBUILD_CONFIG_FILE_ERROR sbuild_config_file_error_quark()

GQuark
sbuild_config_file_error_quark (void)
{
  static GQuark error_quark = 0;

  if (error_quark == 0)
    error_quark = g_quark_from_static_string ("sbuild-config-file-error-quark");

  return error_quark;
}


static struct {
  const char *newroot;
  gboolean preserve;
  gboolean quiet;
  gboolean list;
  gboolean info;
  gboolean all;
} opt;

static GOptionEntry entries[] =
{
  { "all", 'a', 0, G_OPTION_ARG_NONE, &opt.all, "Run command in all chroots", NULL },
  { "chroot", 'c', 0, G_OPTION_ARG_STRING, &opt.newroot, "Use specified chroot", "chroot" },
  { "list", 'l', 0, G_OPTION_ARG_NONE, &opt.list, "List available chroots", NULL },
  { "info", 'i', 0, G_OPTION_ARG_NONE, &opt.info, "Show information about chroot", NULL },
  { "preserve-environment", 'p', 0, G_OPTION_ARG_NONE, &opt.preserve, "Preserve user environment", NULL },
  { "quiet", 'q', 0, G_OPTION_ARG_NONE, &opt.quiet, "Show less output", NULL },
};

static void
parse_options(int   argc,
              char *argv[])
{
  GError *error = NULL;

  GOptionContext *context = g_option_context_new ("- run command or shell in a chroot");
  g_option_context_add_main_entries (context, entries, NULL);
  g_option_context_parse (context, &argc, &argv, &error);
}

gboolean
config_check_security(int      fd,
                      GError **error)
{
  struct stat statbuf;
  if (fstat(fd, &statbuf) < 0)
    {
      g_set_error(error,
                  SBUILD_CONFIG_FILE_ERROR, SBUILD_CONFIG_FILE_ERROR_STAT_FAIL,
                  "failed to stat file: %s", strerror(errno));
      return FALSE;
    }

  if (statbuf.st_uid != 0 || statbuf.st_gid != 0)
    {
      g_set_error(error,
                  SBUILD_CONFIG_FILE_ERROR, SBUILD_CONFIG_FILE_ERROR_OWNERSHIP,
                  "not owned by user and group root", strerror(errno));
      return FALSE;
    }

  if (statbuf.st_mode & S_IWOTH)
    {
      g_set_error(error,
                  SBUILD_CONFIG_FILE_ERROR, SBUILD_CONFIG_FILE_ERROR_PERMISSIONS,
                  "others have write permission");
      return FALSE;
    }

  if (!S_ISREG(statbuf.st_mode))
    {
      g_set_error(error,
                  SBUILD_CONFIG_FILE_ERROR, SBUILD_CONFIG_FILE_ERROR_NOT_REGULAR,
                  "not a regular file");
      return FALSE;
    }

  return TRUE;
}

GList *
load_config(const char *file)
{
  int fd = open(file, O_RDONLY|O_NOFOLLOW);
  if (fd < 0)
    {
      g_printerr("%s: failed to load configuration: %s\n", file, strerror(errno));
      exit (EXIT_FAILURE);
    }

  GError *security_error = NULL;
  config_check_security(fd, &security_error);
  if (security_error)
    {
      g_printerr("%s: security failure: %s\n", file, security_error->message);
      exit (EXIT_FAILURE);
    }

  GKeyFile *keyfile = g_key_file_new();
  GError *error = NULL;
  g_key_file_load_from_file(keyfile, file, G_KEY_FILE_NONE, &error);

  if (error)
    {
      g_printerr("%s: parse failure: %s\n", file, error->message);
      exit (EXIT_FAILURE);
    }

}

gboolean
is_sbuild_member (void)
{
  errno = 0;
  struct group *sbuild_group = getgrnam(SBUILD_GROUP);
  if (sbuild_group == NULL)
    {
      if (errno == 0)
        fprintf(stderr, "group " SBUILD_GROUP " not found\n");
      else
        fprintf(stderr, "group " SBUILD_GROUP " not found: %s\n", strerror(errno));
      exit (EXIT_FAILURE);
    }

  int supp_group_count = getgroups(0, NULL);
  if (supp_group_count < 0)
    {
      fprintf(stderr, "can't get supplementary group count: %s\n", strerror(errno));
      exit (EXIT_FAILURE);
    }
  int supp_groups[supp_group_count];
  if (getgroups(supp_group_count, supp_groups) < 1)
    {
      fprintf(stderr, "can't get supplementary groups: %s\n", strerror(errno));
      exit (EXIT_FAILURE);
    }

  bool sbuild_group_member = false;

  for (int i = 0; i < supp_group_count; ++i)
    {
      if (sbuild_group->gr_gid == supp_groups[i])
        sbuild_group_member = true;
    }

  return sbuild_group_member;
}

int
main (int   argc,
      char *argv[])
{
  parse_options(argc, argv);
  load_config("test.conf");

  if (is_sbuild_member() == false)
    {
      fprintf (stderr, "Permission denied: not an sbuild group member\n");
      exit (EXIT_FAILURE);
    }

  uid_t uid;
  gid_t gid;
  struct passwd *pass;
  const char *shell;

  /* Get user and group IDs */
  uid = getuid ();
  if ((pass = getpwuid (uid)) == NULL)
    {
      fprintf (stderr, "Could not get username for user %lu\n", (unsigned long) uid);
      exit (EXIT_FAILURE);
    }
  gid = pass->pw_gid;

  /* Set group ID and supplementary groups */
  if (setgid (gid))
    {
      fprintf (stderr, "Could not set gid to %lu\n", (unsigned long) gid);
      exit (EXIT_FAILURE);
    }
  if (initgroups (pass->pw_name, gid))
    {
      fprintf (stderr, "Could not set supplementary group IDs\n");
      exit (EXIT_FAILURE);
    }

  /* Enter the chroot */
  if (chdir (CHROOT))
    {
      fprintf (stderr, "Could not chdir to %s: %s\n", CHROOT,
               strerror (errno));
      exit (EXIT_FAILURE);
    }
  if (chroot (CHROOT))
    {
      fprintf (stderr, "Could not chroot to %s: %s\n", CHROOT,
               strerror (errno));
      exit (EXIT_FAILURE);
    }
  /* printf ("Entered chroot: %s\n", CHROOT); */

  /* Set uid and check we are not still root */
  if (setuid (uid))
    {
      fprintf (stderr, "Could not set uid to %lu\n", (unsigned long) uid);
      exit (EXIT_FAILURE);
    }
  if (!setuid (0) && uid)
    {
      fprintf (stderr, "Failed to drop root permissions!\n");
      exit (EXIT_FAILURE);
    }

  /* Set up environment */
  if (pass->pw_dir)
    setenv("HOME", pass->pw_dir, 1);
  else
    setenv("HOME", "/", 1);

  /* chdir to home directory */
  if (chdir (getenv("HOME")))
    {
      fprintf (stderr, "warning: Could not chdir to %s: %s\n", getenv("HOME"),
               strerror (errno));
    }

  /* Run login shell */
  if (pass->pw_shell)
    shell = pass->pw_shell;
  else
    shell = "/bin/false";
  if (execl (shell, shell, (const char *) NULL))
    {
      fprintf (stderr, "Could not exec %s: %s\n", shell, strerror (errno));
      exit (EXIT_FAILURE);
    }
  /* This should never be reached */
  exit(EXIT_FAILURE);
}
