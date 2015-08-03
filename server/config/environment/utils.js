'use strict';

module.exports = (function() {
  var required = function(name) {
    if(!process.env[name]) {
      throw new Error('You must set the ' + name + ' environment variable');
    }
    console.log('Using: ' + process.env[name]);
    return process.env[name];
  }

  return {
    required: required
  }
})();
