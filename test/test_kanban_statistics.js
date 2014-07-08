/*global require, describe, it , before, after, beforeEach, afterEach */
(function () {
    "use strict";

    var assert = require("assert"),
        should = require("should"),
        tl = require("../lib/timeline");


    describe("Kanban Statistics", function(){
        var project = require("./fixture_fake_project_1").project,
            tickets = project.tickets,
            start_date = project.start,
            end_date = start_date.addBusinessDay(20),
            timeline = tl.build_time_line(start_date, end_date);

        describe("testing Kanban Statistics - Work In Progress", function () {


            var monday = start_date,
                tuesday  = monday.next_day(1),
                wednesday = monday.next_day(2),
                thursday = monday.next_day(3),
                friday   = monday.next_day(4),
                next_monday = start_date.next_day(7),
                next_tuesday  = next_monday.next_day(1),
                next_wednesday = next_monday.next_day(2);


            var title = tickets.map(function (wi) { return "        " + wi.progress_bar(timeline) + "\n";}).join("")
            it("assuming  \n        mtwtfmtwtfmtwtf\n" +title, function(){
                monday.weekday().should.eql("Mon");
                next_monday.weekday().should.eql("Mon");
                tickets.length.should.equal(3);
            });

            var calculate_wip = require("../lib/kanban_kpi/work_in_progress").calculate_wip;

            it("testing work_in_progress ", function () {

                var wip = calculate_wip(tickets, monday);
                wip.should.eql({ date: monday , proposed: 0, planned: 0, in_progress: 0, done: 0});

                var wip = calculate_wip(tickets, tuesday);
                wip.should.eql({ date: tuesday  ,proposed: 0, planned: 0, in_progress: 0, done: 0});

                var wip = calculate_wip(tickets, wednesday);
                wip.should.eql({ date: wednesday , proposed: 0, planned: 1, in_progress: 0, done: 0});

                var wip = calculate_wip(tickets, thursday);
                wip.should.eql({ date: thursday, proposed: 0, planned: 0, in_progress: 1, done: 0});

                var wip = calculate_wip(tickets, friday);
                wip.should.eql({ date: friday, proposed: 0, planned: 1, in_progress: 1, done: 0});

                var wip = calculate_wip(tickets, next_monday);
                wip.should.eql({ date: next_monday, proposed: 0, planned: 1, in_progress: 2, done: 0});

                var wip = calculate_wip(tickets, next_tuesday);
                wip.should.eql({ date: next_tuesday  ,proposed: 0, planned: 0, in_progress: 3, done: 0});

                var wip = calculate_wip(tickets, next_wednesday);
                wip.should.eql({ date: next_wednesday , proposed: 0, planned: 0, in_progress: 2, done: 1});

                var far_later = next_wednesday.next_day(100);
                var wip = calculate_wip(tickets, far_later);
                wip.should.eql({ date: far_later , proposed: 0, planned: 0, in_progress: 0, done: 3});
            });
        });

        describe("testing Kanban Statistics - Throughput", function () {

            it("should calculate Throughput - no mean (width == 1)", function () {

                var throughput_progression = require("../lib/kanban_kpi/throughput_progression").throughput_progression;

                var t = throughput_progression(tickets,timeline,1);

                var through_in = t.through_in.data;
                through_in.should.eql([ 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

                var through_out = t.through_out.data;
                through_out.should.eql([ 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]);

            });

            it("should calculate Throughput -  averaging with width = 2 days", function () {

                var throughput_progression = require("../lib/kanban_kpi/throughput_progression").throughput_progression;

                var t = throughput_progression(tickets,timeline,2);

                var through_in = t.through_in.data;
                through_in.should.eql([ 0, 0, 0, 0.5, 0.5, 1, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

                var through_out = t.through_out.data;
                through_out.should.eql([ 0, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0, 0, 0]);

            });

        });

    });

})();

