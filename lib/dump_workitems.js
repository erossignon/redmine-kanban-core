var assert=require("assert");
var tl = require('./timeline');

var ellipsys = require("./utils").ellipsys;
var Project = require("./project").Project;
function w(str,width) {
    return ("" + str + "                         ").substr(0,width);
}
/**
 *
 * @param uc {WorkItem} a use case.
 * @poram
 */
function dump_use_case(level,uc,timeline) {

  console.warn( level + "Use case : ", w(uc.id,5), uc.current_status, uc.subject);

  uc.use_cases.forEach(function (child_uc) {
      dump_use_case(level + "  ",child_uc,timeline);
  });

  uc.user_stories.forEach(function (us) {
    var ret = us.progress_bar(timeline);
    console.warn("  ", us.type, "   ", w(uc.current_status,3), w(us.id,5), ret, ellipsys(us.subject, 40));
    us.defects.forEach(function (bug) {
      var ret = bug.progress_bar(timeline);
      if (bug.current_status === "Done") {
        console.warn("   ok ", bug.type, w(bug.current_status,3), w(bug.id,5), bug.unplanned ? "??" : "  ", ret, ellipsys(bug.subject, 40));
      } else {
        console.warn("    !!", bug.type, w(bug.current_status,3), w(bug.id,5), bug.unplanned, ret, ellipsys(bug.subject, 40));
      }
    });
  });
}

require("./associate_use_case_and_user_stories");
function dump_use_cases(project,startDate,endDate,today) {
    "use strict";
    assert(project instanceof Project);
    assert(startDate);
    assert(endDate);
    assert(today);

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