-- convert a document in M2 Simple Doc format to an HTML document that can be
-- used in TryM2 as a tutorial. We assume that every SUBSECTION constitutes as
-- lesson. Each lesson is wrapped in a <div> with an <h4> headline. 
-- <code> markes M2 code that can be run in the interactive shell. 


-- How do we handle "nodes"?
-- underscore operator is being translated to <sub> and messes up everything

-- TODO 2/29/2012
-- Example:  group all lines that have further indentation together, and make one button out of those.
--        remove initial indentation
-- Text:  write toHtml, meaning:
--          remove @...@ replacing with something inside
--          put html TEX around it
--          handle anything else not handled by TEX
-- Code:  search for SUBSECTION, grab name, put a div in
--        handle weird other things.  Possibly just ignore them
-- do not forget to print html header and wrapper.


newPackage(
        "DocConverter",
        Version => "0.5", 
        Date => "Jan 2014",
        Authors => {
            {
                Name => "Mike Stillman", 
                Email => "mike@math.cornell.edu", 
                HomePage=>"http://www.math.cornell.edu/~mike"
                },
            {
                Name => "Franziska Hinkelmann", 
                Email => "franziska.hinkelmann@tngtech.com"
                },
            {
                Name => "Lars Kastner", 
                Email => "k.l@fu-berlin.de", 
                HomePage=>"http://page.mi.fu-berlin.de/lkastner/"
                }
            },
        Headline => "Convert tutorial and simpleDOC formats to HTML for TryM2 tutorials",
        DebuggingMode => true,
        PackageExports => {"Text"}
        )

export {
     convert,
     simpledocExample
     --tutorialToSimpleDoc,
     --tutorialExample
     }

keywordRE = ///^\s*Key|^\s*Headline|^\s*Description///
descriptionRE = ///^\s*Text|^\s*Code|^\s*Example///

groupLines = method()
groupLines (List,String) := (L, keywordRE) -> (
     -- returns a list of pairs:
     -- {{keyword, list of lines}, ...}
     P1 := positions(L, s -> match(keywordRE, s)); 
     P1 = append(P1, #L);
     apply(#P1-1, i -> (
	       keyline := L#(P1#i);  -- the line with the keyword
	       keyword := replace(///\s*///, "", keyline);
	       content := L_{P1#i + 1 .. P1#(i+1) - 1}; -- the corresponding content
	       {keyword, content}
	       ))
     )



replaceWithValueOf = method()
replaceWithValueOf String  :=  s -> (
  -- replace content between @-symbols with its value
  -- s = "2+2 = @ TO 2+2@, and 4-2= @TO2 {(4-2),"nnnn" }@." 
  --<< "s = " << s << endl;
  l := separate("@", s);
  concatenate for i from 0 to #l-1 list (
    if even i then 
      l#i
    else (
      t := value replace( ///TO|TO2|TT///, "", l#i);
      if instance(t, List) then 
        t = last t;
      t = "\\({\\tt " | toString t | "}\\)"
    )  
    )
 )

-- create string with code for HTML rather than simple doc
-- add extra line break at every paragraph
-- translate TEX code
-- input s spans several lines of simple doc
toHtml = method()
toHtml String := (s) ->  (
  s = replaceWithValueOf s;
  --print s;
  --s = html TEX s;
  s = html s;
  s | "<br/>\n"
  )

toHtmlPara = method()
toHtmlPara String := (s) -> (
  s = replaceWithValueOf s;
  --print s;
  --s = "<p>" | html TEX s | "</p>\n"
  s = "<p>" | html s | "</p>\n"
  )

-- return string with HTML head for given title
printHead = method()
printHead String := title -> (
     s :=  "<html>\n";
     s = s |  "  <head>\n";
     s = s |  "    <title>\n";
     s = s |  title | "\n";
     s = s |  "    </title>\n";
     s = s |  "  </head>\n";
     s = s |  "<body>\n"  
     )

processTextSection = (lines) -> (
     -- Each line should be either completely blank, or
     -- have some text.  Each contiguous group of non-empty lines
     -- will be wrapped in a <p></p>.
     -- A string is returned.
     ----return toHtmlPara concatenate between("\n", lines); -- all lines in a text section
     -- this next part is new.  Is it valid?  8 Jan 2014 MES
     stripSpace := apply(lines, line -> replace("^\\s*", "", line));
     groups := sublists(stripSpace,
          line -> #line > 0,
          toList,
          identity);
     concatenate apply(groups, g -> if not instance(g, List) 
          then ""
          else (   "<p>\n"
--                 | concatenate apply(g, g1 -> "    " | html TEX g1 | "\n") 
                 | concatenate apply(g, g1 -> "    " | html replaceWithValueOf g1 | "\n") 
                 | "</p>\n")
     ))

initialSpaceSize = (line) -> (
     -- Returns the number of spaces at the beginning of the line.
     -- NO tabs are allowed in line!!
     initialSpace := regex("^ *", line);
     initialSpace#0#1
     )
processExampleSection = (lines) -> (
     -- Each line should be either completely blank, or
     -- have some text.  Each line with more indentation than the
     -- previous is appended to a <code> block
     -- A string is returned.
     lines = select(lines, s -> #s > 0);
     sizes := lines / initialSpaceSize;
     minsize := min sizes;
     if minsize != sizes#0 then error "The first line of an Example section should have the
        smallest indentation of all lines in the section.";
     lines = apply(lines, line -> substring(line, minsize));
     pos := positions(sizes, i -> i == minsize);
     pos = append(pos, #lines);
     concatenate for i from 0 to #pos - 2 list (
          -- we make a single <code>m2code</code> from each of these
          -- where m2code might be several lines, in which case it is:
          -- <code>line1<br/>
          -- line2<br/>
          -- line3</code><br/>
          first := pos#i;
          last := pos#(i+1)-1;
          if first == last then (
               "<p><code>" | lines#first | "</code></p>\n"
          ) else (
               "<p><codeblock>" | 
               concatenate (for j from first to last-1 list (lines#j | "\n"))
               | lines#last | "</codeblock></p>\n"
               )
          )
     )

processSUBSECTION = (lines) -> (
     -- lines should be of length 1 here.
     concatenate for line in lines list (
       "<h4>" | replace("^ *", "", line) | "</h4>\n"
       )
     )

convertContents = method()
convertContents String := (docstring) -> (
     contents := lines docstring;
     contents = select(contents, s -> not match(///^\s*--///, s));
     M := groupLines(contents, keywordRE);
     --MKey := first select(M, x -> match(///^\s*Key///, first x));
     MHeadline := select(M, x -> match(///^\s*Headline///, first x));
     MHeadline = if #MHeadline > 0 then MHeadline#0 else {null, {"Tutorial"}};
     MDescription := first select(M, x -> match(///^\s*Description///, first x));
     -- ignore the Key for now.
     -- << "Key = " << last MKey << endl;
     s := printHead first last MHeadline;

     inSection := false; -- we need this to keep track of divs around lessons
     M2 := groupLines(last MDescription, descriptionRE);
     cc :=  concatenate apply(M2, m -> (
	       -- m is {Keyword, List (of lines)}.
	       -- Keyword is: Text, Code, Example (that is it at the moment)
	       k := first m;
	       if k === "Text" then
                processTextSection m#1
	       else if k === "Example" then 
                processExampleSection m#1
	       else if k === "Code" then (
            if match( ///^\s*SUBSECTION///, first last m) then (
              s := "";
              if inSection then 
                s = "</div>\n";
              inSection = true;
              h := replace( ///^\s*SUBSECTION\s*\"///, "", first last m); 
              h = replace( ///\",?\s*$///, "", h );

              s | "<div>\n    <h4>" | h | "</h4>\n" 
              )
            )
	       else 
            error "unknown Key"
	      ));
      s | cc | "    </div>\n  </body>\n</html>\n"
     )

convert = method()
convert String := (filename) -> (
    result := convertContents get (filename|".simpledoc");
    (filename|".html") << result << close
    )

mat := (pat,line) -> class line === String and match(pat,line)

makeSUBSECTION = (str) -> "SUBSECTION" => str
makeTEXT = (str) -> "Text" => str
makeEXAMPLE = (str) -> "Example" => str

writeout = (group) -> (
     name := group#0#0;
     strs := group/last;
     if name === "SUBSECTION"
     then (
          if #strs > 1 then error "our logic with subsections is off";
          "    Code\n        SUBSECTION \"" | strs#0 | "\"\n"
          )
     else (
          header := "    " | name | "\n";
          header | concatenate apply(strs, s -> "        " | s | "\n")
          )
     )
tutorialToSimpleDoc = method()
tutorialToSimpleDoc String := (x) -> (
     x = lines x;
     x = select(x, line -> not mat("^[[:space:]]*$",line));
     x = select(x, line -> not mat("-\\*-", line));
     head := false;
     x = apply(x, line -> (
	       if mat("^---",line) then (head = not head;) 
	       else if head then makeSUBSECTION replace("^-- *","",line)
	       else line));
     x = apply(x, line -> (
               if instance(line, String) then (
                    if mat("^--", line) then makeTEXT replace("^-- *","",line)
                    else makeEXAMPLE line
                    )
               else
                    line
               ));
     -- Now we loop through all of the lines, keeping track of the last type.
     x = select(x, a -> a =!= null);
     x1 := sublists(x, 
            line -> line#0 === "Text",
            toList,
            identity);
     x2 := sublists(x1,
            line -> line#0 === "Example",
            toList,
            identity);
     x3 := sublists(x2,
            line -> line#0 === "SUBSECTION",
            toList,
            identity);
     "Description\n" | concatenate for group in x3 list (
          writeout group
          )
     )

simpledocExample = ///Keyword
    "unused"
Headline
    My wonderful tutorial (by F. Bar)
Description
    Code
        SUBSECTION "Name of the first lesson in the tutorial"
    Text
        Some text, allowing TeX, and things like {\tt ring}.

        A blank line in a Text section places the parts in separate paragraphs.
        Here is a second line for this paragraph.
    Example
        R = ZZ/32003
        f = i -> i^3
        g = (x) -> (
             x^2-x-1
             )  -- these 3 lines will be placed in one clickable button.
    Code
        SUBSECTION "Name of the second lesson in the tutorial"
    Text
        Some more text, and perhaps some math like $x^2-x-1$.
        Or whatever.
    Example
        S = QQ[a..d]
///

doc ///
Key
  DocConverter
Headline
  Conversion from simpledoc format to the html format of web.macaulay2.com
Description
  Text
    Tutorials for use with the web based Macaulay2, at
    web.macaulay2.com, are required to be in a special html format.
    This package is able to translate simpledoc
    format, to the required html format, suitable for use on web.macaulay2.com.
    
    Tutorials may use mathjax latex commands (@HREF"http://www.mathjax.org"@), see also
    @HREF "http://www.onemathematicalcat.org/MathJaxDocumentation/TeXSyntax.htm"@
    for a complete list, or @HREF "http://meta.math.stackexchange.com/questions/5020/mathjax-basic-tutorial-and-quick-reference"@
    for examples.

    Mathjax is very good, but there are some idiosyncracies: To use latex formatting
    for "TT", one must place the phrase in math context.
    
    For an example, suitable for basing your own tutorials on, see @TO "convert"@.
SeeAlso
  SimpleDoc
///

doc ///
Key
    convert
Headline
    Convert simpledoc format to html for tutorials
Usage
    convert basename
Inputs
    basename:String
      the file to be converted should be named {\tt basename.simpledoc}
Outputs
    :String
      the filename, {\tt basename.html}, suitable for use as a 
      tutorial at @HREF "http://web.macaulay2.com"@.
Consequences
  Item
    The file {\tt basename.html} is created.
Description
  Text
    The input file is expected to be in @TO "SimpleDoc"@ format.
    However, not all such files are accepted.  Here is a template of
    what is allowed and expected:
  Text
    Here is an example input string, useful as an example or template.

  Example
    print simpledocExample;
  Text

    The output format is html, which may be used as a tutorial at @HREF"http://web.macaulay2.com"@.
    Here is an example output.

  Example
    "mytutorial.simpledoc" << simpledocExample << close;
    convert "mytutorial"
    get "mytutorial.html"
  Text
    The resulting html file can be uploaded at @HREF"http://web.macaulay2.com"@, by clicking the
    "Load Tutorial" link at that site.
    
    The following keywords, allowed in simpledoc documentation, are ignored:
    {\bf Key,Usage, Inputs, Outputs, Consequences, SeeAlso, Subnodes, Caveat} 
    are all ignored.

SeeAlso
  "SimpleDoc"
///

end

// test of processTextSection
restart
debug loadPackage "DocConverter"
contents = lines simpledocExample
contents = select(contents, s -> not match(///^\s*--///, s));
M = groupLines(contents, keywordRE);
groups = groupLines(M#2#1, descriptionRE)
group = groups#1#1
processTextSection group
group = groups#2#1
processExampleSection group

s = ///
         Your first input prompt will be {\tt "i1 : "}.  In response to the prompt,
         type {\tt 2+2} and press return.  The expression you entered will be
         evaluated - no punctuation is required at the end of the line.
///
restart
loadPackage "DocConverter"
L = convert "gettingStarted.simpledoc";
"public/tutorials/getting-started.html" << L << close;


fn = "Beginning.html"
fn << L << close
get ("!open " | fn)

M = groupLines(L, keywordRE)
M1 = first select(M, x -> match(///^\s*Description///, first x))
M2 = groupLines(last M1, descriptionRE)
M2/first
tally oo
M = L_{4+1..672-1};
groupLines(M, descriptionRE)
netList M_{202..216}
netList oo

restart
loadPackage "DocConverter"
X = get "tu_elementary.m2"
"tu_elementary.simpledoc" << tutorialToSimpleDoc X << close;
"../public/tutorials/elementary.html" << convert "tu_elementary.simpledoc" << close;
netList oo
beginDocumentation()

TEST ///
-- test code and assertions here
-- may have as many TEST sections as needed
///

