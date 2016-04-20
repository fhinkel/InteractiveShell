var mathProgramName = "Macaulay2";
var DefaultText = "" +
    "-- Welcome to Macaulay2 !\n" +
    "-- In this window you may type in Macaulay2 commands \n" +
    "-- and have them evaluated by the server.\n" +
    "\n" +
    "-- Evaluate a line or selection by typing Shift+Enter \n" +
    "-- or by clicking on Evaluate.\n" +
    "\n" +
    "-- To open the Macaulay2 documentation for a \n" +
    "-- topic in another browser tab or window do e.g.:\n" +
    "\n" +
    "viewHelp \"determinant\"\n" +
    "\n" +
    "-- If nothing shows up, you may need to set your browser \n" +
    "-- to allow pop up windows.\n" +
    "\n" +
    "-- To set the print width of the Macaulay2 output window:\n" +
    "printWidth = 150\n" +
    "-- (value of 0 means essentially infinite)\n" +
    "\n" +
    "-- Here are some sample commands:\n" +
    "  R = ZZ/101[a,b,c,d]\n" +
    "  I = ideal(a^2-b*c, a^3-b^3, a^4-b*d^3, a^5-c^2*d^3)\n" +
    "  J = ideal groebnerBasis I;\n" +
    "  netList J_*\n" +
    "\n" +
    "  -- Some examples of rings\n" +
    "  A = ZZ/32003[a..g]\n" +
    "  B = QQ[x_1..x_6]\n" +
    "  C = ZZ/101[vars(0..12)]\n" +
    "---------------\n";

