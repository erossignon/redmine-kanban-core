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

function _is_requirement(work_item) {
    return work_item.type === "RQT";
}

function _is_use_case(work_item) {
    return work_item.type === "U-C";
}

function _is_user_story(work_item) {
    return work_item.type === "U-S";
}

Project.prototype.associate_requirements = function () {

    var project = this;

    function _find_work_item(id) {
        return project.find_work_item(id);
    }

    function _associate_requirement(work_item) {

        work_item.requirements = work_item.relations.map(_find_work_item).filter(_is_requirement);
    }
    function associate_requirement_with_use_case_and_user_story(requirement) {

        var use_cases = requirement.relations.map(_find_work_item).filter(_is_use_case);

        var user_stories = requirement.relations.map(_find_work_item).filter(_is_user_story);

        requirement.nominal_use_cases = use_cases;
        requirement.implementing_user_stories = user_stories;
    }

    project._work_items.forEach(_associate_requirement);

    // now associate Use-case with requirements
    project.requirements.forEach(associate_requirement_with_use_case_and_user_story);

}