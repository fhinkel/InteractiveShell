all:
	pdflatex jsag.tex
	bibtex jsag
	pdflatex jsag.tex
	pdflatex jsag.tex
	open jsag.pdf

clean:
	rm -rf *.aux *.bbl *.blg *.log *.maf *.mtc *.mtc0 *.out
