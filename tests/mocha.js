var assert = require("assert")
var m2server = require('../m2server')

describe('Array', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function(){
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });
    it('should not be true', function() {
        assert(false);
    }); 
  })
})


describe('m2server', function(){
    it('should be available as a variable', function(){
        m2server.listen(8080);
        assert(true);
    })
})

