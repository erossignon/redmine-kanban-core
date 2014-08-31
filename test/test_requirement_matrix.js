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

            assert(work_item.type === "U-S"  || work_item.type === "U-C" );
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
            assert(work_item.type === "U-S"  || work_item.type === "U-C" );

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

        function extract_covered_requirements(work_item) {

            assert(work_item instanceof rck.WorkItem);
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

            var requested_requirements = extract_requested_requirements(project,work_item);
            var covered_requirements = extract_covered_requirements(work_item);

            var uncovered_requirements = _.difference(requested_requirements,covered_requirements);
            return uncovered_requirements;

        }
        function extract_extraneous_requirements(project,work_item) {
            // extract the requirements that  have been covered for work_item but are not explicitly specified
            var requested_requirements = extract_requested_requirements(project,work_item);
            var covered_requirements = extract_covered_requirements(work_item);
            console.log("work_item ",work_item.type,work_item.subject);
            console.log("requested_requirements=", requested_requirements.map(subject).sort());
            console.log("covered_requirements=",covered_requirements.map(subject).sort());
            var xtra_requirements = _.difference(covered_requirements,requested_requirements);
            return xtra_requirements;
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

            var covered_requirements = extract_covered_requirements( use_case2);

            console.log(covered_requirements.map(subject).sort());

            covered_requirements.map(subject).sort().should.eql(['RQ3', "RQ4"]);

        });

        it("should extract the list of all covered requirements for a given TOPLEVEL use case", function() {

            var use_case1 = project.query_work_items({ subject: "UC1"})[0];
            use_case1.type.should.eql("U-C");

            var check_us = find_all_dependant_user_stories(use_case1);
            check_us.map(subject).sort().should.eql(["US1","US2","US3"]);

            var covered_requirements1 = extract_covered_requirements(use_case1);


            console.log(covered_requirements1.map(subject).sort());
            covered_requirements1.map(subject).sort().should.eql(['RQ3',"RQ4","RQ5","RQ6"]);
        });

        it("should extract the list of uncovered requirements", function() {
            var use_case1 = project.query_work_items({ subject: "UC1"})[0];
            var uncovered_requirement = extract_uncovered_requirements(project,use_case1);
            uncovered_requirement.map(subject).sort().should.eql(['RQ1','RQ2']);
        });

        it("should extract the list of extraneous requirements", function() {
            var use_case3 = project.query_work_items({ subject: "UC3"})[0];
            var xtra_requirement = extract_extraneous_requirements(project,use_case3);
            xtra_requirement.map(subject).sort().should.eql(['RQ6']);
        });

        it("should find all the UseCase that are linked to a requirement", function() {

            var requirement4 = project.query_work_items({ subject: "RQ4"})[0];

            requirement4.nominal_use_cases.map(subject).sort().should.eql(['UC2','UC3']);
            requirement4.implementing_user_stories.map(subject).sort().should.eql(["US2"]);
        });

        it("should produce a matrix",function(){

            project.associate_use_case_and_user_stories();
            project.associate_requirements();

            var f= {

                start_row: function()  {
                    this.ele = [];
                },
                end_row: function() {
                    console.log(this.ele.join("   "));
                },
                add_cell: function(text) {
                    this.ele.push(text);
                }
            };
            f.start_row();
            f.add_cell("Rqt #");
            f.add_cell("Rqt Subject");
            f.end_row();

            function dump_requirement(requirement) {
                f.start_row();
                f.add_cell(requirement.id);
                f.add_cell(requirement.subject);

                var m = {};

                console.log(requirement.implementing_user_stories.map(subject).join("-"));

                requirement.nominal_use_cases.forEach(function(uc) {
                    f.add_cell(uc.id);
                    f.add_cell(uc.subject);

                    // extract all users stories for this UC
                    var user_stories = find_all_dependant_user_stories(uc);

                    function filter_user_story_that_implements_requirement(requirement) {

                        return function _filter_user_story_that_implements_requirement(user_story) {
                            var rqts = extract_covered_requirements(user_story);
                            return rqts.indexOf(requirement) >=0;
                        };
                    }
                    var user_stories = user_stories.filter(filter_user_story_that_implements_requirement(requirement));

                    // the user stories that implement the requirements  and that are done
                    var done_user_story   =  user_stories.filter(function(work_item){ return work_item.is_done();});

                    // the user stories that implement the requirements  and that are not done
                    var incomplete_user_story =  user_stories.filter(function(work_item){ return !work_item.is_done();});
                    m[uc.id] = {
                        done_user_story: done_user_story,
                        incomplete_user_story: incomplete_user_story
                    };

                    f.add_cell("D:"+done_user_story.map(subject).join("|"));

                    f.add_cell("U:"+incomplete_user_story.map(subject).join("|"));
                });
                f.end_row();
                f.add_cell("   ");
                f.add_cell("   ");
                f.start_row();
                requirement.nominal_use_cases.forEach(function(uc) {

                });
                f.end_row();


            }
            project.requirements.forEach(dump_requirement);

        });

    });

})();
