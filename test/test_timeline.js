/*global require, describe, it , before, after, beforeEach, afterEach */
(function () {

    "use strict";

    var tl = require("../lib/timeline"),
        should = require("should"),
        today = new Date("2014/06/27"); // require("../lib/today").Today();

    describe("testing days_ago", function () {

        it("assuming that today is 2014/06/27", function () {
            today.should.eql(new Date("2014/06/27"));
        });

        it("should find out that yesterday was 2014/06/26", function () {
            today.days_ago(1).should.eql(new Date("2014/06/26"));
        });
        it("should find out that last week was 2014/06/20", function () {
            today.days_ago(7).should.eql(new Date("2014/06/20"));
        });

        it("should find out than 10 days ago is further in the past than 1 days ago", function () {
            should(today.days_ago(10).getTime() < today.days_ago(1).getTime()).equal(true);
        });
    });

    describe("testing next_day", function () {

        it("assuming that today is 2014/06/27", function () {
            today.should.eql(new Date("2014/06/27"));
        });

        it("should find out that tomorrow will be 2014/06/28", function () {
            today.next_day().should.eql(new Date("2014/06/28"));
        });

        it("should find out that tomorrow will be 2014/06/28", function () {
            today.next_day(1).should.eql(new Date("2014/06/28"));
        });
        it("should find out that next week will be 2014/07/04", function () {
            today.next_day(7).should.eql(new Date("2014/07/04"));
        });

    });

    describe("testing weekday", function () {

        it("should extend the Date object with a weekday method", function () {
            should(Date.prototype).have.property("weekday");
        });

        it("assume that today is a friday as a prerequisite for the following test", function () {
            today.weekday().should.equal("Fri");
        });

        it("should then check that one day ago was a Thurday", function () {
            today.days_ago(1).weekday().should.equal("Thu");
        });

        it("should then check that two days ago was a Wedneday", function () {
            today.days_ago(2).weekday().should.equal("Wed");
        });

        it("should then check that three days ago was a Tuesday", function () {
            today.days_ago(3).weekday().should.equal("Tue");
        });

        it("should then check that four days ago was a Monday", function () {
            today.days_ago(4).weekday().should.equal("Mon");
        });

        it("should then check that five days ago was a Sunday", function () {
            today.days_ago(5).weekday().should.equal("Sun");
        });
    });

    describe("testing working_days_ago", function () {

        it("should extend the Date object with a working_days_ago method", function () {
            should(Date.prototype).have.property("working_days_ago");
        });

        it("assume that today is a friday as a prerequisite for the following test", function () {
            today.weekday().should.equal("Fri");
        });

        it("should verify that working_days_ago take the week end into account ( 5 working days ago is a Fri )", function () {
            today.working_days_ago(5).weekday().should.equal("Fri");
        });

    });

    describe("testing next_working_day",function(){
        xit("should extend the Date object with a next_working_day method", function () {
            should(Date.prototype).have.property("next_working_day");
        });

    });

    describe("testing javascript Date behavior", function () {
        it("should have a getMonth returning month in the range of [0,11] and getDate returning the day in the month [1,31]", function () {

            var d1 = new Date("2012/04/30"); // 4 is for April
            d1.weekday().should.equal("Mon");
            d1.getMonth().should.equal(3); // getMonth starts at 0 (0 = Jan, 1 = Feb etc...)
            d1.getDate().should.equal(30);

        });
    });

    describe("Testing diffDate", function () {
        it("should expose a diffDate method", function () {
            should(tl).have.property("diffDate");
        });
        it("should return 1 when date are the same , by convention a job started today and finished today has a duration of 1 day", function () {
            //
            var d1 = new Date("2012/06/01");
            var d2 = new Date("2012/06/01");
            tl.diffDate(d2, d1).should.equal(1);
        });
        it("should return 2 for diff date between today and tommorrow", function () {
            //
            var d1 = new Date("2012/06/01");
            var d2 = new Date("2012/06/02");
            tl.diffDate(d1, d2).should.equal(2);
        });
        it("should return -2 for diff date between tommorrow and today", function () {
            //
            var d1 = new Date("2012/06/01");
            var d2 = new Date("2012/06/02");
            tl.diffDate(d2, d1).should.equal(-2);
        });
    });

    describe("testing calculateNumberOfNonBusinessDays", function () {

        // Friday 22 Juin 2012
        var today = new Date("2012/06/22");

        it("assuming that today is Friday 22th of June 2012 is a working day", function () {
            today.weekday().should.equal("Fri");
        });

        it("should verify that Friday 22th of June 2012 is a working day", function () {
            today.isWorkingDay().should.equal(true);
        });

        it("should verify that Friday 22th of June 2012 is not a week end", function () {
            today.isWeekEnd().should.equal(false);
        });

        it("should verify that Friday 22th of June 2012 is not a bridge day", function () {
            today.isBridge().should.equal(false);
        });
        it("should verify that Friday 22th of June 2012 is not a team vacation day", function () {
            today.isVacation().should.equal(false);
        });


        it("should verify that Saturday 23th of June 2012 is NOT a working day", function () {
            today.next_day(1).isWorkingDay().should.equal(false);
        });

        it("should verify that Saturday 23th of June 2012 is a week end", function () {
            today.next_day(1).isWeekEnd().should.equal(true);
        });

        it("should verify that Saturday 23th of June 2012 is not a bridge day", function () {
            today.next_day(1).isBridge().should.equal(false);
        });
        it("should verify that Saturday 23th of June 2012 is not a team vacation day", function () {
            today.next_day(1).isVacation().should.equal(false);
        });


        it("should verify that calculateNumberOfNonBusinessDays in the period of [today,today+0days] returns the correct values", function () {
            tl.calculateNumberOfNonBusinessDays(today, 0).should.eql({ weekend: 0, vacations: 0, bridge: 0, end_date: today });
        });

        it("should verify that calculateNumberOfNonBusinessDays in the period of [today,today+ 1 days] returns the correct values", function () {
            tl.calculateNumberOfNonBusinessDays(today, 1).should.eql({ weekend: 0, vacations: 0, bridge: 0, end_date: today });
        });

        it("should verify that calculateNumberOfNonBusinessDays in the period of [today,today+ 2 days] returns the correct values", function () {
            tl.calculateNumberOfNonBusinessDays(today, 2).should.eql({ weekend: 2, vacations: 0, bridge: 0, end_date: today.next_day(3) });
        });
    });

    describe(" calculating the number of business day between two dates", function () {

        var tuesday = today.days_ago(10);
        var monday = tuesday.days_ago(1);
        var sunday = tuesday.days_ago(2);
        var saturday = tuesday.days_ago(3);
        var friday = tuesday.days_ago(4);

        it("assuming that date is " + tuesday + " is a working date", function () {
            tuesday.isWorkingDay().should.eql(true);
            tuesday.weekday().should.eql("Tue");

            monday.isWorkingDay().should.eql(true); // Monday
            monday.weekday().should.eql("Mon");

            sunday.isWorkingDay().should.eql(false);
            sunday.weekday().should.eql("Sun");

            saturday.isWorkingDay().should.eql(false);
            saturday.weekday().should.eql("Sat");
        });

        it("the number of business day between a working day and itself shall be 1", function () {
            tl.calcBusinessDays(tuesday, tuesday).should.eql(1);
        });
        it("the number of business day between monday and tuesday shall be 2", function () {
            tl.calcBusinessDays(monday, tuesday).should.eql(2);
        });

        it("the number of business day between saturday and tuesday shall be 2", function () {
            tl.calcBusinessDays(saturday, tuesday).should.eql(2);
        });
        it("the number of business day between saturday and tuesday shall be 1", function () {
            tl.calcBusinessDays(saturday, monday).should.eql(1);
        });

        it("the number of business day between friday and monday shall be 2", function () {
            tl.calcBusinessDays(saturday, tuesday).should.eql(2);
        });

    });

    describe("calculateBusinessDays with vacationTable", function () {
        //                            2012
        //       Avril                  Mai                   Juin
        // di lu ma me je ve sa  di lu ma me je ve sa  di lu ma me je ve sa
        //  1  2  3  4  5  6  7         1  2  3  4  5                  1  2
        //  8  9 10 11 12 13 14   6  7  8  9 10 11 12   3  4  5  6  7  8  9
        // 15 16 17 18 19 20 21  13 14 15 16 17 18 19  10 11 12 13 14 15 16
        // 22 23 24 25 26 27 28  20 21 22 23 24 25 26  17 18 19 20 21 22 23
        // 29 30                 27 28 29 30 31        24 25 26 27 28 29 30

        var vacationTable = new tl.VacationTable();
        vacationTable.add_recurrent_vacation_day("Labor Day", 1, 5);
        vacationTable.add_recurrent_vacation_day("Victory", 8, 5);

        var old_vacationTable;
        before(function () {
            old_vacationTable = tl.installVacationManager(vacationTable);
        });
        after(function () {
            tl.installVacationManager(old_vacationTable);
        });

        var monday_30th_of_april = new Date("2012/04/30"); // Monday 30th of April

        var labor_day = monday_30th_of_april.next_day();

        it("labor day shall not be a working day", function () {
            labor_day.isWorkingDay().should.eql(false);
        });

        it("labor day shall be a vacation day", function () {
            labor_day.isVacation().should.eql(true);
        });

        it("labor day shall not be a bridge day", function () {
            labor_day.isBridge().should.eql(false);
        });


        it("assuming that labor day is a recurrent non working day", function () {

            var first_of_may_2012 = new Date("2012/05/01");
            first_of_may_2012.weekday().should.eql("Tue");
            vacationTable.isWorkingDay(first_of_may_2012).should.eql(false);
        });

        it("should verify that Monday before Labor day 2012 which is a Tuesday , is not a working day", function () {
            // bridge
            vacationTable.isBridgeDay(monday_30th_of_april).should.eql(true);
            vacationTable.isWorkingDay(monday_30th_of_april).should.eql(false);
            //xx monday_30th_of_april.isWorkingDay().should.equal(false);
        });
        it("should verify that the number of business day between monday and monday is 0", function () {
            tl.calcBusinessDays(monday_30th_of_april, monday_30th_of_april).should.eql(0);
        });


        it("should calculate correct number of business date", function () {

            tl.calcBusinessDays(monday_30th_of_april, "2012/05/02").should.eql(1); //
            tl.calcBusinessDays(monday_30th_of_april, "2012/05/03").should.eql(2);
            tl.calcBusinessDays(monday_30th_of_april, "2012/05/04").should.eql(3);
            tl.calcBusinessDays(monday_30th_of_april, "2012/05/05").should.eql(3);
            tl.calcBusinessDays(monday_30th_of_april, "2012/05/06").should.eql(3);
            tl.calcBusinessDays(monday_30th_of_april, "2012/05/07").should.eql(3);  // bridge
            tl.calcBusinessDays(monday_30th_of_april, "2012/05/08").should.eql(3);  // victory
            tl.calcBusinessDays(monday_30th_of_april, "2012/05/09").should.eql(4);
            tl.calcBusinessDays(monday_30th_of_april, "2012/05/10").should.eql(5);
            tl.calcBusinessDays(monday_30th_of_april, "2012/05/11").should.eql(6);  // friday
            tl.calcBusinessDays(monday_30th_of_april, "2012/05/12").should.eql(6);  // saturday


        });

        it("tl.calculateNumberOfNonBusinessDays(today,0)", function () {

            tl.calculateNumberOfNonBusinessDays(monday_30th_of_april, 0).should.eql(
                { weekend: 0, vacations: 0, bridge: 0, end_date: monday_30th_of_april });

            tl.calculateNumberOfNonBusinessDays(monday_30th_of_april, 1).should.eql(
                { weekend: 0, vacations: 1, bridge: 1, end_date: new Date("2012/05/02")});
        });
        it("1 working day from 30th of April should lead us to 2nd of May (skipping bridge and labor day)", function () {
            monday_30th_of_april.addBusinessDay(1).should.eql(new Date("2012/05/02"));
        });
        it("2 working days from 30th of April should lead us to 3rd of May (skipping bridge and labor day)", function () {
            monday_30th_of_april.addBusinessDay(2).should.eql(new Date("2012/05/03"));
        });
        it("3 working days from 30th of April should lead us to 4th of May (skipping bridge and labor day)", function () {
            monday_30th_of_april.addBusinessDay(3).should.eql(new Date("2012/05/04"));
        });
        it("4 working days from 30th of April should lead us to 9th of May (skipping bridge and labor day)", function () {
            monday_30th_of_april.addBusinessDay(4).should.eql(new Date("2012/05/09"));
        });
    });

    describe("build_time_line", function () {

        var monday = new Date("2013/07/01");
        monday.weekday().should.eql("Mon");

        var tuesday = monday.next_day(1);
        var wednesday = monday.next_day(2);
        var thursday = monday.next_day(3);
        var friday_last_week = monday.days_ago(3);

        friday_last_week.weekday().should.eql("Fri");

        it("should create a time line with one single working day", function () {

            monday.isWorkingDay().should.eql(true);
            var timeline = tl.build_time_line(monday, monday);
            timeline.length.should.equal(1);
            timeline[0].should.eql(monday);

        });

        it("should create a time line with two consecutive working day", function () {
            var timeline = tl.build_time_line(monday, tuesday);
            timeline.length.should.equal(2);
            timeline[0].should.eql(monday);
            timeline[1].should.eql(tuesday);

        });

        it("should create a time line with two consecutive working day", function () {
            var timeline = tl.build_time_line(monday, wednesday);
            timeline.length.should.equal(3);
            timeline[0].should.eql(monday);
            timeline[1].should.eql(tuesday);
            timeline[2].should.eql(wednesday);
        });

        it("should create a time line and exclude the week-end days", function () {
            var timeline = tl.build_time_line(friday_last_week, tuesday);
            timeline.length.should.equal(3);
            timeline[0].should.eql(friday_last_week);
            timeline[1].should.eql(monday);
            timeline[2].should.eql(tuesday);
        });

        it("should create a time line starting on the previous working day  when start date is not a working day ", function () {
           var sunday = monday.days_ago(1);
           sunday.isWorkingDay().should.eql(false);
            var timeline = tl.build_time_line(sunday, tuesday);
            timeline.length.should.equal(3);
            timeline[0].should.eql(friday_last_week);
            timeline[1].should.eql(monday);
            timeline[2].should.eql(tuesday);
        });

        it("should handle invalid argument in time line gracefuly",function() {

            var early_date = new Date("2010/01/01");
            var later_date = new Date("2010/02/01");

            should(function () {
                tl.build_time_line(early_date, later_date);
            }).not.throwError();

            should(function () {
                tl.build_time_line(later_date, early_date);
            }).throwError();
        });

        it("should raise exception if timeline is toolarge",function(){
            should(function(){
                // timeline too large !
                tl.build_time_line("2010/01/01","3100/01/01");
            }).throwError();
        });

    });

})();
