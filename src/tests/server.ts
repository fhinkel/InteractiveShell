import chai = require("chai");
import {Client, Clients} from "../lib/client";
import {SocketEvent} from "../lib/enums";
import {Instance} from "../lib/instance";
import {clients, emitDataViaClientSockets, getInstance,
  instanceManager, sendDataToClient, serverConfig} from "../lib/server";
const assert = chai.assert;

// Suppressing the server output
process.env.NODE_ENV = "test";

describe("Server Module:", function() {

  before(function() {
  });

  beforeEach(function() {
  });

  describe("getInstance()", function() {
    it("should allow us to call getInstance", function(done) {
      const id: string = "user123";
      clients[id] = new Client(id);
      clients[id].instance = {
        host: "",
        port: 0,
        username: "",
        sshKey: "",
      };
      getInstance(clients[id], function(){done(); });
    });
    it("should be able to create a new instance if there is none", function() {
      const id: string = "user123";
      clients[id] = new Client(id);
      const instance: Instance = {
        host: "1",
        port: 2,
        username: "3",
        sshKey: "4",
      };
      instanceManager.getNewInstance = function(next){next(undefined, instance); };
      getInstance(clients[id], function(inst: Instance){
        assert.equal(inst.host, "1");
      });
    });
    it("should delete client if it cannot create instance", function() {
      const id: string = "user123";
      clients[id] = new Client(id);
      const instance: Instance = {
        host: "1",
        port: 2,
        username: "3",
        sshKey: "4",
      };
      instanceManager.getNewInstance = function(next){next("1", instance); };
      assert.notEqual(clients[id], undefined);
      getInstance(clients[id], function(inst: Instance){});
      assert.equal(clients[id], undefined);
    });
  });

  describe("sendDataToClient()", function(){
    it("should make a callable function", function(done){
      const id: string = "user123";
      clients[id] = new Client(id);
      const sender = sendDataToClient(clients[id]);
      sender("Hi.");
      done();
    });
    it("should make a call to the socket.emit function for data of type " + SocketEvent.result, function(){
      const id: string = "user123";
      serverConfig.MATH_PROGRAM = "none";
      clients[id] = new Client(id);
      clients[id].instance = {
        host: "17",
        port: 2,
        username: "3",
        sshKey: "4",
      };
      instanceManager.updateLastActiveTime = function(instance: Instance){
        assert.equal(instance.host, "17");
      };
      clients[id].socketArray.bla = {
        emit(event, data) {
          assert.equal(event, SocketEvent.result);
        },
      };
      const sender = sendDataToClient(clients[id]);
      sender("Hi.");
    });
    // clients[id].socketArray["bla"] = {};
  });
});
