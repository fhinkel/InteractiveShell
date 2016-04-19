Architecture of the tryM2 server
---------------------------------

The components of the system include:

1. The frontend client, running in a browser
2. a nodejs web server
3. m2 docker containers, one per user.

Notes:

* The communication (1) <--> (2) is done using socketio.
* The node web server is generally running inside a virtual machine created by vagrant.
  and the m2 docker containers re created in this same virtual machine.  If you use
  the separate_machines vagrant image, then **two** virtual machines are created:
  one for the node server, and one for all of the m2 containers.
* communication (2) <--> (3) is generally done via ssh.
* if the M2 process tries to "open" a file (which happens for help pages,
    displaying graphics and other files), then the m2 docker container
    issues a request to the nodejs server, which handles sending this data back to the front end.

* Duties of the nodejs server
  * a simple http server.

    Serves the following things.
      *
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