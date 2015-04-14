var assert = require('chai').assert;

var rewire = require("rewire");
var containers = rewire('../lib/sudoDockerContainers.js');

process.env.NODE_ENV = 'test';

describe('Docker manager tests', function () {

    var manager;

    before(function () {
        var execMock = function(command, next) {
            assert.include(command, 'sudo docker');
            next(null);
        };
        containers.__set__("exec", execMock);

        manager = containers.manager();

    });

    it('should show be possible to create a docker container', function () {
        assert(manager);
    });

    it('should call next without error when calling getNewInstance', function(next) {
        var waitForSshd = function(next, instance) {
            next(false, instance);
        };
        containers.__set__("waitForSshd", waitForSshd);
        manager.getNewInstance(function(error, instance) {
            assert.isFalse(error);
            next();
        });
    });

    it('should call removeInstance', function(next) {
        manager.removeInstance({});
        next();
    })
});
