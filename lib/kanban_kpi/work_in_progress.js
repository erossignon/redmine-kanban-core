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

var assert = require("assert");
var _ = require("underscore");

/**
 * given a series of ticket and a date , returns the work in progress
 *
 * @param tickets {Array<WorkItem>
 * @param date {Date}
 * @returns {Object|*}  a structure containing the number of proposed, planned, in progress, and done ticket at Date.
 */
function calculate_wip(tickets, date) {

    "use strict";

    assert(_.isArray(tickets));
    assert(date instanceof Date);

    return tickets.reduce(function (pv, current_ticket /*, index, array*/) {

        //xx console.log("xxxxx ",current_ticket);

        var status = current_ticket.find_status_at_date(date);

        if (status === "New") {

            if (current_ticket.unplanned) {
                pv.proposed += 1;
            } else {
                pv.planned += 1;
            }

        } else if (status === "In Progress") {
            pv.in_progress += 1;

        } else if (status === "Done") {
            pv.done += 1;
        }
        return pv;
    }, { date: date, proposed: 0, planned: 0, in_progress: 0, done: 0 });
}
exports.calculate_wip = calculate_wip;
