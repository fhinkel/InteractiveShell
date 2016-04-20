require('./startup.js')({
  authentication: "basic",
  serverConfig: {
    port: 8002,
    MATH_PROGRAM_COMMAND: 'export WWWBROWSER=/usr/bin/open; ' +
    'export PATH=/usr/bin:$PATH; M2 --print-width 100',
    CONTAINERS: '../lib/sudoDockerContainers.js'
  }
});

