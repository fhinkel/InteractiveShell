Making your own Macaulay2 web server which runs on Amazon Web Services (AWS, i.e. on the Amazon cloud)
------------------------------------------


Before you begin with AWS, install vagrant on your machine,
and also get our **Vagrantfile,** which will be used to
create the Amazon instance running the M2 web server.
* **Vagrant:** https://www.vagrantup.com/downloads.html
* **Our Vagrant file:** https://raw.githubusercontent.com/fhinkel/InteractiveShell/master/Vagrantfile_aws

There are a number of steps to set up AWS,
due to the complexity of AWS.  But, it really isn't
so bad.  Before you begin,

* Create an account on AWS.
* Learn how to log on to the AWS Console.
  * https://console.aws.amazon.com/console

Here are the steps needed, current as of April 2016.  The
specifics might change, but it will likely be essentially the same.

* Create a user with admin privileges, from the AWS console, click on
 **Identity and Access Management,** or try this link:
  * https://console.aws.amazon.com/iam/
  * Click on **Users** (on left), then **Create New Users.**
  * After creating a user, click on **Next**, then **Download** the file.
  This file will be named something like `credentials.csv`
  * This gives you the access key id, and the secret access key.  This info
  will be used below, when creating the Macaulay2 server.
  * **Give this user admin privs:** Click on **Users** again, then click on the
  new user you just created. Click on **Attach Policy**, and choose
  **AdministratorAccess**.

* Create a keypair (This is a file that you will download. It is used by ssh).
  * From the AWS console, click on the **EC2** button (this places you on the EC2
  dashboard.
  * Click on **Key Pairs** (under **Network and Security** on the
  left side of the page).
  * Click on **Create Key Pair**.  Name it, and click on **Create**.
  This downloads a file of the form `keypair.pem` (name will depend on what you called it)
  You will use this name and file below.

* **Allow the AWS machine to open the needed port.**
  * On the **EC2 Dashboard,** click on **Security Groups** (under **Network and Security** on the
      left side of the page).
  * Click on **default** (the name of one of the security groups).
  * Click on **Inbound**, then **Edit**, towards the bottom of the page.
  * Add a new line with the following information (leave the SSH line alone, you
  need that to be able to access your as yet to be constructed machine instance):
    * Custom TCP Rule,
    * Protocol TCP,
    * Port Range 8002 (i.e. only one port)
    * Source: Anywhere, 0.0.0.0/0.

    Save this.

Now, back on your machine, make sure you have installed **vagrant**
and that you have downloaded the **Vagrantfile_aws** mentioned above.

* Make a folder, and place the following three files into this folder:
  * credentials.csv
  * keypair.pem
  * Vagrantfile_aws
* Rename the file `Vagrantfile_aws` to `Vagrantfile`
* Edit this file, changing the following information:
  * change the use of ACCESS_KEY_ID and SECRET_ACCESS_KEY to match
   what you have in your credentials.csv file.
  * Change KEYPAIR_NAME to the name you gave the KeyPair above
  (don't include the .pem part).
  * Change "PRIVATE_KEY_PATH" to e.g. "keypair.pem" (or whatever
  you called that file).
  * You need to set aws.region depending on the information
  visible on the **EC2 Dashboard** page.  For instance, I have
  `aws.region = "us-east-1"`.
  * Optional, if your region is "us-east-1": once you understand something about AWS, you might
  want to change the value of `aws.ami` and/or `aws.instance_type`
  * Save this file.

Now you are finally ready build the Macaulay2 Amazon instance.

* in the same folder as these files, issue the following command:
`vagrant up`.
  * the first time, this will take some time.  Eventually, it will
  complete.  At that point, from the **EC2 Dashboard**, you should
  have `1 Running Instances`.  Click on those words, and you should see
  your instance running (with a green light).
  * From that location, copy either the IP address or the
  Public DNS field.  (e.g. ec2-57-152-40-220.compute-1.amazonaws.com)
  * From a browser (Chrome is best, Firefox is generally fine, Safari has problems,
  and Internet Explorer is not supported), go to port 8002 of that
  instance, e.g.:
  `ec2-54-152-50-235.compute-1.amazonaws.com:8002`
  You should see a web based Macaulay2 appear!
  * Enjoy!

* Maintenance
  * `vagrant halt` halts the instance on Amazon.  After that, you can
  reboot it with `vagrant up`.  These commands are done in the same
  folder you used to fo `vagrant up` earlier.
  * `vagrant destroy` destroys (terminates) the machine instance.
  After that, you cannot use it, and will need to do `vagrant up`
  from the beginning.
  * To manage the instance, you can ssh into that system.  In the
  same directory on your machine do `vagrant ssh`.  This will
  log you into a command line in the amazon instance.

Doing basic authorization
--------------------------

  When you run your own Macaulay2 web server, you might prefer to require user names and passwords.
  We have included a simple but effective method for handling this case.

  * Create a file users.htpasswd (easiest is to place it in the folder where you placed `Vagrantfile`),
    and populate it with at least one user and encrypted password as follows:
    * Go to http://www.htaccesstools.com/htpasswd-generator/ and enter a user name and password.
    * This generates a line.  Place this as a line in the users.htpasswd file.

  It is fine to let all of your users use user name and one password, or you may ask your users to generate their own,
  and to let you know the resulting line.

  * Copy this file to the AWS instance.  Assuming the IP address is 54.236.196.49, and the pem file is keypair.pem, do:
      * `scp -i keypair.pem users.htpasswd ubuntu@54.236.196.49:~/InteractiveShell/public/`
  * Restart the server using the basic authorization method:
      * `ssh -i keypair.pem ubuntu@54.236.196.49 killall node`

      and then
      * `ssh -i keypair.pem ubuntu@54.236.196.49 'cd InteractiveShell; npm start forever_basicAuth'`
