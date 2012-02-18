require 'pp'

isCode = false
isExample = false
isInLesson = false

open("Beginning.html","w") { |out|
  File.open("BeginningCopy.html").each { |line|
      case line 
      when /^\s*Example\s*$/
        isExample = true
        out << "<br>"
        next
      when /^\s*Code\s*$/
        isCode = true
        next
      when /^\s*Text\s*/
        isCode = false
        isExample = false
        #out << "<BR>\n"
        next
      else
        if isExample 
          out << "<code>" << line.strip << "</code></br>\n"
        elsif isCode
          case line
          when /SUBSECTION/
            if isInLesson
              out << "</div>"
            end
            out << "<div>"
            isInLesson = true
            out << "<h4>" << line << "</h4>\n"
          else
            out << line
          end
            
        else
          out << line
        end
      
      end
  }
  out << "</div>"
}