(function() {

  var soap = require('soap');
  var fs = require('fs');
  var enterprise = require('./enterprise.js');
  var runTestsOptions = {
    classIds: null,
    suiteIds: null,
    maxFailedTests: -1,
    testLevel: 'RunSpecifiedTests',
    classNames: 'SimpleDeployableTest',
    suiteNames: null
  };
  var ID_TOKEN = '<ID>';
  var TEST_RESULT_QUERY_STRING = "SELECT AsyncApexJobId,CreatedDate,EndTime,StartTime,Status FROM ApexTestRunResult WHERE AsyncApexJobId = '" + ID_TOKEN + "'";

  var tooling_wsdl;
  try{
    tooling_wsdl = 'node_modules/sfdc-verify-tools/sfdc/wsdl/sfdc_tooling_wsdl.xml'; fs.readFileSync(tooling_wsdl,'base64');
  }
  catch(err){
    tooling_wsdl = 'sfdc/wsdl/sfdc_tooling_wsdl.xml';
  }

  var metadataContainerOptions = {
    sObjects: {
      attributes: {
        'xsi:type': 'MetadataContainer'
      },
      Name: 'sfdc-verify' + (process.env.NAMESPACE) ? process.env.NAMESPACE : ''
    }
  };

  var apexClassOptions = {
    sObjects: {
      attributes: {
        'xsi:type': 'ApexClassMember'
      },
      //TODO: Read this from a file instead of having it inline
      Body: 'public class SimpleDeployableClass {private static final Integer STATIC_INT = 5;public Integer simpleInt {get; set;}public SimpleDeployableClass(Integer myInt){simpleInt = myInt;}public Integer multiplyByStatic(){return simpleInt * STATIC_INT;}}'
    }
  };

  var asyncRequestOptions = {
    sObjects: {
      attributes: {
        'xsi:type': 'ContainerAsyncRequest'
      }
    }
  };

  var APEX_CLASS_QUERY_STRING = 'SELECT Id from ApexClass where Name = \'SimpleDeployableClass\'';
  var DEPLOY_RESULT_QUERY_STRING = "SELECT Id, State, CreatedDate, LastModifiedDate FROM ContainerAsyncRequest WHERE ID = '" + ID_TOKEN + "'";


  module.exports.beginRunTests = function(creds, callback){
    getToolingClient(creds, function(err, tool_client){
      if(err){
        callback(err);
        return;
      }
      tool_client.runTestsAsynchronous(runTestsOptions, function(err, runTestResult){
        if(err){
          callback(err.body)
          return;
        }
        callback(null, runTestResult.result);
      })
    });
  }

  module.exports.checkTestTaskResult = function(creds, id, callback, timeout){
    getToolingClient(creds, function(err, tool_client){
      if(err){
        callback(err);
        return;
      }
      var queryOptions = {
        queryString: TEST_RESULT_QUERY_STRING.replace(ID_TOKEN, id)
      };

      getQueryStatusResponse(tool_client.query, queryOptions, function(err, record){
        if(err){
          callback(err);
          return;
        }
        var result = getTimingFromTestRunResult(record);
        callback(null, result);
      }, timeout);

    });
  }

  module.exports.beginDeploy = function(creds, callback){
    getToolingClient(creds, function(err, tool_client){

      tool_client.query({queryString: APEX_CLASS_QUERY_STRING}, function(err, response){
        if(err){
          console.log(err.body);
          callback(err.body);
          return;
        }
        var contentEntityId = response.result.records[0].Id;

        tool_client.create(metadataContainerOptions,function(err, response){
          if(err) {
            console.log(err.body);
            callback(err.body);
            return;
          }

          var containerId;
          var result = response.result[0];
          if(result.success){
            containerId = result.id;
          }
          else {
            var message = result.errors[0].message;
            containerId = message.substring(message.length - 15);
          }

          apexClassOptions.sObjects.MetadataContainerId = containerId;
          apexClassOptions.sObjects.ContentEntityId = contentEntityId;

          tool_client.create(apexClassOptions, function(err, response){
            if(err){
              console.log(err.body);
              callback(err.body);
              return;
            }

            var classId = response.result[0].id;

            asyncRequestOptions.sObjects.MetadataContainerId = containerId;

            tool_client.create(asyncRequestOptions,function(err, response){
              if(err){
                console.log(err.body);
                callback(err.body);
                return;
              }

              callback(null,response.result[0].id);
            });
          });
        });
      });
    });
  };

  module.exports.checkDeployResult = function(creds, id, callback, timeout){
    getToolingClient(creds, function(err, tool_client){
      if(err){
        callback(err);
        return;
      }

      var queryOptions = {
        queryString: DEPLOY_RESULT_QUERY_STRING.replace(ID_TOKEN, id)
      };

      getQueryStatusResponse(tool_client.query, queryOptions, function(err, record){
        if(err){
          callback(err);
          return;
        }

        callback(null,getTimingFromDeployResult(record));

      },timeout);
    });
  }


  function getToolingClient(creds, callback){
    enterprise.sfdcLogin(creds, function(err, loginResult){

      if(err){
        callback(err);
        return;
      }

      //save the server and session
      var server = loginResult.result.serverUrl.replace(/\/c\//, '/T/');
      var session = loginResult.result.sessionId;

      soap.createClient(tooling_wsdl, function(err, tool_client){
        if(err){
          callback(err.body);
          return;
        }


        //set the session headers for metadata API use
        tool_client.setEndpoint(server);
        var sessionHeader = {SessionHeader: {sessionId: session}};
        tool_client.addSoapHeader(sessionHeader,'','tns','urn:tooling.soap.sforce.com');

        callback(null, tool_client);

      });

    });
  }

  function getTimingFromTestRunResult(record){
    return getTime(record.CreatedDate, record.EndTime, record.StartTime, record.AsyncApexJobId);
  }

  function getTimingFromDeployResult(record){
    return getTime(record.CreatedDate, record.LastModifiedDate, record.CreatedDate, record.Id);
  }

  function getTime(created, completed, started, id){
    var res = {};
    res.createdDate = Date.parse(created);
    res.completedDate = Date.parse(completed);
    res.startDate = Date.parse(started);
    res.deployId = id;
    res.queuedSeconds = (res.startDate - res.createdDate)/1000;
    res.executionSeconds = (res.completedDate - res.startDate)/1000;

    return res;
  }

  function getQueryStatusResponse(statusFunction, options, callback, timeout){
    statusFunction(options, function(err, response){
      if(err){
        console.log(err.body);
        callback(err.body);
        return;
      }

      var record = response.result.records[0];

      var statuses = ['Completed','Failed'];
      if(statuses.includes(record.Status) || statuses.includes(record.State)){
        callback(null, record);
      }
      else if(record.Status === 'Aborted' || record.State === 'Aborted'){
        callback('Job aborted unexpectidly.')
      }
      else{
        setTimeout(function(){
          getQueryStatusResponse(statusFunction, options, callback);
        }, timeout ? timeout : 10000);
      }
    });
  }


}());
