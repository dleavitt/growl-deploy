#!/usr/bin/env node

var sys           = require('sys'),
    growlDeploy   = require('../lib/growlDeploy').growlDeploy;

growlDeploy.init(process.argv[2]);