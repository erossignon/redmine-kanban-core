/*jslint node: true */
"use strict";
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
var HashMap = require("./hashmap").HashMap;
var WorkItem = require("./workitem").WorkItem;
var tl = require('./timeline');
var assert = require("assert");
var _ = require("underscore");

var Project = require("./project").Project;

function _is_requirement(work_item) {
    return work_item && (work_item.type === "RQT");
}

function _is_use_case(work_item) {
    return work_item && (work_item.type === "U-C");
}

function _is_user_story(work_item) {
    return work_item && (work_item.type === "U-S");
}

Project.prototype.associate_requirements = function () {

    var project = this;

    function _find_work_item(id) {
        var wi =  project.find_work_item(id);
        assert( wi  , " Cannot find work item id="+id);
        return wi;
    }


    function _associate_requirement(work_item) {
        work_item.requirements = work_item.relations.map(_find_work_item).filter(_is_requirement);
    }

    function associate_requirement_with_use_case_and_user_story(requirement) {

        var use_cases = requirement.relations.map(_find_work_item).filter(_is_use_case);

        var user_stories = requirement.relations.map(_find_work_item).filter(_is_user_story);
        if (false && requirement.relations.length) {
            console.log(" RQT" , requirement.id, requirement.subject) ;
            console.log("    relations ",requirement.relations);
            console.log("    use_cases =",use_cases.map(function(us){return us.id; }));
            console.log("    user_stories =",user_stories.map(function(us){return us.id; }));
        }

        requirement.nominal_use_cases = use_cases;
        requirement.implementing_user_stories = user_stories;
    }

    project._work_items.forEach(_associate_requirement);

    // now associate Use-case with requirements
    project.requirements.forEach(associate_requirement_with_use_case_and_user_story);

};

function _get_parent(project,work_item) {
    return project.find_work_item(work_item.parent_id);
}

function _populate_requirements_map(m,work_item) {
    function push_to_map(e) { m[e.id] =e;}
    work_item.requirements.forEach(push_to_map);
}

function _to_workitem_array(m) {
    return Object.keys(m).map(function(e)  { return m[e]; });
}

function _extract_requested_requirements(project,work_item) {

    assert(work_item.type === "U-S"  || work_item.type === "U-C" );
    // extract the the requested requirement of a workitem
    // i.e the requirements that are attached to the parent of this work_item up to the root

    while (work_item && work_item.type === "U-S") {
        // for a user story we start at the first parent use case
        work_item = _get_parent(project,work_item);
    }
    assert(work_item && work_item.type === "U-C");
    var m = {};

    while (work_item) {
        _populate_requirements_map(m,work_item);
        work_item = _get_parent(project,work_item);
    }
    return _to_workitem_array(m);
}

function find_descendance(work_item) {
    assert(work_item.type === "U-S"  || work_item.type === "U-C" );

    var queue = [];
    function _recursive_queue_children(work_item) {
        work_item.children.forEach(function (child) {
            queue.push(child);
            _recursive_queue_children(child);
        });
    }
    _recursive_queue_children(work_item);
    return queue;
}

function _find_all_dependant_user_stories(work_item) {
    var tmp =  find_descendance(work_item);
    return tmp.filter(_is_user_story);
}

function _extract_covered_requirements(work_item) {

    assert(work_item instanceof WorkItem);
    assert(work_item.type === "U-S"  || work_item.type === "U-C" );

    // if work_item is a user_stories
    //   - extract the the requirement that have been attached to the user_stories
    //   - explorer also children user_stories
    // i.e the requirements that are attached to the user-stories of this work_item down to the bottom

    var user_stories = _find_all_dependant_user_stories(work_item);
    if (work_item.type === "U-S") {
        user_stories.push(work_item);
    }

    var m = {};
    user_stories.forEach(function(us){ _populate_requirements_map(m,us); });

    return _to_workitem_array(m);

}

function _extract_uncovered_requirements(project,work_item) {
    // extract the requirements that should have been covered for work_item but are not covered

    var requested_requirements = _extract_requested_requirements(project,work_item);
    var covered_requirements = _extract_covered_requirements(work_item);

    var uncovered_requirements = _.difference(requested_requirements,covered_requirements);
    return uncovered_requirements;

}

function subject(e) { return "#" + e.id + " : " + e.subject; }

function _extract_extraneous_requirements(project,work_item) {
    // extract the requirements that  have been covered for work_item but are not explicitly specified
    var requested_requirements = _extract_requested_requirements(project,work_item);
    var covered_requirements = _extract_covered_requirements(work_item);
    console.log("work_item ",work_item.type,work_item.subject);
    console.log("requested_requirements=", requested_requirements.map(subject).sort());
    console.log("covered_requirements=",covered_requirements.map(subject).sort());
    var xtra_requirements = _.difference(covered_requirements,requested_requirements);
    return xtra_requirements;
}

/**
 *
 * @method extract_requested_requirements
 * @param  work_item {WorkItem}  a work item to analyse
 * @return a list of **requirements** that the work_item must implement
 * @precondition: WorkItem is a use case or user story.
 */
Project.prototype.extract_requested_requirements = function(work_item) {
    return _extract_requested_requirements(this,work_item);
};

/**
 *
 * @method extract_covered_requirements
 * @param  work_item {WorkItem}  a work item to analyse
 * @return a list of **requirements** that the work_item is currently  implementing
 *
 * @precondition: WorkItem is a use case or user story.
 */
Project.prototype.extract_covered_requirements = function(work_item) {
    return _extract_covered_requirements(work_item);
};

/**
 *
 * @method extract_uncovered_requirements
 * @param  work_item {WorkItem}  a work item to analyse
 * @return a list of **requirements** that the work_item is not implementing yet
 *
 * @precondition: work_item is a use case.
 */
Project.prototype.extract_uncovered_requirements = function(work_item) {
    return _extract_uncovered_requirements(this,work_item);
};

/**
 *
 * @method extract_extraneous_requirements
 * @param  work_item {WorkItem}  a work item to analyse
 * @return a list of **requirements** that the work_item is implementing but which are
 *         not in the list of requested requirements.
 */
Project.prototype.extract_extraneous_requirements = function(work_item) {
    return _extract_extraneous_requirements(this,work_item);
};

/**
 * find all users stories that are related to this "use case" work_item.
 * @method find_all_dependant_user_stories
 *
 * @param work_item {WorkItem}
 * @returns {Array<WorkItem>}
 *
 * @precondition: work_item is a use case.
 */
Project.prototype.find_all_dependant_user_stories = function(work_item) {
    return _find_all_dependant_user_stories(work_item);
};

/**
 * find a list of user stories from a use_case, that implements a given requirement
 * @method  user_story_that_implements_requirement
 *
 * @param use_case
 * @param requirement
 * @return {Array<Workitem>} a list of user stories
 */
Project.prototype.user_story_that_implements_requirement = function(use_case, requirement) {

    assert( use_case instanceof WorkItem && use_case.type === "U-C");
    assert( requirement instanceof WorkItem && requirement.type === "RQT");

    var project =this;

    var user_stories = project.find_all_dependant_user_stories(use_case);

    function filter_user_story_that_implements_requirement(requirement) {

        return function _filter_user_story_that_implements_requirement(user_story) {
            var rqts = project.extract_covered_requirements(user_story);
            return rqts.indexOf(requirement) >=0;
        };
    }
    user_stories = user_stories.filter(filter_user_story_that_implements_requirement(requirement));

    return user_stories;
};