//
// Webble World 3.0 (IntelligentPad system for the web)
//
// Copyright (c) 2010-2015 Micke Nicander Kuwahara, Giannis Georgalis, Yuzuru Tanaka
//     in Meme Media R&D Group of Hokkaido University, Japan. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Additional restrictions may apply. See the LICENSE file for more information.
//

/**
 * @overview The entry point (main module) of the Webble World server.
 *
 * Its job is to:
 * (a) initialize all the necessary components (e.g., database and express middleware)
 * (b) depending on the deployment value (config.DEPLOYMENT) execute scripts contained
 *     into the directories "bootstrap" or "maintenance"
 * (c) depending on the deployment value (config.DEPLOYMENT) exit or start listening
 *     for connections over http/https
 *
 * @author Giannis Georgalis
 */

////////////////////////////////////////////////////////////////////////
// Startup utility functions
//
console.time("startup");

function reportStartupError(err) {

	console.log("Error:", err.message);
	process.exit(1);
}

function reportStartupSuccess() {
	console.timeEnd("startup");
}

////////////////////////////////////////////////////////////////////////
// Load essential modules
//
var Promise = require('bluebird');

var express = require('express');
var http = require('http');

var util = require('./lib/util');
var dbutil = require('./lib/dbutil');

var loader = require('./lib/loader');
var config = require('./config');

var gettext = function(str) { return str; };

////////////////////////////////////////////////////////////////////////
// Connect to db and initialize app in parallel (to save a little time)
//
var mongoose = require('mongoose');
var app = express();

Promise.join(

	dbutil.connect(mongoose, config.MONGODB_URL),

	Promise.try(function () {

		var bodyParser = require('body-parser');
		var session = require('express-session');
		var MongoStore = require('connect-mongo')(session);

		// 1. First part of middleware initialization
		//
		app.use(bodyParser.json({ limit: '10mb' }));
		
		// We want to save this in app
        app.locals.sessionStore = new MongoStore({ mongooseConnection: mongoose.connection });

		// trust first proxy, so that despite "secure: true" cookies are set over HTTP when behind proxy
		app.set('trust proxy', 1);
		
		// Set up the session-specific parameters
		app.use(session({
			proxy: config.SERVER_BEHIND_REVERSE_PROXY,
			secret: config.SESSION_SECRET,
			key: config.SESSION_KEY,
			cookie: { httpOnly: true, secure: true },
            store: app.locals.sessionStore,
			saveUninitialized: true, // https://github.com/expressjs/session
			resave: false
		}));
		
		// 2. Configure database models and set up routes
        //
        loader.executeAllScriptsSync('models', app, config, mongoose, gettext);

		// Setup the authentication token
		var auth = require('./auth/auth')(app, config, mongoose, gettext);
			
		// Load all modules that define the web server's routes
        return loader.executeAllScripts('api', app, config, mongoose, gettext, [], auth).then(function () {
            
            // 3. Second part of middleware initialization (after having had set up routes)
            //			
            if (!config.SERVER_BEHIND_REVERSE_PROXY) {
                
                // If we're not behind a proxy we also want to serve static stuff
                var serveStatic = require('serve-static');
                app.use(serveStatic(config.APP_ROOT_DIR));
            }
        });

	}), function () {

        switch (config.DEPLOYMENT) {

	        case 'bootstrap':
		        return loader.executeAllScripts('bootstrap', app, config, mongoose, gettext,
			        []).then(process.exit);

	        case 'maintenance':
		        return loader.executeAllScripts('maintenance', app, config, mongoose, gettext,
			        ['templates.js', 'files.js']).then(process.exit);

	        case 'development':
	        case 'testing':
		        return loader.executeAllScripts('maintenance', app, config, mongoose, gettext,
			        ['templates.js', 'files.js']).then(startAllServers);

	        default:
		        return Promise.try(startAllServers);
        }

}).then(reportStartupSuccess, reportStartupError);

////////////////////////////////////////////////////////////////////////
// Starts the http and https servers on the appropriate endpoints
//
function startAppServer() {
	
	if (!config.SERVER_BEHIND_REVERSE_PROXY) {
		
		if (config.SERVER_PORT != config.SERVER_PORT_PUBLIC) {
			
			var redirectApp = express();
			redirectApp.use(function (req, res) { // we don't need to call next()
				res.redirect(301, config.SERVER_URL_PUBLIC + req.path);
			});
			http.createServer(redirectApp).listen(config.SERVER_PORT);
		}
		
		var fs = require('fs');
		
		var options = {
			ca: config.SERVER_CA && util.transform_(config.SERVER_CA.split(','), fs.readFileSync),
			key: fs.readFileSync(config.SERVER_KEY),
			cert: fs.readFileSync(config.SERVER_CERT),
			passphrase: config.SERVER_PASSPHRASE || undefined
		};
		var appServer = require('https').createServer(options, app);
		appServer.listen(config.SERVER_PORT_PUBLIC);
		return appServer;
	}
	else {
		
		var appServer = http.createServer(app);
		appServer.listen(config.SERVER_PORT);
		return appServer;
	}
}

////////////////////////////////////////////////////////////////////////
// Starts the socket server (for real-time message dispatching)
//
function initSocketServer(webServer) {
	
	// Start under endpoint for easier reverse proxy configuration
	var io = require('socket.io')(webServer).of('/socket.io/endpt');
	var socketAuth = require('./auth/auth-socket')(app, config, mongoose, gettext, io);

	// Load all real-time modules
	return loader.executeAllScripts('realtime', app, config, mongoose, gettext, ['pubsub.js'], io, socketAuth);
}

////////////////////////////////////////////////////////////////////////
// Starts the control server (for intra server communication)
//
function initControlServer(webServer) {
    return loader.executeAllScripts('control', app, config, mongoose, gettext);
}

////////////////////////////////////////////////////////////////////////
// Start all servers
//
function startAllServers() {
	
	var server = startAppServer();
	initSocketServer(server);
	initControlServer(server);
	
	console.log("[OK] Server public endpoint:", config.SERVER_URL_PUBLIC, "[" + config.SERVER_URL + "]");
}
