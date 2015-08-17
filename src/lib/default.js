
var configuration = function (overrideOptions){
    
    var options = {
        server_config: {
            port: 8002, // default port number to use
            CONTAINERS: './LocalContainerManager.js',
            MATH_PROGRAM: "Macaulay2",
            MATH_PROGRAM_COMMAND: 'M2'
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
            cpus: 2,
            memory: 128
        }
    };

    var overrideDefaultOptions = function (overrideOptions, defaultOptions) {
	console.log("Hello.");
        for (var opt in overrideOptions) {
            console.log(opt);
            console.log(defaultOptions[opt]);
            console.log(defaultOptions[opt] instanceof Array);
            if (defaultOptions.hasOwnProperty(opt)) {
                if(defaultOptions[opt] instanceof Object){
                    overrideDefaultOptions(overrideOptions[opt], defaultOptions[opt]);
                } else {
                    defaultOptions[opt] = overrideOptions[opt];
                }
                //logExceptOnTest("server option: " + opt + " set to " + defaultOptions[opt]);
            } else {
                defaultOptions[opt] = overrideOptions[opt];
            }
        }
    };

    overrideDefaultOptions(overrideOptions, options);

    return {
        server_config: options.server_config,
        per_container_resources: options.per_container_resources,
        container_config: options.container_config
    };
};

exports.get_config = configuration;

