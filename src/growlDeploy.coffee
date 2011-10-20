# TODO: password prompt for creds
sys     = require 'sys'
exec    = require('child_process').exec
rest    = require 'restler'
moment  = require 'moment'
_       = require 'underscore'

class BeanstalkAppAPI
  constructor: (@domain, @username, @password) ->
    @baseURL = "https://#{@domain}.beanstalkapp.com/api"
  
  defaults: (opts = {}) ->
    _.defaults opts,
      username: @username
      password: @password
      headers: 
        "Content-Type": 'application/json'
  
  get: (url, options) -> 
    rest.get(@baseURL+url+'.json', @defaults(options)).on 'error', errorHandler
        
# end class BeanstalkAppAPI

parseCredString = (credString) ->
  if matches = credString?.match(/^(\w+):(.+)@(\w+)$/)
    matches.slice(1,4)
  else
    console.error "Usage: growl-deploy username:password@subdomain"
    process.exit(1)

errorHandler = (data, res) ->
  console.log(data)
  sys.puts "Beanstalk API Errors:"+_(data).map((line) -> "\n'#{line}'").join()
  
exports.growlDeploy =
  repos: {}
  
  init: (creds) ->
    [username, password, domain] = parseCredString(creds)
    @api = new BeanstalkAppAPI(domain, username, password)
    @check (data) =>
      @lastId = data[1]?.release.id or 0
      @notify(data)
      
  notify: (data) ->
    _(data).reverse().forEach (item) =>
      release = item.release
      if release.id > @lastId
        @lastId = release.id
        @getRepo release.repository_id, (repo) =>
          exec(@message(repo, release))
    # check again in .5s
    setTimeout () =>
      @check (data) => @notify(data)
    , 5000
      
  check: (callback) ->
    req = @api.get('/releases', query: {limit: 1}).on 'success', callback
  
  getRepo: (id, callback) ->
    if @repos[id]
      callback(@repos[id])
    else
      @api.get("/repositories/#{id}").on 'success', (data, req) =>
        repo = data.repository
        @repos[id] = repo
        callback(repo)
    
  message: (repo, release) ->
    title = "#{repo.title} (#{release.environment_name})"
    msg = "#{release.comment} \n - #{release.author}"
    # TODO: add date
    cmd = "growlnotify -I ../lib/beanstalk.png -n growl-deploy -t '#{title}' -m '#{msg}'" 
