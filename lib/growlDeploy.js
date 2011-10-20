(function() {
  var BeanstalkAppAPI, errorHandler, exec, moment, parseCredString, rest, sys, _;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  sys = require('sys');
  exec = require('child_process').exec;
  rest = require('restler');
  moment = require('moment');
  _ = require('underscore');
  BeanstalkAppAPI = (function() {
    function BeanstalkAppAPI(domain, username, password) {
      this.domain = domain;
      this.username = username;
      this.password = password;
      this.baseURL = "https://" + this.domain + ".beanstalkapp.com/api";
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
      return rest.get(this.baseURL + url + '.json', this.defaults(options)).on('error', errorHandler);
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
  errorHandler = function(data, res) {
    console.log(data);
    return sys.puts("Beanstalk API Errors:" + _(data).map(function(line) {
      return "\n'" + line + "'";
    }).join());
  };
  exports.growlDeploy = {
    repos: {},
    init: function(creds) {
      var domain, password, username, _ref;
      _ref = parseCredString(creds), username = _ref[0], password = _ref[1], domain = _ref[2];
      this.api = new BeanstalkAppAPI(domain, username, password);
      return this.check(__bind(function(data) {
        var _ref2;
        this.lastId = ((_ref2 = data[1]) != null ? _ref2.release.id : void 0) || 0;
        return this.notify(data);
      }, this));
    },
    notify: function(data) {
      _(data).reverse().forEach(__bind(function(item) {
        var release;
        release = item.release;
        if (release.id > this.lastId) {
          this.lastId = release.id;
          return this.getRepo(release.repository_id, __bind(function(repo) {
            return exec(this.message(repo, release));
          }, this));
        }
      }, this));
      return setTimeout(__bind(function() {
        return this.check(__bind(function(data) {
          return this.notify(data);
        }, this));
      }, this), 5000);
    },
    check: function(callback) {
      var req;
      return req = this.api.get('/releases', {
        query: {
          limit: 1
        }
      }).on('success', callback);
    },
    getRepo: function(id, callback) {
      if (this.repos[id]) {
        return callback(this.repos[id]);
      } else {
        return this.api.get("/repositories/" + id).on('success', __bind(function(data, req) {
          var repo;
          repo = data.repository;
          this.repos[id] = repo;
          return callback(repo);
        }, this));
      }
    },
    message: function(repo, release) {
      var cmd, msg, title;
      title = "" + repo.title + " (" + release.environment_name + ")";
      msg = "" + release.comment + " \n - " + release.author;
      return cmd = "growlnotify -I ../lib/beanstalk.png -n growl-deploy -t '" + title + "' -m '" + msg + "'";
    }
  };
}).call(this);
