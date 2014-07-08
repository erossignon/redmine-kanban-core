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

var assert = require("assert");
var _ = require("underscore");
var WorkItem = require("./workitem").WorkItem;
var HashMap = require("./hashmap").HashMap;
//xx var Serializer = require("mousse").Serializer;

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
    this._work_items.push(work_item);
    this._index[work_item.id] = work_item;
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

function dateReviver(key, value) {
    switch (key) {
        case "date":
        case "created_on":
        case "updated_on":
            return new Date(value);
        case "user_stories":
        case "defects":
            return new HashMap(value);
        default:
            return value;
    }
}

Project.prototype.loadString = function (dataString, options,callback) {

    if (_.isFunction(options) && !callback) {
        callback = options;
        options = {};
    }
    assert(_.isFunction(callback));

    var self = this;

    self._work_items = deserialize(dataString);
    assert(_.isArray(self._work_items), " expecting an array here");

    // rebuild index;
    self._index = {}
    self._work_items.forEach(function (work_item) {
        self._index[work_item.id] = work_item;
    });

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
        self.loadString(serializationString,callback);

    });
}
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
}

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

exports.Project = Project;
