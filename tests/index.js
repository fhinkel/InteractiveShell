var assert = require('assert');

describe('interrupt action', function() {
    var i = 10;
    
    before( function() {
        console.log("we do the before setup");
        
       i = i+1; 
    });
    
    it('should have an interrupt button', function(){
        console.log("i is " + i);
        assert.equal(i, 11, "my i is 11");
        assert.ok( true, "this is true");
        assert.equal(i, 13, "wrong i");
    });
    it('should send an interrupt signal', function(){
        console.log("i is " + i);
        
        assert.equal(i, 13, "wrong i");
        
    });
    it('should interrupt and restart M2', function(){
        console.log("i is " + i);
        
        assert.equal(i, 11, "my i is 11");
        assert.ok( true, "this is true");
    });
    it('should restart a stuck M2');
    it('should interrupt a large calculation');
    
    after( function() {
        
    });
});