/*global describe, require, it */
(function () {

  var should = require("should"),
      WorkItem =require("../lib/workitem").WorkItem,
      Project = require("../lib/project").Project;


  describe("Projet",function() {

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

      it("should find workitem by special query",function() {

          var project1 = new Project();
          project1.query_work_items({ id: 10}).length.should.eql(0);

          project1.add_work_item(new WorkItem({id: 10, subject: "Hello World"}));

          project1.query_work_items({ id: 10}).length.should.eql(1);

          project1.query_work_items({ subject: "Hello World" }).length.should.eql(1);

          project1.query_work_items({ subject: "Hello World", id: 11 }).length.should.eql(0);

      });

  });

})();
