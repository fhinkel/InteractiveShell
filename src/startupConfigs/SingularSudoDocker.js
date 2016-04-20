require('./default.js')({
  serverConfig: {
    port: 8002,
    MATH_PROGRAM: 'Singular',
    MATH_PROGRAM_COMMAND: 'Singular',
    CONTAINERS: '../lib/sudoDockerContainers.js'
  },
  containerConfig: {
    containerType: "singular_container"
  },
  startInstance: {
    host: '127.0.0.1',
    sshKey: '/home/vagrant/InteractiveShell/Vagrant_singular/id_rsa',
    username: 'singularUser'
  }
});

