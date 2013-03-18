test("hello", function() {
    ok(true, "world");
});

test("failing", function() {
  ok( "a" == "b", "This should fail because a is not equal to b" );
});