# My Great Tutorial (D. Hilbert)
## Lesson 1 title

This file is written in a simple markdown format.  After changing it,
you upload the resulting file via the "LOAD YOUR OWN TUTORIAL" tab
from the home page.  Give your modfied file to your students, and
after they upload it themselves, they can work through your lessons.

We use very little markdown currently.  The line that begins with # is
the title for the tutorial.  Lines that begin with ## give the names
of each lesson.  Latex math, via mathjax, can be used, and Macaulay2
code that you wish to become buttons should be enclosed by triple backquotes (```),
as is shown below.
    
We use mathjax, which means that you can include math, in the form
like the following: \(f(x) = x^3-\sin x + 1\), or in display form via:
\[ \sum_{i=0}^n (x_i y_i + 1). \]

Blank lines start new paragraphs.  You can put in html here if you wish
e.g. <tt>hi</tt>.
<!-- html comments are allowed too, which will not display -->

Macaulay2 commands (which will be displayed as clickable buttons) are
enclosed in triple backquotes (as is standard in many markdown
languages). Here we have blank lines between them, but that is not
required.

```
R = QQ[x]
```

```
x^3-x-1
```

## Lesson 2 title    
Multiple lines can be placed in one button too.

```
f = x -> (
    x^3-x-1
    )
```

Some caveats:

(a) Some html will interact poorly with the markdown.  Using h3, h4 tags in particular,
    will likely cause problems, as the title and lesson headings use these tags.

(b) Not all latex is allowed. But math is fairly well represented, it seems.

(c) Only items in lessons (i.e. started by ##) are displayed.  Therefore any lines between
    then title and the first lesson title are never displayed.    

## If you have written tutorials previously, in simpledoc format

We have simplified the process of writing tutorials.  The markdown method shown
    on the previous pages should be sufficient.

However, if you have written tutorials for this website previously in
    simpledoc format, one can still translate those to the markdown format used here.

First load the package (on the website M2, or in your own installed M2):
        
```
needsPackage "SimpledocToMarkdown"
```

Now upload your file, say it is "tutorial.simpledoc".  It needs to end in ".simpledoc".

```
fileToMarkdown "tutorial"
```

Download the resulting "tutorial.md" file with

```
get "!open tutorial.md"
```

You can use the md file now by loading it with "LOAD YOUR OWN TUTORIAL"

## If you have written tutorials previously, in html format.

Currently, we do not support uploading files in this manner.  Please convert your html file into md format
as in the previous lesson.  If you have any issues with this, please contact us.        
