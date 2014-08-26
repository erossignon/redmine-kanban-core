/*global exports, require */
var Project = require("../").Project;
var WorkItem = require("../").WorkItem;
var makeFakeItem = require("./fixture_fake_project_1").makeFakeItem;
var _get_next_id = require("./fixture_fake_project_1")._get_next_id;

var monday = new Date(2014,08,25);

function make_requirement(subject) {
    var parent_id = null;
    var  requirement = new WorkItem({
        id: _get_next_id(),
        type: "RQT",
        subject: subject,
        created_on:  monday,
        parent_id: parent_id
    });
    return requirement
}

function make_work_item(type,subject,parent, linked_items) {
    var parent_id = parent ? parent.id : null;

    var relation_ids = linked_items.map(function (e) {
        return e.id;
    });

    var work_item = new WorkItem({
        id: _get_next_id(),
        parent_id: parent_id,
        type: type,
        subject: subject,
        relations: relation_ids
    });

    return work_item;

}
function make_use_case(subject,parent, linked_items) {
    return make_work_item("U-C",subject,parent, linked_items);
}

function make_user_story(subject,parent, linked_items) {
    return make_work_item("U-S",subject,parent, linked_items);
}

exports.project= (function make_project() {

    var project = new Project({ start: monday });


    var rq1 = make_requirement("RQ1");
    var rq2 = make_requirement("RQ2");
    var rq3 = make_requirement("RQ3");
    var rq4 = make_requirement("RQ4");
    var rq5 = make_requirement("RQ5");

    project.add_work_items([rq1,rq2,rq3,rq4,rq5]);

    var uc1 = make_use_case("UC1",null,[    rq1,rq2]);
    var uc2 = make_use_case("UC2",uc1 ,[rq3,rq4]);
    var uc3 = make_use_case("UC3",uc1 ,[rq4,rq5]);
    project.add_work_items([uc1,uc2,uc3]);

    var us1 = make_user_story("US1",uc2,[rq3]);
    var us2 = make_user_story("US2",uc2,[rq3,rq4]);
    project.add_work_items([us1,us2]);

    return project;

})();


var use_cases = exports.project.associate_use_case_and_user_stories();
var requirements = exports.project.associate_requirements();


