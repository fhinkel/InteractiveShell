-- convert a document in M2 Simple Doc format to an HTML document that can be
-- used in TryM2 as a tutorial. We assume that every SUBSECTION constitutes as
-- lesson. Each lesson is wrapped in a <div> with an <h4> headline. 
-- <code> markes M2 code that can be run in the interactive shell. 

-- todo:
--  complain if tabs are present DONE
--  flag parts of the documentation (Keyword, lines), that are not translated. DONE
--  tests SOME
--   
--  add in several examples in aux files.
--  change package name?
--  markdownToSimpledoc
--  markdownToTutorial
--  tutorialToMarkdown
-- 
-- TODO:
--  load your own tutorial
--  WRITE: "writing tutorials" text
--  change included tutorials as .md files.
--  place .simpledoc files into the SimpledocToMarkdown dir DONE
--  change SimpledocToMarkdown name. DONE
--  change Makefile in tutorials directory
--  in frontend/tutorials.js:
--    

--  in tutorials.js: 
newPackage(
        "SimpledocToMarkdown",
        Version => "0.9", 
        Date => "21 June 2017",
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
        AuxiliaryFiles => true, -- change to true...
        DebuggingMode => true,
        PackageExports => {"Text"}
        )

export {
    "simpledocToMarkdown",
    "fileToMarkdown",
    "simpledocExample"
    }

initialSpaceSize1 = method()
initialSpaceSize1 String := (line) -> (
     -- Returns the number of spaces at the beginning of the line.
     -- NO tabs are allowed in line!!
     -- result of this should be {(0,n)}
     initialSpace := regex("^ *", line);
     assert(initialSpace#0#0 === 0);
     assert(#initialSpace === 1);
     n := initialSpace#0#1;
     if n === #line then infinity else n
     )

-- returns a list of lists of lines, with initial space (at top level) removed
-- it is expected that all lines are non-empty.
-- empty lines are considered of infinite size
splitByMinimumSpace = method()
splitByMinimumSpace List := (lines) -> (
    assert(all(lines, line -> instance(line,String)));
    sizes := lines / initialSpaceSize1;
    minsize := sizes // min;
    pos := positions(sizes, i -> i == minsize);
    pos = append(pos, #lines);
    -- the following line means that if the frst line of 'lines' is not smallest indent,
    -- then we collect all of the lines before the one of minimum size, and add it into that group.
    if #sizes > 0 and sizes#0 > minsize then pos = prepend(0, drop(pos,1));
    if minsize =!= infinity then
      lines = for line in lines list substring(line, minsize);
    for i from 0 to #pos-2 list (
        first := pos#i;
        last := pos#(i+1)-1;
        lines_{first..last}
        )
    )

TEST ///
{*
  restart
*}
  debug needsPackage "SimpledocToMarkdown"
  L = {"    ", "  a", "   bcd"}
  assert(L/initialSpaceSize1 === {infinity, 2, 3})
  assert(splitByMinimumSpace L === {{"  ", "a", " bcd"}}) -- note that L_0 is not here.  Should we complain if the first element is not the smallest?
  assert(initialSpaceSize1 "" === infinity)
  assert(splitByMinimumSpace {} === {})
  assert(splitByMinimumSpace {"", ""} === {{""}, {""}}) -- both are at the minimum # spaces.
  assert(splitByMinimumSpace {"a", "", ""} === {{"a", "", ""}})-- both are at the minimum # spaces.
  assert(splitByMinimumSpace {"  Key  ", "", "  ", "    Text  ", "  Key2"}  === {{"Key  ", "", "", "  Text  "}, {"Key2"}})
  assert(substring("", 2) === "")
  assert(substring("   ", 2) === " ")
  assert(substring("abc", 0) === "abc")
  assert(substring("abc", 1) === "bc")
  assert(substring("abc", 2) === "c") 
  assert(substring("abc", 3) === "")
///


concatenateLines = method()
concatenateLines List := (lines) -> (
    assert(all(lines, line -> instance(line,String)));
    concatenate for line in lines list (line | "\n")
    )

TEST ///
{*
  restart
*}
  debug needsPackage "SimpledocToMarkdown"
  assert(concatenateLines {} == "")
  assert(concatenateLines {"", ""} === "\n\n")  
  assert(concatenateLines {"a b", " c d"} === "a b\n c d\n") 
///

replaceWithValueOf = method()
replaceWithValueOf String  :=  s -> (
  -- replace content between @-symbols with its value
  -- s = "2+2 = @ TO 2+2@, and 4-2= @TO2 {(4-2),"nnnn" }@." 
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

stripSpace = method()
stripSpace String := (str) -> (
    str1 := replace(///^\s*///, "", str);
    replace(///\s*$///, "", str1)
    )

TEST ///
{*
  restart
*}
  debug needsPackage "SimpledocToMarkdown"
  assert(replaceWithValueOf "" === "")
  assert(replaceWithValueOf "1@TO \"hi\"" === "1\\({\\tt hi}\\)")
  assert(replaceWithValueOf "@@" === "\\({\\tt null}\\)")
///

processExampleSectionMD = (lines) -> (
     -- Each line should be either completely blank, or
     -- have some text.  Each line with more indentation than the
     -- previous is appended to a <code> block
     -- A string is returned.
     lines = select(lines, line -> stripSpace line != "");
     if #lines === 0 then return {};
     blks := splitByMinimumSpace lines;
     {""} | flatten for b in blks list flatten {"```", b, "```"} | {""}
 )

getSubsectionString = method()
getSubsectionString String := (str) -> (
    if not match(///^\s*SUBSECTION///, str) then 
        null 
    else (
        h := replace(///^\s*SUBSECTION\s*\"///, "", str);
        replace(///\",?\s*$///, "", h)
        )
    )

TEST ///
{*
  restart
*}
  debug needsPackage "SimpledocToMarkdown"
  assert(getSubsectionString "  SUBSECTION \"hi there\" " === "hi there")
  assert(getSubsectionString "  SUBSECTION       \"hi there\"      what " =!= null)
  assert(getSubsectionString "      SUBSECTION \"bases of vector spaces\" "


///

-- simpledocToMarkdown: takes a string in simpledoc format, and extracts out the title,
-- section headings, and text and examples, returning a markdown string, suitable for 
-- use with web.macaulay2.com
simpledocToMarkdown = method()
simpledocToMarkdown String := (simpledoc) -> (
    contents := lines simpledoc;
    -- remove comment lines:
    contents = select(contents, s -> not match(///^\s*--///, s));
    for i from 0 to #contents-1 do (
        -- check for tab characters, as they mess up the logic if handled improperly.
        if match("\t", contents#i)
        then return ("***ERROR***: tab character found on line "|i|".  Tabs are not allowed in simpledoc file");
        );
    blocks := splitByMinimumSpace contents;
    markdownLines := flatten for blk in blocks list (
        key := stripSpace blk#0;
        if key == "Headline" then (
            if #blk != 2 then (
                << "warning: expected exactly one line under Headline" << endl;
                << "  received instead: " << endl;
                << concatenateLines blk;
                );
            if #blk == 0 then {""} else
            {"# " | replace(///^\s*///, "", blk#1)}
        ) else if key == "Description" then (
            paras := splitByMinimumSpace drop(blk, 1); -- remove "Description"
            flatten for p in paras list (
                k := stripSpace p#0;
                lines := drop(p,1);
                if k == "Text" then (
                   flatten splitByMinimumSpace (lines/replaceWithValueOf)
                ) else if k == "Example" then (
                    processExampleSectionMD lines
                ) else if k == "Code" then (
                    secname := getSubsectionString lines#0;
                    if secname === null then (
                        << "warning: ignoring lines: " << endl;
                        << concatenateLines  lines;
                        continue;
                    ) else if #lines > 1 then (
                        << "warning: ignoring lines: " << endl;
                        << concatenateLines drop(lines,1);
                        continue;
                    );
                    if secname === null then {"##"} else {"## " |  secname}
                ) else (
                    << "warning: ignoring section: " << endl;
                    << concatenateLines p;
                    continue
                )
            )
        ) else (
             << "warning: ignoring section: " << endl;
             << concatenateLines blk;
             continue
        )
    );
    concatenateLines markdownLines
    )

fileToMarkdown = method()
fileToMarkdown String := (filenamePrefix) -> (
    contents := get (filenamePrefix | ".simpledoc");
    outname := filenamePrefix | ".md";
    << "-- writing file: " << outname << endl;
    outname << simpledocToMarkdown contents << close;
    )
    
example1 = ///
  Key
    example1
  Headline
    my great tutorial (D. Hilbert)
  Description
    Code
      SUBSECTION "Abelian categories"
    Text
      this is the first paragraph, with $f(x) = x^3-\sin x + 1$.
      
      a second paragraph with a tt, @TT "hi"@.
    Text

    Example
      R = QQ[x]
      x^3-x-1
      f = x -> (
          "hi there"
          )
///           

example2 = ///
Key
  what
Headline
  Linear algebra
Description
  Code 
    SUBSECTION "bases of vector spaces"
  Text
    Let $V$ be a vector space, and suppose that $\{v_1, \ldots, v_n\}$ are
    vectors in $V$.  We wish to know how to determine a subset which is a basis,
    and whether they span $V$, and whether they are linearly independent.
  Example
    R = QQ
    V = R^5
  Text
  
  Example
  Caveats
  ///
  
TEST ///
{*
  restart
  needsPackage "SimpledocToMarkdown"
*}
  debug SimpledocToMarkdown
  example1    
  simpledocToMarkdown example1
  simpledocToMarkdown example2
  simpledocToMarkdown simpledocExample
    
  simpledocToMarkdown get "~/src/InteractiveShell/tutorials/1-gettingStarted.simpledoc"
  simpledocToMarkdown get "~/src/InteractiveShell/tutorials/2-elementary-groebner.simpledoc"
  "foo.md" << simpledocToMarkdown get "~/src/InteractiveShell/tutorials/3-beginningM2.simpledoc" << close;
///       

{*
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
*}

simpledocExample = ///Key
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
  SimpledocToMarkdown
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
    
    For an example, suitable for basing your own tutorials on, see @TO "simpledocToMarkdown"@.
SeeAlso
  SimpleDoc
///

end--

restart
uninstallPackage "SimpledocToMarkdown"
restart
needsPackage "SimpledocToMarkdown"
installPackage "SimpledocToMarkdown"
check "SimpledocToMarkdown"


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

eg1 = ///
  Key    
    foo
  Headline                
    My %$&&^%^&%^& title
  Description
  
    Code
      Domething not understood
        Well
    Text
    Example
    Text
    Example
    
    Text
    
    Example
    SomethingElse
    
///

TEST ///
  -- test construction of latex constructs
{*
  restart
*}
  
  debug needsPackage "SimpledocToMarkdown"
  simpledocToMarkdown eg1 -- fails
  
///

TEST ///
  -- test construction of result html
///

TEST ///
    "foo.html" << convertContents simpledocExample
///

// test of processTextSection
restart
loadPackage "SimpledocToMarkdown"
installPackage "SimpledocToMarkdown"

uninstallPackage "SimpledocToMarkdown"
check "SimpledocToMarkdown" -- no tests...

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
loadPackage "SimpledocToMarkdown"
X = get "tu_elementary.m2"
"tu_elementary.simpledoc" << tutorialToSimpleDoc X << close;
"../public/tutorials/elementary.html" << convert "tu_elementary.simpledoc" << close;
netList oo
beginDocumentation()


