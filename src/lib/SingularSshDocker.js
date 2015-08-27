GLOBAL.OPTIONS = require('./default.js').get_config({
    hostConfig: {
        dockerRunCmd: '';
        maxContainerNumber: 10,
        containerType: 'singular_container',
        sshdCmd: "/usr/sbin/sshd -D",
        host: 'localhost',
        username: 'user',
        port: '22',
        sshKey: "/home/vagrant/InteractiveShell/separate_machines/host_key"
    },
    server_config: {
        port: 8002,
        MATH_PROGRAM: 'Macaulay2',
        MATH_PROGRAM_COMMAND: 'export WWWBROWSER=/usr/bin/open; export PATH=/usr/bin:$PATH; M2 --print-width 100',
        CONTAINERS: './sshDockerContainers.js'
    }
    guestInstance: {
        host: 'localhost',
        username: 'singularUser',
        port: '5000',
        sshKey: '/home/vagrant/InteractiveShell/separate_machines/docker_key',
        containerName: 'singularContainer',
        lastActiveTime: 0
    }
});

var Macaulay2Server = require('./index.js').MathServer();
Macaulay2Server.listen();
