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
var tl = require('./timeline');

var ellipsys = require("./utils").ellipsys;
var Project = require("./project").Project;
function w(str,width) {
    return ("" + str + "                         ").substr(0,width);
}


function dump_user_story(level,us,timeline) {

    var ret = us.progress_bar(timeline);
    console.warn("  ", us.type, "   ", w(us.current_status,3), w(us.id,5),  us.unplanned ? "??" : "  ", ret, ellipsys(us.subject, 40),us.fixed_version,us.current_status);
    us.defects.forEach(function (bug) {
        var ret = bug.progress_bar(timeline);
        if (bug.current_status === "Done") {
            console.warn("   ok ", bug.type, w(bug.current_status,3), w(bug.id,5), bug.unplanned ? "??" : "  ", ret, ellipsys(bug.subject, 40));
        } else {
            console.warn("    !!", bug.type, w(bug.current_status,3), w(bug.id,5), bug.unplanned ? "??" : "  ", ret, ellipsys(bug.subject, 40));
        }
    });

}

/**
 *
 * @param uc {WorkItem} a use case.
 * @poram
 */
function dump_use_case(level,uc,timeline) {

  console.warn( level + "Use case : ", w(uc.id,5), w(uc.percent_done(),3)+"%", uc.subject);

  uc.use_cases.forEach(function (child_uc) {
      dump_use_case(level + "  ",child_uc,timeline);
  });

  uc.user_stories.forEach(function (us) {
      dump_user_story(level,us,timeline);
  });
}

require("./associate_use_case_and_user_stories");
function dump_use_cases(project,startDate,endDate,today) {
    "use strict";
    assert(project instanceof Project);
    assert(startDate);
    assert(endDate);
    assert(today);

    console.log(" start date = ", startDate);
    console.log(" end date   = ", endDate);
    console.log(" today      = ", today);
    var use_cases = project.associate_use_case_and_user_stories();
    assert(startDate !== null);

    startDate = new Date(startDate);
    endDate =   new Date(endDate);
    today   = new Date(today);
    var timeline = tl.build_time_line(startDate,today);

    var level = " ";
    use_cases.forEach(function (uc) {   dump_use_case(level,uc,timeline);   });
}
exports.dump_use_cases= dump_use_cases;
exports.dump_user_story= dump_user_story;