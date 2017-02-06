(function(){

  module.exports.db = require('./db/data-access.js');

  module.exports.sfdc = {
    tooling: require('./sfdc-bin/deploy.js');
    deploy: require('./sfdc-bin/deploy.js');
  };
  
}());
