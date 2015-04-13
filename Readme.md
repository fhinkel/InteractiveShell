[![Build Status](https://travis-ci.org/fhinkel/InteractiveShell.svg?branch=master)](https://travis-ci.org/fhinkel/InteractiveShell)

# Interactive Shell - a Web App for Macaulay2

## Purpose

With *Interactive Shell* you can build a web app for interactive command-line tools.
We have developed *Interactive Shell* specifically for [Macaulay2](http://www.macaulay2.com),
**available here: [web.macaulay2.com](http://web.macaulay2.com)**.

Macaulay2 is a software system devoted to supporting research in algebraic geometry and
commutative algebra, whose creation and development have been funded by the National Science Foundation since 1992.

At its core, the web app has is a terminal emulator connecting the user with a Macaulay2 instance running
remote. The web app also contains interactive tutorials that teach algebraic geometry and a
To get started, select a tutorial. Click on any highlighted code, Macaulay2 will execute it. The result is displayed on the right. Alternatively, you can use the Input Terminal on the left to write your own commands. Execute a line by positioning your cursor on it and click on the Evaluate button (or type Shift-Enter). You can switch back to the tutorial at any time.

The tutorials demonstrate different aspects of Macaulay2. They are meant to be starting points for your own experimentation. Edit the commands in the Input Terminal and run them again. Whenever you're ready to move on, click the Next button.


## Features

* Unrestricted [Macaulay2](http://www.macaulay2.com) shell
* Uploading Packages and other files is possible
* Rendering JPGs with e.g., Graphs.m2

## Installation
    `npm install`
    
## Usage
    `npm start`

## Tests
    `sudo npm test`
    `or inside boot2docker npm test`

By default, listening on port 8002. Open [http://localhost:8002](http://localhost:8002) in your browser.
If you have Macaulay2 installed, this gives you an (unsecured!) Macaulay2 shell.
That means, through the browser you have access to your entire machine with the same permissions as the user that started m2server, i.e., you.

In order to get a secure system, build the virtual box by running `vagrant up`.


You need 
* node.js and npm
* Docker (or boot2docker)
* [Macaulay2](http://www.macaulay2.com)
* Optional: [forever](https://github.com/nodejitsu/forever) to run server as a daemon


## Contributing
We welcome any contributions. Feel free to send us an email if you have any questions.

 
    
