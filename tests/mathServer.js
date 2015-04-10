var assert = require("assert");
var http = require('http');
var mathServer = require('../lib/mathServer.js');
var sinon = require('sinon');

describe.only('MathServer Module test', function () {
    describe('When we call getTutorialList', function (next) {
        it('should get the list', function (done) {
            var server = mathServer.MathServer({
                port: 8006,
                CONTAINERS: './sudo_docker_containers.js'
            });

            var response = {
                writeHead: function() {},
                end: function() {
                    done();
                }
            };

            server.getListOfTutorials(null, response);

        });
    });
    describe('Stringify', function() {
        it('should stringify an array', function() {
            var tutorials = ["a", "b"];
            var message = JSON.stringify(tutorials);
            console.log(message);
            assert.equal(message, "[\"a\",\"b\"]");
        })
    });
});
