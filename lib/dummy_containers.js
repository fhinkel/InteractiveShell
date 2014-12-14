var dummy_manager = function () {
    var options = {
      credentials: {
         host: '127.0.0.1',
         username: 'lars',
         port: '22',
         sshKey: '/home/lars/.ssh/id_rsa'
      }
    };

    var removeIp = function(ip){
       return;
    };
   
    var getNewIp = function (next) {
      next(options.credentials);
    };


    return {
        getNewIp : getNewIp,
        removeIp : removeIp
    };

};

exports.manager = dummy_manager;
