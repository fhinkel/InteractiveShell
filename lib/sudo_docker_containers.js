var sudo_docker_manager = function () {
    var exec = require('child_process').exec;

    var options = {
        credentials: {
            host: '127.0.0.1',
            username: 'm2user',
            port: '23',
            sshKey: '/home/vagrant/InteractiveShell/id_rsa'
        }
    };




    var removeCredentials = function(ip){
       return;
    };
   
    var getNewCredentials = function (next) {
      var exec = require('child_process').exec;
      var currentCredentials = options.credentials;
      currentCredentials.port = options.credentials.port;
      options.credentials.port++;
      console.log("Ports: " + currentCredentials.port + " " + options.credentials.port);
      exec('sudo docker run -d -p ' + currentCredentials.port + ':22 m2container', function (error, stdout, stderr) {
         next(currentCredentials);
      });
    };


    return {
        getNewCredentials : getNewCredentials,
        removeCredentials : removeCredentials
    };

};

exports.manager = sudo_docker_manager;
