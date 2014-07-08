/*global require*/
// The MIT License (MIT)
//
// Copyright (c) 2014 Etienne Rossignon
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 *
 */

var assert = require("assert");
var _ = require('underscore');

var WorkItem = require("./workitem").WorkItem;
var HashMap = require("./hashmap").HashMap;
var tl = require('./timeline');
var Today = require("./today").Today;


var calculate_wip = require("./kanban_kpi/work_in_progress").calculate_wip;
var throughput_progression = require("./kanban_kpi/throughput_progression").throughput_progression;
var calculate_average_lead_time = require("./kanban_kpi/lead_time").calculate_average_lead_time;
var lead_time_KPI =  require("./kanban_kpi/lead_time").lead_time_KPI;
var velocity_KPI =require("./kanban_kpi/velocity").velocity_KPI;

function is_one_of(value, array_of_values) {
    return ( array_of_values.indexOf(value) > -1);
}


/**
 *
 * Providing a timeline array  ( array of date ) and a function that
 * takes a date as an argument and returns any arbitrary object of the
 * form { field1: <some value>, field2: <some value>, ...}
 * this function returns a object with can be easily handled
 * by most graph api and looks like this:
 *
 * {
 *   {  name: "field1", 
 *      type: "number",
 *      data: [ 0.123 , .... ,12340] // one data per date
 *   },
 *   {  name: "field1", 
 *      type: "number",
 *      data: [ 0.123 , .... ,12340] // some data value
 *   }
 * }
 *
 * functor must return a object with properties to vectorize
 */

function produce_multi_array(timeline, functor) {
    "use strict";

    assert(_.isArray(timeline));
    assert(_.isFunction(functor));

    var res = new HashMap();
    //  res.timeline = { name: 'timeline', type: 'date', data: timeline};
    timeline.forEach(function (date) {
        var obj = functor(date);
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                if (!res[property]) {
                    res[property] = {name: property, type: 'number', data: []};
                }
                res[property].data.push(obj[property]);
            }
        }
    });
    return res;
}

/**
 */
function average_lead_time_progression(tickets, timeline, width) {
    "use strict";
    assert(timeline.constructor === Date || timeline.constructor === Array);
    if (timeline.constructor === Date) {
        return calculate_average_lead_time(tickets, timeline, width);
    }
    return produce_multi_array(timeline, function (date) {
        return calculate_average_lead_time(tickets, date, width);
    });
}


function average_wip_progression(tickets, timeline, width) {
    "use strict";
    var progression = produce_multi_array(timeline, function (date) {
        return calculate_wip(tickets, date);
    });

    return timeline.map(function (date, i) {
        return  progression.planned.data[i] + progression.in_progress.data[i];
    });
}

function calculate_progression(tickets, timeline, width) {
    "use strict";
    return produce_multi_array(timeline, function (date) {
        return calculate_wip(tickets, date);
    });
}




/**
 *  calculate the statistics for a set of tickets
 */
function statistics(tickets,options) {

    options = options || {};

    options.today       = new Date(options.today || Today());
    options.eta_expected= new Date(options.eta_expected || Today());


    function calculate_trend(old_value, new_value) {

        var average = (old_value + new_value) / 2;
        var diff = new_value - old_value;
        var unsigned_diff = (diff < 0) ? -diff : diff;
        var sign = (diff < 0) ? -1 : 1;
        var variation = Math.round((new_value - old_value) / old_value * 1000) / 10;
        return variation + "%";

        if (unsigned_diff < 0.05 * average) return 0;
        if (unsigned_diff < 0.10 * average) {
            return sign * 1;
        }
        if (unsigned_diff < 0.20 * average) {
            return sign * 2;
        }
        if (unsigned_diff < 0.30 * average) {
            return sign * 3;
        }
        return " " + (4 * sign) + " " + average + " " + unsigned_diff;

    }

    var s = {};
    s.nb_known_defects = 0; //calculate the number of known defects today

    s.nb_in_progress_defects = 0;
    s.nb_new_defects = 0;
    s.nb_in_progress_us = 0;
    s.nb_new_us = 0;
    s.nb_delivered_us = 0;
    s.nb_known_us = 0;
    s.reference_date = options.today;


    var defects = [];
    var user_stories = [];

    s.speedup_factor1 = 5.0;
    s.speedup_factor2 = 2.0;

    console.log(" reference date ".yellow, s.reference_date);

    tickets.forEach(function (ticket) {

        var status = ticket.find_status_at_date(s.reference_date);

        if (is_one_of(ticket.type, ["U-S", "EVO"])) {
            user_stories.push(ticket);
            if (status !== "unknown") {
                s.nb_known_us++;
            }
            if (status === "Done") {
                s.nb_delivered_us++;
            }
            if (status === "In Progress") {
                s.nb_in_progress_us++;
            }
            if (status === "New") {
                s.nb_new_us++;
            }
        }
        if (is_one_of(ticket.type, ["BUG", "QA"])) {
            defects.push(ticket);
            if (status !== "unknown") {
                s.nb_known_defects++;
            }
            if (status !== "In Progress") {
                s.nb_in_progress_defects++;
            }
            if (status === "New") {
                s.nb_new_defects++;
            }
        }
    });


    s.ratio_defect_per_us = Math.round(s.nb_known_defects / s.nb_delivered_us * 100) / 100;

    s.today = options.today;
    s.lastMonth = s.today.removeBusinessDay(20);

    s.velocity_defects            = velocity_KPI(defects, s.today);
    s.velocity_defects_last_month = velocity_KPI(defects, s.lastMonth);

    s.velocity_defects_trend      = calculate_trend(s.velocity_defects_last_month, s.velocity_defects);

    s.velocity_us               = velocity_KPI(user_stories, s.today);
    s.velocity_us_last_month    = velocity_KPI(user_stories, s.lastMonth);
    s.velocity_us_trend = calculate_trend(s.velocity_us_last_month, s.velocity_us);


    s.average_defects_lead_time = lead_time_KPI(defects, s.today);
    s.average_defects_lead_time_last_month = lead_time_KPI(defects, s.lastMonth);
    s.average_defects_lead_time_trend = calculate_trend(s.average_defects_lead_time_last_month,
        s.average_defects_lead_time);

    s.average_user_story_lead_time = lead_time_KPI(user_stories, s.today);
    s.average_user_story_lead_time_last_month = lead_time_KPI(user_stories, s.lastMonth);
    s.average_user_story_lead_time_trend = calculate_trend(s.average_user_story_lead_time_last_month,
        s.average_user_story_lead_time);


    // La date de fin du projet prévue du projet
    s.eta_expected = options.eta_expected

    // s.c = JSON.stringify(configuration);
    // -----------------------------------------------------------------
    s.forecast = function (nb_incoming_us) {

        var f = {};
        var s = this;
        f.nb_incoming_us = nb_incoming_us;
        f.nb_new_backlog_size = s.nb_new_us + nb_incoming_us;


        // calculate the estimated number of bugs that will be generated with wip and planed us
        f.coef1 = 1.00 * s.ratio_defect_per_us;    // probability for a in progress user story
        // to generate new bugs that are unknown today

        f.coef2 = 0.01 * s.ratio_defect_per_us;    // probability for a delivered user story
        // to generate a new bug  that are unknown today

        f.coef3 = 1.20 * s.ratio_defect_per_us;    // probability for a in progress user story
        // to generate new bugs that are unknown today

        f.assumed_in_progress_us_completion_ratio = 0.5;
        f.assumed_in_progress_defect_completion_ratio = 0.5;
        f.estimated_number_of_future_defects = Math.round(f.coef1 * s.nb_in_progress_us +
            f.coef2 * s.nb_delivered_us +
            f.coef3 * f.nb_new_backlog_size);


        f.averaged_nb_defect_to_completion = (s.nb_in_progress_defects * f.assumed_in_progress_defect_completion_ratio +
            s.nb_new_defects + f.estimated_number_of_future_defects );

        f.nb_days_to_completion1 = Math.round(f.averaged_nb_defect_to_completion / s.velocity_defects);

        f.nb_calendar_days_to_completion1 = Math.round(f.nb_days_to_completion1 * 7 / 5);

        //
        // in the first periods, user_stories and defects are processed at the same time and current velocities applies
        // a very optimistic scenario is to consider that project will stop straight after the last US is finished
        // in this case there will be no room left to finish up the defects
        //
        f.nb_days_to_completion2 = Math.round(
                (s.nb_in_progress_us * f.assumed_in_progress_us_completion_ratio +
                    f.nb_new_backlog_size ) / s.velocity_us);

        f.nb_calendar_days_to_completion2 = Math.round(f.nb_days_to_completion2 * 7 / 5);
        ;
        // in reality there is a speed up of (2x to 5x) if the team only work on ano/evo
        //
        f.number_of_fixed_defect_during_mixed_period = Math.round(f.nb_days_to_completion2 * s.velocity_defects);

        f.remaining_defect_during_fast_period = f.averaged_nb_defect_to_completion -
            f.number_of_fixed_defect_during_mixed_period;

        if (f.remaining_defect_during_fast_period < 10) {
            f.remaining_defect_during_fast_period = 10;
        }

        f.number_of_days_to_fixed_remaining_defect_fast1 = Math.round(f.remaining_defect_during_fast_period / ( s.velocity_defects * s.speedup_factor1));
        f.number_of_days_to_fixed_remaining_defect_fast2 = Math.round(f.remaining_defect_during_fast_period / ( s.velocity_defects * s.speedup_factor2));

        var today = s.today;

        f.eta_very_optimistic = today.addBusinessDay(f.nb_days_to_completion2);

        f.eta_optimistic_with_one_month_stab = today.addBusinessDay(f.nb_days_to_completion2 + 31);


        f.eta_probable = today.addBusinessDay(f.nb_days_to_completion2 + f.number_of_days_to_fixed_remaining_defect_fast1);


        f.eta_pessimistic = today.addBusinessDay(f.nb_days_to_completion2 + f.number_of_days_to_fixed_remaining_defect_fast2);

        f.delta_eta = tl.diffDate(s.eta_expected, f.eta_probable);

        // based on probable
        var b = tl.calculateNumberOfNonBusinessDays(today, f.nb_days_to_completion2 + f.number_of_days_to_fixed_remaining_defect_fast1);
        f.non_business_days = ' ' + b.vacations + " / " + b.weekend + ' / ' + b.bridge;
        return f;
    }

    console.log(" calculating statistics  : today        is ".yellow,options.today );
    console.log(" calculating statistics  : eta_expected is ".yellow,options.eta_expected );
    console.log(" calculating statistics  : last month was  ".yellow,s.lastMonth );

    return s;
}

exports.statistics = statistics;
exports.calculate_progression = calculate_progression;
exports.average_lead_time_progression = average_lead_time_progression;
exports.average_wip_progression = average_wip_progression;


