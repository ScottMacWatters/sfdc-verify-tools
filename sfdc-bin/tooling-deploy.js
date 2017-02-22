(function(){

  var db = require('../db/data-access.js');
  var sfdc = require('../sfdc/tooling.js');
  var sfdc_query_timeout = process.env.sfdc_query_timeout;

  var outstanding = 0;

  module.exports.beginDeployTask = function(logins, callback){

    setInterval(function(){
      if(outstanding === 0){
        console.log('Tooling Deploy Complete.');
        callback();
      }
      else{
        console.log(outstanding + ' Tooling Deploys in progress.');
      }
    },1000 * 60);

    console.log('Beginning Tooling Deploy for datacenters',Object.keys(logins));
    for(var dc in logins){
      outstanding++;
      try{
        (function(dc){
          sfdc.beginDeploy(logins[dc], function(err, id){
            if(err){
              console.log("Error:");
              console.log(err);
              return;
            }
            db.saveToolingDeployRequest(dc,id);
            outstanding--;
            checkDeployTask(dc);
          });
        }(dc));
      }
      catch(err){
        console.log(err);
      }
    }
  };

  function checkDeployTask(login, datacenter){
    var outstandingIds = db.getToolingDeployRequests(datacenter, function(ids){
      for(var key in ids){
        (function(id){
          sfdc.checkDeployResult(login,id,function(err,times){
            if(err){
              console.log('Error:');
              console.log(err);
              return;
            }
            db.clearToolingDeployRequest(datacenter,id);
            db.saveToolingDeployResult(datacenter,times);
          },sfdc_query_timeout);
        }(ids[key].asyncApexJobId));
      }
    });
  }

  module.exports.checkDeployTasks = function(logins){
    for(var dc in logins){
      checkDeployTask(logins[dc], dc);
    }
  };

}());
