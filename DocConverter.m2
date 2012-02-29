-- TODO 2/29/2012
-- Example:  group all lines that have further indentation together, and make one button out of those.
--        remove initial indentation
-- Text:  write toHtml, meaning:
--          remove @...@ replacing with something inside
--          put html TEX around it
--          handle anything else not handled by TEX
-- Code:  search for SUBSECTION, grab name, put a div in
--        handle wierd other things.  Possibly just ignore them
-- don't forget to print html header and wrapper.

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

toHtml = method()
toHtml String := (s) -> ""; -- s | "\n";

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
     << "Headline = " << first last MHeadline << endl;
     M2 := groupLines(last MDescription, descriptionRE);
     concatenate apply(M2, m -> (
	       -- m is {Keyword, List (of lines)}.
	       -- Keyword is: Text, Code, Example (that is it at the moment)
	       k := first m;
	       if k === "Text" then
	            toHtml concatenate between("\n", m#1)
	       else if k === "Example" then (
		    m1 := select(last m, x -> not match(///^\s*$///, x));
		    concatenate apply(m1, x -> "<code>"|x|"</code><br>\n")
		    )
	       else if k === "Code" then (
		    )
	       else error "unknown Key"
	       ))
     )


end

restart
loadPackage "DocConverter"
L = convert "beginningM2.simpledoc"
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

