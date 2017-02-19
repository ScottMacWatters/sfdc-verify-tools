process.env.NAMESPACE = '-jasmine-testing';

//var db = require('../../db/data-access');
var metadata = require('../../sfdc/metadata');

var username = process.env.TEST_USERNAME;
var password = process.env.TEST_PASSWORD;

describe('Metadata client',function(){
  it('begins a deployment and checks status',function(done){
    expect(username).toBeDefined();
    expect(password).toBeDefined();
    var creds = {
      username: username,
      password: password
    }
    metadata.beginDeploy(creds,function(err,deployId){
      expect(err).toBeNull();
      expect(deployId).toBeDefined();
      metadata.checkDeployStatus(creds, deployId, function(err, status){
        expect(err).toBeNull();
        expect(status).toBeDefined();
        if(status){
          expect(status.createdDate).toBeDefined();
          expect(status.completedDate).toBeDefined();
          expect(status.startDate).toBeDefined();
          expect(status.deployId).toBe(deployId);
          expect(status.queuedSeconds).toBeDefined();
          expect(status.executionSeconds).toBeDefined();
        }
        done();
      },1000);
    })
  });
});
