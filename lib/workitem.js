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
 * @module RedminKanban
 *
 * WorkItem
 * A WorkItem is an element used for kanban statistics,
 * it could either be a "user story",  a "use case" or a "defect"
 * A workitem holds a history of status changes
 *
 */
var assert = require("assert");
var _ = require("underscore");

var HashMap = require("./hashmap").HashMap;
var tl = require('./timeline');
var Today = require("./today").Today;


var valid_workitem_types = ["U-S","U-C","BUG","EVO","QA","RQT"];

function is_valid_workitem_type(workitem_type) {
    return valid_workitem_types.indexOf(workitem_type) >=0;
}
/**
 * @class WorkItem
 * @param options
 * @param options.id            {Integer} - the work item identification number.
 * @param options.subject       {String}  - the title string of the work item.
 * @param options.type          {String}  - the type of work item.
 * @param options.created_on    {Date}    - the work item creation date.
 * @param options.fixed_version {String}  - the name of the version in which the work item has been fixed/assigned.
 * @param options.priority      {Integer} - the work item priority - higher number means higher priority.
 * @param options.complexity    {String}  - the work item complexity.
 * @param options.projet        {String}  - the name of the project the work item has been assigned to.
 * @param options.parent_id     {Integer} - the id of the parent work_item in a hierarchy of work item.
 * @constructor
 */
function WorkItem(options) {

    options = options || {};

    this.current_status = "New";

    this.relations = [];
    this.blocked_by = [];
    this.children = [];
    this.type = "U-S"; // user story
    this.fixed_version = "SomeVersion";
    this.journal = [];


    if (typeof options === typeof {}) {
        var fields = {
            "id": "[0-9]+",
            "relations":"",
            "blocked_by":"" ,
            "user_stories":"",
            "defects":"",
            "journal":"",
            "parent_id":"",
            "done_ratio":"",
            "subject": "\w",
            "type": valid_workitem_types.join(""),
            "created_on": "DATE",
            "updated_on": "DATE",
            "fixed_version": "IDENT",
            "priority": "NUMBER",
            "complexity": "(S|M|L|XL|XXL)",
            "current_status": "Done|In Progress|New",
            "project": "STRING"
        };
        var me = this;
        Object.keys(options).forEach(function (field) {
            if (!fields.hasOwnProperty(field)) {
                console.log(options);
                throw new Error("invalid options set : " + field);
            }
            // TODO : make some type checking and asserts
            me[field] = options[field];
        });
    }

    assert(is_valid_workitem_type(this.type));

    this.created_on = options.created_on ? new Date(options.created_on) : Today();

    this.updated_on = ( options.updated_on) ? options.updated_on: this.created_on;

    var _cur_status = this.current_status;
    this.current_status = "undefined";
    this.set_status(this.created_on, _cur_status);
    assert(this.created_on.toString() === this.updated_on.toString());
    if (this.parent_id === null ) {
        this.parent_id = "noparent";
    }
}


/**
 * @property unplanned  {Boolean} : true if this work item has been put aside of the project
 */
WorkItem.prototype.__defineGetter__("unplanned",function() {
    return !this.fixed_version || this.fixed_version === "unplanned";
});

/**
 * @property  user_stories {Array<WorkItem>}: the user_stories of this work_item
 */
WorkItem.prototype.__defineGetter__("user_stories",function() {
    return this.children.filter(function(workitem){ return workitem.type === "U-S"; });
});

/**
 * @property  use_cases {Array<WorkItem>}: the use_cases of this work_item
 */
WorkItem.prototype.__defineGetter__("use_cases",function() {
    return this.children.filter(function(workitem){ return workitem.type === "U-C"; });
});

/**
 * @property  defects {Array<WorkItem>}: the defects directly attached to this work_item
 */
WorkItem.prototype.__defineGetter__("defects",function() {
    return this.children.filter(function(workitem){ return workitem.type === "BUG"; });
});

/**
 * @property  weight {Number} the weight of this workitem
 */
WorkItem.prototype.__defineGetter__("weight",function() {
   return this.type === "BUG" ? 0.2 : 1.0;
});


/**
 * reset work item
 */
WorkItem.prototype.reset = function() {

    this.children = [];
    this.stats = null;
}

//WorkItem.createFromJSON = function(jsonObj) {
//
//    var work_item = new WorkItem();
//    Object.keys(jsonObj).forEach(function (field) { work_item[field] = jsonObj[field]; });
//    return work_item;
//}

/**
 *  calculate the consolidated percent done
 *  from  a collection of work item
 */
function consolidated_percent_done(collection) {
    "use strict";
    var nb_el = 0;
    var total = 0;

    if (!collection) return 0;

    collection.forEach(function (workitem) {

        if (workitem.unplanned) {
            // ignore unplanned element
            return;
        }
        total += workitem.percent_done() * workitem.weight;
        nb_el += workitem.weight;
    });
    if (nb_el === 0) return 0;
    return Math.round(total / nb_el);
}

function get_weight(collection) {
   return _.reduce(collection,function(c,work_item) { return c + work_item.weight; },0);
}

exports.private = {};
exports.private.consolidated_percent_done = consolidated_percent_done;
exports.private.get_weight = get_weight;

function get_adjusted_raw_done_ratio(workitem) {

    if (workitem.current_status === "Done") {
      return 100;
    }
    if (!workitem.done_ratio) {
      return 0;
    }
    return workitem.done_ratio;
}


WorkItem.prototype.is_in_progress = function () {

    if (this.current_status === "In Progress") {
      return true;
    }
    var done_ratio = get_adjusted_raw_done_ratio(this);

   if (done_ratio > 0 && done_ratio < 100) {
      return true;
    }

    return false;
};

WorkItem.prototype.is_done = function () {
    "use strict";
    return this.percent_done() > 99.999;
};

//WorkItem.prototype.adjust_done_ratio = function () {
//    this.done_ratio = get_adjusted_raw_done_ratio(this);
//};
//

WorkItem.prototype.percent_done = function () {

    "use strict";

    if (this.type === "U-C") {
        if (this.children.length === 0) {
            return 0.0;
        }
        return consolidated_percent_done(this.children);
//        var p_us =  consolidated_percent_done(this.children);
//        var p_ano = consolidated_percent_done(this.defects);
//        var n_us =  this.children.length;
//        var n_ano = this.defects.length;
//        if (n_us + n_ano === 0) return 0;
//        //xx console.warn(" ---------------- [ ", p_us, p_ano, n_us, n_ano)
//        return Math.round((p_us * 80 * n_us + p_ano * 20 * n_ano) / (n_us * 80 + n_ano * 20));

    }
    if (this.type === "U-S") {

        assert( this.use_cases.length === 0, " a user story shall not have children that are Use Cases");

        var sub_user_stories = this.user_stories;
        if (sub_user_stories.length >0 ) {
            // this user story has been split into multiple user stories.
            // in this case we make the assumption that the percentage of this user story
            return consolidated_percent_done(this.children);
        } else {

            // this is a standalone user story
            // we shall use the raw done ratio
            var raw_percent_done = get_adjusted_raw_done_ratio(this);
            //xx return raw_percent_done;

            // Todo: handle effect of attached bugs on done_ratio
            var defects_and_me = this.defects;
           //xx assert(defects_and_me.length === 0);
            defects_and_me.push({
                unplanned: this.unplanned,
                weight: this.weight,
                percent_done: function() { return raw_percent_done; }
            });

            return consolidated_percent_done(defects_and_me);

        }
/*

 */
//        var p_us = get_adjusted_raw_done_ratio(this);
//        var p_ano = consolidated_percent_done(this.defects);
//        var n_us = 1;
//        // console.warn(" ---------------- [ ", p_us,p_ano,n_us,n_ano)
//        return Math.round((p_us * 80 * n_us + p_ano * 20 * n_ano) / (n_us * 80 + n_ano * 20));

    } else {
        return get_adjusted_raw_done_ratio(this);
    }
};

/**
 * @method set_status
 * @param date   {Date}
 * @param status {String}
 */
WorkItem.prototype.set_status = function (date, status) {

    assert(date);
    assert(date >= this.updated_on);

    this.journal.push({
        date: date,
        old_value: this.current_status,
        new_value: status
    });

    this.updated_on = date;
    this.current_status = status;
};


WorkItem.prototype.find_status_at_date = function (ref_date) {

    "use strict";

    if (ref_date < this.created_on) {
        return "unknown";
    }
    if (!this.journal) {
        return "unknown";
    }
    if (this.unplanned) {
        return "unplanned"
    }
    for (var i = 0; i < this.journal.length; i++) {
        var entry = this.journal[i];
        if (entry.date > ref_date) {
            return entry.old_value;
        }
    }
    return this.current_status;
};


/**
 *  @method find_starting_date
 *
 *  @return the date at which the work item went from
 *          new to In Progress or Done.
 */
WorkItem.prototype.find_starting_date = function () {
    for (var i = 0; i < this.journal.length; i++) {
        var s = this.journal[i].new_value;
        if (s === "In Progress" || s === "Done") {
            return this.journal[i].date;
        }
    }
    return undefined;
};

/**
 *  @method find_completion_date
 *
 *  @return the date at which the work item went from
 *          "In Progress" to "Done", or undefined
 *          if the item is not done yet.
 */
WorkItem.prototype.find_completion_date = function () {
   //TODO
    for (var i = 0; i < this.journal.length; i++) {
        var s = this.journal[i].new_value;
        if (s === "Done") {
            return this.journal[i].date;
        }
    }
    return undefined;
};

/**
 * calculate_lead_time:
 * calculates the duration between the first "In Progress"
 * to the last "Done"
 *
 *  - If the item is still in progress at ref_date, the algorithm
 *    assumes arbitrarilly that 2 more days will be required to
 *    get to "Done".
 *  - If wip_flag is set the calculation of the lead time
 *    starts from the starting_date, otherwise from the creation date
 *
 */
WorkItem.prototype.calculate_lead_time = function (ref_date, wip_flag) {

    "use strict";
    var ticket = this;
    wip_flag = ( wip_flag == undefined) ? false : true;

    if (!ticket.is_done() && !ticket.is_in_progress()) {
        // lead time is undefined
        return undefined;
    }
    if (typeof ref_date === "undefined") {
        ref_date = Today(); // today
    }

    var startDate = ticket.created_on;
    if (wip_flag) startDate = ticket.find_starting_date();
    if (startDate === undefined) {
        return undefined;
    }
    if (ref_date <= startDate) {
        return 0;
    }
    if (ticket.journal.length === 0) {
        return 1; // was created as closed
    }

    //var endDate = new Date(ref_date); // today as ref_date
    //xx var endDate = Today();
    var now = new Date(ref_date);
    var endDate = now;

    var status = this.find_status_at_date(now);

    if (status !== "Done") {
        // add arbitrarily 2 working days
        endDate = now.addBusinessDay(2);
        //   return undefined; // cannot be used to calculate lead time
    } else {
        // find last date
        var a = ticket.journal[ticket.journal.length - 1];
        //xx assert(a.new_value === "Done");
        endDate = a.date;
    }

    var diffDay = tl.calcBusinessDays(startDate, endDate);
    var lead_time = diffDay;
    return lead_time;

};


function _progress_bar(ticket, timeline) {
    "use strict";
    var ret = "";
    if (ticket.id === 133) {
        //xx console.log("xxxxx ",ticket);
    }
    var found_done  = false;
    for (var t in timeline) {
        var d = timeline[t];
        var s = ticket.find_status_at_date(d);
        if (s === undefined) {
            ret = ret + "?"
        } else {
            var c = s.substring(0, 1);
            c  = (s === 'unknown' ) ? '.' : c;
            if ( c === 'D') {
                if (found_done) {
                    c = '.';
                } else {
                    found_done = true;
                }
            } else {
                found_done =false;
            }
            ret = ret + c
        }
    }
    return ret;
}

WorkItem.prototype.progress_bar = function (timeline) {
    return _progress_bar(this, timeline);
};



function sort_work_item_map(map) {
  "use strict";
  function compare_string(a, b) {
    return a.localeCompare(b);
  }

  function compare_number(a, b) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  function compare_us(e1, e2) {
//    return compare_string(e1.fixed_version,e2.fixed_version);
    if (e1.current_status === "Done" && e2.current_status !== "Done") return -1;
    if (e2.current_status === "Done" && e1.current_status !== "Done") return 1;

    if (e1.unplanned && !e2.unplanned) {
      return   1;
    }
    if (!e1.unplanned && e2.unplanned) {
      return  -1;
    }
    if (e1.unplanned && e2.unplanned) {
      // both issues are unplanned, we don't care about the order
      return 0;
    }

    var v = compare_string(e1.fixed_version, e2.fixed_version);
    if (v !== 0) return v;

    var v3 = compare_number(e2.percent_done(), e1.percent_done());
    if (v3 !== 0) return v3;
    var v4 = compare_string(e1.current_status, e2.current_status);
    if (v4 !== 0) return v4;
    return v4;
  }

  var array = [];
  map.forEach(function (us) {
    array.push(us);
  });

  array = array.sort(compare_us);
  return array;
}

WorkItem.prototype.sort_user_stories = function () {
  return sort_work_item_map(this.children);
}

WorkItem.prototype.sort_defects = function () {
  return sort_work_item_map(this.defects);
}
exports.WorkItem = WorkItem;

