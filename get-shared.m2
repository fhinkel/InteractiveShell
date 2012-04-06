str = ///
	libgvc.so.5 => /usr/lib/libgvc.so.5 (0x00007f1fc81e5000)
	libgraph.so.4 => /usr/lib/libgraph.so.4 (0x00007f1fc7fd8000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f1fc7c36000)
	libdl.so.2 => /lib/x86_64-linux-gnu/libdl.so.2 (0x00007f1fc7a32000)
	libcdt.so.4 => /usr/lib/libcdt.so.4 (0x00007f1fc782c000)
	libpathplan.so.4 => /usr/lib/libpathplan.so.4 (0x00007f1fc7623000)
	libexpat.so.1 => /lib/x86_64-linux-gnu/libexpat.so.1 (0x00007f1fc73f9000)
	libz.so.1 => /lib/x86_64-linux-gnu/libz.so.1 (0x00007f1fc71e1000)
	libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6 (0x00007f1fc6f5c000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f1fc846c000)
///

end

restart
load "get-shared.m2"
str
L = select(lines str, s -> match("=>\\s*", s))
L1 = apply(L, s -> separateRegexp("=>\\s*|\\(", s))
L2 = apply(L1, s -> if #s === 3 then s#1 else (<< "line has different format than expected" << endl; s))
L3 = apply(L2, s -> "cp " | s | " " | substring(1,s))
print concatenate between("\n", L3)
netList oo
