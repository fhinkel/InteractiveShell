
var configuration = function(overrideOptions) {

  var options = {
    server_config: {
      CONTAINERS: './LocalContainerManager.js',
      MATH_PROGRAM: "Macaulay2",
      MATH_PROGRAM_COMMAND: 'M2',
      resumeString: '',
      port: '8002'
    },
    container_config: {
      sshdCmd: "/usr/sbin/sshd -D",
      containerType: "m2container",
      instance: {
        host: '127.0.0.1',
        username: 'm2user',
        port: '123',
        sshKey: '/home/vagrant/InteractiveShell/id_rsa',
        containerName: ''
      }
    },
    per_container_resources: {
      cpuShares: 2,
      memory: 128
    },
    hostConfig: {
      minContainerAge: 10,
      maxContainerNumber: 1,
      containerType: 'm2container',
      sshdCmd: "/usr/sbin/sshd -D",
      dockerCmdPrefix: 'sudo ',
      host: '192.168.2.42',
      username: 'vagrant',
      port: '22',
      sshKey: "/home/vagrant/InteractiveShell/separate_machines/host_key"
    },
    guestInstance: {
      host: '192.168.2.42',
      username: 'm2user',
      port: '5000',
      sshKey: '/home/vagrant/InteractiveShell/separate_machines/docker_key',
      containerName: '',
      lastActiveTime: 0
    }

  };

  var overrideDefaultOptions = function(overrideOptions, defaultOptions) {
    for (var opt in overrideOptions) {
      if (defaultOptions.hasOwnProperty(opt)) {
        if (defaultOptions[opt] instanceof Object) {
            overrideDefaultOptions(overrideOptions[opt], defaultOptions[opt]);
          } else {
            defaultOptions[opt] = overrideOptions[opt];
          }
      } else {
        defaultOptions[opt] = overrideOptions[opt];
      }
    }
  };

  overrideDefaultOptions(overrideOptions, options);

  return options;
};

exports.get_config = configuration;

