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

#include <sbuild/keyfile-reader.h>

namespace sbuild
{

  keyfile_reader::keyfile_reader(keyfile& store):
    store(store),
    group(),
    group_set(false),
    key(),
    key_set(false),
    value(),
    value_set(false),
    comment(),
    comment_set(false),
    line_number(0)
  {}

  keyfile_reader::keyfile_reader (keyfile&           store,
                                  const std::string& file):
    keyfile_reader(store)
  {
    std::ifstream fs(file.c_str());
    if (fs)
      {
        fs.imbue(std::locale::classic());
        read_stream(fs);
      }
    else
      {
        throw error(file, keyfile::BAD_FILE);
      }
  }

  keyfile_reader::keyfile_reader (keyfile&       store,
                                  std::istream&  stream):
    keyfile_reader(store)
  {
    read_stream(stream);
  }

  keyfile_reader::~keyfile_reader()
  {}

  void
  keyfile_reader::read_stream(std::istream& stream)
  {
    keyfile tmp;
    std::string line;

    begin();

    while (std::getline(stream, line))
      {
        parse_line(line);

        // Insert group
        if (this->group_set)
          {
            if (tmp.has_group(this->group))
              throw error(this->line_number, keyfile::DUPLICATE_GROUP, this->group);
            else
              tmp.set_group(this->group, this->comment, this->line_number);
          }

        // Insert item
        if (this->key_set && this->value_set)
          {
            if (tmp.has_key(this->group, this->key))
              throw error(this->line_number, this->group, keyfile::DUPLICATE_KEY, this->key);
            else
              tmp.set_value(this->group, this->key, this->value, this->comment, this->line_number);
          }
      }

    end();

    // TODO: do inserts here as well.

    this->store += tmp;
  }

  void
  keyfile_reader::begin()
  {
    line_number = 0;
  }

  void
  keyfile_reader::parse_line (const std::string& line)
  {
    if (comment_set == true)
      {
        comment.clear();
        comment_set = false;
      }
    if (group_set == true)
      {
        // The group isn't cleared
        group_set = false;
      }
    if (key_set == true)
      {
        key.clear();
        key_set = false;
      }
    if (value_set == true)
      {
        value.clear();
        value_set = false;
      }

    if (line.length() == 0)
      {
        // Empty line; do nothing.
      }
    else if (line[0] == '#') // Comment line
      {
        if (!comment.empty())
          comment += '\n';
        comment += line.substr(1);
      }
    else if (line[0] == '[') // Group
      {
        std::string::size_type fpos = line.find_first_of(']');
        std::string::size_type lpos = line.find_last_of(']');
        if (fpos == std::string::npos || lpos == std::string::npos ||
            fpos != lpos)
          throw error(line_number, keyfile::INVALID_GROUP, line);
        group = line.substr(1, fpos - 1);

        if (group.length() == 0)
          throw error(line_number, keyfile::INVALID_GROUP, line);

        comment_set = true;
        group_set = true;
      }
    else // Item
      {
        std::string::size_type pos = line.find_first_of('=');
        if (pos == std::string::npos)
          throw error(line_number, keyfile::INVALID_LINE, line);
        if (pos == 0)
          throw error(line_number, keyfile::NO_KEY, line);
        key = line.substr(0, pos);
        if (pos == line.length() - 1)
          value = "";
        else
          value = line.substr(pos + 1);

        // No group specified
        if (group.empty())
          throw error(line_number, keyfile::NO_GROUP, line);

        comment_set = true;
        key_set = true;
        value_set = true;
      }

    ++line_number;
  }

  void
  keyfile_reader::end()
  {
  }

}
