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
"use strict";

var HashMap = require("./hashmap").HashMap;
var WorkItem = require("./workitem").WorkItem;
var tl = require('./timeline');
var assert = require("assert");

var Project = require("./project").Project;

var calculate_defects_statistics = require("./kanban_kpi/calculate_workitem_statistics.js").calculate_defects_statistics;
var calculate_use_case_statistics = require("./kanban_kpi/calculate_workitem_statistics.js").calculate_use_case_statistics;
var calculate_user_story_statistics = require("./kanban_kpi/calculate_workitem_statistics.js").calculate_user_story_statistics;


Project.prototype.associate_use_case_and_user_stories = function() {

    var self = this;

    // clean up children and defects collection
    function reset_work_item(work_item) {
        work_item.reset();
    };

    self._work_items.forEach(reset_work_item);
    /**
     * get the special Use case used as the parent of the unattached user stories
     * @returns {WorkItem}
     */
    function get_floating_use_case() {

        var uc =self.find_work_item("floating-UC");

        if (!uc) {
            uc = new WorkItem({
                id: "floating-UC",
                type: "U-C",
                current_status: "YYY",
                subject:" Use Case for unattached user stories",
                parent_id: "noparent"
            });
            self.add_work_item(uc);
        }
        return uc;
    }

    /**
     * get the parent use case work item of the given work item
     * @param ticket
     * @returns {WorkItem}
     */
    function get_or_create_use_case_for_user_story(ticket) {
        assert(ticket.type === "U-S");
        var uc = self.find_work_item(ticket.parent_id);
        if (!uc) {
            uc = get_floating_use_case();
        }
        return uc;
    }

    function get_floating_user_story() {

        var us = self.find_work_item("floating")
        if (!us) {
            var floating_use_case = get_floating_use_case();

            us = new WorkItem({
                id: "floating",
                type: "U-S",
                parent_id: floating_use_case.id,
                current_status: "New",
                subject: "floating user story for unattached defects",
                fixed_version: "Bugs"
            });

            self.add_work_item(us);
            floating_use_case.children.push(us);
        }
        assert( us instanceof WorkItem);
        return us;
    }

    function get_or_create_user_story_for_defect(ticket) {

        var p = ticket.parent_id;

        if (p === "noparent") {

            ticket.relations.forEach(function (relation_id) {
                var related_ticket = self.find_work_item(relation_id);
                if (related_ticket.type === "U-S") {
                    ticket.parent_id = relation_id;
                    return related_ticket;
                }
                if (related_ticket.type === "U-C") {
                    // l'anomalie est rattachée à une UC par relation
                }
            });
        }
        var parent_ticket = self.find_work_item(ticket.parent_id);
        if (!parent_ticket) {
            parent_ticket = get_floating_user_story();
        }
        assert( parent_ticket instanceof WorkItem);
        return parent_ticket;
    }

    function attach_user_story_to_use_case(ticket) {
        assert( ticket.type === "U-S");
        var use_case = get_or_create_use_case_for_user_story(ticket);
        assert( use_case.type === "U-C");
        use_case.children.push(ticket);
    }

    function attach_defect_to_user_story(ticket) {
        assert( ticket.type === "BUG");
        var user_story = get_or_create_user_story_for_defect(ticket);
        user_story.children.push(ticket);
    }
    function attach_use_case_to_use_case(ticket) {
        var p = self.find_work_item(ticket.parent_id);
        if (p) {
            p.children.push(ticket);
        }
    }

    self.use_cases.forEach(attach_use_case_to_use_case);

    // attach user stories to use cases
    self.user_stories.forEach(attach_user_story_to_use_case);

    // attach defect to user stories
    self.defects.forEach(attach_defect_to_user_story);

    self.use_cases.forEach(function (ticket) {
        ticket.stats = calculate_use_case_statistics(ticket);
    });

    self.user_stories.forEach(function (ticket) {
        ticket.stats = calculate_user_story_statistics(ticket);
    });

    return self.top_level_use_cases;
};
