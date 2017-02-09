(function(){

  var db = require('../db/data-access.js');
  var sfdc = require('../sfdc/metadata.js');

  var sfdc_query_timeout = process.env.sfdc_query_timeout;

  var outstanding = 0;

  module.exports.beginDeployTask = function(logins, callback){

    setInterval(function(){
      if(outstanding === 0){
        console.log('Deployments Complete.');
        callback();
      }
      else{
        console.log(outstanding + ' Deployments in progress.');
      }
    },1000 * 60);

    console.log('Beginning Deployments for datacenters',Object.keys(logins));
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
            db.saveDeployRequest(dc,id);
            outstanding--;
            checkDeployTask(logins[dc],dc);
          });
        }(dc));
      }
      catch(err){
        console.log(err);
      }
    }
  }

  function checkDeployTask(login, datacenter){
    var outstandingIds = db.getDeployRequests(datacenter, function(ids){
      for(var key in ids){
        (function(id){
          sfdc.checkDeployStatus(login,id,function(err,times){
            if(err){
              console.log('Error:');
              console.log(err);
              return;
            }
            db.clearCompletedDeployRequest(datacenter,id);
            db.saveDeployTime(datacenter,times);
          },sfdc_query_timeout);
        }(ids[key].asyncProcessId))
      }
    });
  }

  module.exports.checkDeployTasks = function(logins){
    for(var dc in logins){
      checkDeployTask(logins[dc], dc);
    }
  }

}());
