# TODO: password prompt for creds

sys     = require 'sys'
rest    = require 'restler'
_       = require 'underscore'

class BeanstalkAppAPI
  constructor: (@domain, @username, @password) ->
    @baseURL = "http://#{@domain}.beanstalkapp.com/api"
  
  defaults: (opts = {}) ->
    _.defaults opts,
      username: @username
      password: @password
      headers: 
        "Content-Type": 'application/json'
  
  get: (url, options) -> rest.get @baseURL+url+'.json', @defaults(options)
# end class BeanstalkAppAPI

parseCredString = (credString) ->
  if matches = credString?.match(/^(\w+):(.+)@(\w+)$/)
    matches.slice(1,4)
  else
    console.error "Usage: growl-deploy username:password@subdomain"
    process.exit(1)
    
exports.growlDeploy =
  init: (creds) =>
    [username, password, domain] = parseCredString(creds)
    api = new BeanstalkAppAPI(domain, username, password)
    req = api.get('/users')
    req
      .on 'success', (data, res) ->
        console.log(data)
      .on 'error', (data, res) ->
        sys.puts "Beanstalk API Errors:"
        _(data).each (line) -> sys.puts "'#{line}'"