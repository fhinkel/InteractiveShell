GLOBAL.OPTIONS = require('./default.js').get_config({
    hostConfig: {
        dockerRunCmd: '',
        minContainerAge: 3600,
        maxContainerNumber: 10,
        containerType: 'singular_container_power',
        sshdCmd: "/usr/sbin/sshd -D",
        host: 'localhost',
        username: 'power',
        port: '22',
        sshKey: "/home/power/.ssh/id_rsa",
        dockerCmdPrefix: ""
    },
    server_config: {
        port: 1337,
        MATH_PROGRAM: 'Singular',
        MATH_PROGRAM_COMMAND: 'Singular',
        CONTAINERS: './sshDockerContainers.js',
        resumeString: 'Type \'listvar();\' to print the list of existing variables.\nType \'basering;\' to print the currently active ring.\n> '
    },
        per_container_resources: {
            cpuShares: 4,
            memory: 2048
        },
    guestInstance: {
        host: 'localhost',
        username: 'singularUser',
        port: '5000',
        sshKey: "/home/power/InteractiveShell/Vagrant_singular/id_rsa",
        containerName: 'singularContainer',
        lastActiveTime: 0
    },
});

var Macaulay2Server = require('./index.js').MathServer();
Macaulay2Server.listen();