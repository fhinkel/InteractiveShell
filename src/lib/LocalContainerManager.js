var localContainerManager = function () {
    var exec = require('child_process').exec;

    var options = {
        credentials: {
            host: '127.0.0.1',
            port: '22'
        }
    };

    exec('whoami', function (error, username) {
        options.credentials.username = username.trim();
    });

    exec('echo $HOME', function (error, homedir) {
        options.credentials.sshKey = homedir.trim() + '/.ssh/id_rsa';
    });


    var removeInstance = function(ip){
       return;
    };
   
    var getNewInstance = function (next) {
      next(false, options.credentials);
    };


    return {
        getNewInstance: getNewInstance,
        removeInstance: removeInstance,
        updateLastActiveTime: function(){}
    };

};

exports.manager = localContainerManager;
