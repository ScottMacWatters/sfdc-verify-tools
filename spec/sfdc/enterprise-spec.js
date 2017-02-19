process.env.NAMESPACE = '-jasmine-testing';

var username = process.env.TEST_USERNAME;
var password = process.env.TEST_PASSWORD;

var enterprise = require('../../sfdc/enterprise');


describe('Enterprise client ',function(){
  it('logs into SFDC', function(done){
    expect(username).toBeDefined();
    expect(password).toBeDefined();

    var creds = {
      username: username,
      password: password
    };

    enterprise.sfdcLogin(creds, function(err,loginResult){
      expect(err).toBeNull();
      expect(loginResult).toBeDefined();
      if(loginResult){
        expect(loginResult.result.sessionId).toBeDefined();
      }
      done();
    });
  });
});
