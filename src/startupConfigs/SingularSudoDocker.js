require('./startup.js')({
  serverConfig: {
    port: 8002,
    MATH_PROGRAM: 'Singular',
    MATH_PROGRAM_COMMAND: 'Singular',
    CONTAINERS: '../lib/sudoDockerContainers.js',
    resumeString: 'Type \'listvar();\' to print the list of ' +
    'existing variables.\n' +
    'Type \'basering;\' to print the currently active ring.\n> '
  },
  containerConfig: {
    containerType: "singular_container"
  },
  startInstance: {
    host: '127.0.0.1',
    sshKey: '/home/vagrant/InteractiveShell/setups/Singular/id_rsa',
    username: 'singularUser'
  }
});

