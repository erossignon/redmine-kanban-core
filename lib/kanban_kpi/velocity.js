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

var assert=require("assert");
var _ = require("underscore");
var tl = require("../timeline");

var throughput_progression = require("./throughput_progression").throughput_progression;
/**
 *
 * @param tickets {Array<WorkItem>}
 * @param endDate {Date}
 * @returns {number}
 */
function velocity_KPI(tickets, endDate) {

  "use strict";
  assert(_.isArray(tickets));

  var startDate = new Date(endDate);

  startDate = endDate.removeBusinessDay(40);

  console.warn(" Start Date", startDate);
  console.warn(" End Date " , endDate);

  var timeline =   tl.build_time_line(startDate, endDate);
  var throughput = throughput_progression(tickets, timeline, 20);


  // method 1  : we use an averaged velocity
  var a1 = throughput.through_out.data.reduce(function (sum, a) {
    return sum + a;
  });
  var c1 = throughput.through_out.data.reduce(function (sum, a) {
    return (a !== 0) ? sum + 1 : sum;
  });
  var velocity1 = a1 / c1;

  // method 2 : we use the most recent velocity
  var velocity2 = throughput.through_out.data[throughput.through_out.data.length - 1];

  var velocity = (velocity2 < velocity1) ? velocity1 : velocity2;

  var retValue = Math.round(velocity * 100) / 100;
  if (retValue == 0.0) {
    retValue = 0.01;
  }
  return retValue;
}
exports.velocity_KPI = velocity_KPI;