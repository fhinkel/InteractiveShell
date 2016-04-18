**Making your own Macaulay2 web server which
runs on Amazon Web Services (AWS, i.e. on the Amazon cloud)**

There are a number of steps to set this up,
due to the complexity of AWS.  But, it really isn't
so bad.

* Create an account on AWS.
* Learn how to log on to the AWS Console

The steps needed to create a virtual machine on AWS running tryM2.  The specific
directions might change, as it depends on Amazon's web interface.

* Create a user with admin priviledges
* Create a key (this is a file that you will download
called credentials.csv.  You will need to open this file later and extract the information. )
* Create a Key Pair:
  * Go to the EC2 Console
  * Go to Network and Security -- Key Pairs
  * Create a KeyPair.  You will give it a name and description.
    This will download a file with a .pem extension, which you
    will refer to below.
* Add a security group, with the following information:
Custom TCP, incoming port 8002, 0.0.0.0/0, name it 'default'.

Now, back on your machine, you will need to install**vagrant**and
make sure you have**wget**as well (if not, you can download the file below from your browser).  After that, do the following.

* In a command line, download the vagrant file we will use.
  * `wget https://github.com/fhinkel/InteractiveShell/blob/master/Vagrantfile_aws`
* You will need to edit this file, to change the following items.
  *

  InteractiveShell/Vagrantfile_aws