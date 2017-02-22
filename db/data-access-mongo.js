(function() {

  var mongo = require('mongodb').MongoClient;
  const DEV_NAMESPACE = (process.env.NAMESPACE) ? process.env.NAMESPACE : '';

  var url = process.env.MONGODB_URI;

  var _db;
  var connecting = false;

  function db(cName, callback){
    if(!_db && !connecting){
      connecting = true;
      mongo.connect(url, function(err, mdb){
        if(err){
          console.log(err);
          return callback(null,err);
        }
        _db = mdb;
        return callback(_db.collection(cName + DEV_NAMESPACE));
      });
    }
    else if(!_db && connecting){
      setTimeout(function(){
        db(cName,callback);
      },500);
      return;
    }
    else{
      return callback(_db.collection(cName + DEV_NAMESPACE));
    }
  }

  function stripId(obj){
    if(obj){
      delete obj._id;
    }
    return obj;
  }

  function splitByDcAndKey(arr,keyName){
    var ret = {};
    arr.forEach(function(doc){
      if(!ret[doc.dc]) ret[doc.dc] = {};
      var dc = doc.dc;
      delete doc._id;
      delete doc.dc;
      ret[dc][doc[keyName]] = doc;
    });
    return ret;
  }

  function splitByKey(arr,keyName){
    var ret = {};
    arr.forEach(function(doc){
      delete doc.dc;
      delete doc._id;
      ret[doc[keyName]] = doc;
    });
    return ret;
  }


  //Note: None of these things are encrypted in the DB.
  //These are essentially throw away orgs with no production
  //code or data so I'm fine not encrytping.
  module.exports.getLogins = function(callback){
    db('logins',function(loginCollection){
      loginCollection.find({}).toArray(function(err, logins) {
        logins = logins[0];
        callback(stripId(logins));
      });
    });
  };

  //Note: None of these things are encrypted in the DB.
  //These are essentially throw away orgs with no production
  //code or data so I'm fine not encrytping.
  module.exports.getLogin = function(datacenter,callback){
    db('logins',function(loginCollection){
      loginCollection.find({}).toArray(function(err, logins) {
        logins = logins[0];
        callback(logins[datacenter]);
      });
    });
  };

  //DATACENTER
  module.exports.getDataCenters = function(callback){
    db('datacenters',function(dcCollection){
      dcCollection.find({}).toArray(function(err, dcs){
        var out = [];

        for(var i in dcs){
          out.push(dcs[i].name);
        }
        out.sort(function(a,b){
          return a.localeCompare(b);
        });

        callback(out);
      });
    });
  };

  module.exports.getDataCentersVerbose = function(callback){
    db('datacenters',function(dcCollection){
      dcCollection.find({}).toArray(function(err, dcs){
        var out = [];
        for(var i in dcs){
          out.push(stripId(dcs[i]));
        }

        out.sort(function(a,b){
          return a.name.localeCompare(b.name);
        });

        callback(out);
      });
    });
  }

  //METADATA DEPLOY TIMES / REQUESTS
  module.exports.saveDeployTime = function(datacenter, deployTimes){
    saveTime('deploy',datacenter,testTimes);
  }

  module.exports.getDeployTimes = function(callback){
    getTimes('deploy',callback);
  };

  module.exports.getDeployTimesForDatacenterForDates = function(datacenter, startTime, endTime, callback){
    getTimesForDatacenterForDates('deploy',datacenter,startTime,endTime,callback);
  };

  module.exports.getDeployTimesForDatacenter = function(datacenter, callback){
    getTimesForDatacenter('deploy',datacenter,callback);
  };

  module.exports.saveDeployRequest = function(datacenter, deployRequestId){
    saveRequest('deploy-request','asyncProcessId',datacenter, testRequestId);
  }

  module.exports.clearCompletedDeployRequest = function(datacenter, deployRequestId){
    clearCompletedRequest('deploy-request','asyncProcessId',datacenter, deployRequestId);
  }

  module.exports.getDeployRequests = function(datacenter, callback){
    getRequests('deploy-request', 'asyncProcessId', datacenter, callback);
  }

  //TOOLING TEST TIMES / REQUESTS
  module.exports.saveTestRequest = function(datacenter, testRequestId){
    saveRequest('test-request','asyncApexJobId',datacenter, testRequestId);
  }

  module.exports.clearCompletedTestRequest = function(datacenter, testRequestId){
    clearCompletedRequest('test-request','asyncApexJobId',datacenter, testRequestId);
  }

  module.exports.getTestRequests = function(datacenter, callback){
    getRequests('test-request','asyncApexJobId',datacenter, callback);
  }

  module.exports.saveTestTime = function(datacenter, testTimes){
    saveTime('test',datacenter,testTimes);
  }

  module.exports.getTestTimes = function(callback){
    getTimes('test',callback);
  };

  module.exports.getTestTimesForDatacenterForDates = function(datacenter, startTime, endTime, callback){
    getTimesForDatacenterForDates('test',datacenter,startTime,endTime,callback);
  }

  module.exports.getTestTimesForDatacenter = function(datacenter, callback){
    getTimesForDatacenter('test',datacenter,callback);
  };

  module.exports.savePredictionTimes = function(times){
    db('predictions',function(predictionCollection){
      var docs = [];
      for(var dc in times){
        for(var day in times[dc]){
          for(var hour in times[dc][day]){
            var doc = times[dc][day][hour];
            doc.dc = dc;
            doc.day = day;
            doc.hour = hour;
            var query = {
              dc: doc.dc,
              day: doc.day,
              hour: doc.hour
            };
            predictionCollection.update(query, doc, {upsert: true});
          }
        }
      }
    });
  }

  module.exports.getPredictionTimesForDatacenter = function(datacenter, callback){
    db('predictions',function(predictionsCollection){
      predictionsCollection.find({dc: datacenter}).toArray(function(err, predictions){
        var ret = {};
        for(var i in predictions){
          var doc = stripId(predictions[i]);
          if(!ret[doc.day]) ret[doc.day] = {};
          ret[doc.day][doc.hour] = doc;
        }
        callback(ret);
      });
    });
  }

  //TOOLING DEPLOY TIMES / REQUESTS
  module.exports.saveToolingDeployRequest = function(datacenter, testRequestId){
    saveRequest('tooling-deploy-request','containerAsyncRequestId',datacenter, testRequestId);
  }

  module.exports.clearCompletedToolingDeployRequest = function(datacenter, testRequestId){
    clearCompletedRequest('tooling-deploy-request','containerAsyncRequestId',datacenter, testRequestId);
  }

  module.exports.getToolingDeployRequests = function(datacenter, callback){
    getRequests('tooling-deploy-request','containerAsyncRequestId',datacenter, callback);
  }

  module.exports.saveToolingDeployTime = function(datacenter, testTimes){
    saveTime('tooling-deploy',datacenter,testTimes);
  }

  module.exports.getToolingDeployTimes = function(callback){
    getTimes('tooling-deploy',callback);
  };

  module.exports.getToolingDeployTimesForDatacenterForDates = function(datacenter, startTime, endTime, callback){
    getTimesForDatacenterForDates('tooling-deploy',datacenter,startTime,endTime,callback);
  }

  module.exports.getToolingDeployTimesForDatacenter = function(datacenter, callback){
    getTimesForDatacenter('tooling-deploy',datacenter,callback);
  };

  //PREDICTION TIMES
  module.exports.savePredictionTimes = function(times){
    db('predictions',function(predictionCollection){
      var docs = [];
      for(var dc in times){
        for(var day in times[dc]){
          for(var hour in times[dc][day]){
            var doc = times[dc][day][hour];
            doc.dc = dc;
            doc.day = day;
            doc.hour = hour;
            var query = {
              dc: doc.dc,
              day: doc.day,
              hour: doc.hour
            };
            predictionCollection.update(query, doc, {upsert: true});
          }
        }
      }
    });
  }

  module.exports.getPredictionTimesForDatacenter = function(datacenter, callback){
    db('predictions',function(predictionsCollection){
      predictionsCollection.find({dc: datacenter}).toArray(function(err, predictions){
        var ret = {};
        for(var i in predictions){
          var doc = stripId(predictions[i]);
          if(!ret[doc.day]) ret[doc.day] = {};
          ret[doc.day][doc.hour] = doc;
        }
        callback(ret);
      });
    });
  }

  function getTimesForDatacenter(collectionName,datacenter, callback){
    db(collectionName,function(collection){
      var query = {
        dc: datacenter
      };
      collection.find(query).toArray(function(err,times){
        callback(splitByKey(times,'deployId'));
      });
    });
  }

  function getTimesForDatacenterForDates(collectionName,datacenter, startTime, endTime, callback){
    db(collectionName,function(collection){
      var query = {
        dc: datacenter,
        createdDate: {
          $gt:startTime,
          $lte:endTime
        }
      };
      collection.find(query).toArray(function(err,times){
        callback(splitByKey(times,'deployId'));
      })
    });
  }

  function getTimes(collectionName,callback){
    db(collectionName,function(collection){
      collection.find({}).toArray(function(err, times){
        callback(splitByDcAndKey(times,'deployId'));
      });
    });
  }

  function saveTime(collectionName, datacenter, times){
    db(collectionName,function(collection){
      deployTimes.dc = datacenter;
      var query = {
        dc: times.dc,
        deployId: times.deployId
      }
      collection.update(query, times, {upsert: true});
    });
  }

  function saveRequest(collectionName, identifier, datacenter, requestId){
    db(collectionName,function(collection){
      var doc = {
        dc: datacenter
      };
      doc[identifier] = requestId;
      var query = {
        dc: datacenter
      };
      query[identifier] = requestId;
      collection.update(query, doc, {upsert: true});
    });
  }

  function getRequests(collectionName, identifier, datacenter, callback){
    db(collectionName,function(collection){
      var query = {
        dc: datacenter
      };
      collection.find(query).toArray(function(err,requests){
        if(requests.length === 0){
          callback(null);
        }
        else {
          callback(splitByKey(requests,identifier));
        }
      });
    });
  }

  function clearCompletedRequest(collectionName, identifier, datacenter, requestId){
    db(collectionName,function(collection){
      var query = {
        dc: datacenter,
      };
      query[identifier] = requestId;
      collection.remove(query);
    });
  }

}());
