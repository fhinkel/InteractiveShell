var dummy_manager = function () {
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


    var removeCredentials = function(ip){
       return;
    };
   
    var getNewCredentials = function (next) {
      next(options.credentials);
    };


    return {
        getNewInstance: getNewCredentials,
        removeInstance: removeCredentials,
        updateLastActiveTime: function(){}
    };

};

exports.manager = dummy_manager;
