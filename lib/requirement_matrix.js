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


var rck = require("../") ;
var _ = require("underscore");

var Project = rck.Project;


// build a stucture to report on project requirement coverage
//
// requirement_coverage : {
//   coverage:      -  coverage in %
//   requirements: [  {
//      requirement: {
//         id:
//         subject:
//
//         statistics:  {
//          nb_use_cases:          - number of use cases to which this requirement applies
//          nb_uncovered_use_cases - number of use case that do not have any user storie attached with this requirement
//          nb_user_stories:       - total number of user stories that are referencing this requirement
//          nb_user_stories_done:  - number of user stories that are completed and validated
//          weight:                - the weight of this requirement ( based on nb_user_stories & nb_uncovered_use_cases)
//          score:                 - the covering score of this requirement
//          covered_percent:       - coverage of this requirements       ( = score/weight )
//        }
//        implementing_user_stories: [   - array of user stories implementing this requirements
//          {/* WorkItem */
//               id:              - use case ID
//               subject:         - subject
//               percent_done     - 100% = done : 0% not started, else in  progress
//          }
//        ]
//        nominal_use_cases: [      -  array of use cases that are affected by this requirement and that must have at
//                                     least one user story implementing this requirement to be valid
//        ],
//        use_case_details {
//            use_case: {/* WorkItem */
//               id:              - use case ID
//               subject:         - subject
//            }
//            user_stories: [{
//                ( one or more element already present in implementing_user_stories)
//            }]
//         }
//
//         uc_us: [
//            key
//         }
//      ]
//    } ]
//  }

var consolidated_percent_done = require("./workitem").private.consolidated_percent_done;
var get_weight = require("./workitem").private.get_weight;
var colors = require("colors");



function evaluate_requirement_statistics(requirement,project) {


    function evaluate_use_case_details_relative_to_requirement(use_case) {

        var user_stories = project.user_story_that_implements_requirement(use_case,requirement);

        var unplanned = user_stories.filter(function(us){ return us.unplanned; });

        var planned   = user_stories.filter(function(us){ return !us.unplanned; });

        var percent_done =consolidated_percent_done(planned);

        var weight = get_weight(user_stories);

        function _get_use_case_status(p) {
           if (p === 0 ) {
                return "RED : 0%".red.bold;
            } else if (p >= 99.8) {
                return "GREEN : 100%".green.bold;
            } else  {
                return ('ORANGE : ' + p + '%').yellow;
            }
        }
        return {
            use_case:      use_case,
            user_stories : user_stories,
            percent_done : percent_done, // in regard with the given requirement
            weight:        weight,
            status: _get_use_case_status(percent_done),
            nb_unplanned_us: unplanned.length
        };
    }

    var use_case_details = requirement.nominal_use_cases.map(evaluate_use_case_details_relative_to_requirement);

    var uncovered_use_cases = use_case_details.filter(function(element) {
        return element.user_stories.length === 0;
    });

    var done_user_stories = requirement.implementing_user_stories.filter(function(work_item){
        return work_item.is_done();
    });


    // get all users stories that are referenced by use_cases
    var use_case_us = _.union.apply(null,use_case_details.map(_.property("user_stories")));

    // console.log(use_case_us.map(_.property"subject")));

    // extract user stories that are referencing this requirement but that are not referenced by
    // any use case.( when this array is not empty, this means that some use case are missing)
    var extra_user_stories = _.difference(requirement.implementing_user_stories,use_case_us);

    //xx project.user_story_that_implements_requirement(use_case,requirement);
    var weight = get_weight(requirement.implementing_user_stories) + uncovered_use_cases.length * 2.0;

    if (weight === 0) {    weight = 1.0;      }

    var score  = requirement.implementing_user_stories.reduce(function(c,work_item){
        return c + work_item.weight * work_item.percent_done();
    },0);

    var score  = done_user_stories.length;

    var statistics = {
        nb_use_cases:    requirement.nominal_use_cases.length,
        nb_uncovered_use_cases:  uncovered_use_cases.length,
        nb_user_stories: requirement.implementing_user_stories.length,
        nb_user_stories_done: done_user_stories.length,
        weight: weight,
        score: score,
        covered_percent: Math.round(score/weight * 100,2)
    }
    requirement.statistics = statistics;

    // build requirement details

    requirement.use_case_details   = use_case_details;
    requirement.extra_user_stories = extra_user_stories;
}
function pass_args(functor,data) {
    return function(arg) {  return functor(arg,data); }
}


Project.prototype.calculate_requirement_coverage = function() {

    var project = this;

    project.requirements.forEach(pass_args(evaluate_requirement_statistics, project));
    var total_weight = project.requirements.reduce(function (current, element) {
        return current + element.statistics.weight;
    }, 0);
    var total_score = project.requirements.reduce(function (current, element) {
        return current + element.statistics.score;
    }, 0);

    var covered_percent = Math.round(total_score / total_weight * 100,2);

    project.requirements_statistics = {
        total_score: total_score,
        total_weight: total_weight,
        covered_percent: covered_percent
    };

}

Project.prototype.dump_requirement_coverage = function() {
    var project  = this;
    if (!project.requirements_statistics) {
        project.calculate_requirement_coverage();
    }

    console.log(" total_score  =", project.requirements_statistics.total_score);
    console.log(" total_weight =", project.requirements_statistics.total_weight);
    console.log(" percent done =", project.requirements_statistics.covered_percent);

    project.requirements.forEach(function(requirement){
        console.log("-------------------------------------");
        console.log(requirement.subject);
        console.log(requirement.statistics);

        console.log("  US: ",requirement.implementing_user_stories.map(_.property("subject")));

        requirement.use_case_details.forEach(function(detail){
            console.log("detail UC: ",detail.use_case.subject , " status : " , detail.status );
            console.log("       US: ",detail.user_stories.map(_.property("subject")));

        });
        console.log("EXTRA  US: ",requirement.extra_user_stories.map(_.property("subject")));
    });
}

Project.prototype.export_requirement_coverage_CSV = function(filename,done) {

    var project = this;
    var fs = require('fs');
    var stream = fs.createWriteStream(filename,{ encoding: 'utf8' });
    stream.on('open', function(fd) {
        console.log('file has been opened');
    });
    stream.on('finish', function () {
        console.log('file has been written');
        done();
    });
    var c = 0;
    function field(value) {

        if (c>0) {
            stream.write(";");
        }
        if (typeof value === "string") {
            stream.write('"' + value + '"');
        } else {
            stream.write(""+value);
        }
        c+=1;
    }
    function endline() {
        stream.write("\n");
        c=0;
    }
    field("Total score"); field(project.requirements_statistics.total_score); endline();
    field("Total weight"); field(project.requirements_statistics.total_weight); endline();
    field("percent done"); field(project.requirements_statistics.covered_percent);endline();

    field("RQ id"); field("RQ subject");field("%rq");
    field("UC id"); field("UC subject");field("wuc");field("%uc");
    field("US id"); field("US subject");field("wus");field("%us");
    endline();
    project.requirements.forEach(function(requirement){

        console.log(" REQ ", requirement.subject);
        if (requirement.use_case_details.length ==0 && requirement.extra_user_stories.length==0 ) {
            field(requirement.id);
            field(requirement.subject);
            field(JSON.stringify(requirement.statistics));
            // ---------
            field(0);
            field("orphan");
            field(0);
            field(0);
            // ---------
            field(0);
            field("missing stories");
            field(0);
            field(0);
            endline();
            return;
        }
        function write_requirement(requirement) {
            field(requirement.id);
            field(requirement.subject);
            //Xxfield(JSON.stringify(requirement.statistics));
            field(requirement.statistics.covered_percent);

        }
        function write_user_story(us,w) {
            w = ( w === undefined ) ? 1 : 0;
            field(us.id);
            field(us.subject);
            field(w);
            field(us.percent_done());
        }
        var write_use_case = write_user_story;

        var missing_story = {
            id: 0, subject:"missing stories", percent_done: function() { return 0;}
        };
        var missing_use_case = {
            id: 0, subject:"orphan", percent_done: function() { return 0;}
            };

        requirement.use_case_details.forEach(function(detail){
            if (detail.user_stories.length ==0) {
                write_requirement(requirement);
                write_use_case(detail.use_case,1);
                write_user_story(missing_story,0);
                endline();

            } else {
                detail.user_stories.forEach(function(us) {
                    write_requirement(requirement);
                    write_use_case(detail.use_case,1);
                    write_user_story(us,1);
                    endline();
                });
            }

        });
        requirement.extra_user_stories.forEach(function(us){
            write_requirement(requirement);
            write_use_case(missing_use_case,0);
            write_user_story(us,1);
            endline();
        });
    });


    stream.end();
};
