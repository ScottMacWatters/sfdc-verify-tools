process.env.NAMESPACE = '-jasmine-testing';

var lib = require('../index');

describe('index',function(){
  it('contains modules',function(done){
    expect(lib).toBeDefined();
    expect(lib.db).toBeDefined();
    var sfdc = lib.sfdc;
    expect(sfdc).toBeDefined();
    expect(sfdc.tooling).toBeDefined();
    expect(sfdc.tooling.beginTestTask).toBeDefined();
    expect(sfdc.tooling.checkTestTasks).toBeDefined();
    expect(sfdc.deploy).toBeDefined();
    expect(sfdc.deploy.beginDeployTask).toBeDefined();
    expect(sfdc.deploy.checkDeployTasks).toBeDefined();
    expect(sfdc.toolingDeploy).toBeDefined();
    expect(sfdc.toolingDeploy.beginDeployTask).toBeDefined();
    expect(sfdc.toolingDeploy.checkDeployTasks).toBeDefined();
    done();
  });

});
