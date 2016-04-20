Architecture of the tryM2 server
---------------------------------

The components of the system include:

1. The frontend client, running in a browser
2. a nodejs web server
3. m2 docker containers, one per user.

* **Configuration methods**

  1. **local.**  No virtual machines at all, and no docker containers either: the node server and m2 processes are all run locally on the host.
  2. **basic.** There is one virtual machine, and the node server runs on it, as do the docker containers for the M2 processes.
  3. **twoMachines.** There are two virtual machines.  The node server runs on one, and all of the docker containers run
  in another.  One could imagine spreading these containers out over a number of machines, but this is not
  yet done.
  4. **basicAWS.** This is the same as **basic** but on an Amazon instance, rather than a local VM.

* **Port mappings**

    1. **local.**  The node server listens on (host) `localhost:8002`
    2. **basic.** The node server listens on (host) `localhost:8002` and communication between node and the m2 containers
    is via ssh.
    3. **twoMachines.** The node server listens  on (host) `localhost:3690` and `4998` for ssh.
    The docker machine listens for ssh traffic on `4999`.
    4. **basicAWS.** The node server listens on port 8002.  To find the IP address, or machine name, use
    the **EC2 Dashboard,** described in our readme for setting up **AWS.**

* **Synced files**

    Soon, the versions involving vagrant

    1. **local.** Everything is local here anyway, so there are no synced files (or, everything is synced!)
    2. **basic.** The `InteractiveShell` directory is synced to `/hone/vagrant/InteractiveShell`.
    3. **twoMachines.** This copies files from the localhost, but does not share files or directories, for security.
    4. **basicAWS.** On Amazon, the current directory (containing the Vagrantfile) on localhost, is placed in `/vagrant`
    on the AWS machine, but we can, and probably **should disable** this.

      * to disable: add the following line into the Vagrantfile, in the `config.vm.define` section:
      `config.vm.synced_folder ".", "/vagrant", disabled: true`

* **Basic Management.**

  Here are the ways to start, stop, and what to do if one simply wants to git pull changes, and restart the server.
  In each case, we first `ssh` or `vagrant ssh` into the machine, to the `InteractiveShell` directory.

  1. **local.** (run in `InteractiveShell`)
      * start: `npm run basic`
      * stop: control-C.
  2. **basic.** (run in `InteractiveShell/setups/basic`)
      * start: `vagrant up`
      * stop: `vagrant halt`
      * restart: `vagrant reload`
      * git pull: `vagrant ssh`, `cd InteractiveShell`, `git pull`, `npm install`, then `npm start`
  3. **twoMachines.** (run in `InteractiveShell/setups/twoMachines`)
      * start: `vagrant up`
      * stop: `vagrant halt`
      * restart: `vagrant reload`
      * git pull: `vagrant ssh`, `cd InteractiveShell`, `git pull`, `npm install`, then `npm run forever`
  4. **basicAWS.** (run in `InteractiveShell/setups/basicAWS`)
      * start: `vagrant up`
      * stop: `vagrant halt`
      * restart: `vagrant reload`
      * git pull: `vagrant ssh`, `cd InteractiveShell`, `git pull`, `npm install`, then `npm start`

* **Authentication**

  If there is a file named `users.htpasswd` in the directory containing the Vagrantfile, then authentication
  is enabled, and users are required to log in.

  In order to change to using passwords, or to add users, modify or create the users.htpasswd file,
  and then issue `vagrant reload` (or `vagrant up`, if the machine is not yet running)

  One interesting aspect is that you may have one user logged in from multiple machines or browsers
  (and even have multiple people doing so), and everyone can see one person type in commands,
  and everyone will receive the output.

* **Accessing directories on your machine**

  Using **local,** on the local machine, you or anyone running your server has complete access to files on your local machine.
  It is strongly recommended that you run a **local** server **with** authentication!

  On the various vagrant setups, files from your local computer are not immediately available.

  Todo (**basic**): allow shared folder to be accessible (either read only or read/write) from inside M2 containers.

  Todo (**basic,** **basicAWS,** and **twoMachines**): allow files to be copied to the m2 container each time one is
  started.

* **Configuration files**

  In the directory `src/startupConfigs`, you find config files for these different configurations.




Notes:

* The communication (1) <--> (2) is done using socketio.
* communication (2) <--> (3) is generally done via ssh.
* if the M2 process tries to "open" a file (which happens for help pages,
    displaying graphics and other files), then the m2 docker container
    issues a request to the nodejs server, which handles sending this data back to the front end.
* Duties of the nodejs server
  * a simple http server.
  * Sets up SocketIO connection with the front end, collects and verifies
    cookie and authorization information.
  * Manages the set of clients, i.e. the set of users currently connected.
  * Manages the SSH credentials to communicate with the M2 processes and containers.
  * Restarts the M2 containers and/or M2 processes in the container.  Sets resource limits.

* **Configuration.** Many aspects are controlled by configuration, which is placed in the `OPTIONS`
 structure.  Different startup scripts set this in different ways.

* Commands which the nodejs server accepts
  * /: serve the index.html file.
  * /

Structure of M2 container
--------------------------

This container has the latest released version of Macaulay2, together with Bertini and PHCpack.  It would be
 nice if it also would include polymake and bergman, but currently it doesn't.  This should be a
 standard m2 container, with ssh keys placed in, and a shared directory?

* The nodejs server starts an M2 container in the following way: