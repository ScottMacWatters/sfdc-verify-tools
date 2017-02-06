(function(){

  var db = require('../db/data-access.js');
  var sfdc = require('../sfdc/metadata.js');

  var sfdc_query_timeout = process.env.sfdc_query_timeout;

  var outstanding = 0;

  module.exports.beginDeployTask = function(callback){

    setInterval(function(){
      if(outstanding === 0){
        console.log('Deployments Complete.');
        callback();
      }
      else{
        console.log(outstanding + ' Deployments in progress.');
      }
    },1000 * 60);

    db.getLogins(function(logins){
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
              checkDeployTask(dc);
            });
          }(dc));
        }
        catch(err){
          console.log(err);
        }
      }
    });
  }

  module.exports.checkDeployTask function(datacenter){
    db.getLogins(function(logins){
      for(var dc in logins){
        if(datacenter && dc !== datacenter) continue;
        (function(dc){
          var outstandingIds = db.getDeployRequests(dc, function(ids){
            for(var key in ids){
              (function(id){
                sfdc.checkDeployStatus(logins[dc],id,function(err,times){
                  if(err){
                    console.log('Error:');
                    console.log(err);
                    return;
                  }
                  db.clearCompletedDeployRequest(dc,id);
                  db.saveDeployTime(dc,times);
                },sfdc_query_timeout);
              }(ids[key].asyncProcessId))
            }
          });
        }(dc));
      }
    });
  }

}());
