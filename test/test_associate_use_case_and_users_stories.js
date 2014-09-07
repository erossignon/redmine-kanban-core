/*global describe, before, require, it */
var should =require("should");
var HashMap = require("../lib/hashmap").HashMap;

var rck = require("../") ;
(function () {
    "use strict";
    describe("Testing Use cases & User stories association", function () {

        var project = null;
        before(function(done){

            project = require("./fixture_fake_project_2").project2;

            project.should.be.instanceOf(rck.Project);

            project.save(__dirname + "/temp/fixture_project1.json",function(err){
                done(err);
            });
        });
        it("should associate use cases",function(){

            project._work_items.length.should.be.greaterThan(10);

            var use_cases = project.associate_use_case_and_user_stories();

            //xx console.log(use_cases.length);
            //xx console.log(require("util").inspect(use_cases,{colors: true, depth: 10}));

            use_cases.length.should.eql(2); // 2 epics

            use_cases[0].children.length.should.eql(3); // 3 use_cases in epic 1
            use_cases[1].children.length.should.eql(3); // 3 use_cases in epic 1

            use_cases.should.be.instanceOf(Array);

        });

        it("associating use_case several time shall not cause damages",function(){

            var use_case_ref1 = project.associate_use_case_and_user_stories()[0];
            var use_case_before = use_case_ref1.children.length;

            var use_case_ref2 = project.associate_use_case_and_user_stories()[0];
            var use_case_after = use_case_ref2.children.length;

            use_case_before.should.equal(use_case_after);
        });

    });
})();
