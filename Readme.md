# TryM2

## Purpose

A node.js webserver that serves an interactive Macaulay2 shell. 

[Macaulay2](http://www.macaulay2.com) is a software system devoted to supporting research in algebraic geometry and commutative algebra, whose creation has been funded by the National Science Foundation since 1992.

To get started, select a tutorial. Click on any highlighted code, Macaulay2 will execute it. The result is displayed on the right. Alternatively, you can use the Input Terminal on the left to write your own commands. Execute a line by positioning your cursor on it and click on the Evaluate button (or type Shift-Enter). You can switch back to the tutorial at any time.

The tutorials demonstrate different aspects of Macaulay2. They are meant to be starting points for your own experimentation. Edit the commands in the Input Terminal and run them again. Whenever you're ready to move on, click the Next button.

## Current status

Still a little hacked, but we think it's working. 

## Features

* Running inside secure chroots
* Unrestricted Macaulay2, uploading Packages and other files is possible
* Rendering JPGs with graphs.m2

## Usage
    node m2server.js --schroot
    
By default, listening on port 8002. 