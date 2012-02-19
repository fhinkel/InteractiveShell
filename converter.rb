require 'pp'

isCode = false
isExample = false
isInLesson = false
isInPreamble = true
isHeadline = false

open("Beginning.html","w") { |out|
  out << "<html>\n"
  out << "  <head>\n"
  out << '    <linkrel="stylesheet"href="m2.css"type="text/css"media="screen">'
  out << "\n"
  out << "    <title>\n"
  File.open("BeginningCopy.html").each { |line|
      case line 
      when /Headline/
        isHeadline = true
        next
      when /Description/
        isInPreamble = false
        next
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
        if isHeadline
          out << line
          out << "    </title>\n"
          out << "  </head>\n"
          out << "<body>\n"
          isHeadline = false
        end
        unless isInPreamble 
          if isExample 
            #puts line.lstrip.rstrip
            out << "<code>" << line.strip << "</code></br>\n"
          elsif isCode
            case line
            when /SUBSECTION/
              if isInLesson
                out << "</div>"
              end
              out << "<div>"
              isInLesson = true
              puts line.match(/\s*SUBSECTION\s*"(.*)"/)[1]
              out << "<h4>" << line.match(/\s*SUBSECTION\s*"(.*)"/)[1] << "</h4>\n"
            else
              out << line
            end
          else
            out << line
          end
        end
      end
  }
  out << "</div>"
  out << "</body>"
  out << "</html>"
  
}
