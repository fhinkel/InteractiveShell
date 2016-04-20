2016-04-18
* Transfer changes to Singular
* Tests! Tests! Tests!
* Multiple File upload
* ~~"Session thing": Having several sockets in the same session~~
* Streamline basic authorisation
* Rename vagrantfile_aws, fix aws-readme
* Update current readme
* Add description of node server architecture to Readme
* Extract more code from frontend
* Use Sass or SCSS?


2016-04-16
* ~~keypress to expand/contract M2 window~~ (button instead)
* ~~bug: tutorials: scroll bar appears too far to the left sometimes~~ (File bug, if reappears)
* ~~command+- changes font size in the current window.~~ (buttons instead)
* ~~hovering over maximize/minimize button~~
* ~~put the About into the hamburger menu?~~
* in drawer, a close button?  or bind it to Macaulay2 at top.
* ~~Make footer smaller, and header too, if possible.~~
* ~~button colors?  think it through?~~
* ~~save menu needs better CSS~~
* ~~dialog after upload is wrong style~~
* ~~dialog for showing images done~~
* ~~picture is in the wrong place on the home screen~~
* ~~hover over buttons should be visible~~
* ~~evaluate button: make it somewhat transparent~~
* ~~polyfill should be a client side dependency~~
* possible: can code-buttons easily be wrapped if they are too long?
  or should they be even?

2016-04-14
* Clean up logging concept with environments

2016-03-26
* ~~Playing with Google's Material Design light~~
* ~~Use fetch instead of $ajax~~
* ~~Fix footer~~
* ~~Try MDL list layout instead of jquery accordion~~
* ~~delete code for tabs, i.e., trym2.navbar~~
* ~~push to AWS, so everybody can look at the new design~~

2016-03-29
* Fix AWS CodeDeploy fixen, use with TravisCI
* Add buttons on left side back in, see missing buttons

2016-03-26
* Playing with Google's Material Design light
* ~~Use fetch instead of $ajax~~
* Fix footer
* Try MDL list layout instead of jquery accordion
* delete code for tabs, i.e., trym2.navbar
* push to AWS, so everybody can look at the new design

2016-03-19
* ~~UI: Make tabs on left side visible~~
* ~~extract frontend shell part as module~~


2016-03-19
Plan for action
- clean up old branches (one branch to rule them all)
- nicer frontend
- extract shell into npm module
- mobile site, what keyboard strategy is good? Maybe only show right-hand side?
- ssl encryption
- Tests? 
- Update node and dependencies
- Are our Docker containers safe enough?
- bug when restarting your browser?
- rule the world

2016-01-07
* Computeralgebra Rundbrief
* It takes some time for the Docker container to start. We should always have one ready, i.e. start it before the client connects.

2015-12-04
* Provide a https version for M2 as well.
* Rename the tryM2's in mathProgram.js
* Clean out code.
* Redesign Singular page.
* Merge branches singular and master to one branch. Delete singular branch.
* Sites for mobile devices
* App?


2015-10-25
* Meeting in late April maybe?

Next steps:
* Ask about JSAG paper
* Use the cloud in addition to Mike's machine, how expensive is that?
* Fonts and CSS and Mobile, maybe look at React and Material UI
* Native App
* More tutorials
* Update Docker and Vagrant
* Update Node and some modules
* Monitoring/error recovery
* EcmaScript 6 Syntax



* getting running on windows 7.
    step 1: Install virtual box: https://www.virtualbox.org/wiki/Downloads
      Selected all of the default options while installing.
    step 2. download and install vagrant from http://www.vagrantup.com/downloads
      click on (or double click on) the resulting file vagrant.msi
      (for me: "vagrant 1.7.2.msi").  Allow this program to make changes.
    step 3.  Restart your computer when/if prompted.
    step 4: Install "Git Bash" from: https://github.com/msysgit/msysgit/releases/
    step 5:    
      git clone https://github.com/fhinkel/InteractiveShell.git
      mkdir vagrant-trym2
      cd vagrant-trym2
      cp ../InteractiveShell/Vagrantfile_user Vagrantfile
      vagrant up
      vagrant ssh
      npm run-script sudo_docker
    step 6:
      in Chrome or Firefox, open the URL: localhost:3691
        
    * we tried to change loading of tutorials to allows loading from a URL.
    However, it appears that cross-domain loading is not allowed, and we
    would need to use our server in the middle, which appears to have
    legality and possibly security issues that would need to be explored.
    (2015-04-12)

2015-03-20
** Get the environment setup such that we can run it in the cloud
    * get it so Mike (and everybody else including "The Cloud" can install
    * use Docker or Vagrant for managing and executing the virtual machine in which Node is running
    * use Docker for managing and executing linux containers or native Docker containers for each user
    * everybody read a Docker tutorial! Lars, create Dockerfile that builds Virtual machine for us. Thanks :)



** Upload file for directory or several files at once
** Better error handling
** New tutorials and tutorial upload?
** Monitoring
** Paper in JSAG (submitted 5/16/15)
** Paper in AMS Notices



2014-12-14
* remove duplications from mathProgram.js in 3 public folders
* graph generated with M2 should not be save on server, stream directly to browser
* interrupt
* write lxc/docker_containers.js
* automatically mkdir public/images so images can be emitted to client





2014-12-13  9pm
Make the containers run
   * Connect to localhost via ssh
   * Make the sftp stuff work
   * Decide how the curls should work
      ** image + viewHelp


2014-12-13  11am
Goal: Attract more users!
1. Improve stability
   * Use socket.io instead of ServerSentEvents. Benefit:  DONE
      ** Outsource complicated connection process.
      ** Basis for account management
      ** Basis for tutorial upload
      ** Basis for frontend re-design
   * Separate node server and containers
      ** Several machines able to run containers -> Redundancy
         (Amazon AWS? Ask institutions to run container machines?)
      ** Node server checks machine for load and sanity
2. Better look + feel
   * Re-desing frontend
      ** Bootstrap?
3. Better tutorials
   * Make tutorial upload available
4. Easier install for institutions


2014-03-10
Refactor client side, eliminate duplication
    common 
        shell
        accordion
        upload
        save
    M2
    Singular
Finish article
Application for ICMS
Need Singular 
    url + text + tutorials
    viewHelp, viewImage?
Design
max number of users
    user cleanup
    recycle ips
    remove users in cron
Cleanup broken sessions
Offer virtual machine for download
Install script for lxc
Cleanup documentation TeX files


M2: install dot (Graphviz) (DONE)
upload response (DONE)
save (DONE)
open for images
tutorial upload, DocConverter.m2 should be in /home?
open for text, open not found




2014-03-09
One repo for different math programs (DONE)
Linux Containers instead of schroots (DONE)


2013-07-24
TAB completion:
   * On server or client side?
Colorization
Feedback button

2013-07-20

Next we should think about refactoring all tutorial functions 
and load lessen functions, and then decide, if loadLesson calls 
activate(tutorial) or the other way round, or if the main 
routines always call both.   sort of DONE

set caret position needs to be rewritten to get $element passed in instead of string   DONE

2013-07-15
Planning structure:
   Want: * TAB completion
         * Tutorial management w/ user login
Server side
   * user-module
      * start + assert + delete user
      * find ClientID
      * clientID.exists
   * shell-module (two modules, one for schroots, one without)
     One shell per user or global shellobject to distinguish between non-schroot and schroot?
      * Constructor setting up directories, etc.
      * Create persistent instance of M2
      * Pipe output back and forth
      * Restart+Interrupt
      * Delete
      * property: path for file interactions
      * getClientIDFromUrl
   * main m2server-module
      * server app
      * startSource
      * EventStream bla
      * stats + admin
Client side
   * Maybe a shell object?   DONE
      * History management   DONE
      * Bind key events on shell window   DONE
      * parts of postMessage go here   DONE
      * chatOnData   DONE
   * Improve show+hide methods for tutorial, terminal, home   DONE
      * Sometimes one has to click twice ?
   * Tutorials module 
      * makeAccordion?
      * load the tutorials from files
      * Uploading tutorials
      

2013-07-12
* Check user management, i.e. user deletion for bugs on machine w/ schroots.

2013-07-05
* Want to be able to maximize the right hand side, for better use on devices with small displays.
   1. Maximize button
   2. Make middle separator moveable

What do we need to make this really useful for the fall semester? 
* data persistence
* tutorial uploads
* handle many concurrent clients - load balancing
* email homework assignments to teachers for grading? 
* announce it
* database with tutorials an feedback/user information on tutorials. MongoDB? or couchDB? 
    can we use a standard solution for up/down voting tutorials?
* we want a curated and organized list of tutorials
* extra node in M2 package documentation that is lifted automatically into tutorial



6/28/2013
* data persistence of command history on client side
* data persistence of output on client side, especially useful for long running computations, 
    or persistence on server side, and a way of sending it to the client when reconnecting
*Vagrant: Up and Running? 

Tutorial uploads: 
    *front end interface
    *transform from simple doc format, on the fly?
    *where do we store them?


6/21/2013
* disable autocorrection (e.g. Upper case) on iPad 
* restrict size of array that keeps track of command history


6/19/2013
Franzi's thoughts: 
* use grunt? (JavaScript Runner to automate testing, jsLint, deployment, etc)
* web sockets instead of Ajax + SSE? Websockets has some overhead, whereas 
    SSE does not, but our SSE implementation is very hard to understand and maintain, websockets has
    fallback mechanism for older browsers
* automated testing, Selenium?
* refactor mathProgram.js, it is really long and hard to navigate
* automatic deployment? Push to the server without being on the server? What tools can do that? 



6/10/2013
* typing into right hand side DONE


6/7/13
* fixed bug with caching file in Chrome for uploads 



5/31/2013
* Should we check for cookies? Should we create users when user does not accept cookies, like for curl?
* secure cookies?  avoid spoofing of users?
* write a jsag paper about this
* get "!cat /etc/passwd", /groups, /shadow should be cleaned
* fork the schroot git
* restrict network access of schroots, we need curl to work on 
    localhost and also for tutorials uploaded by users. If we restrict network access to localhost, 
    we need to rethink tutorial strategy, maybe use iptables


Major stuff: 
* Android
* tutorials management strategy




5/15/2013

notify user if using Internet Explorer (DONE), or viewHelp on Mobile device etc. 

5/10/2013
DONE: 
    move cursor on shift enter
    second virtual machine, master and stable branch for nice deploying
    subdomain for trym2
    
On iPhone, viewHelp does not work, looks as if server is serving page before iPhone user allows pop up


4/26/2013
Shift enter and button click moves down to next line (FRANZI + LARS) DONE
Does site work on IE? (MIKE)
Converter for tutorial format (MIKE)
* subdomain from Dan (MIKE) DONE
different virtual machine (LARS) DONE
Writing into right hand side (ALL): 
    - show input on left hand side?
    - deactivate mouse cursor? 
    - change color/font? 
    - when typing in right hand side, automatically type on left or bring warning
BUG: trying to get a URL that we don't serve does not give 404 but eternal waiting DONE


4/5/2013
welcome tutorial: clicking on everything in order makes a error because x and x_1 DONE
m2server: refactor, handle unhandled requests DONE
selenium testing, we should use it!

3/26/2013
BUG: on iPad, using viewHelp breaks the event stream
We need another port for a test server that we can use before we go live now that we have told people about web.m2.com DONE 


upload: owned by root DONE
/home can't use mv etc DONE
running get "!open .txt" returns a wrong link DONE


3/25/2013
*tutorial name should be displayed inside lessons, font DONE
*update readme for github
*strategy for tutorials
*JSAG article
* Create new tutorial DONE

* Change text of 'welcome' and 'help' and 'M2In', DONE
* explain save-upload relationship (they're not necessarily intended to be used together) DONE

DESIRED
* 'Evaluate all' method for tutorials
* Getting list of tutorials, so far it is fixed, OK for now
* keep/get M2 results from earlier calculations when navigating away from site


*alerts DONE
*welcome screen DONE
*about DONE
*open image - can we pass the name? DONE
* Terminal, Tutorial, TOC - the one we're on should be highlighted DONE

3/23/2013
IMPORTANT
* Save button  (pretty much)DONE
* CSS position of buttons DONE

3/21/2013
User interface:
* one button for upload & browse DONE
* arrows instead of previous & next DONE


3/17/2013
New TODO list:
* manage user list: clean-users
    background scripts: 
      clean up script: for when the m2server goes down  DONE
* resource limitations
    understand the nproc limit,  DONE
    perhaps use cgroups  DONE
    how to determine the number of processes for a user? /sys/fs/cgroup/memory/<username>/tasks
      the number of lines in this file is the number used by nproc.
    memory limit for user, not for process  DONE
* how to control virtualbox via command line  DONE (info in configuring_ubuntu.tex)
* scripts or directions to recreate the vbox server
    includes: vbox, schroot, ...
    this is partially written down in one of the tex files (in configuring_ubuntu.tex too)
* Dan's emails: check them DONE
* update habanero, restart it  DONE
* need test suite and perhaps testing framework  (DONE)
    Have "make check"
    EventStream does not allow for easy testing.
* tutorials management strategy
* writing tutorials
* allow, if possible: in one browser, multiple sessions (one per tab, or window).
    Decided to go with one session per browser.  (DONE)
* user interface elements:
    download button
    drop down menu doesn't fit the style  DONE (ABANDONED)
    next and prev buttons sometimes disappear  DONE
    resizing or changing fonts?  Can the user do this?  SEEMS SO, BUT RESULT ISN'T SO NICE
* save, or print button
* M2 help
* ipad
* update M2 on vbox to the latest version  DONE
* write a jsag paper about this
* secure cookies?  avoid spoofing of users?
* check on: error messages from M2 getting out of sync? (From Dan's email)

1/25/13
* Lars made changes to perl-scripts
* We added times stamps in order to prune old clients
* username and clientID is now the same thing, we got rid of the hack with an array of premade user names

* we still need a max for total user number
* eventually we need to write status_user.pl  NO
* need to check for identical random usernames DONE

* is deleting clients working? Sort of we think

1/18/13
* figure out logic for deleting obsolete clients
* new users on the system should be created as needed (with a max), not using a fixed number of pre-made users DONE
* userID and clientID should be the same/based on the same random number DONE
* clientID should be checked whether it's already in use DONE?
* when is a client obsolete? we need a perl routine that check for resources, m2server will call this script for every user and kill it if the script returns true
* we need to figure out how to use timestamps

1/4/13
* we need to fix upload - seems to be working again  DONE?  test it!
* but interrupt seems broken 
* what about prune clients? Are we still touching the sName.txt for this?
* Security: can users upload executable files? YES
* More reasonable error messages from M2 is needed when user reaches his disk quota

12/14/2012
*we run the server with sudo, and then switch to one of 3 premade users, TODO: make a lot of users and have a mechanism in place that prevents users from getting a userID that's already in use. DONE
* user currently has access to sName.txt, also open-schroot is probably not going to work any more, this affects /image  DONE


11/15/2012
* how to restart the machine
* how can we tackle the security issues we have? 
    * problem: all users are the same user and can kill each other
    * solution: - start m2server as root, 
                - m2server creates users and let schroots run as different users
                - most changes for this would have to be in m2server.m2
                - we can use setpid to a random id, we probably also need to create a directory for that id where they can write to
                - we need to make sure we're using the correct pids (interrupt etc)
* when do we meet again? March (10-17 or 17-22) might be good days! :)  DONE!

9/13/2012
General:
* unit tests

IPad use:
* "keyboard" with buttons for (){}_#... to make iPad use easier



9/9/2012
use node.js connect()
change logic for startM2()

9/9/2012
We're using a virtual box and run the web server (node.js) in it. The M2's are started in schroots (secure chroots)

9/6/2012
We considered jails in FreeBSD briefly, but decided to use Ubuntu schroots.

8/31/2012
* get it running on Mike's newest machine
* maybe get MacOS 10 Server, can we sandbox it on there? 
* get sandbox running on Lars' laptop

* Security issues: We are now using a startup script setting ulimits. Can these be overwritten from inside the schroot?
* upload a package DONE
* upload tutorials 

* use it in the cloud with more than 1 machine

* Write a paper, maybe JSAG?





4/20/2012
* problem: 2 tabs in the same browser share the same cookie and the same eventStream
* what happens when we quit the browser? 

Timer: 
* start timer when user leaves  DONE
* destroy timer when user with same cookie comes back  DONE
* Can we determine if M2 is currently running a calculation for a client?  "DONE"



Mike: get server ready for May visit

4/17/2012
Do not start a new user every time they leave the page:  DONE
- don't delete clientID right away from clients[] (DONE), use a timer instead  
- Done: we are currently writing to many (dead) clients with ondata, we need to "unlink" previous on data calls first, before assigning them to new eventStreams

Still to do: 
display image not in help box  DONE
cronjob to cleanup /tmp (Maybe Lars?)  DONE
/tmp should be only writable directory in sandbox  DONE
make images work in sandbox and still have security (talk to Dan about allowing allowing restricted M2 to write)

maybe work on Print and Don't reload when briefly navigating away from site
Can we run a non-restricted M2 inside the sandbox and still be secure?  MAYBE



3/22/2012
cleanup loadFiles for jpg
get PID - find user by PID  


3/20/12
app-armor?



Gwyn's suggestions: 
ability to get worksheet uploaded
print
users can start their own server
want to be able to run programs e.g., gfan...  DONE
be able to display jpg files and generate them as in posets package DONE
list of allowed commands  (like gfan etc)
don't delete history on reload in input window  NOT DONE/IMPOSSIBLE
ask David Cook about M2/gap  NOT DONE
test low memory conditions, gracefully telling the user  NOT DONE
lots of users -> issues?  YES
Save input and output windows  NOT DONE
link for reporting issues, asking questions  NOT DONE


3/13/2012
multi-line <code>  DONE


Greg: 
"useful starting code" in Terminal
Get rid of M2 title, put in welcome screen instead
Bug: same browser, different tabs, several M2's in the same output window
help 'command' should open up in tutorial-style css, maybe on the left side? 
Tutorial button on the bottom of the page? 
syntax highlighting and autocompletion (maybe a button not necessarily tab)
Previous and Next should be inside the tutorial screen
re-arrange title, buttons, menu 

3/12/2012
  In general: security
    includes: not serving pages in /etc/...!
              denial of service attack
              running security screening tools (nlmp, or...?)
              https protocol, more secure cookies/session  MOSTLY DONE

  streamlining the M2 schroot:
    limit resources  almost DONE
    ...
  
  server mechanics:
    cron job to restart server, if it dies
    logging of data, who is coming (ip address, OS?)
    kill extraneous M2 processes
    learn about load balancing and reverse proxy server
    remove stale M2's  (time out: after a week, ...)
  server itself:
    at the moment: serving "/" resends index.hmtl and restarts M2.
    would be nice if it didn't do that: it could remember process if cookie is OK.
  
  user authentication
    allowing files on the server? Better persistence, better M2 performance (less limits)

3/7/2012
For version 1: See Mike's list


3/6/12
* deal with viewHelp, how can we display help to users? 
* Navigating through lessons, scroll bar should jump to top of each lesson

2/29/2012
* email Greg
* talk to Lars next week

2/23/2012
- Talking about server pushing data to client rather than client pulling for data

2/21/2012
Get "Next" button working again! - Done
Node.js, chat server example in "Definite Guide to Javascript", Flanagan, p 519, we need Lars to incorporate this into the existing server

Homework due 2/21 - 80% of your final grade!!!
Franzi: convert BeginningMacaulay2 to Tutorial (trunk/Macaulay2/packages/Begin...)
Mike: investigate asynchronous retrieval of M2 output, JS lint, read up on "global" variables in JS

2/17/12
At this point, it's basically functional, we need to clean it up a little bit: 
	- add another tutorial
	- fix help text
	- credits (funding?)
	- generally clean code, get rid of obsolete (?) createMenu() and createMenu2()
	- display title of current tutorial
	- display 
	
	
In the future:	
* we need 
	- load lessons from url
* write content for help text
* need Greg make it prettier
* get rid of constant pulling of data
* iPad (buttons instead of keyboard input)
* save/get our work (via email)
* Stylized way of making a tutorial page, conversion between M2 documentation style and tutorial form 
* resizing
* communicate the text-area size to M2 for correct string formatting or set reasonable default at beginning, printWidth = 80, but figure out what the width should be in advance
* undo feature	( command Z?)
* syntax highlighting
* autocompletion on Tab
* save contents (input and output)
* upload files that will turn into clickable tutorials, notebook style
* Run all commands in the tutorial up to here


2/7/12
* MB Extruder, http://pupunzi.open-lab.com/mb-jquery-components/jquery-mb-extruder/
* we need 
	- show tutorial lessons
	- load lessons
	- load lessons from url
* Strip down extruder files (js and css in root dir), change way menu is getting its content (we have a function for retrieving content, i.e., all H4's, in m2.js, createMenu()
	
	
1/30/12
* final prompts in output terminal
* AJAX-like call to get results from M2 when they're ready instead of pulling every x ms, get a smarter web server
* a little CSS to make it just a little prettier (colors, font, buttons, shadows, offset inside boxes, don't type into output window)
* indexing for tutorials, from here, load tutorials
* second tutorial so we can play with double indexed list
* help button


11/9/11
Adjusting layout, using http://tour.golang.org/ as template


12/10/11
Giving up on Sencha for now (chapter2, sencha*.*)
Going back to index-ipad.html, renaming it to index.html, starting fresher




Sencha Touch: 

* textarea size
* node.js for "pulling" data from the server without draining the battery
* Ajax calls (this should be really easy - really?)
* more buttons
* larger textarea
* lessons
* we want swiping
* table of contents/lesson overview



Use index.html in main directory or index-ipad.html, start the server from inside sockets: 
ruby RubyM2Server.rb

The php scripts that you're using from inside the Javascript files is sockets/M2Client.php and getResults.php. Be careful with different directories ...

-------

* clicking on "send to M2" button should move the cursor to next line
* padding inside lessons

* fix TOC on help page (!)
* fix TOC expand/collapse
* fix the layout :) 
* change M2 output to not be a text area but something with scrollbars
* sendToM2 functional on lesson pages, send everything up to that point
* table of contents: collapse/expand, fix sizes
* help button
* tutorial button
* back button change name
* somehow select font size

* colorization of keywords, comments, and strings


Done :) 
* detect orientation, side by side, over each other
* change titles: "on the web", "interactive" -> remove or change
* take out waiting time
* 2 finger zoom

**Planned Feature List** (some things might be out of date...)
resizing
incorporate input from tutorial
communicate the text-area size to M2 for correct string formatting or set reasonable default at beginning
undo feature	( command Z?)
syntax highlighting
autocompletion on Tab
save contents (input and output)
upload files that will turn into clickable tutorials, notebook style
Run all commands in the tutorial up to here
retrieve newest results right after sending a request and then less frequently

iPad: 
* scroll bars
* math keyboard, or buttons of most needed keys
* move text areas around
* newRing button: k, p, gens
* buttons for variables that are available

Involve Amelia, Frank Moore, Bart Snapp, other undergrad research people to have undergrads use this site, maybe develop lessons, develop a project that can be used with this site? Brandy (Elena?) thought computational algebra, any insight?



**Tutorial**
change structure: Preamble and div's should be in index.html, just load commands (and explanations)
Choice of tutorials to chose from
"run all" button, run selection/line


Use index.html in main directory or index-ipad.html, start the server from inside sockets: 
ruby RubyM2Server.rb

The php scripts that you're using from inside the Javascript files is sockets/M2Client.php and getResults.php. Be careful with different directories ... 


-----

in the cloud
education: for undergrads
why not sage: old version, too complex for simple in-classroom action, 

notebook structure not right format for M2
not suitable for mobile version
"join" sage: our notebooks can be made available through sage as well, for a different kind of users

colorization
