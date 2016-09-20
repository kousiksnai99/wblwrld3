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
// sitemap.js
// Created by Giannis Georgalis on Fri Mar 27 2015 16:19:01 GMT+0900 (Tokyo Standard Time)
//
var Promise = require("bluebird");

var fs = require('fs');
var path = require('path');

var util = require('../lib/util');

module.exports = function (app, config, mongoose, gettext) {

    var Webble = mongoose.model('Webble');

    ////////////////////////////////////////////////////////////////////
    // Utility functions
    //

    ////////////////////////////////////////////////////////////////////

    return Webble.find({}).exec().then(function (webbles) {

        var stream = fs.createWriteStream(path.join(config.APP_ROOT_DIR, "sitemap.xml"));

        stream.write('<?xml version="1.0" encoding="UTF-8"?>');
        stream.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

        webbles.forEach(function (w) {
            stream.write('<url><loc>https://wws.meme.hokudai.ac.jp/webbleinfo.html?wbl=' + w.webble.defid + '</loc></url>');
        });

        stream.write('</urlset>');
        stream.end();
    });
};
