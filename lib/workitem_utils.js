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
// FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

var assert = require("assert");

function get_projet_names(tickets) {
    var projects = {};
    tickets.forEach(function (ticket) {
        projects[ticket.project] = "a";
    });
    return Object.keys(projects);
}


function search(tickets, get_value, comp_func) {
    if (tickets.length === 0) {
        return null;
    }
    assert(tickets.length > 0);
    return tickets
        .map(get_value)
        .reduce(function (previousValue, currentValue, index, array) {
            return comp_func(currentValue, previousValue) ? currentValue : previousValue;
        }, get_value(tickets[0]));
}

function get_last_updated_date(tickets) {
    function ref_date(ticket) {
        return new Date(ticket.updated_on);
    };
    function comp(currentDate, previousDate) {
        return currentDate.getTime() > previousDate.getTime();
    }

    return search(tickets, ref_date, comp);
}

function get_start_date(tickets) {
    function ref_date(ticket) {
        return new Date(ticket.created_on);
    };
    function comp(currentDate, previousDate) {
        return currentDate.getTime() < previousDate.getTime();
    }

    return search(tickets, ref_date, comp);
}
exports.get_start_date = get_start_date;
exports.get_projet_names = get_projet_names;
exports.get_last_updated_date = get_last_updated_date;
