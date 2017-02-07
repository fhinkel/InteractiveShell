/* global MathJax */
/* eslint "new-cap": "off" */
MathJax.Hub.Config({tex2jax: {inlineMath: [['$', '$'], ['\\(', '\\)']]}});
MathJax.Hub.Config({
  TeX: {
    Macros: {
      PP: "{\\mathbb{P}}",
      ZZ: "{\\mathbb{Z}}",
      QQ: "{\\mathbb{Q}}",
      RR: "{\\mathbb{R}}",
      CC: "{\\mathbb{C}}",
      mac: "{{\\it Macaulay2}}",
      bold: ["{\\bf #1}", 1]
    }
  }
});
