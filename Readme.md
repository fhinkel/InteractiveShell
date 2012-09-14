# TryM2

## Purpose

A node.js webserver that serves an interactive Macaulay2 shell. Security is provided by starting every Macaulay2 process in its own schroot. We recommend starting the webserver from inside a virtual box for added security. 

[Macaulay2](http://www.macaulay2.com) is a software system devoted to supporting research in algebraic geometry and commutative algebra, whose creation has been funded by the National Science Foundation since 1992.

To get started, select a tutorial. Click on any highlighted code, Macaulay2 will execute it. The result is displayed on the right. Alternatively, you can use the Input Terminal on the left to write your own commands. Execute a line by positioning your cursor on it and click on the Evaluate button (or type Shift-Enter). You can switch back to the tutorial at any time.

The tutorials demonstrate different aspects of Macaulay2. They are meant to be starting points for your own experimentation. Edit the commands in the Input Terminal and run them again. Whenever you're ready to move on, click the Next button.

## Current status

Still a little hacked, but we think it's working. 

## Features

* Unrestricted Macaulay2 shell
* Uploading Packages and other files is possible
* Rendering JPGs with Graphs.m2
* Running inside schroots


## Usage
    node m2server.js --schroot
    
By default, listening on port 8002. You can change this in m2server.js.

## Installation
You can run

    node m2server.js 
    
on your own machine visit the server on http://localhost:8002. If you have Macaulay2 installed, this gives you an (unsecured!) Macaulay2 shell. That means, through the browser you have access to your entire machine with the same permissions as the user that started m2server, i.e., you. 

### Secure server using schroots
You probably want to run 

    node m2server.js --schroot
    
which will place every new user into its own (secure) chroot, thus not giving access to your system. Warning: Know what you are doing when you offer this service, we are not responsible if somebody finds a security hole!

You need 
* node.js
* Macaulay2
* patched formidable: [git@github.com:fhinkel/node-formidable.git](git@github.com:fhinkel/node-formidable.git)
* different node packages, use npm install to get them (connect, cookies, )
* forever to run server as a daemon



 
    
