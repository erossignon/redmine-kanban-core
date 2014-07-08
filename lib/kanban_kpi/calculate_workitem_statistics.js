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

var WorkItem = require("../workitem").WorkItem;
var assert = require("assert");

function calculate_defects_statistics(work_item) {
  "use strict";
  assert(work_item instanceof WorkItem);
  var ret = {};
  ret.nb_defects = 0;
  ret.nb_defects_done = 0;
  ret.nb_defects_planned = 0;
  ret.nb_defects_unplanned = 0;
  if (!work_item.defects) return ret;

  work_item.defects.forEach(function (defect) {

    ret.nb_defects++;

    if (defect.unplanned) {
      ret.nb_defects_unplanned++;
    } else {
      if (defect.is_done()) {
        ret.nb_defects_done++;
      } else {
        ret.nb_defects_planned++;
      }
    }
  });

  return ret;
}

function calculate_user_story_statistics(user_story) {
  "use strict";
  return calculate_defects_statistics(user_story);
}


/**
 * @deprecated
 * @param use_case
 * @returns {{}}
 */
function calculate_use_case_statistics(use_case) {

  "use strict";
  assert(use_case instanceof WorkItem);

  // unplanned user stories are ignored

  var ret = {
    consolidated_percent_done: 0,
    nb_user_stories :0,
    nb_user_stories_planned: 0,
    nb_user_stories_unplanned:  0,
    nb_user_stories_done: 0,
    nb_defects: 0, // nb defects
    nb_defects_done: 0,
    nb_defects_planned: 0,
    nb_defects_unplanned: 0,
  };


  var own_stat = calculate_defects_statistics(use_case);

  ret.nb_defects           += own_stat.nb_defects;
  ret.nb_defects_done      += own_stat.nb_defects_done;
  ret.nb_defects_planned   += own_stat.nb_defects_planned;
  ret.nb_defects_unplanned += own_stat.nb_defects_unplanned;

  use_case.children.forEach(function (us) {
    ret.nb_user_stories++;

    if (us.unplanned) {
      // console.warn(" UNPLANNED US ",us.unplanned,us.fixed_version);
      ret.nb_user_stories_unplanned++;

    } else {

      var stat_us = calculate_defects_statistics(us);
      ret.nb_defects += stat_us.nb_defects;
      ret.nb_defects_done += stat_us.nb_defects_done;
      ret.nb_defects_planned += stat_us.nb_defects_planned;
      ret.nb_defects_unplanned += stat_us.nb_defects_unplanned;

      if (us.is_done()) {
        ret.nb_user_stories_done++;
      } else {
        ret.nb_user_stories_planned++;
      }
    }
  });
  assert.equal(ret.nb_user_stories, use_case.children.length);
  assert.equal(ret.nb_user_stories,
      ret.nb_user_stories_unplanned + ret.nb_user_stories_done + ret.nb_user_stories_planned);

  return ret;
}


exports.calculate_use_case_statistics = calculate_use_case_statistics;
exports.calculate_defects_statistics = calculate_defects_statistics;
exports.calculate_user_story_statistics = calculate_user_story_statistics;

