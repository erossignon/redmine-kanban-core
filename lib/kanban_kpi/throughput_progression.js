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
var HashMap = require("../hashmap").HashMap;
var calculate_wip = require("./work_in_progress").calculate_wip;

/**
 *
 * @param tickets {Array<WorkItem>} the workitem to extract statistics from
 * @param timeline {Array<Date>}  the coresponding timeline
 * @param width
 * @returns {HashMap}
 */
function throughput_progression(tickets, timeline, width) {

    "use strict";

    assert(_.isArray(tickets));
    assert(_.isArray(timeline));

    var wip_new_array = timeline.map(function (date) {
        return calculate_wip(tickets, date);
    });
    var throughput = new HashMap();
    throughput['through_in'] = {name: "Through In", type: 'number', data: []};
    throughput['through_out'] = {name: "Through Out", type: 'number', data: []};

    wip_new_array.forEach(function (e, index, array) {

        if (index <= width) {
            throughput.through_in.data.push(0);
            throughput.through_out.data.push(0);
            return;
        }
        var eb = array[index - width];
        var wip_new_before = eb.planned + eb.in_progress + eb.done;
        var wip_new_current = e.planned + e.in_progress + e.done;
        var done_current = e.done;
        var done_before = eb.done;

        throughput.through_in.data.push(wip_new_current - wip_new_before);
        throughput.through_out.data.push(done_current - done_before);
    });

    // average per day
    throughput.through_in.data = throughput.through_in.data.map(function (e) {
        return e / width;
    });
    throughput.through_out.data = throughput.through_out.data.map(function (e) {
        return e / width;
    });
    return throughput;
}

exports.throughput_progression = throughput_progression;