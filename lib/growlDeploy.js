(function() {
  var BeanstalkAppAPI, parseCredString, rest, sys, _;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  sys = require('sys');
  rest = require('restler');
  _ = require('underscore');
  BeanstalkAppAPI = (function() {
    function BeanstalkAppAPI(domain, username, password) {
      this.domain = domain;
      this.username = username;
      this.password = password;
      this.baseURL = "http://" + this.domain + ".beanstalkapp.com/api";
    }
    BeanstalkAppAPI.prototype.defaults = function(opts) {
      if (opts == null) {
        opts = {};
      }
      return _.defaults(opts, {
        username: this.username,
        password: this.password,
        headers: {
          "Content-Type": 'application/json'
        }
      });
    };
    BeanstalkAppAPI.prototype.get = function(url, options) {
      return rest.get(this.baseURL + url + '.json', this.defaults(options));
    };
    return BeanstalkAppAPI;
  })();
  parseCredString = function(credString) {
    var matches;
    if (matches = credString != null ? credString.match(/^(\w+):(.+)@(\w+)$/) : void 0) {
      return matches.slice(1, 4);
    } else {
      console.error("Usage: growl-deploy username:password@subdomain");
      return process.exit(1);
    }
  };
  exports.growlDeploy = {
    init: __bind(function(creds) {
      var api, domain, password, req, username, _ref;
      _ref = parseCredString(creds), username = _ref[0], password = _ref[1], domain = _ref[2];
      api = new BeanstalkAppAPI(domain, username, password);
      req = api.get('/users');
      return req.on('success', function(data, res) {
        return console.log(data);
      }).on('error', function(data, res) {
        sys.puts("Beanstalk API Errors:");
        return _(data).each(function(line) {
          return sys.puts("'" + line + "'");
        });
      });
    }, this)
  };
}).call(this);
