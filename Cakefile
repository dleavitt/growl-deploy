{exec} = require 'child_process'

run = (command, callback) ->
  exec command, (err, stdout, stderr) ->
    console.warn stderr if stderr
    callback?() unless err
    
build = (callback) ->
  run 'coffee -co lib src', callback
  
task "build", "Build lib/ from src/", ->
  build()