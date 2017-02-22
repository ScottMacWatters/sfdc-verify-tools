process.env.NAMESPACE = '-jasmine-testing';

var username = process.env.TEST_USERNAME;
var password = process.env.TEST_PASSWORD;

var tooling = require('../../sfdc/tooling');

describe('Tooling client',function(){
  it('begins async apex tests',function(done){
    expect(username).toBeDefined();
    expect(password).toBeDefined();
    var creds = {
      username: username,
      password: password
    };
    tooling.beginRunTests(creds, function(err, id){
      expect(err).toBeNull();
      expect(id).toBeDefined();
      tooling.checkTestTaskResult(creds, id, function(err, times){
        expect(err).toBeNull();
        expect(times).toBeDefined();
        if(times){
          expect(times.createdDate).toBeDefined();
          expect(times.completedDate).toBeDefined();
          expect(times.startDate).toBeDefined();
          expect(times.deployId).toContain(id);
          expect(times.executionSeconds).toBeDefined();
          expect(times.queuedSeconds).toBeDefined();
        }
        done();
      },1000);
    });
  },10000);

  it('Deploys apex classes', function(done){
    expect(username).toBeDefined();
    expect(password).toBeDefined();
    var creds = {
      username: username,
      password: password
    };
    tooling.beginDeploy(creds, function(err, id){
      expect(err).toBeNull();
      expect(id).toBeDefined();
      tooling.checkDeployResult(creds, id, function(err, times){
        expect(times.createdDate).toBeDefined();
        expect(times.completedDate).toBeDefined();
        expect(times.startDate).toBeDefined();
        expect(times.deployId).toContain(id);
        expect(times.executionSeconds).toBeDefined();
        expect(times.queuedSeconds).toBeDefined();
        done();
      },1000);
    });
  },10000);

});
