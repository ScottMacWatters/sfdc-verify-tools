process.env.NAMESPACE = '-jasmine-testing';
var da = require('../../db/data-access-mongo');


var sampleData = {
  "datacenters": [
    {
      query: {
        name: 'testdc'
      },
      data: {
        name: 'testdc',
        source: 'src'
      }
    }
  ],
  "logins": [
    {
      query: {
        "testdc": { $exists: true}
      },
      data: {
        "testdc": {
          username: "testuser",
          password: "testpass.testtoken"
        }
      }
    }
  ],
  "deploy": [
    {
      query: {
        dc: "testdc",
        deployId: "testDeployId"
      },
      data: {
        dc: "testdc",
        deployId: "testDeployId",
        queuedSeconds: 1,
        createdDate: new Date().getTime()
      }
    }
  ],
  "deploy-request": [
    {
      query: {
        dc: "testdc",
        asyncProcessId: "testId"
      },
      data: {
        dc: "testdc",
        asyncProcessId: "testId"
      }
    }
  ],
  "test": [
    {
      query: {
        dc: "testdc",
        deployId: "testDeployId"
      },
      data: {
        dc: "testdc",
        deployId: "testDeployId",
        queuedSeconds: 1,
        createdDate: new Date().getTime()
      }
    }
  ],
  "test-request": [
    {
      query: {
        dc: "testdc",
        asyncApexJobId: "testId"
      },
      data: {
        dc: "testdc",
        asyncApexJobId: "testId"
      }
    }
  ],"tooling-deploy": [
    {
      query: {
        dc: "testdc",
        deployId: "testDeployId"
      },
      data: {
        dc: "testdc",
        deployId: "testDeployId",
        queuedSeconds: 1,
        createdDate: new Date().getTime()
      }
    }
  ],
  "tooling-deploy-request": [
    {
      query: {
        dc: "testdc",
        containerAsyncRequestId: "testId"
      },
      data: {
        dc: "testdc",
        containerAsyncRequestId: "testId"
      }
    }
  ],
  "predictions": [
    {
      query: {
        dc: "testdc",
        hour: "0",
        day: "0"
      },
      data: {
        deploy_avg_queuedSeconds: 1,
        deploy_max_queuedSeconds: 11,
        deploy_med_queuedSeconds: 0,
        test_avg_executionSeconds: 1,
        test_max_executionSeconds: 12,
        test_med_executionSeconds: 1,
        dc: "testdc",
        day: "0",
        hour: "0"
      }
    }
  ]
}


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

describe('data-access', function(){

  beforeEach(function(done){
    var total = Object.keys(sampleData).length;
    var executed = 0;
    Object.keys(sampleData).forEach(function(cName){
      db(cName,function(collection){
        sampleData[cName].forEach(function(record){
          collection.update(record.query, record.data, {upsert: true}, function(err, result){
            executed++;
            if(executed == total){
              done();
            }
          });
        });
      });
    });
  });

  afterEach(function(done){
    var total = Object.keys(sampleData).length;
    var executed = 0;
    Object.keys(sampleData).forEach(function(cName){
      db(cName,function(collection){
        sampleData[cName].forEach(function(record){
          collection.remove(record.query, function(err, result){
            executed++;
            if(executed == total){
              done();
            }
          });
        });
      });
    });
  });

  it('Should return datacenters verbosely', function(done){
    da.getDataCentersVerbose(function(dcs){
      var sample = sampleData["datacenters"][0].data;
      expect(dcs.length).toBe(1);
      expect(dcs[0].name).toBe(sample.name);
      expect(dcs[0].source).toBe(sample.source);
      expect(dcs[0]._id).toBeUndefined();
      done();
    });
  });

  it('Should return datacenters as a list',function(done){
    da.getDataCenters(function(dcs){
      expect(dcs.length).toBe(1);
      expect(dcs[0]).toBe('testdc');
      done();
    });
  })

  it('Should return a login', function(done){
    da.getLogins(function(logins){
      var sample = sampleData["logins"][0].data;
      expect(Object.keys(logins)[0]).toBe(Object.keys(sample)[0]);
      Object.keys(logins).forEach(function(key){
        expect(logins[key].username).toBe(sample[key].username);
        expect(logins[key].password).toBe(sample[key].password);
        expect(logins._id).toBeUndefined();
      });
      done();
    })
  });

  it('Should return a login for a datacenter', function(done){
    da.getLogin("testdc", function(login){
      var sample = sampleData["logins"][0].data["testdc"];
      expect(login).toBeDefined();
      expect(login.username).toBe(sample.username);
      expect(login.password).toBe(sample.password);
      done();
    })
  });

  it('Should get deploy times', function(done){
    da.getDeployTimes(function(times){
      var sample = sampleData["deploy"][0].data;
      Object.keys(times).forEach(function(dc){
        expect(dc).toBe(sample.dc);
        Object.keys(times[dc]).forEach(function(id){
          expect(id).toBe(sample.deployId);
          expect(times[dc][id].deployId).toBe(sample.deployId);
          expect(times[dc][id].queuedSeconds).toBe(sample.queuedSeconds);
          expect(times[dc][id].createdDate).toBe(sample.createdDate);
        });
      });
      done();
    });
  });

  it('Should get deploy times for datacenter',function(done){
    da.getDeployTimesForDatacenter('testdc',function(times){
      var sample = sampleData["deploy"][0].data;
      Object.keys(times).forEach(function(id){
        expect(id).toBe(sample.deployId);
        expect(times[id].deployId).toBe(sample.deployId);
        expect(times[id].queuedSeconds).toBe(sample.queuedSeconds);
        expect(times[id].createdDate).toBe(sample.createdDate);
      });
      done();
    });
  });

  it('Should get deploy requests',function(done){
    da.getDeployRequests("testdc",function(requests){
      expect(requests).toBeDefined();
      expect(requests["testId"]).toBeDefined();
      expect(requests["testId"].asyncProcessId).toBe("testId");
      done();
    });
  });

  it('Should get test times', function(done){
    da.getTestTimes(function(times){
      var sample = sampleData["test"][0].data;
      Object.keys(times).forEach(function(dc){
        expect(dc).toBe(sample.dc);
        Object.keys(times[dc]).forEach(function(id){
          expect(id).toBe(sample.deployId);
          expect(times[dc][id].deployId).toBe(sample.deployId);
          expect(times[dc][id].queuedSeconds).toBe(sample.queuedSeconds);
          expect(times[dc][id].createdDate).toBe(sample.createdDate);
        });
      });
      done();
    });
  });

  it('Should get test times for datacenter',function(done){
    da.getTestTimesForDatacenter('testdc',function(times){
      var sample = sampleData["test"][0].data;
      Object.keys(times).forEach(function(id){
        expect(id).toBe(sample.deployId);
        expect(times[id].deployId).toBe(sample.deployId);
        expect(times[id].queuedSeconds).toBe(sample.queuedSeconds);
        expect(times[id].createdDate).toBe(sample.createdDate);
      });
      done();
    });
  });

  it('Should get test requests',function(done){
    da.getTestRequests('testdc',function(requests){
      expect(requests).toBeDefined();
      expect(requests["testId"]).toBeDefined();
      expect(requests["testId"].asyncApexJobId).toBe("testId");
      done();
    });
  });

  it('Should get tooling deploy times', function(done){
    da.getToolingDeployTimes(function(times){
      var sample = sampleData["tooling-deploy"][0].data;
      Object.keys(times).forEach(function(dc){
        expect(dc).toBe(sample.dc);
        Object.keys(times[dc]).forEach(function(id){
          expect(id).toBe(sample.deployId);
          expect(times[dc][id].deployId).toBe(sample.deployId);
          expect(times[dc][id].queuedSeconds).toBe(sample.queuedSeconds);
          expect(times[dc][id].createdDate).toBe(sample.createdDate);
        });
      });
      done();
    });
  });

  it('Should get test times for datacenter',function(done){
    da.getToolingDeployTimesForDatacenter('testdc',function(times){
      var sample = sampleData["tooling-deploy"][0].data;
      Object.keys(times).forEach(function(id){
        expect(id).toBe(sample.deployId);
        expect(times[id].deployId).toBe(sample.deployId);
        expect(times[id].queuedSeconds).toBe(sample.queuedSeconds);
        expect(times[id].createdDate).toBe(sample.createdDate);
      });
      done();
    });
  });

  it('Should get test requests',function(done){
    da.getToolingDeployRequests('testdc',function(requests){
      expect(requests).toBeDefined();
      expect(requests["testId"]).toBeDefined();
      expect(requests["testId"].containerAsyncRequestId).toBe("testId");
      done();
    });
  });

  it('Should get prediction times for datacenter',function(done){
    da.getPredictionTimesForDatacenter("testdc",function(predictions){
      var sample = sampleData["predictions"][0].data;
      Object.keys(predictions).forEach(function(day){
        expect(day).toBe(sample.day);
        Object.keys(predictions[day]).forEach(function(hour){
          expect(hour).toBe(sample.hour);
          var prediction = predictions[day][hour];
          Object.keys(prediction).forEach(function(key){
            expect(prediction[key]).toBe(sample[key]);
          });
        });
      });
      done();
    });
  });

});
