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
var _ = require("underscore");

function filter_tickets_for_average_lead_time_calculation(tickets, pivot_date, width) {

  "use strict";
  if (width <= 1) width = 2;

  // width is in Business days
  var low_date = pivot_date.removeBusinessDay(width / 2);

  var high_date = pivot_date.addBusinessDay(width / 2);

  //        L  p  H
  //        |  |  |
  // XXX    |  |  |         KO  (a)
  //        |  |  |  XXX    KO  (b)
  // ......X|XXyXX|X......  OK  (c)
  // ......X|XXyX.|.......  OK  (c)
  // .......|.XyXX|XXXXXX.  OK  (c)
  // .......|.XyXX|XXXXXXX  KO  (d)


  return tickets.filter(function (ticket) {

    if (ticket.unplanned) {
      return false;
    }
    if (ticket.current_status !== "Done") { // (case d)
      // now we consider that undone ticket can be used to calculate lead time
      // BEFORE => return false; // cannot be used to calculate lead time
    }
    // filter out tickets that don't exist at pivot date
    if (ticket.created_on > high_date) { // (case b)
      return false;
    }
    // filter out tickets that are not yet started at end date
    var status_at_high_date = ticket.find_status_at_date(high_date);
    if (status_at_high_date === "unknown") { // (case b)
      return false;
    }

    // filter out tickets that are already completed at low date
    var start_status = ticket.find_status_at_date(low_date);
    if (start_status === "Done") { // case a
      return false;
    }
    // take into account case c,c,c
    return true;
  });
}


function calculate_average_lead_time(tickets, pivot_date, width) {
  "use strict";
  var arr = filter_tickets_for_average_lead_time_calculation(tickets, pivot_date, width);

  if (arr.length === 0) {
    return  {
      min_value: 0,
      average: 0,
      max_value: 0,
      std_deviation: 0,
      count: 0
    };
  }

  var values = arr.map(function (element) {
    return element.calculate_lead_time(pivot_date);
  });

  values = values.filter(function (element) {
    return element !== undefined;
  });

  // extract the minimum lead time
  var min_val = values.reduce(function (previousValue, currentValue, index, array) {
    return (currentValue < previousValue) ? currentValue : previousValue;
  }, values[0]);


  // extract the greatest lead time
  var max_val = values.reduce(function (previousValue, currentValue, index, array) {
    return (currentValue > previousValue) ? currentValue : previousValue;
  }, values[0]);

  var sum = values.reduce(function (previousValue, currentValue) {
    return previousValue + currentValue;
  }, 0);

  var n = arr.length;
  var average = sum / n;

  var variance = values.reduce(function (sum, value) {
    var a = (value - average);
    return sum + (a * a) / (n - 1);
  }, 0);

  var std_deviation = Math.sqrt(variance);

  var ret = {
    min_value: min_val,
    average: Math.round(average * 10) / 10,
    max_value: max_val,
    std_deviation: std_deviation,
    count: arr.length
  };
//   console.warn(ret);
  return ret;
}
exports.calculate_average_lead_time = calculate_average_lead_time;

function lead_time_KPI(tickets, endDate) {
  var lead_time = calculate_average_lead_time(tickets, endDate, 20);
  return  Math.round(lead_time.average * 100) / 100;
}
exports.lead_time_KPI = lead_time_KPI;