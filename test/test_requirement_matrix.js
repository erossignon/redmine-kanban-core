/*global describe, before, require, it */
var should =require("should");
var HashMap = require("../lib/hashmap").HashMap;

var rck = require("../") ;
var given = it;
var and = it;

(function () {
    "use strict";

    describe("Testing requirement matrix management", function () {


        var project;
        before(function(){
            project = require("./fixture_fake_project_for_requirement_matrix").project;
        });

        given("a project with some requiremnets", function() {
            project.requirements.length.should.be.greaterThan(1);
        });
        and(" with 3 uses cases", function() {

           console.log(project.use_cases.map(function(e){return e.subject + " " + e.id;}));
           // 3 use cases
           project.use_cases.length.should.equal(3);
        });
        //
        //  UC1 : "use case"
        //   |        linked with : "RQ1" , "RQ2"      <= list of nominal requirements
        //   |
        //   +-->UC2 : "use case"
        //   |     +-> linked with : "RQ3" , "RQ4"      <= list of nominal requirements
        //   |     |
        //   |     +-> US1 "user story 1"  (parent: UC2)
        //   |     |   |
        //   |     |   +---- linked with "RQ3"
        //   |     |
        //   |     +-> US2 "user story 1"  (parent: UC2)
        //   |     |   |
        //   |     |   +---- linked with "RQ3" , "RQ4"
        //   |
        //   +-->UC3 : "use case"
        //   |     +-> linked with : "RQ4" , "RQ5"      <= list of nominal requirements
        //   |     |
        //   |     +-> US3 "user story 3"  (parent: UC2)
        //   |     |   |
        //   |     |   +---- linked with "RQ4"
        //
        it("should populate the requirements collection of a workitem", function() {

            project.associate_use_case_and_user_stories();
            project.associate_requirements();

            var use_case1 = project.use_cases[0];

            use_case1.subject.should.eql("UC1");
            use_case1.requirements.length.should.eql(2);
            use_case1.requirements[0].subject.should.eql("RQ1");
            use_case1.requirements[1].subject.should.eql("RQ2");

            var use_case2 = project.use_cases[1];
            use_case2.subject.should.eql("UC2");
            use_case2.requirements.length.should.eql(2);
            use_case2.requirements[0].subject.should.eql("RQ3");
            use_case2.requirements[1].subject.should.eql("RQ4");

            var use_case3 = project.use_cases[2];
            use_case3.subject.should.eql("UC3");
            use_case3.requirements.length.should.eql(2);
            use_case3.requirements[0].subject.should.eql("RQ4");
            use_case3.requirements[1].subject.should.eql("RQ5");

        });

        var assert = require("assert");

        function _get_parent(project,work_item) {
           return project.find_work_item(work_item.parent_id);
        }

        function _populate_requirements_map(m,work_item) {
            function push_to_map(e) { m[e.id] =e;}
            work_item.requirements.forEach(push_to_map);
        }
        function _to_workitem_array(m) {
           return Object.keys(m).map(function(e)  { return m[e]; });
        }
        function extract_requested_requirements(project,work_item) {
            // extract the the requested requirement of a workitem
            // i.e the requirements that are attached to the parent of this work_item up to the root

            while (work_item && work_item.type === "U-S") {
                // for a user story we start at the first parent use case
                work_item = _get_parent(project,work_item);
            }
            assert(work_item && work_item.type === "U-C");
            var m = {};

            while (work_item) {
                _populate_requirements_map(m,work_item);
                work_item = _get_parent(project,work_item);
            }
            return _to_workitem_array(m);
        }


        function find_descendance(work_item) {

            var queue = [];
            function _recursive_queue_children(work_item) {
                work_item.children.forEach(function (child) {
                    queue.push(child);
                    _recursive_queue_children(child);
                });
            }
            _recursive_queue_children(work_item);
            return queue;
        }

        function find_all_dependant_user_stories(work_item) {
            function is_user_stories(e) { return e.type==="U-S"; }
            var tmp =  find_descendance(work_item);
            return tmp.filter(is_user_stories);
        }

        function extract_covered_requirements(project,work_item) {

            // if work_item is a user_stories
            //   - extract the the requirement that have been attached to the user_stories
            //   - explorer also children user_stories
            // i.e the requirements that are attached to the user-stories of this work_item down to the bottom

            var user_stories = find_all_dependant_user_stories(work_item);
            if (work_item.type === "U-S") {
                user_stories.push(work_item);
            }

            var m = {};
            user_stories.forEach(function(us){ _populate_requirements_map(m,us); });

            return _to_workitem_array(m);

        }

        var _ = require("underscore");
        function extract_uncovered_requirements(project,work_item) {
            // extract the requirements that should have been covered for work_item but are not covered
        }
        function extract_extra_covered_requirements(project,work_item) {
            // extract the requirements that  have been covered for work_item but are not explicitly specified
        }

        function subject(e) { return e.subject; }

        it("should extract the list of all requested requirements for a given user story", function() {

            var user_story1 = project.query_work_items({ subject: "US1"})[0];
            user_story1.type.should.eql("U-S");

            var requested_requirements = extract_requested_requirements(project,user_story1);

            console.log(requested_requirements.map(subject).sort());

            requested_requirements.map(subject).sort().should.eql(["RQ1","RQ2",'RQ3',"RQ4"]);

        });
        it("should extract the list of all requested requirements for a given use-case", function() {

            var use_case = project.query_work_items({ subject: "UC2"})[0];
            use_case.type.should.eql("U-C");

            var requested_requirements = extract_requested_requirements(project,use_case);

            console.log(requested_requirements.map(subject).sort());

            requested_requirements.map(subject).sort().should.eql(["RQ1","RQ2",'RQ3',"RQ4"]);

        });

        it("should extract the list of all covered requirements for a given LEAF  use case", function() {

            var use_case2 = project.query_work_items({ subject: "UC2"})[0];
            use_case2.type.should.eql("U-C");

            var covered_requirements = extract_covered_requirements(project, use_case2);

            console.log(covered_requirements.map(subject).sort());

            covered_requirements.map(subject).sort().should.eql(['RQ3', "RQ4"]);

        });

        it("should extract the list of all covered requirements for a given TOPLEVEL use case", function() {

            var use_case1 = project.query_work_items({ subject: "UC1"})[0];
            use_case1.type.should.eql("U-C");

            var check_us = find_all_dependant_user_stories(use_case1);
            check_us.map(subject).sort().should.eql(["US1","US2","US3"]);

            var covered_requirements1 = extract_covered_requirements(project,use_case1);


            console.log(covered_requirements1.map(subject).sort());
            covered_requirements1.map(subject).sort().should.eql(['RQ3',"RQ4","RQ5"]);
        });
    });

})();
