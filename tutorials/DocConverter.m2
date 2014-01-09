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
        Version => "0.1", 
        Date => "",
        Authors => {{Name => "Mike Stillman, Franziska Hinkelmann", 
                  Email => "hinkelmann.1@mbi.osu.edu", 
                  HomePage => ""}},
        Headline => "Convert simpleDOC to HTML for TryM2 tutorials",
        DebuggingMode => true
        )

needsPackage "Text"

export {convert, keywordRE, descriptionRE, tutorialToSimpleDoc}

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
  l := separate("@", s);
  concatenate for i from 0 to #l-1 list (
    if even i then 
      l#i
    else (
      t := value replace( ///TO|TO2|TT///, "", l#i);
      if instance(t, List) then 
        t = last t;
      t = "{\\tt " | toString t | "}"
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
  s = html TEX s;
  s | "<BR>\n"
  )

toHtmlPara = method()
toHtmlPara String := (s) -> (
  s = replaceWithValueOf s;
  --print s;
  s = "<p>" | html TEX s | "</p>\n"
  )

-- return string with HTML head for given title
printHead = method()
printHead String := title -> (
     s :=  "<html>\n";
     s = s |  "  <head>\n";
     s = s |  "\n    <title>\n";
     s = s |   title;
     s = s | "\n";
     s = s |  "    </title>\n";
     s = s |  "  </head>\n";
     s = s |  "<body>\n"  
     )

convert = method()
convert String := (filename) -> (
     contents := lines get filename;
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
	          toHtmlPara concatenate between("\n", m#1) -- all lines in a text section
	       else if k === "Example" then (
              m1 := select(last m, x -> not match(///^\s*$///, x));
              concatenate apply(m1, x -> "        <code>"| replace(///^\s*///, "", x) |"</code><br>\n")
            )
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

end

restart
loadPackage "DocConverter"
--L = convert "beginningM2.simpledoc";
L = convert "tutorials/gettingStarted.simpledoc";
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

doc ///
Key
  DocConverter
Headline
Description
  Text
  Example
Caveat
SeeAlso
///

doc ///
Key
Headline
Usage
Inputs
Outputs
Consequences
Description
  Text
  Example
  Code
  Pre
Caveat
SeeAlso
///

TEST ///
-- test code and assertions here
-- may have as many TEST sections as needed
///

