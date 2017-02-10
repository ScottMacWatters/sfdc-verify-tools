(function(){

  var db = require('../db/data-access.js');
  var sfdc = require('../sfdc/tooling.js');
  var sfdc_query_timeout = process.env.sfdc_query_timeout;

  var outstanding = 0;

  module.exports.beginTestTask = function(logins, callback){

    setInterval(function(){
      if(outstanding === 0){
        console.log('Test Execution Complete.');
        callback();
      }
      else{
        console.log(outstanding + ' Test Executions in progress.');
      }
    },1000 * 60);

      console.log('Beginning Async Apex Tests for datacenters',Object.keys(logins));
      for(var dc in logins){
        outstanding++;
        try{
          (function(dc){
            sfdc.beginRunTests(logins[dc], function(err, id){
              if(err){
                console.log("Error:");
                console.log(err);
                return;
              }
              db.saveTestRequest(dc,id);
              outstanding--;
              checkTestTask(dc);
            });
          }(dc));
        }
        catch(err){
          console.log(err);
        }
      }
    };
  }


  function checkTestTask(login, datacenter){
    var outstandingIds = db.getTestRequests(datacenter, function(ids){
      for(var key in ids){
        (function(id){
          sfdc.checkTestTaskResult(login,id,function(err,times){
            if(err){
              console.log('Error:');
              console.log(err);
              return;
            }
            db.clearCompletedTestRequest(datacenter,id);
            db.saveTestTime(datacenter,times);
          },sfdc_query_timeout);
        }(ids[key].asyncApexJobId))
      }
    });
  }

  module.exprots.checkTestTasks = function(logins){
    for(var dc in logins){
      checkTestTask(logins[dc], dc);
    }
  }

}());
