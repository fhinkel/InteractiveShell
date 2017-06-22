import chai = require("chai");
import {Client, Clients} from "../lib/client";
import {Instance} from "../lib/instance";
import {clients, getInstance, instanceManager} from "../lib/server";
const assert = chai.assert;

describe("Server Module:", function() {

  before(function() {
  });

  beforeEach(function() {
  });

  describe("Server", function() {
    it("should allow us to call getInstance", function(done) {
      const id: string = "user123";
      clients[id] = new Client();
      clients[id].instance = {
        host: "",
        port: "",
        username: "",
        sshKey: "",
      };
      getInstance(id, function(){done(); });
    });
    it("should be able to create a new instance if there is none", function() {
      const id: string = "user123";
      clients[id] = new Client();
      const instance: Instance = {
        host: "1",
        port: "2",
        username: "3",
        sshKey: "4",
      };
      instanceManager.getNewInstance = function(next){next(undefined, instance); };
      getInstance(id, function(instance: Instance){
        assert.equal(instance.host, "1");
      });
    });
    it("should delete client if it cannot create instance", function() {
      const id: string = "user123";
      clients[id] = new Client();
      const instance: Instance = {
        host: "1",
        port: "2",
        username: "3",
        sshKey: "4",
      };
      instanceManager.getNewInstance = function(next){next("1", instance); };
      assert.notEqual(clients[id], undefined);
      getInstance(id, function(instance: Instance){});
      assert.equal(clients[id], undefined);
    });
  });
});
