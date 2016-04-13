GLOBAL.OPTIONS = require('./default.js').get_config({
  server_config: {
    port: 8002,
    MATH_PROGRAM: 'Singular',
    MATH_PROGRAM_COMMAND: 'Singular',
    CONTAINERS: './sudoDockerContainers.js'
  },
  container_config: {
    containerType: "singular_container",
    instance: {
      host: '127.0.0.1',
      sshKey: '/home/vagrant/InteractiveShell/Vagrant_singular/id_rsa',
      username: 'singularUser'
    }
  }
});

console.log(OPTIONS);

var SingularServer = require('./index.js').MathServer();
SingularServer.listen();
