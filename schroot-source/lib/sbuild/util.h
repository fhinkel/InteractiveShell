/* Copyright © 2005-2013  Roger Leigh <rleigh@debian.org>
 *
 * schroot is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * schroot is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see
 * <http://www.gnu.org/licenses/>.
 *
 *********************************************************************/

#ifndef SBUILD_UTIL_H
#define SBUILD_UTIL_H

#include <sbuild/environment.h>
#include <sbuild/error.h>
#include <sbuild/regex.h>
#include <sbuild/types.h>

#include <string>
#include <cerrno>
#include <cstring>

#include <sys/types.h>
#include <sys/stat.h>
#include <pwd.h>
#include <grp.h>
#include <unistd.h>
#include <typeinfo>

#ifdef __GNUG__
#include <cxxabi.h>
#endif

namespace sbuild
{

  /**
   * Strip the directory path from a filename.  This is similar to
   * basename(3).
   *
   * @param name the filename to strip of its path.
   * @returns the base name.
   */
  std::string
  basename (std::string name);

  /**
   * Strip the fileame from a pathname.  This is similar to
   * dirname(3).
   *
   * @param name the path to strip of its filename.
   * @returns the directory name.
   */
  std::string
  dirname (std::string name);

  /**
   * Normalise a pathname.  This strips all trailing separators, and
   * duplicate separators within a path.
   *
   * @param name the path to normalise.
   * @returns the normalised name.
   */
  std::string
  normalname (std::string name);

  /**
   * Check if a pathname is absolute.
   *
   * @param name the path to check.
   * @returns true if the name is absolute or false if it is not, or
   * if name is empty.
   */
  bool
  is_absname (const std::string& name);

  /**
   * Check if a filename matches the allowed pattern(s).  This will
   * not match dotfiles, backup files, dpkg configuration backup
   * files, etc. 
   *
   * @param name the filename to check.
   * @returns true if it matches, false if not.
   */
  bool
  is_valid_sessionname (const std::string& name);

  /**
   * Check if a filename matches the allowed pattern(s).  This will
   * not match dotfiles, backup files, dpkg configuration backup
   * files, etc.  This uses the same rules as run-parts(8).
   *
   * @param name the filename to check.
   * @param lsb_mode true to use LSB mode, otherwise false.
   * @returns true if it matches, false if not.
   */
  bool
  is_valid_filename (const std::string& name,
                     bool               lsb_mode = true);

  /**
   * Get the current working directory.  If it can't be found, fall
   * back to root.
   *
   * @returns the current working directory.
   */
  std::string
  getcwd ();


  /**
   * Get a unique string for use as a session identifier.
   *
   * @returns a session identifier.
   */
  std::string
  unique_identifier ();

  /**
   * Convert a string_list into a string.  The strings are
   * concatenated using separator as a delimiter.
   *
   * @param list the list to concatenate.
   * @param separator the delimiting character.
   * @returns a string.
   */
  std::string
  string_list_to_string (const string_list& list,
                         const std::string& separator);

  /**
   * Split a string into a string_list.  The string is split using
   * separator as a delimiter.  Note that only non-zero-length strings
   * are preserved, so multiple concatenated delimiters or delimiters
   * at the beginning and end of the string will not result in empty
   * strings in the list.
   *
   * @param value the string to split.
   * @param separator the delimiting character or characters.
   * @returns a string_list.
   *
   * @todo Provide an alternative that splits the string in place
   * using an iterator interface.
   */
  template <typename S>
  std::vector<S>
  split_string (S const& value,
                S const& separator)
  {
    std::vector<S> ret;

    // Skip any separators at the start
    typename S::size_type last_pos =
      value.find_first_not_of(separator, 0);
    // Find first separator.
    typename S::size_type pos = value.find_first_of(separator, last_pos);

    while (pos !=S::npos || last_pos != S::npos)
      {
        // Add to list
        ret.push_back(value.substr(last_pos, pos - last_pos));
        // Find next
        last_pos = value.find_first_not_of(separator, pos);
        pos = value.find_first_of(separator, last_pos);
      }

    return ret;
  }

  /**
   * Split a string into a string_list.  The string is split using
   * separator as a delimiter.  Multiple delimiters, or delimiters at
   * the start of the start or end of the string will be discarded and
   * not result in empty strings being returned (see
   * split_string_strict).
   *
   * @param value the string to split.
   * @param separator the delimiting character or characters.
   * @returns a string_list.
   */
  std::vector<std::string>
  split_string (const std::string& value,
                const std::string& separator);

  /**
   * Split a string into a string_list.  The string is split using
   * separator as a delimiter.  All delimiters are used as string
   * separators, so delimiters at the beginning or end of a string, or
   * which are concatenated together, will result in empty strings in
   * the string list (use split_string to avoid this).
   *
   * @param value the string to split.
   * @param separator the delimiting character or characters.
   * @returns a string_list.
   *
   * @todo Provide an alternative that splits the string in place
   * using an iterator interface.
   */
  template <typename S>
  std::vector<S>
  split_string_strict (S const& value,
                       S const& separator)
  {
    std::vector<S> ret;

    // Skip any separators at the start
    typename S::size_type last_pos = 0;
    // Find first separator.
    typename S::size_type pos = value.find_first_of(separator, last_pos);

    while (pos !=S::npos || last_pos != S::npos)
      {
        // Add to list
        if (pos == std::string::npos)
          // Entire string from last_pos
          ret.push_back(value.substr(last_pos, pos));
        else
          // Between pos and last_pos
          ret.push_back(value.substr(last_pos, pos - last_pos));

        // Find next
        last_pos = pos + separator.length();
        pos = value.find_first_of(separator, last_pos);
      }

    return ret;
  }

  /**
   * Split a string into a string_list.  The string is split using
   * separator as a delimiter.  All delimiters are used as string
   * separators, so delimiters at the beginning or end of a string, or
   * which are concatenated together, will result in empty strings in
   * the string list.
   *
   * @param value the string to split.
   * @param separator the delimiting character or characters.
   * @returns a string_list.
   */
  std::vector<std::string>
  split_string_strict (const std::string& value,
                       const std::string& separator);

  /**
   * Widen a string.  The narrow string is converted into a wide
   * string.  Note that any conversion error will cause the string to
   * be clipped at the point of error.
   *
   * @param str the string to widen.
   * @param locale the locale to use for the conversion.
   * @returns a wide string.
   */
  std::wstring
  widen_string (const std::string& str,
                std::locale        locale);

  /**
   * Narrow a string.  The wide string is converted into a narrow
   * string.  Note that any conversion error will cause the string to
   * be clipped at the point of error.
   *
   * @param str the string to narrow.
   * @param locale the locale to use for the conversion.
   * @returns a narrow string.
   */
  std::string
  narrow_string (const std::wstring& str,
                 std::locale         locale);

  /**
   * Find a program in the PATH search path.
   *
   * @param program the program to search for.
   * @param path the search path; typically the value of $PATH.
   * @param prefix a directory prefix the add to the search path.
   * This may be left empty to search the root filesystem.
   * @returns the absolute path of the program, or an empty string if
   * the program could not be found.
   */
  std::string
  find_program_in_path (const std::string& program,
                        const std::string& path,
                        const std::string& prefix);

  /**
   * Create a string vector from a string_list.  The strings in the
   * vector, as well as the vector itself, are allocated with new, and
   * should be freed as a whole with strv_delete.
   *
   * @param str the string_list to use.
   * @returns a string vector.
   */
  char **
  string_list_to_strv (const string_list& str);

  /**
   * Delete a string vector.  The strings in the vector, as well as
   * the vector itself, must have been previously allocated with new,
   * for example sbuild::environment::get_strv.
   *
   * @param strv the string vector to delete.
   */
  void
  strv_delete (char **strv);

  /**
   * execve wrapper.  Run the command specified by file (an absolute
   * pathname), using command and env as the argv and environment,
   * respectively.
   *
   * @param file the program to execute.
   * @param command the arguments to pass to the executable.
   * @param env the environment.
   * @returns the return value of the execve system call on failure.
   */
  int
  exec (const std::string& file,
        const string_list& command,
        const environment& env);

  /**
   * Get the type name of a type, demangled if possible.
   */
  template <typename T>
  std::string
  type_name()
  {
    std::string name;

    const std::type_info& info = typeid(T);

#ifdef __GNUG__
    int status;
    char *demangled = abi::__cxa_demangle(info.name(), 0, 0, &status);
    if (status)
      name = info.name();
    else
      name = demangled;
    free(demangled);
#else
    name = info.name();
#endif

    return name;
  }

  /**
   * Get file status.  stat(2) wrapper.
   */
  class stat
  {
  public:
    /// Error codes.
    enum error_code
      {
        FILE, ///< Failed to stat file.
        FD    ///< Failed to stat file descriptor.
      };

    /// Mode bits.
    enum mode_bits
      {
        FILE_TYPE_MASK      = S_IFMT,   ///< Mask for file type bit fields.
        FILE_TYPE_SOCKET    = S_IFSOCK, ///< Socket file type.
        FILE_TYPE_LINK      = S_IFLNK,  ///< Symbolic link file type.
        FILE_TYPE_REGULAR   = S_IFREG,  ///< Regular file type.
        FILE_TYPE_BLOCK     = S_IFBLK,  ///< Block device file type.
        FILE_TYPE_DIRECTORY = S_IFDIR,  ///< Directory file type.
        FILE_TYPE_CHARACTER = S_IFCHR,  ///< Character device file type.
        FILE_TYPE_FIFO      = S_IFIFO,  ///< Named pipe (FIFO) file type.
        PERM_SETUID         = S_ISUID,  ///< Set user ID permission.
        PERM_SETGIT         = S_ISGID,  ///< Set group ID permission.
        PERM_STICKY         = S_ISVTX,  ///< Sticky permission.
        PERM_USER_MASK      = S_IRWXU,  ///< Mask for user permissions.
        PERM_USER_READ      = S_IRUSR,  ///< User read permission.
        PERM_USER_WRITE     = S_IWUSR,  ///< User write permission.
        PERM_USER_EXECUTE   = S_IXUSR,  ///< User execute permission.
        PERM_GROUP_MASK     = S_IRWXG,  ///< Mask for group permissions.
        PERM_GROUP_READ     = S_IRGRP,  ///< Group read permission.
        PERM_GROUP_WRITE    = S_IWGRP,  ///< Group write permission.
        PERM_GROUP_EXECUTE  = S_IXGRP,  ///< Group execute permission.
        PERM_OTHER_MASK     = S_IRWXO,  ///< Mask for other permissions.
        PERM_OTHER_READ     = S_IROTH,  ///< Other read permission.
        PERM_OTHER_WRITE    = S_IWOTH,  ///< Other write permission.
        PERM_OTHER_EXECUTE  = S_IXOTH   ///< Other execute permission.
      };

    /// Exception type.
    typedef custom_error<error_code> error;

    /**
     * The constructor.
     * @param file the filename to use.
     * @param link use lstat rather than stat (i.e. don't follow symlinks).
     */
    stat (const char *file,
          bool        link = false);

    /**
     * The constructor.
     * @param file the filename to use.
     * @param link use lstat rather than stat (i.e. don't follow symlinks).
     */
    stat (const std::string& file,
          bool               link = false);

    /**
     * The constructor.
     * @param file the filename to use (only used for error
     * reporting).
     * @param fd the file descriptor to use.
     */
    stat (const std::string& file,
          int                fd);

    /**
     * The constructor.
     * @param fd the file descriptor to use.
     */
    stat (int fd);

    /// The destructor.
    virtual ~stat ();

    /**
     * Check if the file status was obtained.
     * An error will be thrown if stat(2) failed to get the file
     * status.
     */
    void check () const
    {
      if (this->errorno)
        {
          if (!this->file.empty())
            throw error(this->file, FILE, std::strerror(this->errorno));
          else
            {
              std::ostringstream str;
              str << "fd " << fd;
              throw error(str.str(), FD, std::strerror(this->errorno));
            }
        }
    }

    /**
     * Get the struct stat used internally.  This is returned by
     * stat(2).
     * @returns the stat struct.
     */
    const struct ::stat& get_detail()
    { return this->status; }

    /**
     * Get the device the file resides on.
     * @returns the device.
     */
    dev_t
    device () const
    { check(); return status.st_dev; }

    /**
     * Get the inode of the file.
     * @returns the inode.
     */
    ino_t
    inode () const
    { check(); return status.st_ino; }

    /**
     * Get the mode of the file.
     * @returns the mode.
     */
    mode_t
    mode () const
    { check(); return status.st_mode; }

    /**
     * Get the number of hard links to the file.
     * @returns the hard link count.
     */
    nlink_t
    links () const
    { check(); return status.st_nlink; }

    /**
     * Get the user id owning the file.
     * @returns the uid.
     */
    uid_t
    uid () const
    { check(); return status.st_uid; }

    /**
     * Get the group id owning the file.
     * @returns the uid.
     */
    gid_t
    gid () const
    { check(); return status.st_gid; }

    /**
     * Get the file size.
     * @returns the file size.
     */
    off_t
    size () const
    { check(); return status.st_size; }

    /**
     * Get the file block size.
     * @returns the block size.
     */
    blksize_t
    blocksize () const
    { check(); return status.st_blksize; }

    /**
     * Get the file block count.
     * @returns the block count.
     */
    blkcnt_t
    blocks () const
    { check(); return status.st_blocks; }

    /**
     * Get the file access time.
     * @returns the access time.
     */
    time_t
    atime () const
    { check(); return status.st_atime; }

    /**
     * Get the file modification time.
     * @returns the modification time.
     */
    time_t
    mtime () const
    { check(); return status.st_mtime; }

    /**
     * Get the file creation time.
     * @returns the creation time.
     */
    time_t
    ctime () const
    { check(); return status.st_ctime; }

    /**
     * Is the file a regular file?
     * @returns true if regular, otherwise false.
     */
    inline bool
    is_regular () const;

    /**
     * Is the file a directory?
     * @returns true if a directory, otherwise false.
     */
    inline bool
    is_directory () const;

    /**
     * Is the file a character device?
     * @returns true if a character device, otherwise false.
     */
    inline bool
    is_character () const;

    /**
     * Is the file a block device?
     * @returns true if a block device, otherwise false.
     */
    inline bool
    is_block () const;

    /**
     * Is the file a named pipe (FIFO)?
     * @returns true if a named pipe, otherwise false.
     */
    inline bool
    is_fifo () const;

    /**
     * Is the file a symbolic link?
     * @returns true if a symbolic link, otherwise false.
     */
    inline bool
    is_link () const;

    /**
     * Is the file a socket?
     * @returns true if a socket, otherwise false.
     */
    inline bool
    is_socket () const;

    /**
     * Check if particular mode bits are set.
     * @param mask A bitmask containing the bits to check are set.
     * @returns true if all the bits in mask are set, otherwise false.
     */
    inline bool check_mode (mode_bits mask) const;

  private:

    /// The filename being checked (if specified).
    std::string file;
    /// The file descriptor being checked (if specified).
    int fd;
    /// The error number set after stat(2) error.
    int errorno;
    /// The stat(2) results.
    struct ::stat status;
  };

  /**
   * Bitwise-OR of specifed mode bits
   * @param lhs mode bits
   * @param rhs mode bits
   * @returns result of OR.
   */
  stat::mode_bits
  inline operator | (const stat::mode_bits& lhs,
                     const stat::mode_bits& rhs)
  {
    return static_cast<stat::mode_bits>
      (static_cast<int>(lhs) | static_cast<int>(rhs));
  }

  /**
   * Bitwise-OR of specifed mode bits
   * @param lhs mode bits
   * @param rhs mode bits
   * @returns result of OR.
   */
  stat::mode_bits
  inline operator | (const mode_t&          lhs,
                     const stat::mode_bits& rhs)
  {
    return static_cast<stat::mode_bits>
      (lhs | static_cast<int>(rhs));
  }

  /**
   * Bitwise-OR of specifed mode bits
   * @param lhs mode bits
   * @param rhs mode bits
   * @returns result of OR.
   */
  stat::mode_bits
  inline operator | (const stat::mode_bits& lhs,
                     const mode_t&          rhs)
  {
    return static_cast<stat::mode_bits>
      (static_cast<int>(lhs) | rhs);
  }

  /**
   * Bitwise-AND of specifed mode bits
   * @param lhs mode bits
   * @param rhs mode bits
   * @returns result of AND.
   */
  stat::mode_bits
  inline operator & (const stat::mode_bits& lhs,
                     const stat::mode_bits& rhs)
  {
    return static_cast<stat::mode_bits>
      (static_cast<int>(lhs) & static_cast<int>(rhs));
  }

  /**
   * Bitwise-AND of specifed mode bits
   * @param lhs mode bits
   * @param rhs mode bits
   * @returns result of AND.
   */
  stat::mode_bits
  inline operator & (const mode_t&          lhs,
                     const stat::mode_bits& rhs)
  {
    return static_cast<stat::mode_bits>
      (lhs & static_cast<int>(rhs));
  }

  /**
   * Bitwise-AND of specifed mode bits
   * @param lhs mode bits
   * @param rhs mode bits
   * @returns result of AND.
   */
  stat::mode_bits
  inline operator & (const stat::mode_bits& lhs,
                     const mode_t&          rhs)
  {
    return static_cast<stat::mode_bits>
      (static_cast<int>(lhs) & rhs);
  }

  inline bool
  stat::is_regular () const
  { return check_mode(FILE_TYPE_REGULAR & FILE_TYPE_MASK); }

  inline bool
  stat::is_directory () const
  { return check_mode(FILE_TYPE_DIRECTORY & FILE_TYPE_MASK); }

  inline bool
  stat::is_character () const
  { return check_mode(FILE_TYPE_CHARACTER & FILE_TYPE_MASK); }

  inline bool
  stat::is_block () const
  { return check_mode(FILE_TYPE_BLOCK & FILE_TYPE_MASK); }

  inline bool
  stat::is_fifo () const
  { return check_mode(FILE_TYPE_FIFO & FILE_TYPE_MASK); }

  inline bool
  stat::is_link () const
  { return check_mode(FILE_TYPE_LINK & FILE_TYPE_MASK); }

  inline bool
  stat::is_socket () const
  { return check_mode(FILE_TYPE_SOCKET & FILE_TYPE_MASK); }

  inline bool
  stat::check_mode (mode_bits mask) const
  {
    check();
    return (static_cast<stat::mode_bits>(status.st_mode) & mask) == mask;
  }

  /**
   * System passwd database entry
   */
  class passwd : public ::passwd
  {
  public:
    /// A buffer for reentrant passwd functions.
    typedef std::vector<char> buffer_type;

    /// The contructor.
    passwd ();

    /**
     * The constructor.
     *
     * @param uid the UID to search for.
     */
    passwd (uid_t uid);

    /**
     * The constructor.
     *
     * @param name the user name to search for.
     */
    passwd (const char *name);

    /**
     * The constructor.
     *
     * @param name the user name to search for.
     */
    passwd (const std::string& name);

    /**
     * Clear search result.  The query result is undefined following
     * this operation.
     */
    void
    clear ();

    /**
     * Query using a UID.
     *
     * @param uid the UID to search for.
     */
    void
    query_uid (uid_t uid);

    /**
     * Query using a name.
     *
     * @param name the user name to search for.
     */
    void
    query_name (const char *name);

    /**
     * Query using a name.
     *
     * @param name the user name to search for.
     */
    void
    query_name (const std::string& name);

    /**
     * Check if the query result is valid.
     */
    bool
    operator ! () const;

  private:
    /// Query result buffer.
    buffer_type buffer;
    /// Object validity.
    bool        valid;
  };

  /**
   * System group database entry
   */
  class group : public ::group
  {
  public:
    /// A buffer for reentrant group functions.
    typedef std::vector<char> buffer_type;

    /// The constructor.
    group ();

    /**
     * The constructor.
     *
     * @param gid the GID to search for.
     */
    group (gid_t gid);

    /**
     * The constructor.
     *
     * @param name the group name to search for.
     */
    group (const char *name);

    /**
     * The constructor.
     *
     * @param name the group name to search for.
     */
    group (const std::string& name);

    /**
     * Clear search result.  The query result is undefined following
     * this operation.
     */
    void
    clear ();

    /**
     * Query using a GID.
     *
     * @param gid the GID to search for.
     */
    void
    query_gid (gid_t gid);

    /**
     * Query using a name.
     *
     * @param name the group name to search for.
     */
    void
    query_name (const char *name);

    /**
     * Query using a name.
     *
     * @param name the group name to search for.
     */
    void
    query_name (const std::string& name);

    /**
     * Check if the query result is valid.
     */
    bool
    operator ! () const;

  private:
    /// Query result buffer.
    buffer_type buffer;
    /// Object validity.
    bool        valid;
  };

}

#endif /* SBUILD_UTIL_H */

/*
 * Local Variables:
 * mode:C++
 * End:
 */
