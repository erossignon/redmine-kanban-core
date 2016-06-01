/*global describe, require, it */
(function () {


    var should = require("should"),
        path = require("path"),
        fs = require("fs"),
        WorkItem = require("../lib/workitem").WorkItem,
        Project = require("../lib/project").Project;


    describe("Projet", function () {

        it("should create a simple project", function () {

            var project = new Project();

            project.nb_work_items.should.eql(0);


        });


        it("should persist in and out a project with a single work item", function (done) {

            var project1 = new Project();
            project1.add_work_item(new WorkItem({id: 10}));

            var wi = project1.find_work_item(10);


            project1.nb_work_items.should.eql(1);

            project1.save("toto.json", function (err) {
                if (err) {
                    done(err);
                    return;
                }
                var project2 = new Project();

                project2.load("toto.json", function (err) {
                    if (err) {
                        done(err);
                        return;
                    }

                    project2._work_items.length.should.eql(project1._work_items.length);
                    done();
                });


            })
        });

        it("should find workitem by special query", function () {

            var project1 = new Project();
            project1.query_work_items({id: 10}).length.should.eql(0);

            project1.add_work_item(new WorkItem({id: 10, subject: "Hello World"}));

            project1.query_work_items({id: 10}).length.should.eql(1);

            project1.query_work_items({subject: "Hello World"}).length.should.eql(1);

            project1.query_work_items({subject: "Hello World", id: 11}).length.should.eql(0);

        });

    });
    describe("test project serialization", function () {

        var tmpfolder = path.join(__dirname, "../tmp");
        before(function (done) {
            var fs =require("fs");
            fs.stat(tmpfolder,function(stats) {
               if (stats && stats.isDirectory) {
                   done();
               } else {
                   fs.mkdir(tmpfolder,function() { done(); });
               }
            });
        });

        it(" shoud serialize and deserialize a projet ", function (done) {

            var project = require("./fixture_fake_project_2").project2;

            var tmp_filename = path.join(tmpfolder,"project.json");
            project.save(tmp_filename, function (err) {

                if (err) {
                    return done(err);
                }

                var reloaded_project = new Project();
                reloaded_project.nb_work_items.should.eql(0);

                reloaded_project.load(tmp_filename, function (err) {

                    reloaded_project.nb_work_items.should.eql(project.nb_work_items);

                    done(err);
                });

            });
        });
    });
})();
