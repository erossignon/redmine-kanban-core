/*global exports, require */

var WorkItem = require("../lib/workitem").WorkItem;

var short_to_Status = {
    "N": "New",
    "I": "In Progress",
    "D": "Done",
    ".": "unknwon"
};

var monday = new Date("2014/06/02");


var _next_id = 0;
function _get_next_id() {
    _next_id += 1;
   return _next_id;
}
function makeFakeItem(title, progress, parent_id) {
    "use strict";

    progress = progress.replace(/-/g, "");

    var ticket = null,
        current_date = monday;

    progress.split('').forEach(function (c) {

        if (c !=='.') {

            var status = short_to_Status[c];
            if (status === "New" && ticket === null) {
                ticket = new WorkItem({ id: _get_next_id(), subject: title, created_on: current_date , parent_id: parent_id});
            }
            if (ticket) {
                var current_status = ticket.find_status_at_date(current_date);
                if (status !== current_status && ticket) {
                    ticket.set_status(current_date, status);
                }

            }
        }
        current_date = current_date.addBusinessDay(1);
    });
    return ticket;
}
exports.makeFakeItem = makeFakeItem;
exports._get_next_id = _get_next_id;

exports.project= {
    start: monday,
    tickets: [
        makeFakeItem("user story 1", "..NII-IIID.-....."),
        makeFakeItem("user story 2", "....N-IIIII-D...."),
        makeFakeItem("user_story 3", ".....-NNIII-IIID.")
        //        wip             00112  33332  21110)
    ]
};

