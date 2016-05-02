var imageNo = Math.floor(24 * Math.random());
var mathProgramName = "Singular";
var DefaultText = "" +
    "   /**\n" +
    "    * Welcome to Singular online!\n" +
    "    * In this window you may type in Singular commands \n" +
    "    * and have them evaluated by the server.\n" +
    "    * \n" +
    "    * Evaluate a line or selection by typing Shift+Enter \n" +
    "    * or by clicking on Evaluate.\n" +
    "    * \n" +
    "    * Here are some sample commands: */\n" +
    "    **/\n" +
    "  ring r = 101,(a,b,c,d),dp;\n" +
    "  ideal I = a^2-b*c, a^3-b^3, a^4-b*d^3, a^5-c^2*d^3;\n" +
    "  ideal G = groebner(I);\n" +
    "\n" +
    "  /*  Some examples of rings and orderings  */\n" +
    "  ring r; // ZZ/32003ZZ[x,y,z]\n" +
    "  ring s = 0,x(1..6),lp; // QQ[x(1)..x(6)]\n" +
    "  ring R = (0,t),(x,y,z),dp; // QQ(t)[x,y,z]\n" +
    "  ring C = (0,i),(x,y,z),dp; minpoly = i2+1;\n"
    "  /******************************************/\n";

document.addEventListener('DOMContentLoaded', function() {
    var fpis = document.getElementsByClassName("frontPageImage");
    for(var key in fpis){
        var fpi = fpis[key];
        if(typeof fpi === "object"){
            fpi.setAttribute("src", "/images/fpi" + imageNo + ".jpg");
        }
    }
}, false);

