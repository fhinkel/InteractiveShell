
var configuration = function(overrideOptions) {
  var options = {
    cookieName: "tryM2",
    authentification: "none",
    serverConfig: {
      CONTAINERS: '../lib/LocalContainerManager.js',
      MATH_PROGRAM: "Macaulay2",
      MATH_PROGRAM_COMMAND: 'M2',
      resumeString: '',
      port: '8002'
    },
    containerConfig: {
      sshdCmd: "/usr/sbin/sshd -D",
      containerType: "m2container"
    },
    startInstance: {
      host: '127.0.0.1',
      username: 'm2user',
      port: '123',
      sshKey: '/home/vagrant/InteractiveShell/id_rsa',
      containerName: ''
    },
    perContainerResources: {
      cpuShares: 2,
      memory: 256
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

exports.getConfig = configuration;

