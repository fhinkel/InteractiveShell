GLOBAL.OPTIONS = require('./default.js').get_config({
  hostConfig: {
    dockerRunCmd: '',
    maxContainerNumber: 10,
    containerType: 'singular_container',
    sshdCmd: "/usr/sbin/sshd -D",
    host: 'localhost',
    username: 'user',
    port: '22',
    sshKey: "/home/user/.ssh/id_rsa",
    dockerCmdPrefix: ""
  },
  server_config: {
    port: 8002,
    MATH_PROGRAM: 'Singular',
    MATH_PROGRAM_COMMAND: 'Singular',
    CONTAINERS: './sshDockerContainers.js',
    resumeString: 'Type \'listvar();\' to print the list of ' +
    'existing variables.\n' +
    'Type \'basering;\' to print the currently active ring.\n> '
  },
  guestInstance: {
    host: 'localhost',
    username: 'singularUser',
    port: '5000',
    sshKey: "/home/user/InteractiveShell/Vagrant_singular/id_rsa",
    containerName: 'singularContainer',
    lastActiveTime: 0
  }
});

var Macaulay2Server = require('./index.js').mathServer();
Macaulay2Server.listen();
