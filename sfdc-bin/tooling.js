(function(){

  var db = require('../db/data-access.js');
  var sfdc = require('../sfdc/tooling.js');
  var sfdc_query_timeout = process.env.sfdc_query_timeout;

  var outstanding = 0;

  module.exports.beginTestTask = function(callback){

    setInterval(function(){
      if(outstanding === 0){
        console.log('Test Execution Complete.');
        callback();
      }
      else{
        console.log(outstanding + ' Test Executions in progress.');
      }
    },1000 * 60);

    db.getLogins(function(logins){
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
    });
  }


  function checkTestTask(datacenter){
    db.getLogins(function(logins){
      for(var dc in logins){
        if(datacenter && dc !== datacenter) continue;
        (function(dc){
          var outstandingIds = db.getTestRequests(dc, function(ids){
            for(var key in ids){
              (function(id){
                sfdc.checkTestTaskResult(logins[dc],id,function(err,times){
                  if(err){
                    console.log('Error:');
                    console.log(err);
                    return;
                  }
                  db.clearCompletedTestRequest(dc,id);
                  db.saveTestTime(dc,times);
                },sfdc_query_timeout);
              }(ids[key].asyncApexJobId))
            }
          });
        }(dc));
      }
    });
  }

}());
