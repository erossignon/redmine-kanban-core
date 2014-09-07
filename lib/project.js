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
// FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

var assert = require("assert");
var _ = require("underscore");
var WorkItem = require("./workitem").WorkItem;
var HashMap = require("./hashmap").HashMap;

var serialize = require("serialijse").serialize;
var deserialize = require("serialijse").deserialize;
var declarePersistable = require("serialijse").declarePersistable;


function Project(options) {
    this._work_items = [];
    this._index = {};

    var self = this;
    if (options && options.tickets) {
        options.tickets.forEach(function (t) {
            self.add_work_item(t);
        });
    }

};

Project.prototype.add_work_item = function (work_item) {
    assert(work_item && work_item.id);
    this._work_items.push(work_item);
    this._index[work_item.id] = work_item;
};

Project.prototype.add_work_items = function(work_item_array) {
    var self = this;
    work_item_array.forEach(function(work_item){ self.add_work_item(work_item);});
};

Project.prototype.find_work_item = function (id) {
    return this._index[id];
};

/**
 * @property nb_work_item {Integer}
 */
Project.prototype.__defineGetter__("nb_work_items", function () {
    return this._work_items.length;
});

var fs = require("fs");

declarePersistable(Project);
declarePersistable(WorkItem);
declarePersistable(HashMap);


Project.prototype.loadString = function (dataString, options,callback) {

    if (_.isFunction(options) && !callback) {
        callback = options;
        options = {};
    }
    assert(_.isFunction(callback));

    var self = this;

    self._work_items = [];
    try {
        self._work_items = deserialize(dataString);
        assert(_.isArray(self._work_items), " expecting an array here");

        // rebuild index;
        self._index = {}
        self._work_items.forEach(function (work_item) {
            self._index[work_item.id] = work_item;
        });
    }
    catch(err) {
        callback(err);
        return;
    }
    callback(null);
};

Project.prototype.load = function (filename, callback) {

    assert(_.isFunction(callback));

    var self = this;

    var f = fs.readFile(filename, function (err, serializationString) {

        if (err) {
            callback(err);
            return;
        }
        serializationString = serializationString.toString();
        self.loadString(serializationString,function(err) {
            if(err) { console.log(" cannot load file ",filename); }
            callback(err);
        });

    });
};

Project.prototype.saveString = function (callback) {
    assert(_.isFunction(callback));
    var self = this;
    var serializationString = serialize(self._work_items);
    callback(null,serializationString);
};

Project.prototype.save = function (filename, callback) {

    assert(_.isFunction(callback));
    var self = this;
    self.saveString(function(err,serializationString){
        var f = fs.writeFile(filename, serializationString, function (err) {
            callback(err);
        });
    });
};


Project.prototype.__defineGetter__("use_cases",function(){
    var self = this;
    return self._work_items.filter(function(wi){ return wi.type === "U-C"; });
});

Project.prototype.__defineGetter__("top_level_use_cases",function(){
    var self = this;
    return self._work_items.filter(function(wi){ return wi.type === "U-C" && wi.parent_id === "noparent"; });
});

Project.prototype.__defineGetter__("user_stories",function(){
    var self = this;
    return self._work_items.filter(function(wi){ return wi.type === "U-S"; });
});

Project.prototype.__defineGetter__("defects",function(){
    var self = this;
    return self._work_items.filter(function(wi){ return wi.type === "BUG"; });
});

var get_start_date = require("./workitem_utils").get_start_date;
Project.prototype.__defineGetter__("startDate",function(){
    var self = this;
    return get_start_date(self._work_items);
});

var get_last_updated_date = require("./workitem_utils").get_last_updated_date;
Project.prototype.__defineGetter__("lastUpdatedDate",function(){
    var self = this;
    return get_last_updated_date(self._work_items);
});

Project.prototype.__defineGetter__("requirements",function(){
    var self = this;
    return self._work_items.filter(function(wi){ return wi.type === "RQT"; });
});

exports.Project = Project;

function  _match_query(query,work_item) {
    for(var key in query) {
        if (query.hasOwnProperty(key)) {
            if (work_item[key] != query[key]) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Query a collection of work  items that matches the request.
 * @method query_work_items
 * @param query  {Object} and object with the property to match
 *
 * @returns {Array<WorkItem>}
 */
Project.prototype.query_work_items = function (query) {
    var self = this;
    return self._work_items.filter(function(wi){ return _match_query(query,wi); });
}
