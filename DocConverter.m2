-- Umlaute (Groebner ...) cause problems in HTML
-- \mapsto{}  this causes problems inside TEX

-- TODO 2/29/2012
-- Example:  group all lines that have further indentation together, and make one button out of those.
--        remove initial indentation
-- Text:  write toHtml, meaning:
--          remove @...@ replacing with something inside
--          put html TEX around it
--          handle anything else not handled by TEX
-- Code:  search for SUBSECTION, grab name, put a div in
--        handle wierd other things.  Possibly just ignore them
-- do not forget to print html header and wrapper.


newPackage(
        "DocConverter",
        Version => "0.1", 
        Date => "",
        Authors => {{Name => "Franzi", 
                  Email => "", 
                  HomePage => ""}},
        Headline => "",
        DebuggingMode => true
        )

needsPackage "Text"

export {convert, groupLines, keywordRE, descriptionRE}

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


-- create string with code for HTML rather than simple doc
-- add extra line break at every paragraph
-- translate TEX code
toHtml = method()
toHtml String := (s) ->  (

  -- replace only what is between 2 @ symbols 
    -- there might be extra with spaces betwen @ TO 
    -- careful with greedy matching
  -- @TO2 looks like this: 
    -- @TO2 {(symbol _,Matrix,Sequence),"_"}@
    -- this causes problems with following TEX, e.g., _ is translated to <sub>
    --s = replace(///@\s*TO2\s*\{\([^\)]*\),"([^"]*)"\}@///, "(\\1)", s );

  -- whitespaces followed by @TO2, remove everything up to next @ symbold
  s = replace(///\s*@\s*TO2\s*\{\([^\)]*\),"([^"]*)"\}@///, "", s );

  -- @TO (not @TO 2)
    -- keep text between @TO ... @
  s = replace(///@\s*TO\s*([^@]*)@///, "\\1", s );
  s = html TEX s;
  s | "<BR>\n"
  )

-- return string with HTML head for given title
printHead = method()
printHead String := title -> (
     s :=  "<html>\n";
     s = s |  "  <head>\n";
     s = s | ///   <link rel="stylesheet" href="m2.css" type="text/css" media="screen"> ///;
  	 s = s | ///   <script type="text/javascript" src="jquery-1.6.4.min.js"> </script> ///;
	   s = s | ///   <script type="text/javascript" src="m2.js"></script></script> ///;
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
     MKey := first select(M, x -> match(///^\s*Key///, first x));
     MHeadline := first select(M, x -> match(///^\s*Headline///, first x));
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
	          toHtml concatenate between("\n", m#1)
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


end

restart
loadPackage "DocConverter"
L = convert "beginningM2.simpledoc";
fn = "Beginning.html"
fn << L
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

