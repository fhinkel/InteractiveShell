var sudo_docker_manager = function () {
    //var exec = require('child_process').exec;
    
   
    var resources = {
        cpus: 1,
        memory: 128
    };

    var options = {
        sshdCmd: "/usr/sbin/sshd -D",
        credentials: {
            host: '127.0.0.1',
            username: 'm2user',
            port: '123',
            sshKey: '/home/vagrant/InteractiveShell/id_rsa',
            containerName: ''
        }
    };




    var removeCredentials = function(credentials){
      console.log("Removing container: " + credentials.containerName);
      var exec = require('child_process').exec;
       exec('sudo docker rm -f ' + credentials.containerName, function(error, stdout, stderr){
         console.log("Removed container with result: " + error);
       });
       delete credentials;
    };
   
    var getNewCredentials = function (next) {
      var exec = require('child_process').exec;
      var currentCredentials = JSON.parse(JSON.stringify(options.credentials));
      options.credentials.port++;
      var dockerContainerName = "m2Port" + currentCredentials.port;
      var dockerRunCmd = 'sudo docker run -d';
      dockerRunCmd += ' -c ' + resources.cpus;
      dockerRunCmd += ' -m ' + resources.memory + 'm';
      dockerRunCmd += ' --name ' + dockerContainerName;
      dockerRunCmd += ' -p ' + currentCredentials.port + ':22';
      dockerRunCmd += ' m2container ' + options.sshdCmd;
      // console.log("Ports: " + currentCredentials.port + " " + options.credentials.port);
      exec(dockerRunCmd, function (error, stdout, stderr) {
         if(error){
            console.log("There was an error starting the docker container: " + error.message);
            if(error.message.match(/Conflict. The name/)){
               console.log("The name was taken.");
               getNewCredentials(next);
            } else {
               throw error;
            }
         } else {
            //console.log("Starting ssh. OUT: " + stdout + " ERR: " + stderr);
            currentCredentials.containerName = dockerContainerName;
            waitForSshd(next, currentCredentials, dockerContainerName);
         }
      });
    };
   
    var waitForSshd = function(next, credentials, dockerContainerName){
      var exec = require('child_process').exec;
      var dockerRunningProcesses = "sudo docker exec " + dockerContainerName + " ps aux";
      var filterForSshd = "grep \"" + options.sshdCmd + "\"";
      var excludeGrep = "grep -v grep";
      
      exec(dockerRunningProcesses + " | " + filterForSshd + " | " + excludeGrep, function(error, stdout, stderr){
         if(error){
            console.log("There was an error while waiting for sshd: " + error);
         }
         var RunningSshDaemons = stdout;

         console.log("Looking for sshd. OUT: " + stdout + " ERR: " + stderr);

         if(RunningSshDaemons){
            console.log("sshd is ready.");
            next(credentials);
         } else {
            console.log("sshd not ready yet.");
            waitForSshd(next, credentials, dockerContainerName);
         }
      });
    };

    return {
        getNewCredentials : getNewCredentials,
        removeCredentials : removeCredentials
    };

};

exports.manager = sudo_docker_manager;
