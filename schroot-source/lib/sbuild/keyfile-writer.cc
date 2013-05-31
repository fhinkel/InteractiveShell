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

#include <config.h>

#include <fstream>

#include <sbuild/keyfile-writer.h>

namespace sbuild
{

  keyfile_writer::keyfile_writer(const keyfile& store):
    store(store)
  {}

  keyfile_writer::keyfile_writer (const keyfile&     store,
                                  const std::string& file):
    keyfile_writer(store)
  {
    std::ofstream fs(file.c_str());
    if (fs)
      {
        fs.imbue(std::locale::classic());
        write_stream(fs);
      }
    else
      {
        throw error(file, keyfile::BAD_FILE);
      }
  }

  keyfile_writer::keyfile_writer (const keyfile& store,
                                  std::ostream&  stream):
    keyfile_writer(store)
  {
    write_stream(stream);
  }

  keyfile_writer::~keyfile_writer()
  {}

  void
  keyfile_writer::write_stream(std::ostream& stream) const
  {
    keyfile::size_type group_count = 0;

    for (const auto& group : this->store.get_groups())
      {
        if (group_count > 0)
          stream << '\n';
        ++group_count;

        keyfile::comment_type comment = this->store.get_comment(group);

        if (comment.length() > 0)
          print_comment(comment, stream);

        stream << '[' << group << ']' << '\n';

        for (const auto& key : this->store.get_keys(group))
          {
            std::string value;
            this->store.get_value(group, key, value);
            keyfile::comment_type comment = this->store.get_comment(group, key);

            if (comment.length() > 0)
              print_comment(comment, stream);

            stream << key << '=' << value << '\n';
          }
      }
  }

  void
  sbuild::keyfile_writer::print_comment (const keyfile::comment_type& comment,
                                         std::ostream&                stream)
  {
    std::string::size_type last_pos = 0;
    std::string::size_type pos = comment.find_first_of('\n', last_pos);

    while (1)
      {
        if (last_pos == pos)
          stream << "#\n";
        else
          stream << '#' << comment.substr(last_pos, pos - last_pos) << '\n';

        // Find next
        if (pos < comment.length() - 1)
          {
            last_pos = pos + 1;
            pos = comment.find_first_of('\n', last_pos);
          }
        else
          break;
      }
  }

}
