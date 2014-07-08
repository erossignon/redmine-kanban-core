/*global describe, require, it */
var should =require("should");
var HashMap = require("../lib/hashmap").HashMap;

(function () {
    "use strict";
    describe("Testing HashMap", function () {

        it("should have a length of 0 when created", function () {
            var hm = new HashMap();
            hm.size().should.equal(0);
        });

        it("should have a length of 1 after one element has been added", function () {
            var hm = new HashMap();
            hm.set("toto", 'some text');
            hm.size().should.equal(1);

            hm.get('toto').should.eql('some text');
        });

        it("should provide a has method to check if a key exists", function () {

            var hm = new HashMap();
            hm.has("toto").should.eql(false);

            hm.set("toto", 'some text');

            hm.has("toto").should.eql(true);
            hm.has("invalid key").should.eql(false);
        });

        it("should raise an exception when trying get a value of an inexistant key", function () {
            var hm = new HashMap();
            should(hm.get("invalid key")).be.undefined;
        });
        it("should create a map with a itertable map as arguement",function(){

           var some_data = { 'a':'b', 'c':'d'  };

           var hm = new HashMap(some_data);

            hm.has('a').should.eql(true);
            hm.has('c').should.eql(true);
            hm.size().should.eql(2);

        })
    });

})();

