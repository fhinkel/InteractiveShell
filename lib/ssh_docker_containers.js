var ssh2 = require('ssh2');
var fs = require('fs');

var ssh_docker_manager = function () {
    
   
    var resources = {
        cpus: 1,
        memory: 128
    };

    var hostConfig = {
        containerType: 'm2container',
        sshdCmd: "/usr/sbin/sshd -D",
        dockerRunCmd: '',
        host: '127.0.0.1',
        username: 'vagrant',
        port: '4999',
        sshKey: "/home/vagrant/InteractiveShell/separate_machines/host_key"
    };

    function init(){
        hostConfig.dockerRunCmd = 'sudo docker run -d';
        hostConfig.dockerRunCmd += ' -c ' + resources.cpus;
        hostConfig.dockerRunCmd += ' -m ' + resources.memory + 'm';
        hostConfig.dockerRunCmd += ' --name';
    }

    init();

    var options = {
        guestCredentials: {
            host: '127.0.0.1',
            username: 'm2user',
            port: '5000',
            sshKey: '/home/vagrant/InteractiveShell/separate_machines/docker/docker_key',
            containerName: ''
        }
    };

    var getDockerStartCmd = function(credentials){
        console.log("Generating a docker start cmd.");
        var result = hostConfig.dockerRunCmd;
        result += ' ' + credentials.containerName;
        result += ' -p ' + credentials.port + ":22";
        result += ' ' + hostConfig.containerType + " " + hostConfig.sshdCmd;
        return result;
    };




    var removeCredentials = function(guestCredentials){
      console.log("Removing container: " + guestCredentials.containerName);
      // var exec = require('child_process').exec;
      //  exec('sudo docker rm -f ' + guestCredentials.containerName, function(error, stdout, stderr){
      //    console.log("Removed container with result: " + error);
      //  });
      //  delete guestCredentials;
    };
   
    var getNewCredentials = function (next) {
        var currentCredentials = JSON.parse(JSON.stringify(options.guestCredentials));
        options.guestCredentials.port++;
        currentCredentials.containerName = "m2Port" + currentCredentials.port;
        connectWithSshAndCreateContainer(currentCredentials, next);
        
    };

    process.on('uncaughtException', function (err) {
        console.log('Caught exception in cm process object: ' + err);
    });

    var connectWithSshAndCreateContainer = function(credentials, next){
        console.log("Credentials generated. Now running container.");
        var dockerRunCmd = getDockerStartCmd(credentials);
        var connection = new ssh2.Client();
        connectToHostAndExecCmd(dockerRunCmd, function(stream){
            stream.on('data', function(dataObject){
                //console.log("Receiving data: " + dataObject);
                var data = dataObject.toString();
                credentials.containerId = data;
                checkForSuccessfulContainerStart(credentials, next);
            });

            stream.stderr.on('data', function(dataObject){
                // If we get stderr, there will not come an id, so don't be
                // afraid of data.
                console.log("Receiving stderr: " + dataObject);
                var data = dataObject.toString();
                if(data.match(/ERROR/i)){
                    console.log("We got an error. Requesting other credentials.");
                    getNewCredentials(next);
                    stream.end();
                }
                // var error = dataObject.toString();
                
            });
        });

    };

    var connectToHostAndExecCmd = function(cmd, next){
        console.log("Will exec cmd:\n" + cmd);
        var connection = new ssh2.Client();
        connection.on('ready', function () {
            connection.exec(cmd, function (err, stream) {
                if (err) throw err;
                stream.on('close', function () {
                    connection.end();
                });
                stream.on('end', function () {
                    stream.close();
                    console.log('I ended.');
                    connection.end();
                });
                next(stream);
            });
        }).connect({
            host: hostConfig.host,
            port: hostConfig.port,
            username: hostConfig.username,
            privateKey: fs.readFileSync(hostConfig.sshKey)
        });
    };

    var checkForSuccessfulContainerStart = function(credentials, next){
        console.log("Checking for succesful container start.");
        var getListOfAllContainers = 'sudo docker ps --no-trunc | grep ' + credentials.containerName + ' | wc -l';
        connectToHostAndExecCmd(getListOfAllContainers, function(stream){
            stream.on('data', function(dataObject){
                console.log("Receiving data: " + dataObject);
                var data = dataObject.toString();
                if(data == 0){
                    console.log('No such container');
                    getNewCredentials(next);
                } else {
                    console.log('So much success ' + data);
                    checkForRunningSshd(credentials, next);
                }
            });

            stream.stderr.on('data', function(dataObject){
                console.log("ContainerStart: Receiving stderr: " + dataObject);
            });
        });
    };

    var checkForRunningSshd = function(credentials, next){
        console.log("Will check for running sshd.");
        var getContainerProcesses = "sudo docker exec " + credentials.containerName + " ps aux"
        var filterForSshd = "grep \"" + hostConfig.sshdCmd + "\"";
        var excludeGrepAndWc = "grep -v grep | wc -l";
        var sshdCheckCmd = getContainerProcesses + " | " + filterForSshd + " | " + excludeGrepAndWc;
        connectToHostAndExecCmd(sshdCheckCmd, function(stream){
            stream.on('data', function(dataObject){
                console.log("Receiving data: " + dataObject);
                var data = dataObject.toString();
                if(data == 0){
                    console.log('No sshd running');
                    checkForRunningSshd(credentials, next);
                } else {
                    console.log('Container started + sshd running: ' + data);
                    next(credentials);
                }
            });

            stream.stderr.on('data', function(dataObject){
                console.log("CheckRunningSshd: Receiving stderr: " + dataObject);
            });
        });
    };
   

    return {
        getNewCredentials : getNewCredentials,
        removeCredentials : removeCredentials
    };

};

exports.manager = ssh_docker_manager;
