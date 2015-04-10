[![Build Status](https://travis-ci.org/fhinkel/InteractiveShell.svg?branch=master)](https://travis-ci.org/fhinkel/InteractiveShell)

# Interactive Shell

## Purpose

A node.js webserver that serves an interactive Math Program command line.

See [Macaulay2](http://web.macaulay2.com)  and [Singular](http://habanero.math.cornell.edu:3691/).

Security is provided by starting every process in its own docker container.

[Macaulay2](http://www.macaulay2.com) is a software system devoted to supporting research in algebraic geometry and commutative algebra, whose creation and development have been funded by the National Science Foundation since 1992.

To get started, select a tutorial. Click on any highlighted code, Macaulay2 will execute it. The result is displayed on the right. Alternatively, you can use the Input Terminal on the left to write your own commands. Execute a line by positioning your cursor on it and click on the Evaluate button (or type Shift-Enter). You can switch back to the tutorial at any time.

The tutorials demonstrate different aspects of Macaulay2. They are meant to be starting points for your own experimentation. Edit the commands in the Input Terminal and run them again. Whenever you're ready to move on, click the Next button.

## Current status

Still a little hacked, but we think it's working. 

## Features

* Unrestricted [Macaulay2](http://www.macaulay2.com) shell
* Uploading Packages and other files is possible
* Rendering JPGs with e.g., Graphs.m2
* Running inside LXCs

## Installation
    `npm install`
    
## Usage
    `npm start`

## Tests
    `sudo npm test`
    `or inside boot2docker npm test`

By default, listening on port 8002.
On your own machine visit the server on http://localhost:8002. If you have Macaulay2 installed, this gives you an (unsecured!) Macaulay2 shell.
That means, through the browser you have access to your entire machine with the same permissions as the user that started m2server, i.e., you.

In order to get a secure system, build the virtual box by running `vagrant up`.


You need 
* node.js and npm
* Docker
* [Macaulay2](http://www.macaulay2.com)
* different node packages, use npm install to get them (express, socket.io,... )
* [forever](https://github.com/nodejitsu/forever) to run server as a daemon, use npm install forever -g.




 
    
