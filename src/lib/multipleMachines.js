var multiMachineManager = function() {
  var Machine = function() {
    this.name = '';
    this.containerManager = '';
    this.config = null;
    this.maxContainerNumber = 1;
    this.currentContainerNumber = 0;
    this.load = 0;
    this.updateLoad = function() {
      if (this.maxContainerNumber == 0) {
        console.log("Why are you even considering machines that don't allow users?");
        this.load = 1;
      } else {
        this.load = this.currentContainerNumber / this.maxContainerNumber;
      }
    };
    this.init = function(name,
                            containerManagerFile,
                            config,
                            maxContainerNumber) {
      this.name = name;
      this.containerManager = require(containerManagerFile)(config);
      this.config = config;
      this.maxContainerNumber = maxContainerNumber;
      this.getNewInstance = function(next) {
        this.containerManager.getNewInstance(function(err, instance) {
          if (err) {
            next(err);
          } else {
            this.currentContainerNumber++;
            this.updateLoad();
            instance.machine = this;
            next(instance);
          }
        });
      };
      this.removeInstance = function(instance, next) {
        this.containerManager.removeInstance(instance, function() {
          this.currentContainerNumber--;
          this.updateLoad();
          if (next) {
            next();
          }
        });
      };
      this.updateLastActiveTime = function(instance) {
        this.containerManager.updateLastActiveTime(instance);
      };
    };
  };

  var machines = [];

  var updateLastActiveTime = function(instance) {
    instance.machine.updateLastActiveTime(instance);
  };

  var getNewInstance = function(next) {
    machines.sort(function(a, b) {
      return a.load - b.load;
    });
    machines[0].getNewInstance(next);
  };

  var removeInstance = function(instance, next) {
    instance.machine.removeInstance(instance, next);
  };

  return {
    updateLastActiveTime: updateLastActiveTime,
    getNewInstance: getNewInstance,
    removeInstance: removeInstance
  };
};
