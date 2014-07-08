
var makeFakeItem = require("./fixture_fake_project_1").makeFakeItem;
var _get_next_id = require("./fixture_fake_project_1")._get_next_id;
var Project = require("../").Project;
var WorkItem = require("../").WorkItem;
var monday = new Date("2014/06/02");
var last_epic = 0;
function e(title) {
    var ticket = new WorkItem({ id: _get_next_id(), type: "U-C", subject: title, created_on: monday , parent_id: null});
    last_epic = ticket.id;
    return ticket;
}
var last_use_case =0;
function c(title) {
    var ticket = new WorkItem({ id: _get_next_id(),type: "U-C", subject: title, created_on: monday , parent_id: last_epic});
    last_use_case = ticket.id;
    return ticket;
}

var counter = 0;
var last_user_story;
function w(str) {
    counter += 1;
    var ticket=  makeFakeItem("user story "+ counter, str, last_use_case);
    last_user_story = ticket.id;
    return ticket;
}
var bug_counter = 0
function b(str) {
    bug_counter += 1;
    var ticket = makeFakeItem("BUG " + bug_counter + " on us "+ counter, str , last_user_story);
    ticket.type ="BUG";
    return ticket;
}



exports.project2= new Project({
        start: monday,
    tickets: [
        //                   L1           l2
        e("EPIC"),
        c("Use case"),
        w("..NNIIIIID..........................................."),
        b("...................NIID.............................."), // bug1
        w("....NIIIIID.........................................."),
        b(".....................NIID............................"), // bug1
        b("......................NIID..........................."), // bug1
        b("...........................NIID......................"), // bug1
        c("Use case"),
        w(".....NNIIIIIID......................................."),
        b(".......................NIID.........................."), // bug1
        b("............................NIID....................."), // bug1
        w(".....NNNNNIIIIIID...................................."),
        b(".................................NIID................"), // bug1
        w("....NNNNNNNIIIIID...................................."),
        b("...............................NNNNNIID.............."), // bug1
        w("....NNNNNNNNNNIIIIIID................................"),
        b(".....................................NIID............"), // bug1
        c("Use case"),
        w("......NNNNNNNNNNIIIIIID.............................."),
        e("Epic"),
        c("Use case"),
        w("............NNNNNNIIIIIID............................"),
        b("........................................NIID........."), // bug1
        w("...............NNNNNNIIID............................"),
        w("..................NNNNNIIIIIID......................."),
        b("..........................................NIID......."), // bug1
        w("...................NNNNNNIIID........................"),
        b("...........................................NIID......"), // bug1
        c("Use case"),
        w(".......................NNNNNIIIIIID.................."),
        b("............................................NIID....."), // bug1
        b(".............................................NIID...."), // bug1
        w(".........................NNNNNIIIIIID................"),
        b("............................................NIID....."), // bug1
        b(".............................................NIID...."), // bug1
        c("Use case"),
        w(".......................NNNNNNNIIIID.................."),
        b("............................................NIID....."), // bug1
        b(".............................................NIID...."), // bug1
        b("..............................................NIID..."), // bug1
        w(".............NNNIIID..IIIID.........................."),
    ]
});

