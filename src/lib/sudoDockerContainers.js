var sudo_docker_manager = function () {
    //var exec = require('child_process').exec;
    
   
    var resources = {
        cpus: 1,
        memory: 128
    };

    var options = {
        sshdCmd: "/usr/sbin/sshd -D",
        instance: {
            host: '127.0.0.1',
            username: 'm2user',
            port: '123',
            sshKey: '/home/vagrant/InteractiveShell/id_rsa',
            containerName: ''
        }
    };




    var removeInstance = function(instance){
      console.log("Removing container: " + instance.containerName);
      var exec = require('child_process').exec;
       exec('sudo docker rm -f ' + instance.containerName, function(error, stdout, stderr){
         console.log("Removed container with result: " + error);
       });
       delete instance;
    };
   
    var getNewInstance = function (next) {
      var exec = require('child_process').exec;
      var currentInstance = JSON.parse(JSON.stringify(options.instance));
      options.instance.port++;
      var dockerContainerName = "m2Port" + currentInstance.port;
      var dockerRunCmd = 'sudo docker run -d';
      dockerRunCmd += ' -c ' + resources.cpus;
      dockerRunCmd += ' -m ' + resources.memory + 'm';
      dockerRunCmd += ' --name ' + dockerContainerName;
      dockerRunCmd += ' -p ' + currentInstance.port + ':22';
      dockerRunCmd += ' m2container ' + options.sshdCmd;
      // console.log("Ports: " + currentInstance.port + " " + options.instance.port);
      exec(dockerRunCmd, function (error, stdout, stderr) {
         if(error){
            console.log("There was an error starting the docker container: " + error.message);
            if(error.message.match(/Conflict. The name/)){
               console.log("The name was taken.");
               getNewInstance(next);
            } else {
               throw error;
            }
         } else {
            //console.log("Starting ssh. OUT: " + stdout + " ERR: " + stderr);
            currentInstance.containerName = dockerContainerName;
            waitForSshd(next, currentInstance, dockerContainerName);
         }
      });
    };
   
    var waitForSshd = function(next, instance, dockerContainerName){
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
            next(false, instance);
         } else {
            console.log("sshd not ready yet.");
            waitForSshd(next, instance, dockerContainerName);
         }
      });
    };

    return {
        getNewInstance : getNewInstance,
        removeInstance : removeInstance,
        updateLastActiveTime : function(instance){}
    };

};

exports.manager = sudo_docker_manager;
