﻿//
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

//
// takeout.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//

////////////////////////////////////////////////////////////////////////
// Development webbles API for creating and exposing new templates
//
var path = require('path');
var tar = require('tar-stream');

var util = require('../lib/util');

module.exports = function (Q, app, config, mongoose, gettext, auth) {
	
	var Webble = mongoose.model('Webble');
	var DevWebble = mongoose.model('DevWebble');
	
	var webbleDir = 'webbles';
	var devWebbleDir = 'devwebbles';
	
	////////////////////////////////////////////////////////////////////
	// Utility functions
	//
	
	////////////////////////////////////////////////////////////////////
	// Basic routes for webbles
	//
	var fsOps = require('../lib/ops/gfsing')(Q, app, config, mongoose, gettext, auth);
	
	app.get('/api/takeout/devwebbles', auth.dev, function (req, res) {
		
		Q.ninvoke(DevWebble, "find", { $or: [{ _owner: req.user._id }, { _owner: null }] }).then(function (webbles) {
			
			if (!webbles)
				throw new util.RestError(gettext("Cannot retrieve webbles"));
			
			var pack = tar.pack();
			
			// Sequentially		
			return webbles.reduce(function (soFar, w) {
				
				return soFar.then(function () {
					return fsOps.exportFiles(req, w, path.join(devWebbleDir, w._id.toString()), pack);
				});
			}, Q(null));

		}).then(function () {

			pack.finalize();
			
			res.writeHead(200, {
				'Content-Description': 'Webble Archive: ' + req.user.name.first,
				'Content-Disposition' : 'inline; filename="' + req.user.username + '.tar"',
				'Content-Type': 'application/octet-stream'
			});
			pack.pipe(res);

		}).fail(function (err) {
			util.resSendError(res, err);
		}).done();
	});
	
	app.get('/api/takeout/devwebbles/:id', auth.dev, function (req, res) {
		
		var pack = tar.pack();
		
		fsOps.exportFiles(
			req, 
			DevWebble.findById(mongoose.Types.ObjectId(req.params.id)), 
			path.join(devWebbleDir, req.params.id), 
			pack
		).then(function (w) {
						
			pack.finalize();
			
			res.writeHead(200, {
				'Content-Description': 'Webble Archive: ' + w.webble.displayname,
				'Content-Disposition' : 'inline; filename="' + w.webble.defid + '.tar"',
				'Content-Type': 'application/octet-stream',
				//'Content-Length': pack.size
			});
			pack.pipe(res);

		}).fail(function (err) {
			util.resSendError(res, err);
		}).done();
	});
    
	//******************************************************************

};