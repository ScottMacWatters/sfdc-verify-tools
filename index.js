(function(){

  module.exports.db = require('./db/data-access.js');

  module.exports.sfdc = {
    tooling: require('./sfdc-bin/tooling.js'),
    deploy: require('./sfdc-bin/deploy.js')
  };

}());
