/*global require, describe, it, beforeEach*/
/**
 */
(function () {
    /**
     *  WorkItem utest
     */
    var should = require("should"),
        WorkItem = require("../lib/workitem").WorkItem,
        HashMap = require("../lib/hashmap").HashMap,
        tl = require("../lib/timeline"),
        today = require("../lib/today").Today();


    describe("Testing WorkItem", function () {

        it("a WorkItem created with empty options should have valid default value", function () {

            var w1 = new WorkItem({ created_on: today});

            w1.relations.length.should.equal(0);
            w1.percent_done().should.equal(0.0);
            w1.is_in_progress().should.equal(false);
            w1.is_done().should.equal(false);
            w1.type.should.equal("U-S");
            w1.journal.length.should.equal(1);
            w1.created_on.should.eql(today);
            w1.current_status.should.eql("New");
            should(w1.calculate_lead_time()).equal(undefined);

        });

        describe("Testing work item progression",function(){

            var monday = new Date("2013/07/01"),
                tuesday = monday.next_day(1),
                wednesday = monday.next_day(2);

            describe("Given a WorkItem created on monday",function(){
                var work_item = new WorkItem({ created_on: monday});

                it("should have a current status of 'New' ",function(){
                    work_item.current_status.should.eql("New");
                });

                it("should have a undefined starting_date",function(){
                    should(work_item.find_starting_date()).eql(undefined);
                });
                it("should report a status of 'unknown' for a date before its creation date ",function() {
                    work_item.find_status_at_date(monday.days_ago(10)).should.equal("unknown");
                });
                it("should report a status of 'New' at monday ",function() {
                    work_item.find_status_at_date(monday).should.equal("New");
                });
                it("should report a status of 'New' for a date after its creation date",function() {
                    work_item.find_status_at_date(monday.next_day(10)).should.equal("New");
                });
            });
            describe("Given a WorkItem created on monday and started on tuesday",function(){
                var work_item = new WorkItem({ created_on: monday});
                work_item.set_status(tuesday, "In Progress");

                it("should have a current status of 'In Progress' ",function(){
                    work_item.current_status.should.eql("In Progress");
                });
                it("should have tuesday as a starting_date",function(){
                    should(work_item.find_starting_date()).eql(tuesday);
                });
                it("should report a status of 'unknown' for a date before its creation date ",function() {
                    work_item.find_status_at_date(monday.days_ago(10)).should.equal("unknown");
                });
                it("should report a status of 'New' at monday ",function() {
                    work_item.find_status_at_date(monday).should.equal("New");
                });
                it("should report a status of 'In Progress' for a date after its creation date",function() {
                    work_item.find_status_at_date(tuesday).should.equal("In Progress");
                });
            });
            describe("Given a work item created on monday and started on tuesday and done on wednesday",function() {
                var work_item = new WorkItem({ created_on: monday});
                work_item.set_status(tuesday, "In Progress");
                work_item.set_status(wednesday, "Done");

                it("should have a current status of 'Done' ",function(){
                    work_item.current_status.should.eql("Done");
                });
                it("should have tuesday as a starting_date",function(){
                    should(work_item.find_starting_date()).eql(tuesday);
                });
                it("should report a status of 'unknown' for a date before its creation date ",function() {
                    work_item.find_status_at_date(monday.days_ago(10)).should.equal("unknown");
                });
                it("should report a status of 'New' at monday ",function() {
                    work_item.find_status_at_date(monday).should.equal("New");
                });
                it("should report a status of 'In Progress' for a date after its creation date",function() {
                    work_item.find_status_at_date(monday.next_day(10)).should.equal("Done");
                });
                it("should report a status of 'Done' for a date after its creation date",function() {
                    work_item.find_status_at_date(monday.next_day(10)).should.equal("Done");
                });



            });
        });

    });

    describe("Calculating the consolidated progress of a set of workitem", function () {

        var consolidated_percent_done = require("../lib/workitem").private.consolidated_percent_done;

        var collection, w1, w2;
        beforeEach(function () {
            collection = new HashMap();
            w1 = new WorkItem();
            w2 = new WorkItem();
        });

        it("should find that a empty set of work item shall have a progress of 0.0%", function () {
            consolidated_percent_done(collection).should.equal(0.0);
        });

        it("should find that set of work item containing a single workitem at 0% shall have a progress of 0.0%", function () {

            w1.percent_done().should.equal(0.0);

            collection.set('1', w1);
            consolidated_percent_done(collection).should.equal(0.0);
        });

        it("should find that set of work item containing a single work item at 50% shall have a progress of 50.0%", function () {

            w1.done_ratio = 50;
            w1.percent_done().should.equal(50.0);

            collection.set('1', w1);
            consolidated_percent_done(collection).should.equal(50.0);

        });

        it("should find that set of work item containing a single work item at 100% shall have a progress of 100.0%", function () {


            w1.done_ratio = 100;
            w1.percent_done().should.equal(100.0);

            collection.set('1', w1);
            consolidated_percent_done(collection).should.equal(100.0);

        });
        it("should find that set of work item containing a work item at 100% and an other one at  0% shall have a progress of 100.0%", function () {

            w1.done_ratio = 100;
            w1.percent_done().should.equal(100.0);

            w2.percent_done().should.equal(0.0);

            collection.set('1', w1);
            collection.set('2', w2);

            consolidated_percent_done(collection).should.equal(50.0);

        });
        it("should find that set of work item containing a work item at  50% and an other one at 50% shall have a progress of  50.0%", function () {

            w1.done_ratio = 50;
            w1.percent_done().should.equal(50.0);

            w2.done_ratio = 50;
            w2.percent_done().should.equal(50.0);

            collection.set('1', w1);
            collection.set('2', w2);

            consolidated_percent_done(collection).should.equal(50.0);
        });

        it("should find that set of work item containing a work item at 100% and an other one at 50% shall have a progress of  75.0%", function () {

            w1.done_ratio = 100;
            w1.percent_done().should.equal(100.0);

            w2.done_ratio = 50;
            w2.percent_done().should.equal(50.0);

            collection.set('1', w1);
            collection.set('2', w2);

            consolidated_percent_done(collection).should.equal(75.0);
        });
    });


    describe("Calculating work item LeadTime", function () {
        var monday = new Date("2013/07/01");
        var tuesday = monday.next_day(1);
        var wednesday = monday.next_day(2);
        var thursday = monday.next_day(3);
        var w1;

        beforeEach(function () {
            w1 = new WorkItem({ created_on: monday});
        });

        it("assuming a week starting on monday with 4 working days", function () {
            monday.weekday().should.eql("Mon");
        });

        it("... and assuming a work item created on monday", function () {
            w1.created_on.should.eql(monday);
        });

        it("the LeadTime of a new item shall be undefined", function () {
            w1.current_status.should.equal("New");
            should(w1.calculate_lead_time()).equal(undefined);
        });

        it("the starting date of a new item shall be undefined", function () {
            w1.current_status.should.equal("New");
            should(w1.find_starting_date()).equal(undefined);
        });

        it("the starting date of a item marked as 'In Progress' on tuesday shall be tuesday", function () {
            w1.set_status(tuesday, "In Progress");
            w1.find_starting_date().should.eql(tuesday);
        });

        it("the completion date of a item marked as 'In Progress' shall be undefined", function () {
            w1.set_status(tuesday, "In Progress");
            should(w1.find_completion_date()).equal(undefined);
        });

        it("the lead time of a work item marked as 'in progress' since tuesday shall be estimated at 3 days on tuesday (by convention)", function () {
            w1.set_status(tuesday, "In Progress");
            should(w1.calculate_lead_time(tuesday)).equal(3);
        });
        it("the lead time of a work item marked as 'in progress' since tuesday shall be estimated at 4 days on wednesday  (by convention)", function () {
            w1.set_status(tuesday, "In Progress");
            should(w1.calculate_lead_time(wednesday)).equal(4);
        });
        it("the lead time of a work item marked as 'in progress' since tuesday shall be estimated at 5 days on wednesday  (by convention)", function () {
            w1.set_status(tuesday, "In Progress");
            should(w1.calculate_lead_time(thursday)).equal(5);
        });

        it("the lead time of a work item marked as 'in progress' on tuesday and declared terminated on tuesday shall be 3 days (exactly)", function () {
            w1.set_status(tuesday, "In Progress");
            w1.set_status(wednesday, "Done");
            should(w1.calculate_lead_time(thursday)).equal(3);
        });

        it("the completion date of a item marked as 'Done' shall match the date the item was marked as done", function () {
            w1.set_status(tuesday, "Done");
            should(w1.find_completion_date()).equal(tuesday);
        });

    });

    describe("Building barlines", function () {

        var monday = new Date("2013/07/01");


        monday.weekday().should.eql("Mon");
        var tuesday = monday.next_day(1);
        var wednesday = monday.next_day(2);
        var thursday = monday.next_day(3);
        var last_friday = monday.days_ago(3);
        var last_thursday = monday.days_ago(4);

        var timeline;
        before(function() {
            timeline = tl.build_time_line(last_thursday, thursday);
            timeline.should.eql([ last_thursday, last_friday , monday, tuesday, wednesday, thursday]);
        });

        it("should construct a correct progress bar",function() {

            var work_item = new WorkItem({ created_on: monday});

            work_item.progress_bar(timeline).length.should.eql(timeline.length);

            work_item.progress_bar(timeline).should.eql("..NNNN");
            should(work_item.calculate_lead_time(monday)).equal(undefined);

        });

        it("should construct a correct progress bar",function() {


            var work_item = new WorkItem({ created_on: monday});

            work_item.set_status(tuesday, "In Progress");

            work_item.progress_bar(timeline).length.should.eql(timeline.length);

            work_item.progress_bar(timeline).should.eql("..NIII");

            work_item.calculate_lead_time(monday).should.equal(0);
            work_item.calculate_lead_time(tuesday).should.equal(3);
            work_item.calculate_lead_time(wednesday).should.equal(4);
            work_item.calculate_lead_time(thursday).should.equal(5);

            work_item.calculate_lead_time(monday, true).should.equal(0);
            work_item.calculate_lead_time(tuesday, true).should.equal(0);
            work_item.calculate_lead_time(wednesday, true).should.equal(3);
            work_item.calculate_lead_time(thursday, true).should.equal(4);

        });
    });


    describe("get_creation_date", function() {

        var monday = new Date("2013/07/01");
        var tuesday = monday.next_day(1);
        var wednesday = monday.next_day(2);
        var thursday = monday.next_day(3);

        var w1 = new WorkItem({ created_on: tuesday});
        var w2 = new WorkItem({ created_on: wednesday});
        var w3 = new WorkItem({ created_on: monday});

        var wip1 = new WorkItem({ created_on: tuesday});
        wip1.set_status(wednesday, "In Progress");

        var wip2 = new WorkItem({ created_on: wednesday});
        wip2.set_status(thursday, "In Progress");

        var done4 = new WorkItem({ created_on: monday});
        done4.set_status(wednesday, "In Progress");
        done4.set_status(thursday, "Done");

        var get_creation_date = require("../").get_creation_date;
        var get_starting_date = require("../").get_starting_date;

        it("should get the creation date of a set of workitems",function() {

             get_creation_date([w1,w2,w3]).should.eql(monday);

        });
        it("should return that the starting date is undefined if none of the work items has started yet",function() {

            should(get_starting_date([w1,w2,w3])).eql(undefined);

        });
        it("should return the earliest date of all wip items",function() {
            should(get_starting_date([w1,wip1])).eql(wednesday);
        });
        it("should return the earliest date of all wip items",function() {
            should(get_starting_date([w1,wip1,wip2,done4])).eql(wednesday);
        });


    });

})();