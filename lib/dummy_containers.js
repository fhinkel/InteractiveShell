var manager = function () {
    var options = {
      LOCALHOST: "127.0.0.1"
    };

    var removeIp = function(ip){
       return;
    };
   
    var getNewIp = function (next) {
      next(options.LOCALHOST);
    };


    return {
        getNewIp : getNewIp,
        removeIp : removeIp
    };

};

exports.manager = manager;
