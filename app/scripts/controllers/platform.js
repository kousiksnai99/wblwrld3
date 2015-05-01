//====================================================================================================================
// Webble World
// [IntelligentPad system for the web]
// Copyright (c) 2010 Micke Nicander Kuwahara, Giannis Georgalis, Yuzuru Tanaka in Meme Media R&D Group of Hokkaido University
// v3.0 (2013)
//
// Project Leader & Lead Meme Media Architect: Yuzuru Tanaka
// Webble System Lead Architect & Developer: Micke Nicander Kuwahara
// Server Side Developer: Giannis Georgalis
// Additional Support: Jonas Sjöbergh
//
// This file is part of Webble World (c).
// ******************************************************************************************
// Webble World is licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ******************************************************************************************
// The use of the word "Webble" or "webble" for the loadable meme media objects are limited
// only to objects that actually loads in this original Webble World Platform. Modifications
// of the meme media object code which leads to breaking of compatibility with the original
// Webble World platform, may no longer be referred to as a "Webble" or "webble".
// ******************************************************************************************
//====================================================================================================================
'use strict';

//====================================================================================================================
//
// PLATFORM ROOT CONTROLLER (PlatformCtrl)
//
// This is the main controller for the Webble World platform
//
//====================================================================================================================
ww3Controllers.controller('PlatformCtrl', function ($scope, $rootScope, $location, $modal, $log, $q, $http, $route, $filter, $window, $compile, $timeout, localStorageService, gettext, gettextCatalog, Enum, wwConsts, dbService, menuItemsFactoryService, appPaths, bitflags, getKeyByValue, getUrlVars, fromKeyCode, isValidEnumValue, isValidStyleValue, getCSSClassPropValue, jsonQuery, Slot, authService, valMod, socket, strCatcher, isExist) {    // DEBUG Mode announcement if logging is not commented out, and even with an alert if this is a non-localhost version
    $log.log('This application currently run in DEBUG mode.');

    //=== PLATFORM PROPERTIES =============================================

    // User Authentication Related
    //-------------------------------
    var authPrompt = null;      // Authentication prompt modal
    // Login / Logout buttons
    $scope.login = function() { openAuthPrompt(false); };
    $scope.signup = function() { openAuthPrompt(true); };
    $scope.logout = function() { authService.logout(); };


    // Filters
    //-------------------------------
    $scope.strFormatFltr = $filter('stringFormat');
    //-------------------------------


    // Appearance and View Template Related
    //-------------------------------------
    $scope.bkgLogoClass = 'noLogoBkg';
    $scope.setBkgLogoClass = function(whatClass){$scope.bkgLogoClass = whatClass;};
    $scope.wsTopPos = '0px';
    $scope.progressManager = {
        isWorking: false,
        isLoading: false,
        soFarLevel: 0
    };
    $scope.mouseCursor = 'default';
    $scope.ExistingBitFlagsForPlatformConfigs = Enum.bitFlags_PlatformConfigs;
    var platformBkgColor_ = '#ffffff';
    $scope.getPlatformBkgColor = function(){return platformBkgColor_;};
    $scope.setPlatformBkgColor = function(newPlatformBkgColor){platformBkgColor_ = newPlatformBkgColor;};
    var mwpVisibility_ = 'none';
    $scope.getMWPVisibility = function(){return mwpVisibility_;};
    $scope.setMWPVisibility = function(newVal){if(newVal == 'inline-block' || newVal == 'none'){mwpVisibility_ = newVal;}else{mwpVisibility_ = 'none';}};
    var vcvVisibility_ = 'none';
    $scope.getVCVVisibility = function(){return vcvVisibility_;};
    $scope.setVCVVisibility = function(newVal){if(newVal == 'inline-block' || newVal == 'none'){vcvVisibility_ = newVal;}else{vcvVisibility_ = 'none';}};
    //-------------------------------


    // Quick Info Message
    //-------------------------------------
    $scope.qimTxt = '';
    $scope.qimPos = {x: 0, y: 0};
    $scope.qimSize = {w: 0, h: 0};
    $scope.qimVisibility = false;
    // ----------------------------------------


    // Language Related
    //-------------------------------
    var sysLanguage = $window.navigator.userLanguage || $window.navigator.language;
    $scope.getSysLanguage = function() { return sysLanguage.toLowerCase(); };
    $scope.getCurrentLanguage = function(){ return gettextCatalog.currentLanguage; };
    $scope.stringCollection = {
        logging: gettext("Debug Logging On")
    };
    $scope.langChangeTooltipTxt = '';
    //-------------------------------


    // Menu Related
    //-------------------------------
    $scope.menuItems = angular.copy(menuItemsFactoryService.menuItems);
    $scope.getMenuItem = function(itemName){ for (var i = 0,item; item = $scope.menuItems[i]; i++) { if(item.itemName == itemName){ return item; } for (var n = 0, subitem; subitem = item.sublinks[n]; n++) { if(subitem.sublink_itemName == itemName){ return subitem; } } } };
    var originalWebbleMenu_ = angular.copy(menuItemsFactoryService.menuItems[1].sublinks);
    //-------------------------------


    // Is Enabled-Flags
    //-------------------------------
    $scope.isLoggingEnabled = wwGlobals.loggingEnabled;
    $scope.menuModeEnabled = false;
    $scope.setMenuModeEnabled = function(newState){$scope.menuModeEnabled = newState};
    var isFormOpen_ = false;
    $scope.getIsFormOpen = function(){ return isFormOpen_;};
    $scope.altKeyIsDown = false;
    $scope.shiftKeyIsDown = false;
    $scope.ctrlKeyIsDown = false;
    var doNotSaveUndoEnabled_ = false;
    $scope.getPlatformDoNotSaveUndoEnabled = function(){ return doNotSaveUndoEnabled_; };
    $scope.setPlatformDoNotSaveUndoEnabled = function(newState){ doNotSaveUndoEnabled_ = newState; };
    var isRedoWanted_ = false;
    //-------------------------------


    // Route Message Related
    //-------------------------------
    var videoRequest_ = '';
    $scope.getVideoRequest = function(){return videoRequest_;};
    $scope.setVideoRequest = function(whatVR){videoRequest_ = whatVR;};


    // Platform Core Features Related
    //-------------------------------

    // Flag that tells us weather the platform is running at its full potential or only with limited powers
    var currentPlatformPotential_ = Enum.availablePlatformPotentials.Undefined;

    // Webble Instance Id counter, that assign session unique id's for the Webbles created.
    var wblInstanceIdCounter_ = 0;
    $scope.getNewInstanceId = function(){wblInstanceIdCounter_++; return wblInstanceIdCounter_;};

    // Current workspace and the webbles they contain
    var currWS_ = undefined;
    $scope.getCurrWS = function(){return currWS_;};

    // A list of available (at server) workspaces
    var availableWorkspaces_ = [];
    $scope.setAvailableWorkspaces = function (newArrayOfWS) {availableWorkspaces_ = newArrayOfWS;};
    $scope.getAvailableWorkspaces = function() { return availableWorkspaces_; };

    // A list of available sandbox webble templates
    var availableSandboxWebbles_ = [];

    // A list of open workspaces last time we checked
    var recentWS_ = undefined;
    $scope.getRecentWS = function() { return recentWS_; };

    // A list of all at least once loaded webble definitions since system startup.
    // (A webble definition is a named JSON object containing one or more webbles of one or several templates)
    var webbleDefs_ = [];
    $scope.getWebbleDefs = function(){ return webbleDefs_; };

    // A list of all at least once loaded webble templates since system startup. A webble template is a definition of a webble type which owns its own specific view.html file
    var webbleTemplates_ = [];

    // if the webble template currently being loaded requires external libraries outside what Webble World already provides, then those are saved as an array of text-links in this property while loading them
    var wblManifestLibs = [];
    var prevLoadedManifestLibs = [];

    // Current Supported mode level
    var currentExecutionMode_ = Enum.availableOnePicks_ExecutionModes.Developer;
    //var currentExecutionMode_ = Enum.availableOnePicks_ExecutionModes.SuperHighClearanceUser;
    $scope.getCurrentExecutionMode = function(){return currentExecutionMode_;};
    //SET more complex and found further down

    // When duplicating or creating webbles in large quantities this property keeps track of the amount of webbles being inserted
    var noOfNewWebbles_ = 0;

    //A list of newly created Webbles and its original def objects used during initiation
    var underDevelopmentData_ = [];
    $scope.AddUDD = function(wblInitObject){underDevelopmentData_.push(wblInitObject);};

    // A list of newly created webbles predecessors history linkage, used to be able to recreate parent child relations etc
    var relationConnHistory_ = [];

    // A list of newly created webbles predecessors history linkage, used to be able to recreate shared model relations beyond family ties
    var longtermrelationConnHistory_ = [];

    // When duplicating or creating webbles en masse this property keeps track of the amount of new templates being loaded
    var noOfNewTemplates_ = 0;

    // When loading a workspace this property keeps track of the amount of new independent Webble families being loaded
    var wblFamiliesInLineForInsertion_ = [];

    // a bit flag container that keeps track of various settings which configures the platform environment
    var platformSettingsFlags_ = Enum.bitFlags_PlatformConfigs.None;
    $scope.getPlatformSettingsFlags = function(){return platformSettingsFlags_};

    // The name or the JSON def object of the last inserted webble def... for future fast retrieval
    var recentWebble_ = undefined;

    // When duplicating Webbles 'en masse' this little list keeps track of where we are in the process.
    var pendingWebbleDuplees_ = [];

    // If a load has been called with a callback method assigned then it has to be saved away until the new webble is finished loading and tells so
    var pendingCallbackMethod_ = null;

    // Memory of a webble to be used as parameter in callback method
    var pendingCallbackArgument_ = null;

    // a bit flag container that keeps track of various boolean states this platform has to deal with
    var platformCurrentStates_ = Enum.bitFlags_PlatformStates.None;
    $scope.getPlatformCurrentStates = function(){return platformCurrentStates_;};
    $scope.setPlatformCurrentStates = function(newPCS){platformCurrentStates_ = newPCS;};

    // This is the jquery element of this platform
    var platformElement_ = undefined;
    $scope.getPlatformElement = function(){return platformElement_;};
    $scope.setPlatformElement = function(whatPlatformElement){ if(platformElement_ == undefined){ platformElement_ = whatPlatformElement; }};

    // This is the DOM element of the current selected work surface
    var workSurfaceElement_ = undefined;
    $scope.getWSE = function(){ return workSurfaceElement_;};
    $scope.setWSE = function(currWSE){workSurfaceElement_ = currWSE;};

    // future child waiting to be assigned a parent
    var pendingChild_ = undefined;
    $scope.getPendingChild = function(){return pendingChild_;};
    $scope.setPendingChild = function(newPC){pendingChild_ = newPC;};

    // If the system is bundling, maybe one would like to know (for example avoiding too much $apply)
    var isBundling_ = false;
    $scope.getIsBundling = function() { return isBundling_; };

    // Remember who is being share model duplicated when doing all selected
    var sharedModelTemplate = undefined;

    // Image container element for auto generated images
    var autoGenImageFrame;

    // The start time of application usage
    var applicationStartTime_ = new Date();

    //Temporary watches used in special situations
    var watchingForWebbleExtermination;

    // When switching path, the ws must be saved internally or it will be lost or damaged, this is where it is kept
    var quickSavedWS;

    // Instead of direct calling location path change, this value is set to the requested path and when all needed prep
    // work is done, then the path is changed
    var locationPathChangeRequest = '';

    // flags that knows weather the current workspace is shared and therefore wishes to emit its changes to the outside world
    var liveOnlineInteractionEnabled_ = false;
    $scope.getLOIEnabled = function(){ return liveOnlineInteractionEnabled_; };
    var emitLockEnabled_ = false;
    $scope.getEmitLockEnabled = function(){ return emitLockEnabled_; };
    $scope.setEmitLockEnabled = function(emitLockState){ emitLockEnabled_ = emitLockState; };
    var hasBeenUpdated_ = false;
    var trustedParameterWasUndefined = false;

    //Trust related variables
    var listOfUntrustedWbls_ = [];
    $scope.getIsUntrustedWblsExisting = function(){return (listOfUntrustedWbls_.length > 0)};
    // $scope.getListAsStringOfUniqueUntrustedWbls() Found further below returns a list of unique untrusted Webbles currently loaded

    // A set of flags for rescuing weird touch event behavior
    $scope.touchRescuePlatformFlags = {
        noParentSelectPossibleYet: false
    };

    // A set of flags for situations when default behavior needs to be set aside
    $scope.globalByPassFlags = {
        byPassBlockingProtection: false
    };

    // This is a global info object that keeps track of what basic (non-value related) events that are firing in unrelated webbles and the platform
    // This is used in combination with $watch in webble development to be able to react properly to things of interest.
    $scope.eventInfo = {
        slotChanged: null, //As set: {instanceid: [Instance Id for webble getting slot changed], slotname: [Slot Name], slotvalue: [Slot Value]}
        deletingWebble: null, //As set: {instanceId: [Instance Id for webble being deleted], templateId: [template Id for webble being deleted]}
        keyDownForWebble: null, //As set: {instanceid: [Instance Id for webble being selected], key: {code: [key code], name: [key name], released: [True When Key Released]}
        duplicatingWebble: null, //As set: {originalId: [Instance Id for webble being duplicated], copyId: [Instance Id for Webble that is a copy]}
        shareModelWebble: null, //As set: {originalId: [Instance Id for webble being duplicated], copyId: [Instance Id for Webble that is a copy]}
        pastingWebble: null, //As set: {childId: [Instance Id for webble being pasted], parentId: [Instance Id for Webble that is pasted upon]}
        peelingWebble: null, //As set: {formerChildId: [Instance Id for webble being peeled], formerParentId: [Instance Id for Webble that was peeled from]}
        loadingWebble: null, //As set: [Instance Id for webble being loaded]
        mainMenuExecuted: null, //As set: [menu sublink id]
        wblMenuExecuted: null //As set: {instanceId: [Instance Id for the Webble executing menu], menuItemName: [menu item name]}
    };

    $scope.eventInfoStack = [];
    //-------------------------------


    // EasterEgg Properties
    //-------------------------------
    var soFarWord_ = '';
    var eeWord_ = ['KUWAHARA', 'TANAKA', 'MADEINJAPAN'];
    var eeFunc_ = [
        function(){
            $('html > head').append($('<style>.easterEgg { background: center / 239px 222px no-repeat fixed url("http://www.mickekuwahara.com/images/me.jpg"); }</style>'));
            $scope.bkgLogoClass = 'easterEgg';
            alert('Micke Nicander Kuwahara made this, how about that!!');
        },
        function(){
            $window.open('http://www.amazon.com/Meme-Media-Market-Architectures-Distributing/dp/0471453781/ref=sr_1_5?ie=UTF8&s=books&qid=1252565397&sr=8-5', '_blank');
        },
        function(){
            $window.open('https://www.google.se/search?q=Japan&hl=en&safe=off&rlz=1C1DVCA_enJP357JP357&prmd=imvnsu&source=lnms&tbm=isch&sa=X&ei=tvrzT5zxEeXEmAXa68mEBQ&ved=0CGgQ_AUoAQ&biw=1920&bih=1085', '_blank');
        }
    ];
    //-------------------------------


    // Temporary while developing and debugging
    //-------------------------------
    $scope.debugValue = { txt: '---' };
    //-------------------------------


    //=== EVENT HANDLERS =====================================================================

    //========================================================================================
    // Catch and react on key down events
    //========================================================================================
    $scope.onEventHandler_KeyDown = function($event){
        if($event.altKey && !$scope.altKeyIsDown){
            $scope.altKeyIsDown = true;
        }
        if($event.shiftKey && !$scope.shiftKeyIsDown){
            $scope.shiftKeyIsDown = true;
        }
        if($event.ctrlKey && !$scope.ctrlKeyIsDown){
            $scope.ctrlKeyIsDown = true;
        }

        if($event.keyCode != 18 && $event.keyCode != 16 && $event.keyCode != 13 && $event.keyCode != 17){
            if($scope.executeMenuSelection('', {theAltKey: $event.altKey, theShiftKey: $event.shiftKey, theCtrlKey: $event.ctrlKey, theKey: fromKeyCode($event.keyCode)})){
                $event.preventDefault();
            }
            else{
                var selectedWbls = [];
                for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                    if(aw.scope() != undefined){
                        if (aw.scope().getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked){
                            selectedWbls.push(aw.scope().getInstanceId());
                        }
                    }
                }
                $scope.eventInfoStack.push({event: "keyDownForWebble", info: {instanceidlist: selectedWbls, key: {code: $event.keyCode, name: fromKeyCode($event.keyCode), released: false}}});
                $timeout(function(){ var eisItem = $scope.eventInfoStack.shift(); $scope.eventInfo[eisItem.event] = eisItem.info; });
                $scope.eventInfoStack.push({event: "keyDownForWebble", info: null});
                $timeout(function(){ var eisItem = $scope.eventInfoStack.shift(); $scope.eventInfo[eisItem.event] = eisItem.info; });

            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Catch and react on key up events
    //========================================================================================
    $scope.onEventHandler_KeyUp = function($event){
        if($event.keyCode == 18 && $scope.altKeyIsDown){
            $scope.altKeyIsDown = false;
        }
        if($event.keyCode == 16 && $scope.shiftKeyIsDown){
            $scope.shiftKeyIsDown = false;
        }
        if($event.keyCode == 17 && $scope.ctrlKeyIsDown){
            $scope.ctrlKeyIsDown = false;
        }

        $scope.eventInfoStack.push({event: "keyDownForWebble", info: {instanceidlist: [], key: {code: $event.keyCode, name: fromKeyCode($event.keyCode), released: true}}});
        $timeout(function(){ var eisItem = $scope.eventInfoStack.shift(); $scope.eventInfo[eisItem.event] = eisItem.info; });
        $scope.eventInfoStack.push({event: "keyDownForWebble", info: null});
        $timeout(function(){ var eisItem = $scope.eventInfoStack.shift(); $scope.eventInfo[eisItem.event] = eisItem.info; });
    };
    //========================================================================================


    //========================================================================================
    // Authentication Event-handlers
    //========================================================================================
    $scope.$on('auth:required', function() {
        openAuthPrompt(false);
    });
    //-----------------------------------------------------------
    $scope.$on('auth:login', function(event, user) {
        var hasUserChanged = ($scope.user == undefined || $scope.user.email != user.email);
        $scope.user = user;

        // Set user platform settings if that is not blocked by overrides
        if (!wblwrldSystemOverrideSettings.ignore_UserSettings && hasUserChanged){
            loadUserSettings();
        }

        if(wblwrldSystemOverrideSettings.sysLang == ''){
            if (gettextCatalog.currentLanguage != user.languages[0]){
                gettextCatalog.currentLanguage = user.languages[0] || 'en';
            }
        }

        loadSandboxWblDefs();

        if($scope.user.role == 'adm'){
            unansweredQPending();
        }
    });
    //-----------------------------------------------------------
    $scope.$on('auth:logout', function() {
        $scope.user = null;
        $scope.cleanActiveWS();
        availableWorkspaces_ = [];
        availableSandboxWebbles_ = [];
        $scope.getMenuItem('webbles').sublinks = angular.copy(originalWebbleMenu_);
    });
    //========================================================================================


    //========================================================================================
    // Live Online Interaction Event-handlers (for shared workspaces)
    //========================================================================================
    var onInfo = function(here, there) {
    };
    //-----------------------------------------------------------
    var onDraw = function(here, there) {
    };
    //-----------------------------------------------------------
    var onSave = function(here, there) {
    };
    //-----------------------------------------------------------
    var onComm = function(here, there) {
        if (here) {
            //Lock
            $scope.setEmitLockEnabled(true);

            if(here.op == Enum.transmitOps.setSelectState){
                var theWbl = $scope.getWebbleByInstanceId(here.target);
                if(theWbl){
                    theWbl.scope().setSelectionState(here.selectState);
                }
            }
            else if(here.op == Enum.transmitOps.unselectWbls){
                $scope.resetSelections();
            }
            else if(here.op == Enum.transmitOps.setSlot){
                var theWbl = $scope.getWebbleByInstanceId(here.target);
                if(theWbl){
                    theWbl.scope().set(here.slotName, here.slotValue);
                    if(here.slotName == 'root:left' || here.slotName == 'root:top'){
                        $scope.showQIM((here.user + ' ' + gettext("moved webble") + ' [' + here.target + ']'), undefined, undefined, {x: 0, y: parseInt($scope.wsTopPos)});
                    }
                    else{
                        $scope.showQIM((here.user + ' ' + gettext("set slot") + ' "' + here.slotName + '" ' + gettext("to") + ' ' + here.slotValue + ' ' + gettext("for webble") + ' [' + here.slotValue + ']'), undefined, undefined, {x: 0, y: parseInt($scope.wsTopPos.replace('px', ''))});
                    }
                }
            }
            else if(here.op == Enum.transmitOps.loadWbl){
                $scope.loadWebbleFromDef(here.wblDef);
            }
            else if(here.op == Enum.transmitOps.deleteWbl){
                var theWbl = $scope.getWebbleByInstanceId(here.target);
                if(theWbl){
                    $scope.requestDeleteWebble(theWbl);
                }
            }
            else if(here.op == Enum.transmitOps.pasteWbl){
                var theChild = $scope.getWebbleByInstanceId(here.child);
                var theParent = $scope.getWebbleByInstanceId(here.parent);
                if(theChild && theParent){
                    theChild.scope().paste(theParent);
                }
            }
            else if(here.op == Enum.transmitOps.peelWbl){
                var theWbl = $scope.getWebbleByInstanceId(here.target);
                if(theWbl){
                    theWbl.scope().peel();
                    $scope.showQIM((here.user + ' ' + gettext("peeled webble") + ' [' + here.target + '] ' + gettext("from its parent")), undefined, undefined, {x: 0, y: parseInt($scope.wsTopPos)});
                }
            }
            else if(here.op == Enum.transmitOps.connSlots){
                var theWbl = $scope.getWebbleByInstanceId(here.target);
                if(theWbl){
                    theWbl.scope().connectSlots(here.parentSlot, here.childSlot, here.directions);
                    $scope.showQIM((here.user + ' ' + gettext("connected child slot") + ' "' + here.childSlot + '" ' + gettext("with parent slot") + ' "' + here.parentSlot + '" ' + gettext("for webble") + ' [' + here.target + ']'), undefined, undefined, {x: 0, y: parseInt($scope.wsTopPos)});
                }
            }
            else if(here.op == Enum.transmitOps.addCustSlot){
                var theWbl = $scope.getWebbleByInstanceId(here.target);
                if(theWbl){
                    var theNewSlot = new Slot(here.slot.name,
                        here.slot.value,
                        here.slot.displayName,
                        here.slot.desc,
                        here.slot.cat,
                        here.slot.metadata,
                        undefined
                    );
                    theNewSlot.setIsCustomMade(true);

                    if(here.slot.elPntr){
                        // make sure all elements has ids, the same way that they got them when the custom slot was created
                        var index = 0;
                        theWbl.scope().theView.find('*').addBack().each(function(){
                            var tagName = $(this).get(0).tagName;
                            var elmId = $(this).attr('id');
                            if(!elmId){
                                index++;
                                elmId = 'myElement' + index + '_' + tagName;
                                $(this).attr('id', elmId);
                            }
                        });

                        var elementId = '#' + theNewSlot.getName().substr(0, theNewSlot.getName().indexOf(':'));
                        var theElmnt = theWbl.scope().theView.parent().find(elementId);
                        theNewSlot.setElementPntr(theElmnt);
                        theWbl.scope().setStyle(theElmnt, theNewSlot.getName(), theNewSlot.getValue());
                    }
                    theWbl.scope().addSlot(theNewSlot);
                    $scope.showQIM((here.user + ' ' + gettext("created custom slot") + ' "' + here.slot.name + '" ' + gettext("for webble") + ' [' + here.target + '] ' + gettext("with value") + ' ' + here.slot.value), undefined, undefined, {x: 0, y: parseInt($scope.wsTopPos)});
                }
            }
            else if(here.op == Enum.transmitOps.removeCustSlot){
                var theWbl = $scope.getWebbleByInstanceId(here.target);
                if(theWbl){
                    theWbl.scope().removeSlot(here.slotname);
                    $scope.showQIM((here.user + ' ' + gettext("deleted custom slot") + ' "' + here.slotname + '" ' + gettext("for webble") + ' [' + here.target + ']'), undefined, undefined, {x: 0, y: parseInt($scope.wsTopPos)});
                }
            }
            else if(here.op == Enum.transmitOps.bundle){
                var bundleDef = wwConsts.bundleContainerWblDef;
                var bundleContentStr = here.bundleData;
                bundleDef['webble']['private'] = {bundlecontent: bundleContentStr, creatingbundle: true};
                $scope.loadWebbleFromDef(bundleDef, $scope.connectBundleContent);
                $timeout(function(){$scope.showQIM((here.user + ' ' + gettext("bundled a bunch of webbles")), undefined, undefined, {x: 0, y: parseInt($scope.wsTopPos)});}, 400);
            }
            else if(here.op == Enum.transmitOps.unbundle){
                var theWbl = $scope.getWebbleByInstanceId(here.target);
                if(theWbl){
                    for(var i = 0, bcWbl; bcWbl = $scope.getAllDescendants(theWbl.scope().theView)[i]; i++){
                        bcWbl.scope().setIsBundled(false);
                    }
                    while(theWbl.scope().getChildren().length > 0){
                        var theKid = theWbl.scope().getChildren()[0];
                        var prevValue = $scope.getPlatformDoNotSaveUndoEnabled();
                        $scope.setPlatformDoNotSaveUndoEnabled(true);
                        theWbl.scope().getChildren()[0].scope().peel();
                        $timeout(function(){$scope.setPlatformDoNotSaveUndoEnabled(prevValue);}, 1);
                    }
                    $scope.addUndo({op: Enum.undoOps.unbundle, target: undefined, execData: [{wblDef: theWbl.scope().createWblDef(true)}]}, !$scope.getPlatformDoNotSaveUndoEnabled());
                    $scope.setPlatformDoNotSaveUndoEnabled(true);
                    $scope.requestDeleteWebble(theWbl.scope().theView, false);
                    $timeout(function(){$scope.setPlatformDoNotSaveUndoEnabled(false);}, 100);
                    $timeout(function(){$scope.showQIM((here.user + ' ' + gettext("unbundled the bundle with id") + ' [' + here.target + ']'), undefined, undefined, {x: 0, y: parseInt($scope.wsTopPos)});}, 200);
                }
            }
            else if(here.op == Enum.transmitOps.getCurrentChanges){
                if(here.updatedWSDef){
                    if(!hasBeenUpdated_){
                        hasBeenUpdated_ = true;
                        var currentWS = JSON.stringify(getWSDef(undefined));
                        var otherWS = JSON.stringify(here.updatedWSDef);
                        if(currentWS != otherWS){
                            insertUpdatedWS(here.updatedWSDef);
                            $timeout(function(){$scope.setEmitLockEnabled(false);}, 200);
                        }
                    }
                }
                else{
                    $scope.setEmitLockEnabled(false);
                    $scope.onlineTransmit({id: currWS_.id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.getCurrentChanges, updatedWSDef: getWSDef(undefined)});
                }
            }
            else{
                $log.log('unknown transmit operation');
                $log.log(here);
            }

            //Unlock
            if(here.op != Enum.transmitOps.loadWbl && here.op != Enum.transmitOps.getCurrentChanges && here.op != Enum.transmitOps.bundle){
                $scope.setEmitLockEnabled(false);
            }
        }
    };
    //========================================================================================



    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Platform Initial setup
    //========================================================================================
    var platformCtrlSetup = function () {

        // make sure we have a platform menu even when deep linking to an area that does not really care for one, but need it
        if($location.path() != '' && $location.path().search('mediaplayer') == -1){
            $scope.setMenuModeEnabled(true);
        }

        // Fire up and enable all $watch(es)
        watchConfiguration();

        if(!localStorageService.isSupported()){
            $log.warn('This browser does not support Local storage service!');
        }

        var storedLoggingEnabledVal = localStorageService.get('isLoggingEnabled');
        if(storedLoggingEnabledVal == 'true' || storedLoggingEnabledVal == 'false'){
            //noinspection RedundantConditionalExpressionJS
            $scope.isLoggingEnabled = storedLoggingEnabledVal == 'true' ? true : false;
            wwGlobals.loggingEnabled = $scope.isLoggingEnabled;
        }

        platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
        platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
        platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);

        currentPlatformPotential_ = Enum.availablePlatformPotentials.None;
        dbService.doDBAvailabilityTest().then(
            function(data){
                $log.log('Web Service Status: ' + data.webservicestatus + '\n' + 'Database Status: ' + data.dbStatus);
                if(data.dbStatus.search('Ready and responding') > -1) {
                    currentPlatformPotential_ = Enum.availablePlatformPotentials.Full;
                }
                else {
                    currentPlatformPotential_ = Enum.availablePlatformPotentials.Limited;
                    if(!wwDef.WEBSERVICE_ENABLED){
                        currentPlatformPotential_ = wwDef.PLATFORM_DEFAULT_LEVEL;
                        $log.warn('Webservice connection is disabled by code and instead the data delivered is hardcoded.');
                        $log.warn($scope.strFormatFltr('The platform potential has defaulted to the system forced value of [{0} - {1}]. To change this you must change the wwDef settings in app.js.', [currentPlatformPotential_, getKeyByValue(Enum.availablePlatformPotentials, currentPlatformPotential_)]));
                    }
                    else{
                        $log.warn($scope.strFormatFltr('The current chosen platform potential is not full(3), instead it is of a lower value ({0} - {1}), \nthe reason for this may be service disabled or system forced limitations.', [currentPlatformPotential_, getKeyByValue(Enum.availablePlatformPotentials, currentPlatformPotential_)]));
                    }
                }
            },
            function(errorMessage){
                currentPlatformPotential_ = Enum.availablePlatformPotentials.Limited;
                $log.warn($scope.strFormatFltr('The current chosen platform potential is not full(3), instead it is of a lower value ({0} - {1}), since there seem to be no web service available. Following error message was returned: {2}', [currentPlatformPotential_, getKeyByValue(Enum.availablePlatformPotentials, currentPlatformPotential_), errorMessage]));
            }
        ).then(function() { initPlatform(); });
    };
    //========================================================================================


    //========================================================================================
    // This method initiates the webble system platform and makes it ready to interact with
    // the user and enable webble management.
    //========================================================================================
    var initPlatform = function () {
        // Override any internal system settings that has been declared 'externally' from the override javascript file
        platformBkgColor_ = wblwrldSystemOverrideSettings.platform_Background != '' ? wblwrldSystemOverrideSettings.platform_Background : platformBkgColor_;
        if(wblwrldSystemOverrideSettings.systemMenuVisibility != ''){
            if(wblwrldSystemOverrideSettings.systemMenuVisibility == 'true'){
                platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
            }
            else if(wblwrldSystemOverrideSettings.systemMenuVisibility == 'false'){
                platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
            }
        }
        if(wblwrldSystemOverrideSettings.sysLang != ''){
            gettextCatalog.currentLanguage = wblwrldSystemOverrideSettings.sysLang;
        }
        if(wblwrldSystemOverrideSettings.popupEnabled != ''){
            if(wblwrldSystemOverrideSettings.popupEnabled == 'true'){
                platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
            }
            else if(wblwrldSystemOverrideSettings.popupEnabled == 'false'){
                platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
            }
        }
        if(wblwrldSystemOverrideSettings.autoBehaviorEnabled != ''){
          if(wblwrldSystemOverrideSettings.autoBehaviorEnabled == 'true'){
            platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);
          }
          else if(wblwrldSystemOverrideSettings.autoBehaviorEnabled == 'false'){
            platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);
          }
        }
        $scope.setExecutionMode(wblwrldSystemOverrideSettings.requestedPlatformPotential != -1 ? wblwrldSystemOverrideSettings.requestedPlatformPotential : currentExecutionMode_);
        $rootScope.pageTitle = wblwrldSystemOverrideSettings.pageTitle != '' ? wblwrldSystemOverrideSettings.pageTitle : $rootScope.pageTitle;

        if(wblwrldSystemOverrideSettings.autoLoadedWebblePath.toString().search('http') > -1){
            $scope.loadWblFromURL(wblwrldSystemOverrideSettings.autoLoadedWebblePath, null);
        }
        else if(wblwrldSystemOverrideSettings.autoLoadedWebblePath != ''){
            $scope.loadWblFromURL(appPaths.currentAppUriCore + appPaths.webbleAccessPath + wblwrldSystemOverrideSettings.autoLoadedWebblePath, null);
        }

        // Configure quick language change button if needed
        if(gettextCatalog.currentLanguage.search('en') == -1){
            $scope.langChangeTooltipTxt = "Change Language";
        }
        else{
            if($scope.getSysLanguage().search(gettextCatalog.currentLanguage) == -1){
                $scope.langChangeTooltipTxt = $filter('nativeString')($scope.getSysLanguage());
            }
        }

        var pathQuery = $location.search();
        if(pathQuery.webble && !pathQuery.workspace){
            $scope.downloadWebbleDef(pathQuery.webble)
        }
    };
    //========================================================================================


    //========================================================================================
    // This method sets up and configures all $watch(ed)
    // variables that the system and platform need to
    // consider for optimal experience.
    //========================================================================================
    var watchConfiguration = function(){
        // Listen to menu visibility, in order to adjust workspace top alignment
        $scope.$watch(function(){ //noinspection JSBitwiseOperatorUsage
            return ($scope.menuModeEnabled && (parseInt(platformSettingsFlags_, 10) & parseInt(Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled, 10))); }, function(newValue, oldValue) {
            if(!newValue){
                $scope.wsTopPos = '0px';
            }
            else{
                $scope.wsTopPos = $('#mainmenu').css('height');
            }
        });

        $scope.$watch(function(){ return parseInt($('#mainmenu').css('height')); }, function(newValue, oldValue) {
            if(!isNaN(newValue) && newValue > 0){
                $scope.wsTopPos = newValue + 'px';
            }
        });

        // Listen to platform potential, in order to set menu item availability
        $scope.$watch(function(){ return currentPlatformPotential_; }, function(newValue, oldValue) {
            for (var i = 0,item; item = $scope.menuItems[i]; i++) {
                item.visibility_enabled = true;
                for (var n = 0, subitem; subitem = item.sublinks[n]; n++) {
                    subitem.visibility_enabled = true;
                }
            }
            platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);

            if (newValue == Enum.availablePlatformPotentials.Limited || newValue == Enum.availablePlatformPotentials.Slim || newValue == Enum.availablePlatformPotentials.None) {
                $scope.getMenuItem('webbles').visibility_enabled = false;
                $scope.getMenuItem('docs').visibility_enabled = false;
                $scope.getMenuItem('faq').visibility_enabled = false;
                $scope.getMenuItem('support').visibility_enabled = false;
                $scope.getMenuItem('devpack').visibility_enabled = false;
                $scope.getMenuItem('bugreport').visibility_enabled = false;

                if (newValue == Enum.availablePlatformPotentials.Slim || newValue == Enum.availablePlatformPotentials.None) {
                    $scope.getMenuItem('workspace').visibility_enabled = false;
                    $scope.getMenuItem('edit').visibility_enabled = false;
                    $scope.getMenuItem('view').visibility_enabled = false;
                }
                if (newValue == Enum.availablePlatformPotentials.None) {
                    platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
                }
            }
        });

        // Listen to location path change, in order to alter menu item availability
        $scope.$watch(function(){ return $location.path(); }, function(newValue, oldValue) {
            if(newValue != oldValue){
                for (var i = 0,item; item = $scope.menuItems[i]; i++) {
                    item.visibility_enabled = true;
                    for (var n = 0, subitem; subitem = item.sublinks[n]; n++) {
                        subitem.visibility_enabled = true;
                    }
                }
                if(newValue != '/app'){
                    $scope.getMenuItem('workspace').visibility_enabled = false;

                    $scope.getMenuItem('edit').visibility_enabled = false;

                    $scope.getMenuItem('toggleconn').visibility_enabled = false;
                    $scope.getMenuItem('wsinfo').visibility_enabled = false;

                    $scope.getMenuItem('webbles').visibility_enabled = false;
                }
                else{
                    quickLoadInternalSavedWS();
                }

                if(oldValue == '/templates'){
                    loadSandboxWblDefs();

                    var newWblTemplateList = [];
                    for (var i = 0; i < webbleTemplates_.length; i++){
                        if (webbleTemplates_[i]['templaterevision'] != 0 || webbleTemplates_[i]['templateid'] == 'bundleTemplate'){
                            newWblTemplateList.push(webbleTemplates_[i]);
                        }
                    }
                    webbleTemplates_ = newWblTemplateList;
                }
            }
        });

        // Listen to Current Workspace Name so that the web site title can adjust ackordingly
        $scope.$watch(function(){ return (currWS_ ? currWS_.name : ''); }, function(newValue, oldValue) {
            if(newValue != oldValue){
                if(newValue != ''){
                    $rootScope.pageTitle = newValue + gettext(" in Webble World 3.0");
                }
                else{
                    $rootScope.pageTitle = gettext("Webble World 3.0 - Where memes comes alive");
                }
            }
        });
    };
    //========================================================================================


    //========================================================================================
    // Open Authentication Prompt
    // Open modal for letting user login properly and be aunthenticated.
    //========================================================================================
    var openAuthPrompt = function(authOfferToRegisterByDefault) {
        if (authPrompt != null)
            return authPrompt;

        authPrompt = $modal.open({
            templateUrl: 'views/login.html',
            backdrop: 'static',
            controller: 'LoginCtrl',
            resolve: { authOfferToRegisterByDefault: function() { return authOfferToRegisterByDefault; } }
        });
        authPrompt.result.catch(function() { authService.onAuthCancelled(); } )
            .finally(function() { authPrompt = null; });
        return authPrompt;
    };
    //========================================================================================


    //========================================================================================
    // Load Sandbox Webble Definitions
    // Asks the server for any existing sandbox webble under development that the current
    // user has in his possession.
    //========================================================================================
    var loadSandboxWblDefs = function() {
        dbService.getAllDevelopmentWebbleDefs().then(
            function(sandboxWblDefs) {
                availableSandboxWebbles_ = sandboxWblDefs;
                $scope.getMenuItem('webbles').sublinks = angular.copy(originalWebbleMenu_);

                if(availableSandboxWebbles_.length > 0){
                    var wblMenuList = $scope.getMenuItem('webbles').sublinks;
                    var divider = {"sublink_itemName": "divider", "title": "---", "visibility_enabled": true};
                    wblMenuList.push(divider);

                    for(var i = 0; i < availableSandboxWebbles_.length; i++){
                        var sbwItem = {"sublink_itemName": availableSandboxWebbles_[i].id, "title": gettext("Load Sandbox Webble") + ': ' + availableSandboxWebbles_[i].webble.displayname, "shortcut": "", "visibility_enabled": true};
                        wblMenuList.push(sbwItem);
                    }
                }
            },
            function (msg) {
                $log.log("Error while loading list of available sandbox webbles")
                $log.log(msg);
            }
        );
    };
    //========================================================================================


    //========================================================================================
    //= This method loads the Webble world platform settings from the local storage if it
    //= exists.
    //========================================================================================
    var loadUserSettings = function() {
        if($scope.user){
            var rootPathName = $scope.user.email;
            var storedPlatformSettings = localStorageService.get(rootPathName + wwConsts.storedPlatformSettingsPathLastName);

            if(storedPlatformSettings){
                try{
                    storedPlatformSettings = JSON.parse(storedPlatformSettings);
                }
                catch(err){
                    $log.error($scope.strFormatFltr('parsing user settings failed. File corrupt and will be reset.\n\nError description: {0}',[err.message]));
                    localStorageService.remove(rootPathName + wwConsts.storedPlatformSettingsPathLastName);
                    return;
                }

                platformBkgColor_ = storedPlatformSettings.platformBkgColor != undefined ? storedPlatformSettings.platformBkgColor : platformBkgColor_;
                $scope.setExecutionMode(storedPlatformSettings.currentExecutionMode != undefined ? storedPlatformSettings.currentExecutionMode : null);
                if(storedPlatformSettings.popupEnabled != undefined){
                    if(storedPlatformSettings.popupEnabled == true || storedPlatformSettings.popupEnabled == 'true'){
                        platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
                    }
                    else if(storedPlatformSettings.popupEnabled == false || storedPlatformSettings.popupEnabled == 'false'){
                        platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
                    }
                }
                if(storedPlatformSettings.autoBehaviorEnabled != undefined){
                  if(storedPlatformSettings.autoBehaviorEnabled == true || storedPlatformSettings.autoBehaviorEnabled == 'true'){
                    platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);
                  }
                  else if(storedPlatformSettings.autoBehaviorEnabled == false || storedPlatformSettings.autoBehaviorEnabled == 'false'){
                    platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);
                  }
                }
                if(storedPlatformSettings.systemMenuVisibility != undefined){
                    if(storedPlatformSettings.systemMenuVisibility == true || storedPlatformSettings.systemMenuVisibility == 'true'){
                        platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
                    }
                    else if(storedPlatformSettings.systemMenuVisibility == false || storedPlatformSettings.systemMenuVisibility == 'false'){
                        platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
                    }
                }
                recentWebble_ = storedPlatformSettings.recentWebble != undefined ? storedPlatformSettings.recentWebble : recentWebble_;
                recentWS_ = storedPlatformSettings.recentWS != undefined ? storedPlatformSettings.recentWS : recentWS_;
            }
            else{
                $log.log('No stored platform settings object found for the user [' + $scope.user.email + '].');
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Set Platform Properties
    // This method sets a specified platform property found by name to a specified value and
    // if requested saves it.
    //========================================================================================
    var setPlatformProperties = function(whatPlatformPropName, whatPlatformPropValue, shouldSave) {
        var propWasSet = true;

        if(whatPlatformPropName == 'platformBkgColor'){
            platformBkgColor_ = isValidStyleValue('color', whatPlatformPropValue) ? whatPlatformPropValue : platformBkgColor_;
        }
        else if(whatPlatformPropName == 'currentExecutionMode'){
            $scope.setExecutionMode(isValidEnumValue(Enum.availableOnePicks_ExecutionModes, whatPlatformPropValue) ? (isNaN(whatPlatformPropValue) ? Enum.availableOnePicks_ExecutionModes[whatPlatformPropValue] : whatPlatformPropValue) : null);
        }
        else if(whatPlatformPropName == 'popupEnabled'){
            if(whatPlatformPropValue == true || whatPlatformPropValue == 'true'){
                platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
            }
            else if(whatPlatformPropValue == false || whatPlatformPropValue == 'false'){
                platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
            }
        }
        else if(whatPlatformPropName == 'autoBehaviorEnabled'){
            if(whatPlatformPropValue == true || whatPlatformPropValue == 'true'){
                platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);
            }
            else if(whatPlatformPropValue == false || whatPlatformPropValue == 'false'){
                platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);
            }
        }
        else if(whatPlatformPropName == 'systemMenuVisibility'){
            if(whatPlatformPropValue == true || whatPlatformPropValue == 'true'){
                platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
            }
            else if(whatPlatformPropValue == false || whatPlatformPropValue == 'false'){
                platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
            }
        }
        else if(whatPlatformPropName == 'recentWebble'){
            recentWebble_ = whatPlatformPropValue;
        }
        else if(whatPlatformPropName == 'recentWS'){
            recentWS_ = whatPlatformPropValue;
        }
        else {
            propWasSet = false;
        }

        if (propWasSet && shouldSave)
            $scope.saveUserSettings(false);

        return propWasSet;
    };
    //========================================================================================


    //========================================================================================
    // Download Webble Template
    // This method loads a new set of webble template files and then adds a new instance of a
    // webble templates using that set to the list of webble templates.
    //========================================================================================
    var downloadWblTemplate = function(whatTemplateId, whatTemplateRevision, whatWblDef){
        var corePath = $scope.getTemplatePath(whatTemplateId, whatTemplateRevision);
        $.ajax({url: corePath + appPaths.webbleView,
            success: function(){
                $.ajax({url: corePath + appPaths.webbleManifest,
                    success: function(data){
                        if(data["libs"]){
                            for(var i = 0; i < data["libs"].length;i++){
                                if(!isExist.valueInArray(prevLoadedManifestLibs, data["libs"][i])){
                                    var urlPath = corePath + "/" + data["libs"][i];
                                    if(data["libs"][i].search('/') != -1){ urlPath = data["libs"][i]; }
                                    wblManifestLibs.push(urlPath);
                                    prevLoadedManifestLibs.push(urlPath);
                                }
                            }
                        }
                    },
                    complete: function(){
                        if(wblManifestLibs.length > 0 && !downloadingManifestLibs){
                            downloadWblTemplateManifestFile(whatTemplateId, whatTemplateRevision, whatWblDef, corePath);
                        }
                        else{
                            downloadWblTemplatePartTwo(whatTemplateId, whatTemplateRevision, whatWblDef, corePath);
                        }
                    }
                });
            },
            error: function(){
                $log.error($scope.strFormatFltr('The Webble template "{0}" of revision [{1}] did not exist or was broken and can therefore not be loaded.', [whatTemplateId, whatTemplateRevision]));

                // Remove it from the list of healthy compound webbles
                for (var i = 0; i < webbleDefs_.length; i++){
                    if (webbleDefs_[i]['defId'] == whatWblDef.webble.defid){
                        webbleDefs_.splice(i, 1);
                        break;
                    }
                }
                pendingCallbackMethod_ = null;
                pendingCallbackArgument_ = null;

                $scope.waiting(false);
                if($scope.isLoggingEnabled){
                    alert($scope.strFormatFltr('The Webble template "{0}" of revision [{1}] did not exist or was broken and therefore the loading of the the webble named {2} will be canceled.', [whatTemplateId, whatTemplateRevision, whatWblDef['webble']['defid']]));
                }
                else{
					alert($scope.strFormatFltr('The Webble template "{0}" of revision [{1}] did not exist or was broken and therefore the loading of the the webble named {2} will be canceled including any Workspace which included it.', [whatTemplateId, whatTemplateRevision, whatWblDef['webble']['defid']]));
                    //alert($scope.strFormatFltr('The Webble currently loading did not exist or was broken and therefore the loading of this Webble and any Workspace which included it will be canceled.'));
                }
            }
        });
    };
    //========================================================================================

    var downloadingManifestLibs = false;
    //========================================================================================
    // Download Webble Template Manifest File
    // This method loads all files (one by one) found in the webble templates manifest file.
    // When done it continues loading the rest of the template.
    //========================================================================================
    var downloadWblTemplateManifestFile = function(whatTemplateId, whatTemplateRevision, whatWblDef, corePath){
        if(wblManifestLibs.length > 0 && !downloadingManifestLibs){
            downloadingManifestLibs = true;
            var libItem = wblManifestLibs.shift();
            var libItemExt = libItem.substr(libItem.lastIndexOf('.')+1);

            if(libItemExt == 'css'){
                $.ajax({url: libItem,
                    success: function(){
                        $('<link rel="stylesheet" type="text/css" href="' + libItem + '" >').appendTo("head");
                    },
                    complete: function(){
                        downloadingManifestLibs = false;
                        downloadWblTemplateManifestFile(whatTemplateId, whatTemplateRevision, whatWblDef, corePath);
                    }
                });
            }
            else{
                $.getScript( libItem )
                    .always(function( jqxhr, settings, exception ) {
                        downloadingManifestLibs = false;
                        downloadWblTemplateManifestFile(whatTemplateId, whatTemplateRevision, whatWblDef, corePath);
                    });
            }
        }
        else{
            downloadWblTemplatePartTwo(whatTemplateId, whatTemplateRevision, whatWblDef, corePath);
        }
    };
    //========================================================================================


    //========================================================================================
    // Download Webble Template Part Two
    // This method loads the second half of the required template files after any possible
    // manifest files have been loaded.
    //========================================================================================
    var downloadWblTemplatePartTwo = function(whatTemplateId, whatTemplateRevision, whatWblDef, corePath){
        $.ajax({url: corePath + appPaths.webbleCSS,
            success: function(){
                $('<link rel="stylesheet" type="text/css" href="' + corePath + appPaths.webbleCSS + '" >').appendTo("head");
            },
            complete: function(){
                $.getScript(corePath + appPaths.webbleService)
                    .always(function() {
                        $.getScript(corePath + appPaths.webbleFilter)
                            .always(function() {
                                $.getScript(corePath + appPaths.webbleDirective)
                                    .always(function() {
                                        $.getScript(corePath + appPaths.webbleCtrl)
                                            .always(function() {
                                                webbleTemplates_.push({templateid: whatTemplateId, templaterevision: whatTemplateRevision});
                                                noOfNewTemplates_--;

                                                // if no more templates are being loaded Insert the webble into the desktop
                                                if (noOfNewTemplates_ == 0){
                                                    insertWebble(whatWblDef);
                                                }
                                            }
                                        )
                                    }
                                )
                            }
                        )
                    }
                )
            }
        });
    };
    //========================================================================================


    //========================================================================================
    // Insert Webble Definition
    // This method creates and insert a webble definition, a number of related webbles of a
    // number of specified classes.
    //========================================================================================
    var insertWebble = function(whatWblDef){
        var webblesToInsert = jsonQuery.allValByKey(whatWblDef, 'webble');
        noOfNewWebbles_ = webblesToInsert.length;

        if(whatWblDef.is_verified && whatWblDef.is_trusted == false){
            listOfUntrustedWbls_.push(whatWblDef.webble.defid);
        }
        if(whatWblDef.is_trusted == undefined){ trustedParameterWasUndefined = true; }

        if(currWS_){
            for(var i = 0; i < webblesToInsert.length; i++){
                currWS_.webbles.push({wblDef: webblesToInsert[i]});
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Insert Workspace
    // This method Inserts a workspace and calls for the insertion of its stored webbles.
    //========================================================================================
    var insertUpdatedWS = function(wsDef){
        wblInstanceIdCounter_ = 0;

        currWS_ = {
            id: wsDef.id,
            name: wsDef.name,
            webbles: [],
            undoMemory: [],
            redoMemory: [],
            creator: wsDef.creator,
            is_shared: wsDef.is_shared
        };

        if(wsDef.webbles){
            if(wsDef.webbles.length > 0){
                $scope.setEmitLockEnabled(true);
                wblFamiliesInLineForInsertion_ = wsDef.webbles;
                var wblFamily = wblFamiliesInLineForInsertion_.shift();
                $scope.loadWebbleFromDef(wblFamily);
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Service Response: Get Webble Definition Completed
    // This method manages a successful response form the web service containing the requested
    // data of a Webble definition defined by name and developer.
    //========================================================================================
    var serviceRes_getWebbleDef_Completed = function(whatWblDefId, data){
        if(data['webble'] != undefined){
            if(data['webble']['defid'] != whatWblDefId){
                $log.error('The Webble Definition file was somehow not formatted correctly so therefore Webble loading was canceled.');
            }
            else{
                webbleDefs_.push({wblDefId: whatWblDefId, json: data});
                $scope.loadWebbleFromDef(data, pendingCallbackMethod_);
            }
        }
        else{
            $log.log($scope.strFormatFltr('No webble definition file was found in the database for the webble called {0}.', [whatWblDefId]));
            $scope.waiting(false);
        }
    };
    //========================================================================================


    //========================================================================================
    // Update Undo/Redo List
    // This method make sure that all operations pointing at a Webble that has been deleted
    // is now pointing at undefined and if that webble gets reintroduced the undefined is
    // changed to the new instance id created.
    //========================================================================================
    var updateUndoRedoList = function(whatTargetId, whatChangeId){
        for(var i = 0, op; op = $scope.getCurrWSUndoMemory()[i]; i++){
            if(op.target == whatTargetId){
                op.target = whatChangeId;
            }
            else if(op.execData[0] && op.execData[0].parent){
                if(op.execData[0].parent == whatTargetId){
                    op.execData[0].parent = whatChangeId;
                }
            }
        }
        for(var i = 0, op; op = $scope.getCurrWSRedoMemory()[i]; i++){
            if(op.target == whatTargetId){
                op.target = whatChangeId;
            }
            else if(op.execData[0] && op.execData[0].parent){
                if(op.execData[0].parent == whatTargetId){
                    op.execData[0].parent = whatChangeId;
                }
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Execute Undo / Redo
    // This method reverts the last change of collected undoable operations or redo a
    // previous undone.
    //========================================================================================
    var executeUndoRedo = function(isRedo){
        var theOpList;
        if(!isRedo){
            theOpList = $scope.getCurrWSUndoMemory();
        }
        else{
            theOpList = $scope.getCurrWSRedoMemory();
        }

        if(theOpList.length > 0){
            var theOp = theOpList.shift();
        }
        else{
            return;
        }

        var target = theOp.target != undefined ? $scope.getWebbleByInstanceId(theOp.target) : undefined;
        var data = theOp.execData;
        var currState = {op: theOp.op, target: theOp.target, execData: undefined};
        var currStateData = [];
        switch (theOp.op){
            case Enum.undoOps.setSlot:
                if(!target){ return; }
                doNotSaveUndoEnabled_ = true;
                for(var i = 0; i < data.length; i++){
                    currStateData.push({slotname: data[i].slotname, slotvalue: target.scope().gimme(data[i].slotname)});
                    target.scope().set(data[i].slotname, data[i].slotvalue);
                }
                currState.execData = currStateData;
                $timeout(function(){doNotSaveUndoEnabled_ = false;}, 300);
                break;
            case Enum.undoOps.loadWbl:
                if(!target){ return; }
                doNotSaveUndoEnabled_ = true;
                currState.op = Enum.undoOps.deleteWbl;
                currState.target = undefined;
                currStateData.push({wbldef: target.scope().createWblDef(true)});
                $scope.requestDeleteWebble(target, false);
                currState.execData = currStateData;
                $timeout(function(){doNotSaveUndoEnabled_ = false;}, 300);
                break;
            case Enum.undoOps.deleteWbl:
                doNotSaveUndoEnabled_ = true;
                currState.op = Enum.undoOps.loadWbl;
                $scope.loadWebbleFromDef(data[0].wbldef, function(wblData){
                    theOp.target = wblData.wbl.scope().getInstanceId();
                    currState.execData = currStateData.push({oldid: wblData.oldInstanceId});
                    updateUndoRedoList(wblData.oldInstanceId, theOp.target);
                });
                $timeout(function(){doNotSaveUndoEnabled_ = false;}, 300);
                break;
            case Enum.undoOps.pasteWbl:
                if(!target){ return; }
                doNotSaveUndoEnabled_ = true;
                currState.op = Enum.undoOps.peelWbl;
                currStateData.push({parent: target.scope().getParent().scope().getInstanceId()});
                target.scope().peel();
                target.scope().activateBorder(true, 'gold', undefined, undefined, true);
                currState.execData = currStateData;
                $timeout(function(){doNotSaveUndoEnabled_ = false;}, 300);
                break;
            case Enum.undoOps.peelWbl:
                if(!target){ return; }
                doNotSaveUndoEnabled_ = true;
                currState.op = Enum.undoOps.pasteWbl;
                var parent = $scope.getWebbleByInstanceId(data[0].parent);
                target.scope().paste(parent);
                target.scope().activateBorder(true, 'pink', undefined, undefined, true);
                parent.scope().activateBorder(true, 'darkred', undefined, undefined, true);
                currState.execData = currStateData;
                $timeout(function(){doNotSaveUndoEnabled_ = false;}, 300);
                break;
            case Enum.undoOps.connSlots:
                if(!target){ return; }
                doNotSaveUndoEnabled_ = true;
                currStateData.push({connslot: target.scope().getConnectedSlot(), selectslot: target.scope().getSelectedSlot(), slotdir: target.scope().getSlotConnDir()});
                target.scope().connectSlots(data[0].connslot, data[0].selectslot, data[0].slotdir);
                currState.execData = currStateData;
                $timeout(function(){doNotSaveUndoEnabled_ = false;}, 300);
                break;
            case Enum.undoOps.addCustSlot:
                if(!target){ return; }
                doNotSaveUndoEnabled_ = true;
                currState.op = Enum.undoOps.removeCustSlot;
                currStateData.push({slotname: data[0].slotname, slotvalue: target.scope().gimme(data[0].slotname), slotcat: target.scope().getSlot(data[0].slotname).getCategory()});
                target.scope().removeSlot(data[0].slotname);
                currState.execData = currStateData;
                $timeout(function(){doNotSaveUndoEnabled_ = false;}, 300);
                break;
            case Enum.undoOps.removeCustSlot:
                if(!target){ return; }
                doNotSaveUndoEnabled_ = true;
                currState.op = Enum.undoOps.addCustSlot;
                currStateData.push({slotname: data[0].slotname});
                var displayInfo = strCatcher.getAutoGeneratedDisplayInfo(data[0].slotname);
                var cSlot = new Slot(data[0].slotname,
                    data[0].slotvalue,
                    displayInfo.name,
                    displayInfo.desc,
                    data[0].slotcat,
                    undefined,
                    undefined
                );
                cSlot.setIsCustomMade(true);
                if(cSlot.getCategory() == 'custom-css'){
                    var elementId = '#' + cSlot.getName().substr(0, cSlot.getName().indexOf(':'));
                    var theElmnt = target.scope().theView.parent().find(elementId);
                    cSlot.setElementPntr(theElmnt);
                    target.scope().setStyle(theElmnt, cSlot.getName(), cSlot.getValue());
                }
                target.scope().addSlot(cSlot);
                currState.execData = currStateData;
                $timeout(function(){doNotSaveUndoEnabled_ = false;}, 300);
                break;
            case Enum.undoOps.bundle:
                doNotSaveUndoEnabled_ = true;
                currState.op = Enum.undoOps.unbundle;
                currState.target = undefined;
                for(var i = 0, bcWbl; bcWbl = target.scope().getAllDescendants(target)[i]; i++){
                    bcWbl.scope().setIsBundled(false);
                }
                while(target.scope().getChildren().length > 0){
                    target.scope().getChildren()[0].scope().peel();
                }
                currStateData.push({wblDef: target.scope().createWblDef(true)});
                $scope.requestDeleteWebble(target.scope().theView, false);
                currState.execData = currStateData;
                $timeout(function(){doNotSaveUndoEnabled_ = false;}, 300);
                break;
            case Enum.undoOps.unbundle:
                doNotSaveUndoEnabled_ = true;
                data[0].wblDef['webble']['private']['creatingbundle'] = true;
                isRedoWanted_ = isRedo;
                $scope.loadWebbleFromDef(data[0].wblDef, $scope.connectBundleContentFromUndo);
                $timeout(function(){doNotSaveUndoEnabled_ = false;}, 300);
                return;
                break;
        }

        if(!isRedo){
            $scope.getCurrWSRedoMemory().unshift(currState);
        }
        else{
            $scope.getCurrWSUndoMemory().unshift(currState);
        }
    };
    //========================================================================================


    //========================================================================================
    // Delete Webble
    // This method deletes the webble provided as parameter from the platform list of webbles
    // in the current active workspace.
    //========================================================================================
    var deleteWbl = function(target){
        $scope.eventInfoStack.push({event: "deletingWebble", info: {instanceId: target.scope().getInstanceId(), templateId: target.scope().theWblMetadata['templateid']}});
        $timeout(function(){ var eisItem = $scope.eventInfoStack.shift(); $scope.eventInfo[eisItem.event] = eisItem.info; });
        target.scope().wblEventInfoStack.push({event: "deleted", info: new Date()});
        $timeout(function(){ var eisItem = target.scope().wblEventInfoStack.shift(); target.scope().wblEventInfo[eisItem.event] = eisItem.info; });

        //also call $apply since otherwise the webble most likely is killed before angular knows what happened an no $watch is fired
        if(!$scope.$$phase){ $scope.$apply(); }

        var targetInstanceId = target.scope().getInstanceId();

        $timeout(function(){
            // Delete shared model connections
            if(target.scope()){
                for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                    if(aw.scope().getInstanceId() != targetInstanceId){
                        for(var n = 0, ms; ms = aw.scope().getModelSharees()[n]; n++){
                            if(ms.scope().getInstanceId() == targetInstanceId){
                                aw.scope().getModelSharees().splice(n, 1);
                                break;
                            }
                        }
                    }
                }
            }

            if(target.scope()){
                // Unregister all slot watches in the webble for proper clean-up
                for(var slot in target.scope().getSlots()){
                    var thisSlot = target.scope().getSlot(slot);
                    if(thisSlot.cssValWatch){
                        thisSlot.cssValWatch();
                    }
                }
            }

            // do the actual deletion
            for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                if(aw.scope()){
                    if(aw.scope().getInstanceId() == targetInstanceId){
                        $scope.getCurrWS().webbles.splice(i, 1);
                        target.parent().remove();
                        $scope.eventInfoStack.push({event: "deletingWebble", info: null});
                        $timeout(function(){ var eisItem = $scope.eventInfoStack.shift(); $scope.eventInfo[eisItem.event] = eisItem.info; });
                        break;
                    }
                }
            }

            var updatedUntrustList = []
            for(var k = 0, aw; aw = $scope.getActiveWebbles()[k]; k++){
                for(var i = 0; i < listOfUntrustedWbls_.length; i++){
                    if(listOfUntrustedWbls_[i] == aw.scope().theWblMetadata['defid']){
                        updatedUntrustList.push(listOfUntrustedWbls_[i]);
                        break;
                    }
                }
            }
            listOfUntrustedWbls_ = updatedUntrustList;

        }, 150);
    };
    //========================================================================================


    //========================================================================================
    // Connect Child Parent
    // This method connects two webbles as child and parent.
    //========================================================================================
    var connectChildParent = function(child, parent){
        if (parent && child){
            // Check so that the child doesn't already have a parent
            if (child.scope().getParent() != undefined){
                $log.warn($scope.strFormatFltr('This child [{0}] already has a parent [{1}] and does not want another [{2}]', [child.scope().getWebbleFullName(), child.scope().getParent().scope().getWebbleFullName(), parent.scope().getWebbleFullName()]));
                return;
            }

            // Check so that child and parent are'nt already related in an unnatural way
            for(var i = 0, d; d = $scope.getAllDescendants(child)[i]; i++){
                if (d.scope().getInstanceId() == parent.scope().getInstanceId()){
                    $log.warn('Incest is not allowed!!');
                    return;
                }
            }

            if(child.scope().paste(parent)){
                for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                    if (aw.scope().getInstanceId() == parent.scope().getInstanceId()){
                        aw.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsNewParent);
                    }
                    else if (aw.scope().getInstanceId() == child.scope().getInstanceId()){
                        aw.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsNewChild);
                    }
                }
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Get Selected Top Parents
    // This method finds the all selected top parents (parent without any own parent or a
    // parent that is not selected).
    //========================================================================================
    var getSelectedTopParents = function(){
        var superParents = [];

        for(var i = 0, sw; sw = $scope.getSelectedWebbles()[i]; i++){
            var theOneToPick = sw;
            if(sw.scope().getParent()){
                for(var n = 0, anc; anc = $scope.getAllAncestors(sw)[n]; n++){
                    if(anc.scope().getSelectionState() ==  Enum.availableOnePicks_SelectTypes.AsMainClicked){
                        theOneToPick = anc;
                    }
                }
            }
            var isFound = false;
            for(var n = 0, sp; sp = superParents[n]; n++){
                if(sp.scope().getInstanceId() == theOneToPick.scope().getInstanceId()){
                    isFound = true;
                    break;
                }
            }

            if(!isFound){
                superParents.push(theOneToPick);
            }
        }

        return superParents;
    };
    //========================================================================================


    //========================================================================================
    // Duplicate Selected Webbles
    // This method finds all selected webbles if any and creates duplicates of them.
    //========================================================================================
    var duplicateAllSelectedWebbles = function(){
        pendingWebbleDuplees_ = getSelectedTopParents();
        duplicateNextSelectedWbl();
    };
    //========================================================================================


    //========================================================================================
    // Duplicate Selected Webbles
    // This method finds all selected webbles if any and creates duplicates of them.
    //========================================================================================
    var duplicateNextSelectedWbl = function(){
        var duplee = pendingWebbleDuplees_.shift();
        if(duplee){
            duplee.scope().duplicate({x: 15, y: 15}, duplicateNextSelectedWbl);
        }
    };
    //========================================================================================


    //========================================================================================
    // Duplicate Selected Webbles
    // This method finds all selected webbles if any and creates duplicates of them.
    //========================================================================================
    var sharedModelDuplicateAllSelectedWebbles = function(){
        sharedModelTemplate = undefined;
        pendingWebbleDuplees_ = getSelectedTopParents();
        sharedModelDuplicateNextSelectedWbl(null);
    };
    //========================================================================================


    //========================================================================================
    // Duplicate Selected Webbles
    // This method finds all selected webbles if any and creates duplicates of them.
    //========================================================================================
    var sharedModelDuplicateNextSelectedWbl = function(wblData){
        if(wblData != null && sharedModelTemplate != undefined){
            sharedModelTemplate.scope().connectSharedModel(wblData);
        }
        sharedModelTemplate = pendingWebbleDuplees_.shift();
        if(sharedModelTemplate){
            sharedModelTemplate.scope().sharedModelDuplicate({x: 15, y: 15}, sharedModelDuplicateNextSelectedWbl);
        }
    };
    //========================================================================================


    //========================================================================================
    // Get Publish Webble Content
    // Gets the content to fill this form properly
    //========================================================================================
    var getPublishWebbleContent = function(whatWebble){
        autoGenImageFrame = angular.element(document.createElement("div"));
        autoGenImageFrame.attr('id', 'autoGenImageFrame');
        var theWblFamily = $scope.getAllDescendants(whatWebble);
        var ltrb = {l: 10000, t: 10000, r: 0, b: 0};
        for(var i = 0, wbl; wbl = theWblFamily[i]; i++){
            var wblLTPos = $scope.getWblAbsPosInPixels(wbl);
            var wblLTRB = {l: wblLTPos.x, t: wblLTPos.y, r: wblLTPos.x + Math.round(getUnits(wbl.parent()[0], 'width').pixel), b: wblLTPos.y + Math.round(getUnits(wbl.parent()[0], 'height').pixel)};
            if(wblLTRB.l < ltrb.l){
                ltrb.l = wblLTRB.l;
            }
            if(wblLTRB.t < ltrb.t){
                ltrb.t = wblLTRB.t;
            }
            if(wblLTRB.r > ltrb.r){
                ltrb.r = wblLTRB.r;
            }
            if(wblLTRB.b > ltrb.b){
                ltrb.b = wblLTRB.b;
            }
        }

        $scope.getWSE().append(autoGenImageFrame);
        autoGenImageFrame.css('background-color', 'transparent');
        autoGenImageFrame.css('position', 'absolute');
        autoGenImageFrame.css('left', ltrb.l);
        autoGenImageFrame.css('top', ltrb.t);
        autoGenImageFrame.css('width', (ltrb.r - ltrb.l + 7));
        autoGenImageFrame.css('height', (ltrb.b - ltrb.t + 7));

        for(var i = 0, wbl; wbl = theWblFamily[i]; i++){
            var wblLTPos = $scope.getWblAbsPosInPixels(wbl);
            wbl.parent().clone().css('left', (wblLTPos.x - ltrb.l)).css('top', (wblLTPos.y - ltrb.t)).prependTo(autoGenImageFrame);
        }

        var theWblDef = whatWebble.scope().createWblDef(true);
        theWblDef.webble.author = $scope.user.username;

        return {
            wblDef: theWblDef,
            isSameAuthor: $scope.user.username == whatWebble.scope().theWblMetadata['author'],
            theWblElement: autoGenImageFrame,
            sandboxWblList: availableSandboxWebbles_
        };
    };
    //========================================================================================


    //========================================================================================
    // Publish Webble Returned
    // Manages the return data from this form when submitted
    //========================================================================================
    var publishWebbleReturned = function(returnData){
        $scope.getWSE().find('#autoGenImageFrame').remove();
        if(returnData){
			$scope.waiting(true);
            var theWbl = $scope.getWebbleByInstanceId(returnData.instanceid);
            theWbl.scope().theWblMetadata['defid'] = returnData.defid;
            theWbl.scope().theWblMetadata['displayname'] = returnData.displayname;
            theWbl.scope().theWblMetadata['description'] = returnData.description;
            theWbl.scope().theWblMetadata['keywords'] = returnData.keywords;
            theWbl.scope().theWblMetadata['image'] = returnData.image;
            if(returnData.sandboxWblPublished){
                loadSandboxWblDefs();
            }

			$scope.waiting(false);
            $scope.showQIM(gettext("Webble Successfully Published"));
        }
    };
    //========================================================================================


    //========================================================================================
    // Load Webble Returned
    // Manages the return data from this form when submitted
    //========================================================================================
    var loadWebbleReturned = function(returnData){
        if(returnData){
            if(returnData.webble){
                $scope.loadWebbleFromDef(returnData, null);
            }
            else if(returnData.wblUrl){
                $scope.loadWblFromURL(returnData.wblUrl, null);
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Get Platform Properties Content
    // Gets the content to fill this form properly
    //========================================================================================
    var getPlatformPropsContent = function(){
        return {
            platformBkgColor: platformBkgColor_,
            currentExecutionMode: currentExecutionMode_,
            popupEnabled: (platformSettingsFlags_ & Enum.bitFlags_PlatformConfigs.PopupInfoEnabled) != 0,
            autoBehaviorEnabled: (platformSettingsFlags_ & Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled) != 0
        };
    };
    //========================================================================================


    //========================================================================================
    // platform Properties Returned
    // Manages the return data from this form when submitted
    //========================================================================================
    var platformPropsReturned = function(returnData){
        if(returnData){
            platformBkgColor_ = returnData.platformBkgColor;
            $scope.setExecutionMode(returnData.currentExecutionMode);
            if(returnData.popupEnabled == true){
                platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
            }
            else if(returnData.popupEnabled == false){
                platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.PopupInfoEnabled);
            }

            if(returnData.autoBehaviorEnabled == true){
                platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);
            }
            else if(returnData.autoBehaviorEnabled == false){
                platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled);
            }

            $scope.saveUserSettings(false);
        }
    };
    //========================================================================================


    //========================================================================================
    // Get Workspace Definition
    // Creates and return the content of the workspace (all webbles) in a proper workspace
    // definition object.
    //========================================================================================
    var getWSDef = function(whoCreated){
        var theActiveWS = $scope.getCurrWS();
        var ws = {
            "id": theActiveWS.id,
            "name": theActiveWS.name,
            "creator": (whoCreated ? whoCreated : theActiveWS.creator)
        };

        var wbls = [];
        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            if(!aw.scope().getParent()){
                wbls.push(aw.scope().createWblDef(true));
            }
        }
        ws["webbles"] = wbls;

        return ws;
    };
    //========================================================================================


    //========================================================================================
    // Has Unanswered FAQ Pending
    // Tells weather there are any pending questions without answers in the FAQ.
    //========================================================================================
    var unansweredQPending = function(){
        dbService.getFAQs().then(function(data){
            if(data.length){
                for(var i = 0, faq; faq = data[i]; i++){
                    if(faq.a == 'Unanswered' || faq.a == ''){
                        $scope.openForm(Enum.aopForms.infoMsg, {
                                title: gettext('Pending Questions in the FAQ'),
                                content: gettext('There are pending questions in the FAQ waiting for your attention. Please visit there and give some good answers.')}
                        );
                        break;
                    }
                }
            }
        },function(eMsg){
            //no info needed
        });
    };
    //========================================================================================


    //========================================================================================
    // Quick Save Save Workspace Internal
    // Tries to save the current active workspace
    //========================================================================================
    var quickSaveWSInternal = function(){
        quickSavedWS = getWSDef();
        $scope.cleanActiveWS();
    };
    //========================================================================================


    //========================================================================================
    // Quick Load Internal Saved Workspace
    // Tries to restore an auto saved workspace
    //========================================================================================
    var quickLoadInternalSavedWS = function(){
        if(quickSavedWS){
            if(quickSavedWS.id){
                $scope.insertWS(quickSavedWS);
            }
            else{
                wblFamiliesInLineForInsertion_ = angular.copy(quickSavedWS.webbles);
                quickSavedWS = undefined;
                $scope.loadWebbleFromDef(wblFamiliesInLineForInsertion_.shift());
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Update WorkSurfce
    // Make sure the Webble is loaded and Displayed as it should before it is happy by regular
    // check that Angular has applied everything as it should.
    //========================================================================================
    var updateWorkSurfce = function() {
        if(!$scope.$$phase){
            $scope.$apply();
        }
        if($scope.waiting()){
            $timeout(updateWorkSurfce, 100);
        }
    };
    //========================================================================================



    //*****************************************************************************************************************
    //=== PUBLIC FUNCTIONS ============================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Get Template Path
    // This method gets the path to the template as either from the sandbox if a webble by
    // the defined id exists there or otherwise from the default repository.
    //========================================================================================
    $scope.getTemplatePath = function(whatTemplateId, whatTemplateRevision){
        var corePath = '';
        var isInSandbox = false;

        for(var i = 0; i < availableSandboxWebbles_.length; i++){
            if(whatTemplateId == availableSandboxWebbles_[i].webble.templateid){
                isInSandbox = true;
                corePath = appPaths.webbleSandboxCore + availableSandboxWebbles_[i].id + '/' + whatTemplateRevision;
                break;
            }
        }

        if(!isInSandbox || whatTemplateRevision > 0){
            corePath = appPaths.webbleRepCore + whatTemplateId + '/' + whatTemplateRevision;
        }

        return corePath;
    };
    //========================================================================================


    //========================================================================================
    // Save Platform Properties
    // This method saves the platform properties for current user to the local storage.
    //========================================================================================
    $scope.saveUserSettings = function(isSaveImportantOnly){
        if($scope.user){
            var platformProps = null;
            var rootPathName = $scope.user.email;

            if (isSaveImportantOnly) {
                // Get current user platform settings
                var org_pp = localStorageService.get(rootPathName + wwConsts.storedPlatformSettingsPathLastName);
                if(org_pp){
                    platformProps = JSON.parse(org_pp);

                    platformProps['recentWebble'] = recentWebble_;
                    platformProps['recentWS'] = recentWS_;
                }
            }

            if(!isSaveImportantOnly || platformProps == null)
            {
                // Store the platforms settings to the user profile
                platformProps = {
                    'platformBkgColor': platformBkgColor_,
                    'currentExecutionMode': currentExecutionMode_,
                    'popupEnabled': (platformSettingsFlags_ & Enum.bitFlags_PlatformConfigs.PopupInfoEnabled) != 0,
                    'autoBehaviorEnabled': (platformSettingsFlags_ & Enum.bitFlags_PlatformConfigs.autoBehaviorEnabled) != 0,
                    'systemMenuVisibility': (platformSettingsFlags_ & Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled) != 0,
                    'recentWebble': recentWebble_
                };
            }
            localStorageService.add(rootPathName + wwConsts.storedPlatformSettingsPathLastName, JSON.stringify(platformProps));

        }
    };
    //========================================================================================


    //========================================================================================
    // Online Transmit
    // This method will transfer the specified operation of the current workspace and its
    // webbles to all online users that is sharing this workspace if this feature is enabled
    // and open.
    //========================================================================================
    $scope.onlineTransmit = function(data){
        socket.emit('interaction:comm', data);
    };
    //========================================================================================


    //========================================================================================
    // Insert Workspace
    // This method Inserts a workspace and calls for the insertion of its stored webbles.
    //========================================================================================
    $scope.insertWS = function(wsDef){
        $scope.waiting(true);
        $timeout(updateWorkSurfce, 100);

        wblInstanceIdCounter_ = 0;
        hasBeenUpdated_ = false;
        if(currWS_ && currWS_.is_shared){
            liveOnlineInteractionEnabled_ = false;
            socket.emit('interaction:ended', currWS_.id);

            socket.removeListener('interaction:info', onInfo);
            socket.removeListener('interaction:move', onDraw);
            socket.removeListener('interaction:save', onSave);
            socket.removeListener('interaction:comm', onComm);
            $log.log('Live Online Interaction for shared workspace turned OFF');
        }

        currWS_ = {
            id: wsDef.id,
            name: wsDef.name,
            webbles: [],
            undoMemory: [],
            redoMemory: [],
            creator: wsDef.creator,
            is_shared: wsDef.is_shared
        };

        if(wsDef.webbles){
            if(wsDef.webbles.length > 0){
                $scope.setEmitLockEnabled(true);
                wblFamiliesInLineForInsertion_ = wsDef.webbles;
                var wblFamily = wblFamiliesInLineForInsertion_.shift();
                $scope.loadWebbleFromDef(wblFamily);
            }
            else{
                $scope.waiting(false);
            }
        }
        else{
            if(wsDef.id){
                dbService.getWorkspace(wsDef.id).then(
                    function(workspace) {
                        currWS_.name = workspace.name;
                        currWS_.creator = workspace.creator;
                        if(workspace.webbles.length > 0){
                            $scope.setEmitLockEnabled(true);
                            wblFamiliesInLineForInsertion_ = workspace.webbles;
                            var wblFamily = wblFamiliesInLineForInsertion_.shift();
                            $scope.loadWebbleFromDef(wblFamily);
                        }
                        else{
                            $scope.waiting(false);
                        }
                    },
                    function () {
                        $log.log("ERROR WHILE LOADING WORKSPACE WITH ID " + wsDef.id);
                    }
                );
            }
            else{
                $scope.waiting(false);
            }
        }

        if(wsDef.id){
            $location.search('workspace', wsDef.id);
        }
        else{
            $location.search('workspace', null);
        }

        //Shared Workspace Live Interaction
        if(wsDef.is_shared){
            $timeout(function(){
                socket.emit('interaction:started', wsDef.id);

                socket.addListener('interaction:info', onInfo);
                socket.addListener('interaction:move', onDraw);
                socket.addListener('interaction:save', onSave);
                socket.addListener('interaction:comm', onComm);
                liveOnlineInteractionEnabled_ = true;
                $log.log('Live Online Interaction for shared workspace turned ON');
                $scope.onlineTransmit({id: currWS_.id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.getCurrentChanges});
                $timeout(function(){hasBeenUpdated_ = true;}, 5000);
            }, 500);

        }
    };
    //========================================================================================


    //========================================================================================
    // Reset Selections
    // This method resets the work surface by removing all selections and half finished
    // connections.
    //========================================================================================
    $scope.resetSelections = function(){
        if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled()){
            $scope.onlineTransmit({id: currWS_.id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.unselectWbls});
        }

        // Pending clicks gets reset
        $scope.setPendingChild(undefined);
        $scope.setPlatformCurrentStates(bitflags.off($scope.getPlatformCurrentStates(), Enum.bitFlags_PlatformStates.WaitingForParent));

        // remove any webble selection
        $scope.unselectAllWebbles();
    };
    //========================================================================================


    //========================================================================================
    // Clean Active Workspace
    // This method cleans out everything from the current selected workspace and resets the
    // webbles therein.
    //========================================================================================
    $scope.cleanActiveWS = function(){
        var wblsToKill = [];
        $scope.waiting(true);

        $scope.globalByPassFlags.byPassBlockingProtection = true;

        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            if (aw.scope() && !aw.scope().getParent()){
                wblsToKill.push(aw);
            }
        }

        for(var i = 0, wtk; wtk = wblsToKill[i]; i++){
            $scope.requestDeleteWebble(wtk, false);
        }

        if($scope.getActiveWebbles().length > 0){
            watchingForWebbleExtermination = $scope.$watch(function(){return $scope.getActiveWebbles().length;}, function(newVal, oldVal) {
                if(newVal == 0){
                    watchingForWebbleExtermination();
                    $scope.globalByPassFlags.byPassBlockingProtection = false;
                    $scope.insertWS({id: undefined, name: '', creator: '', is_shared: false});
                    recentWS_ = undefined;
                    $scope.saveUserSettings(true);
                    if(locationPathChangeRequest != ''){
                        var thePathToGo = locationPathChangeRequest;
                        locationPathChangeRequest = '';
                        $scope.waiting(false);
                        $location.path(thePathToGo);
                    }
                }
            }, true);
        }
        else{
            if(locationPathChangeRequest != ''){
                var thePathToGo = locationPathChangeRequest;
                locationPathChangeRequest = '';
                $location.path(thePathToGo);
            }
			$scope.globalByPassFlags.byPassBlockingProtection = false;
			$scope.insertWS({id: undefined, name: '', creator: '', is_shared: false});
			recentWS_ = undefined;
			$scope.saveUserSettings(true);
            $scope.waiting(false);
        }

        listOfUntrustedWbls_ = [];
    };
    //========================================================================================


    //========================================================================================
    // Load Webble From URL
    // This method tries to load a Webble JSON file from a URI provided as a parameter.
    //========================================================================================
    $scope.loadWblFromURL = function(whatUrl, whatCallbackMethod) {
        dbService.getWebbleDefByURL(whatUrl).then(function(data){
            if(data['webble'] && data['webble']['defid']){
                $scope.loadWebbleFromDef(data, null);
            }
            else{
                $log.error('The Webble Definition file was somehow not formatted correctly so therefore Webble loading was canceled.');
            }
        },function(eMsg){
            $scope.serviceError(eMsg);
        });
    };
    //========================================================================================


    //========================================================================================
    // Download Webble
    // This method calls the server to load a webble. If the webble has been loaded previously
    // it is stored in memory and the system will call it from there instead of the server.
    //========================================================================================
    $scope.downloadWebbleDef = function(whatWblDefId, whatCallbackMethod) {
        if (whatWblDefId != ""){
            $scope.waiting(true);
            $timeout(updateWorkSurfce, 100);
            var existingWebbleDef = null;

            // Check if the webble def has already been loaded before...
            for (var i = 0; i < webbleDefs_.length; i++){
                if (webbleDefs_[i]['wblDefId'] == whatWblDefId){
                    existingWebbleDef = webbleDefs_[i]['json'];
                    break;
                }
            }

            // ...and if so get it from memory.
            if (existingWebbleDef != null){
                $scope.loadWebbleFromDef(existingWebbleDef, whatCallbackMethod);
            }
            // ...and if not get it from the server.
            else{
                pendingCallbackMethod_ = whatCallbackMethod;
                dbService.getWebbleDef(whatWblDefId, true).then(function(data){serviceRes_getWebbleDef_Completed(whatWblDefId, data);},function(eMsg){$scope.serviceError(eMsg);});
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Load From Definition File
    // This method loads a webble from a JSON definition provided as a parameter.
    //========================================================================================
    $scope.loadWebbleFromDef = function(whatWblDef, whatCallbackMethod){
        if(whatWblDef){
            if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled()){
                $scope.onlineTransmit({id: currWS_.id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.loadWbl, wblDef: whatWblDef});
            }

            if(!$scope.waiting()){
                $scope.waiting(true);
                $timeout(updateWorkSurfce, 100);
            }
            pendingCallbackMethod_ = whatCallbackMethod;
            recentWebble_ = whatWblDef;
            $scope.saveUserSettings(true);

            // Find the template files and the template name of each webble within the def file.
            var webbleAtomsList = jsonQuery.allValByKey(whatWblDef, 'webble');
            var containingNewWblTemplates = [];

            // Make a list of templates never before loaded
            for(var i = 0; i < webbleAtomsList.length; i++){
                var existAlready = false;

                for (var t = 0; t < webbleTemplates_.length; t++){
                    if (webbleAtomsList[i]['templateid'] == webbleTemplates_[t]['templateid'] && webbleAtomsList[i]['templaterevision'] == webbleTemplates_[t]['templaterevision']){
                        existAlready = true;
                        break;
                    }
                }
                for(var n = 0; n < containingNewWblTemplates.length; n++) {
                    if(containingNewWblTemplates[n]['templateid'] == webbleAtomsList[i]['templateid'] && containingNewWblTemplates[n]['templaterevision'] == webbleAtomsList[i]['templaterevision']){
                        existAlready = true;
                        break;
                    }
                }
                if(!existAlready){
                    containingNewWblTemplates.push({templateid: webbleAtomsList[i]['templateid'], templaterevision: webbleAtomsList[i]['templaterevision']});
                }
            }

            if (containingNewWblTemplates.length == 0){
                insertWebble(whatWblDef);
            }
            else{
                noOfNewTemplates_ = containingNewWblTemplates.length;
                for(var i = 0; i < containingNewWblTemplates.length; i++){
                    downloadWblTemplate(containingNewWblTemplates[i]['templateid'], containingNewWblTemplates[i]['templaterevision'], whatWblDef)
                }
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Webble Initiation Done
    // This method informs the system that a specific Webble has finished initiating and may
    // now be manipulated with by the platform, for example being assigned a parent or a
    // child.
    //========================================================================================
    $scope.wblInitiationDone = function(whatWebble){
        $scope.eventInfoStack.push({event: "loadingWebble", info: whatWebble.scope().getInstanceId()});
        $timeout(function(){ var eisItem = $scope.eventInfoStack.shift(); $scope.eventInfo[eisItem.event] = eisItem.info; });
        var thisIsFirst = false;
        // if new webbles are still being added
        if (noOfNewWebbles_ != 0 && whatWebble != undefined){
            // If there is no relationConnHistory items then this is the first webble in the chain which we save away for callback info
            if(relationConnHistory_.length == 0){
                thisIsFirst = true;
                var oldId = underDevelopmentData_[underDevelopmentData_.length-1].initWblDef['instanceid'];
                $scope.addUndo({op: Enum.undoOps.loadWbl, target: whatWebble.scope().getInstanceId(), execData: [{oldid: oldId}]}, !doNotSaveUndoEnabled_);
                if(pendingCallbackMethod_ != null){
                    pendingCallbackArgument_ = {wbl: whatWebble, oldInstanceId: oldId, wbldef: underDevelopmentData_[underDevelopmentData_.length-1].initWblDef};
                }
            }

            // Create a an item of ancient history info about the webble who made the call
            var relationHistory = {};
            relationHistory['currWebble'] = whatWebble;

            for(var i = 0, udd; udd = underDevelopmentData_[i]; i++){
                if (udd.newInstanceId == relationHistory.currWebble.scope().getInstanceId()){
                    relationHistory['oldId'] = udd.initWblDef['instanceid'];

                    // If this is the first one and its a duplicate being made than set the eventInfo correctly to inform of this duplication going on
                    if(thisIsFirst && relationConnHistory_.length == 0 && relationHistory['oldId'] != udd.newInstanceId && $scope.getWebbleByInstanceId(relationHistory['oldId']) != undefined){
                        if($scope.getWebbleByInstanceId(relationHistory['oldId']).scope().getIsCreatingModelSharee()){
                            $scope.eventInfoStack.push({event: "shareModelWebble", info: {originalId: relationHistory['oldId'], copyId: udd.newInstanceId}});
                            $timeout(function(){ var eisItem = $scope.eventInfoStack.shift(); $scope.eventInfo[eisItem.event] = eisItem.info; });
                            $scope.getWebbleByInstanceId(relationHistory['oldId']).scope().wblEventInfoStack.push({event: "shareModelCreated", info: udd.newInstanceId});
                            $timeout(function(){ var eisItem = $scope.getWebbleByInstanceId(relationHistory['oldId']).scope().wblEventInfoStack.shift(); $scope.getWebbleByInstanceId(relationHistory['oldId']).scope().wblEventInfo[eisItem.event] = eisItem.info; });
                        }
                        else{
                            $scope.eventInfoStack.push({event: "duplicatingWebble", info: {originalId: relationHistory['oldId'], copyId: udd.newInstanceId}});
                            $timeout(function(){ var eisItem = $scope.eventInfoStack.shift(); $scope.eventInfo[eisItem.event] = eisItem.info; });
                            $scope.getWebbleByInstanceId(relationHistory['oldId']).scope().wblEventInfoStack.push({event: "duplicated", info: udd.newInstanceId});
                            $timeout(function(){ var eisItem = $scope.getWebbleByInstanceId(relationHistory['oldId']).scope().wblEventInfoStack.shift(); $scope.getWebbleByInstanceId(relationHistory['oldId']).scope().wblEventInfo[eisItem.event] = eisItem.info; });
                        }
                    }

                    // keep track of children connection
                    var oldChildren = [];
                    var childrenFromDef = udd.initWblDef.children;
                    for(var n = 0, c; c = childrenFromDef[n]; n++){
                        oldChildren.push(c['webble']['instanceid']);
                    }
                    relationHistory['oldChildren'] = oldChildren;

                    // keep track of modelsharees connection
                    var oldModelSharees = [];
                    var modelShareesFromDef = udd.initWblDef.modelsharees.wbls;
                    var slotShareesFromDef = udd.initWblDef.modelsharees.slots;
                    for(var n = 0, ms; ms = modelShareesFromDef[n]; n++){
                        oldModelSharees.push(ms);
                    }
                    relationHistory['oldModelSharees'] = oldModelSharees;
                    relationHistory['oldModelShareesSlots'] = slotShareesFromDef;

                    relationConnHistory_.push(relationHistory);
                    underDevelopmentData_.splice(i, 1);
                    break;
                }
            }

            // If all webbles set to be inserted has done so start the setting of relationships
            if (relationConnHistory_.length == noOfNewWebbles_){

                for(var i = 0, rch; rch = relationConnHistory_[i]; i++){

                    // Connect all children and parents
                    if (rch.oldChildren.length > 0){
                        for(var n = 0, c; c = rch.oldChildren[n]; n++){
                            for(var t = 0, rch2; rch2 = relationConnHistory_[t]; t++){
                                if (c == rch2.oldId){
                                    connectChildParent(rch2.currWebble, rch.currWebble);
                                    break;
                                }
                            }
                        }
                    }

                    // Connect all modelsharees
                    if (rch.oldModelSharees.length > 0){
                        for(var n = 0, ms; ms = rch.oldModelSharees[n]; n++){
                            for(var t = 0, rch2; rch2 = relationConnHistory_[t]; t++){
                                if (ms == rch2.oldId){
                                    var alreadyExist = false;

                                    for(var p = 0, nms; nms = rch.currWebble.scope().getModelSharees()[p]; p++){
                                        if(rch2.currWebble.scope().getInstanceId() == nms.scope().getInstanceId()){
                                            alreadyExist = true;
                                            break;
                                        }
                                    }

                                    if(!alreadyExist){
                                        rch.currWebble.scope().connectSharedModel({wbl: rch2.currWebble, oldInstanceId: rch2.oldId});
                                    }

                                    for(var slot in rch.currWebble.scope().getSlots()){
                                        rch.currWebble.scope().getSlots()[slot]['isShared'] = false;
                                    }
                                    for(var p = 0, nmsSlot; nmsSlot = rch.oldModelShareesSlots[p]; p++){
                                        rch.currWebble.scope().getSlots()[nmsSlot]['isShared'] = true;
                                    }

                                    break;
                                }
                            }
                        }
                    }
                }
                noOfNewWebbles_ = 0;
            }
        }

        if (noOfNewWebbles_ == 0){
            longtermrelationConnHistory_ = longtermrelationConnHistory_.concat(relationConnHistory_);
            relationConnHistory_ = [];

            var pcm = pendingCallbackMethod_;
            pendingCallbackMethod_ = null;
            var pca = pendingCallbackArgument_;
            pendingCallbackArgument_ = null;
            if (pcm != null){
                pcm(pca);
            }

            // close "wait please" info
            $scope.waiting(false);

            $scope.eventInfoStack.push({event: "shareModelWebble", info: null});
            $timeout(function(){ var eisItem = $scope.eventInfoStack.shift(); $scope.eventInfo[eisItem.event] = eisItem.info; });
            $scope.eventInfoStack.push({event: "duplicatingWebble", info: null});
            $timeout(function(){ var eisItem = $scope.eventInfoStack.shift(); $scope.eventInfo[eisItem.event] = eisItem.info; });

            $scope.resetSelections();

            if(wblFamiliesInLineForInsertion_.length > 0){
                $scope.loadWebbleFromDef(wblFamiliesInLineForInsertion_.shift());
            }
            else{
                $scope.waiting(true);
                for(var i = 0, rch; rch = longtermrelationConnHistory_[i]; i++){
                    // Connect all modelsharees
                    if (rch.oldModelSharees.length > 0){
                        for(var n = 0, ms; ms = rch.oldModelSharees[n]; n++){
                            for(var t = 0, rch2; rch2 = longtermrelationConnHistory_[t]; t++){
                                if (ms == rch2.oldId){
                                    var alreadyExist = false;

                                    for(var p = 0, nms; nms = rch.currWebble.scope().getModelSharees()[p]; p++){
                                        if(rch2.currWebble.scope().getInstanceId() == nms.scope().getInstanceId()){
                                            alreadyExist = true;
                                            break;
                                        }
                                    }

                                    if(!alreadyExist){
                                        rch.currWebble.scope().connectSharedModel({wbl: rch2.currWebble, oldInstanceId: rch2.oldId});
                                    }

                                    for(var slot in rch.currWebble.scope().getSlots()){
                                        rch.currWebble.scope().getSlots()[slot]['isShared'] = false;
                                    }
                                    for(var p = 0, nmsSlot; nmsSlot = rch.oldModelShareesSlots[p]; p++){
                                        rch.currWebble.scope().getSlots()[nmsSlot]['isShared'] = true;
                                    }

                                    break;
                                }
                            }
                        }
                    }
                }
                longtermrelationConnHistory_ = [];
                $scope.setEmitLockEnabled(false);

                // Check for trust in webbles delivered via a Workspace
                if(listOfUntrustedWbls_.length == 0 && trustedParameterWasUndefined){
                    var listOfWebblesToTrustCheck = []
                    for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                        var alreadyInList = false;
                        for(var n = 0; n < listOfWebblesToTrustCheck.length; n++){
                            if(listOfWebblesToTrustCheck[n] == aw.scope().theWblMetadata['templateid']){
                                alreadyInList = true;
                                break;
                            }
                        }
                        if(!alreadyInList){
                            listOfWebblesToTrustCheck.push(aw.scope().theWblMetadata['templateid']);
                        }
                    }

                    dbService.verifyWebbles(listOfWebblesToTrustCheck).then(function(listOfConfirmedTrust){
                        var listOfUntrustedWblTemplates = [];
                        for(var i = 0; i < listOfConfirmedTrust.length; i++){
                            if(!listOfConfirmedTrust[i]){
                                listOfUntrustedWblTemplates.push(listOfWebblesToTrustCheck[i]);
                            }
                        }

                        var newListOfUntrustedWbls = [];
                        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                            for(var k = 0; k < listOfUntrustedWblTemplates.length; k++){
                                if(aw.scope().theWblMetadata['templateid'] == listOfUntrustedWblTemplates[k]){
                                    newListOfUntrustedWbls.push(listOfUntrustedWblTemplates[k]);
                                }
                            }
                        }
                        listOfUntrustedWbls_ = newListOfUntrustedWbls;
                    },function(eMsg){
                        $scope.serviceError(eMsg);
                    });
                }
                trustedParameterWasUndefined = false;
                $scope.waiting(false);

                var pathQuery = $location.search();
                if(pathQuery.webble && pathQuery.workspace){
                    var requestedWbl = pathQuery.webble;
                    $location.search('webble', null);
                    $scope.downloadWebbleDef(requestedWbl)
                }
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Waiting
    // This method turns on or off the appearance indicators in waiting mode
    //========================================================================================
    $scope.waiting = function(isWaitingEnabled) {
        if(isWaitingEnabled){
            $scope.progressManager.isWorking = true;
            $scope.mouseCursor = 'wait';
        }
        else{
            if(isWaitingEnabled == undefined){
                return $scope.progressManager.isWorking;
            }
            else{
                $scope.progressManager.isWorking = false;
                $scope.mouseCursor = 'default';
            }
        }

        return undefined;
    };
    //========================================================================================


    //========================================================================================
    // Show Quick Info Message
    // Shows the Quick Info Message box with the specicified text for either 2 seconds or the
    // specified time of either default size or the specified size at either the center of
    // the screen or the specified position.
    //========================================================================================
    $scope.showQIM = function(qimText, qimTime, qimSize, qimPos, qimColor){
        var showTime = 2000;
        var calcQIMSize = {w: 250, h: 100};
        $scope.qimTxt = qimText;
        if(qimSize && qimSize.w && qimSize.h){
            calcQIMSize = qimSize;
        }
        $scope.qimSize = {w: calcQIMSize.w + 'px', h: calcQIMSize.h + 'px'};

        if(qimPos && qimPos.x != undefined && qimPos.y != undefined){
            $scope.qimPos = {x: qimPos.x + 'px', y: qimPos.y + 'px'};
        }
        else{
            $scope.qimPos = {x: (($(document).width() / 2) - (calcQIMSize.w / 2)) + 'px', y: '30%'}
        }

        if(qimTime){
            showTime = qimTime;
        }

        if(qimColor){
            $('.quickInfoBox').css('background-color', qimColor);
            $('.quickInfoBox').css('background', '-webkit-linear-gradient(' + qimColor + ', ' + qimColor + ')');
            $('.quickInfoBox').css('background', '-moz-linear-gradient(' + qimColor + ', ' + qimColor + ')');
            $('.quickInfoBox').css('background', '-ms-linear-gradient(' + qimColor + ', ' + qimColor + ')');
            $('.quickInfoBox').css('background', '-o-linear-gradient(' + qimColor + ', ' + qimColor + ')');
        }

        $scope.qimVisibility = true;
        $('.quickInfoBox').fadeIn(200);
        $timeout(function(){$('.quickInfoBox').fadeOut(500, function(){$scope.qimVisibility = false;})}, showTime);
    };
    //========================================================================================


    //========================================================================================
    // Configure Bundle
    // This method opens the form that lets the user configure the design of the bundle being
    // created.
    //========================================================================================
    $scope.configureBundle = function(whatWbls){
        var wblsSlotsList = [];
        var protectionBlockEnabled = false;

        for(var i = 0, wbl; wbl = whatWbls[i]; i++){
            if((parseInt(wbl.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.BUNDLE, 10)) !== 0){
                protectionBlockEnabled = true;
                break;
            }

            var wblPack = {wbl: wbl, fullName: wbl.scope().getWebbleFullName()};
            wblPack['slots'] = [];

            if(wbl.scope().theWblMetadata['templateid'] != 'bundleTemplate'){
                angular.forEach(wbl.scope().getSlots(), function (value, key) {
                    if(!(key.search('root') != -1 && value.getCategory() == 'css')){
                        var tmp = {};
                        tmp['id'] = key;
                        tmp['name'] = value.getDisplayName();
                        tmp['value'] = value.getValue();
                        tmp['isSelected'] = false;
                        this.push(tmp);
                    }
                }, wblPack['slots']);
            }

            wblsSlotsList.push(wblPack);
        }

        if(protectionBlockEnabled){
            $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Bundle Failed"), content: gettext("One Webble is protected from Bundling and therefore this operation is canceled.")}, null);
            return;
        }

        if(wblsSlotsList.length > 0){
            $scope.openForm(Enum.aopForms.bundle, wblsSlotsList, $scope.createBundle);
        }
        else{
            $scope.showQIM(gettext("No Webbles to bundle are selected."));
        }
    };
    //========================================================================================


    //========================================================================================
    // Create Bundle
    // This method handles the returning info/data from the Bundling form and start the
    // process of creating a Bundle.
    //========================================================================================
    $scope.createBundle = function(bundleContent){
        if(bundleContent != null){
            isBundling_ = true;
            var bundleDef = wwConsts.bundleContainerWblDef;
            var bundleContentStr = $scope.stringatizeBundleContent(bundleContent);
            if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled()){
                $scope.onlineTransmit({id: currWS_.id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.bundle, bundleData: bundleContentStr});
                $scope.setEmitLockEnabled(true);
            }
            bundleDef['webble']['private'] = {bundlecontent: bundleContentStr, creatingbundle: true};
            $scope.loadWebbleFromDef(bundleDef, $scope.connectBundleContent);
        }
    };
    //========================================================================================


    //========================================================================================
    // Connect Bundle Content
    // This method connects the selected webbles to the bundle webble and flag them as
    // bundled before deselecting them
    //========================================================================================
    $scope.connectBundleContent = function(newBundleData){
        var bndl = newBundleData.wbl;
        var bundleContentStr = newBundleData.wbldef.private.bundlecontent;

        var bundleContentWblsOnly = [];
        for(var i = 0, bcs; bcs = bundleContentStr[i]; i++){
            bundleContentWblsOnly.push($scope.getWebbleByInstanceId(bcs.wbl));
        }

        for(var i = 0, bw; bw = bundleContentWblsOnly[i]; i++){
            if(bw.scope().getParent() == undefined){
                bw.scope().paste(bndl);
            }
            bw.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsNotSelected);
        }
        isBundling_ = false;
    };
    //========================================================================================


    //========================================================================================
    // Connect Bundle Content from Undo
    // This method calls the original connect bundle content method but first store a redo
    // object for an unbundle.
    //========================================================================================
    $scope.connectBundleContentFromUndo = function(newBundleData){
        var bndl = newBundleData.wbl;

        if(!isRedoWanted_){
            $scope.getCurrWSRedoMemory().unshift({op: Enum.undoOps.bundle, target: bndl.scope().getInstanceId(), execData: []});
        }
        else{
            $scope.getCurrWSUndoMemory().unshift({op: Enum.undoOps.bundle, target: bndl.scope().getInstanceId(), execData: []});
        }
        $scope.connectBundleContent(newBundleData);
    };
    //========================================================================================


    //========================================================================================
    // Stringatize Bundle Content
    // This method takes a bundle content object and make its references into id strings
    // instead.
    //========================================================================================
    $scope.stringatizeBundleContent = function(bundleContent){
        var bundleContentStr = [];
        for(var i = 0, bc; bc = bundleContent[i]; i++){
            var slots = [];
            for(var n = 0, s; s = bc.slots[n]; n++){
                slots.push(s.getName());
            }
            bundleContentStr.push({wbl: bc.wbl.scope().getInstanceId(), slots: slots});
        }

        return bundleContentStr;
    };
    //========================================================================================


    //========================================================================================
    // Get Bundle Master
    // This method returns the bundle master of the specified Webble if it has one otherwise
    // undefined.
    //========================================================================================
    $scope.getBundleMaster = function(whatWebble){
        var bundleMaster = undefined;
        if(whatWebble.scope().getIsBundled()){
            bundleMaster = $scope.getBundleMaster(whatWebble.scope().getParent());
        }
        else if(whatWebble.scope().theWblMetadata['templateid'] == 'bundleTemplate'){
            return whatWebble;
        }

        return bundleMaster;
    };
    //========================================================================================


    //========================================================================================
    // Get List Of Unique Untrusted Wbls
    // This method creates a list of unique Untrusted Webbles.
    //========================================================================================
    $scope.getListAsStringOfUniqueUntrustedWbls = function(){
        var uniqueUntrustList = [], uniqueUntrustListAsStr = '';
        for(var i = 0; i < listOfUntrustedWbls_.length; i++){
            var alreadyExist = false;
            for(var n = 0; n < uniqueUntrustList.length; n++){
                if(listOfUntrustedWbls_[i] == uniqueUntrustList[n]){
                  alreadyExist = true;
                  break;
                }
            }
            if(!alreadyExist){
                uniqueUntrustList.push((listOfUntrustedWbls_[i]));
            }
        }

        for(var n = 0; n < uniqueUntrustList.length; n++){
            uniqueUntrustListAsStr += '\n"' + uniqueUntrustList[n] + '"';
        }

        return uniqueUntrustListAsStr;
    };
    //========================================================================================


    //========================================================================================
    // Set Execution Mode
    // This method sets the execution mode index (integer indicating the operation mode level
    // of the system and its webbles).
    //========================================================================================
    $scope.setExecutionMode = function(whatExecutionModeIndex) {
        if(whatExecutionModeIndex == null){
            return;
        }

        currentExecutionMode_ = whatExecutionModeIndex;

        if(currWS_){
            if (currentExecutionMode_ == Enum.availableOnePicks_ExecutionModes.Developer) {
                for(var n = 0, wbl; wbl = currWS_.webbles[n]; n++){
                    if(wbl.wblElement.scope()){
                        if((parseInt(wbl.wblElement.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.NON_DEV_HIDDEN, 10)) !== 0){
                            wbl.wblElement.scope().setWblVisibilty(true);
                        }
                    }
                }
            }
            else{
                for(var n = 0, wbl; wbl = currWS_.webbles[n]; n++){
                    if(wbl.wblElement.scope()){
                        if((parseInt(wbl.wblElement.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.NON_DEV_HIDDEN, 10)) !== 0){
                            wbl.wblElement.scope().setWblVisibilty(false);
                        }
                    }
                }
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Get Current Active Workspace Undo Memory
    // This method returns the undo memory of the current active workspace.
    //========================================================================================
    $scope.getCurrWSUndoMemory = function(){
        return currWS_.undoMemory;
    };
    //========================================================================================


    //========================================================================================
    // Get Current Active Workspace Redo Memory
    // This method returns the redo memory of the current active workspace.
    //========================================================================================
    $scope.getCurrWSRedoMemory = function(){
        return currWS_.redoMemory;
    };
    //========================================================================================


    //========================================================================================
    // Get Current Active Webbles
    // This method returns a list of the current active webbles.
    //========================================================================================
    $scope.getActiveWebbles = function(){
        var awList = [];
        var currWS = $scope.getCurrWS();
        if(currWS){
            for(var i = 0, wi; wi = currWS.webbles[i]; i++){
                awList.push(wi.wblElement);
            }
        }
        return awList;
    };
    //========================================================================================


    //========================================================================================
    // Get Selected Webbles
    // This method returns a list of all webbles main selected.
    //========================================================================================
    $scope.getSelectedWebbles = function(){
        var swList = [];
        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            if (aw.scope().getSelectionState() ==  Enum.availableOnePicks_SelectTypes.AsMainClicked){
                swList.push(aw);
            }
        }
        return swList;
    };
    //========================================================================================


    //========================================================================================
    // Get Webble Absolute Position In Pixels
    // This method calculates the specified webbles absolute position within the work surface.
    //========================================================================================
    $scope.getWblAbsPosInPixels = function(whatWebble){
        var theFullPos = {x: 0, y: 0};
        if(whatWebble){
            var ancestors = $scope.getAllAncestors(whatWebble);
            theFullPos = {x: Math.round(getUnits(whatWebble.parent()[0], 'left').pixel), y: Math.round(getUnits(whatWebble.parent()[0], 'top').pixel)};
            for(var i = 0, a; a = ancestors[i]; i++){
                theFullPos.x += Math.round(getUnits(a.parent()[0], 'left').pixel);
                theFullPos.y += Math.round(getUnits(a.parent()[0], 'top').pixel);
            }
        }

        return theFullPos;
    };
    //========================================================================================


    //========================================================================================
    // Get Webble Center Position
    // This method calculates the specified webbles center position within the work surface.
    //========================================================================================
    $scope.getWebbleCenterPos = function(whatWebble){
        var wblPos = $scope.getWblAbsPosInPixels(whatWebble);
        var wblSize = {w: Math.round(getUnits(whatWebble.parent()[0], 'width').pixel), h: Math.round(getUnits(whatWebble.parent()[0], 'height').pixel)};

        return {x: wblPos.x + (wblSize.w / 2), y: wblPos.y + (wblSize.h / 2)};
    };
    //========================================================================================


    //========================================================================================
    // Get All Ancestors
    // This method finds all ancestors (parents and parents parents etc) of the defined
    //= webble and return the list.
    //========================================================================================
    $scope.getAllAncestors = function(whatWebble){
        var ancestors = [];

        var parent = whatWebble.scope().getParent();
        if (parent && parent != null){
            ancestors.push(parent);
            ancestors = ancestors.concat($scope.getAllAncestors(parent));
        }

        return ancestors;
    };
    //========================================================================================


    //========================================================================================
    // Get All Descendants
    // This method returns all webbles of those that are children or grandchildren of
    // the webble specified in the parameter which is also included in the top of the list.
    //========================================================================================
    $scope.getAllDescendants = function(whatWebble){
        var familyMembers = [];
        if(whatWebble){
            familyMembers.push(whatWebble);

            for (var i = 0, c; c = whatWebble.scope().getChildren()[i]; i++){
                familyMembers = familyMembers.concat($scope.getAllDescendants(c));
            }
        }

        return familyMembers;
    };
    //========================================================================================


    //========================================================================================
    // Get Winning Slot Value Among All Webbles
    // Looks for either the highest or the lowest value from all existing Webbles of a
    // specified slot and return that value.
    //========================================================================================
    $scope.getWinningSlotValueAmongAllWebbles = function(whatSlot, lowestWins){
        var winner = {value: 0, owner: undefined};

        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            var thisWblValue = aw.scope().gimme(whatSlot);
            if(lowestWins){
                if(thisWblValue < winner.value){
                    winner.value = thisWblValue;
                    winner.owner = aw.scope().getInstanceId();
                }
            }
            else{
                if(thisWblValue > winner.value){
                    winner.value = thisWblValue;
                    winner.owner = aw.scope().getInstanceId();
                }
            }
        }

        return winner;
    };
    //========================================================================================


    //========================================================================================
    // Request Webble Selection
    // Deals with the interaction process of making webbles selected
    //========================================================================================
    $scope.requestWebbleSelection = function(target){
        var familyMembers = $scope.getAllDescendants(target);
        for(var i = 0, fm; fm = familyMembers[i]; i++){
            if (fm.scope().getInstanceId() == target.scope().getInstanceId()){
                fm.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsMainClicked);
            }
            else{
                fm.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsChild);
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Publish Webble
    // This method saves and publish Webble definition to a specified place somewhere.
    //========================================================================================
    $scope.requestPublishWebble = function(whatWbl){
        if($scope.user){
            if($scope.user.username){
                var allFamily = $scope.getAllDescendants(whatWbl);
                allFamily = allFamily.concat($scope.getAllAncestors(whatWbl));
                for(var i = 0, w; w = allFamily[i]; i++){
                    if((parseInt(w.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.PUBLISH, 10)) !== 0){
                        $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Publish Webble Attempt Failed"), content: gettext("One or more of the Webbles included in the publish attempt is protected from publishing and therefore this operation is canceled.")}, null);
                        return false;
                    }
                }

                $scope.resetSelections();
                $timeout(function(){$scope.openForm(Enum.aopForms.publishWebble, getPublishWebbleContent(whatWbl), publishWebbleReturned);}, 100);
            }
            else{
                $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Need a username..."), content: gettext("In order to publish a Webble, you need a proper username which you have not yet. Please visit your user-profile page and rectify that.")}, null);
            }
        }
        else{
            $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Publish Not Available"), content: gettext("You must be logged in to Webble World in order to save Workspaces and publish Webbles. Please sign in and try again.")}, null);
        }
    };
    //========================================================================================


    //========================================================================================
    // Request Delete Webble
    // This method deletes a specified webble from the system.
    //========================================================================================
    $scope.requestDeleteWebble = function(target, isFromWithin){
        if($scope.getLOIEnabled() && !$scope.getEmitLockEnabled() && $scope.user){
            $scope.onlineTransmit({id: currWS_.id, user: ($scope.user.username ? $scope.user.username : $scope.user.email), op: Enum.transmitOps.deleteWbl, target: target.scope().getInstanceId()});
        }

        if(!isFromWithin){
            $scope.addUndo({op: Enum.undoOps.deleteWbl, target: undefined, execData: [{wbldef: target.scope().createWblDef(true)}]}, !doNotSaveUndoEnabled_);
        }
        var allFamily = $scope.getAllDescendants(target);
        allFamily = allFamily.concat($scope.getAllAncestors(target));

        if(!$scope.globalByPassFlags.byPassBlockingProtection){
          for(var i = 0, w; w = allFamily[i]; i++){
            if((parseInt(w.scope().getProtection(), 10) & parseInt(Enum.bitFlags_WebbleProtection.DELETE, 10)) !== 0){
              $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Deletion Failed"), content: gettext("One or more of the Webbles included in the deletion attempt is protected from deletion and therefore this operation is canceled.")}, null);
              return false;
            }
          }
        }

        // If the webble to be deleted is a bundle, kill all bundle slot watches before killing children connected to it
        if(target.scope().theWblMetadata['templateid'] == 'bundleTemplate'){
            target.scope().killBundleSlotWatches();
        }

        // If the webble to be deleted has a parent, disconnect that first
		$scope.globalByPassFlags.byPassBlockingProtection = true;
        if(target.scope().peel() == null){ return false; }
		$scope.globalByPassFlags.byPassBlockingProtection = false;

        // If the webble to be deleted has children, find them and delete them first
        var foundOne = true;
        while (foundOne){
            var children = target.scope().getChildren();
            foundOne = false;
            if(children.length > 0){
                foundOne = $scope.requestDeleteWebble(children[0], true);
				if(!foundOne){
					return false;
				}
            }
        }

        deleteWbl(target);

        return true;
    };
    //========================================================================================


    //========================================================================================
    // Request Assign Parent
    // Deals with the interaction process of assigning child parent
    //========================================================================================
    $scope.requestAssignParent = function(target){
        if(!$scope.touchRescuePlatformFlags.noParentSelectPossibleYet){
            $scope.touchRescuePlatformFlags.noParentSelectPossibleYet = true;

            // AssignParent - Prepare to wait for the user to pick a parent
            if (pendingChild_ == undefined){
                pendingChild_ = target;
                platformCurrentStates_ = bitflags.on(platformCurrentStates_, Enum.bitFlags_PlatformStates.WaitingForParent);

                //Select mark the pending child so that the user see what is going on
                target.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsWaitingForParent);
            }

            // AcceptChild - Assign a parent and a child to the webbles candidate for the job
            else{
                for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                    aw.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsNotSelected);
                }
                if (target.scope().getInstanceId() != pendingChild_.scope().getInstanceId()){
                    pendingChild_.scope().wblStateFlags.pasteByUser = true;
                    connectChildParent(pendingChild_, target);
                }
                pendingChild_ = undefined;
                platformCurrentStates_ = bitflags.off(platformCurrentStates_, Enum.bitFlags_PlatformStates.WaitingForParent);
            }
            $timeout(function(){$scope.touchRescuePlatformFlags.noParentSelectPossibleYet = false;}, 500);
        }
    };
    //========================================================================================


    //========================================================================================
    // Open Form
    // This method Creates and opens a modal form window for a specific use that can be used
    // to edit or consume any data.
    //========================================================================================
    $scope.openForm = function(whatForm, content, callbackFunc){
        var modalOptions = {};

        if(content == undefined || content == null){
            content = [];
        }

        if(whatForm == Enum.aopForms.wblProps){
            modalOptions.templateUrl = 'views/modalForms/propertySheet.html';
            modalOptions.controller = 'propertySheetCtrl';
            modalOptions.resolve = {
                templateId: function(){ return content[0]; },
                props: function(){ return content[1]; }
            };
        }
        else if(whatForm == Enum.aopForms.wblAbout){
            modalOptions.templateUrl = 'views/modalForms/wblAbout.html';
            modalOptions.controller = 'AboutWebbleSheetCtrl';
            modalOptions.resolve = {
                wblData: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.openWorkspace){
            modalOptions.templateUrl = 'views/modalForms/openWSSheet.html';
            modalOptions.controller = 'openWSSheetCtrl';
            modalOptions.resolve = {
                availWS: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.saveWorkspaceAs){
            modalOptions.templateUrl = 'views/modalForms/saveWSAsSheet.html';
            modalOptions.controller = 'saveWSAsSheetCtrl';
            modalOptions.resolve = {
                wsData: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.shareWorkspaces){
            modalOptions.templateUrl = 'views/modalForms/shareWSSheet.html';
            modalOptions.controller = 'shareWSSheetCtrl';
            modalOptions.resolve = {
                wsData: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.faq){
            modalOptions.templateUrl = 'views/modalForms/faqSheet.html';
            modalOptions.controller = 'faqSheetCtrl';
            modalOptions.resolve = {
                currUser: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.slotConn){
            modalOptions.templateUrl = 'views/modalForms/slotConnSheet.html';
            modalOptions.controller = 'slotConnSheetCtrl';
            modalOptions.resolve = {
                childSlots: function(){ return content[0]; },
                parentSlots: function(){ return content[1]; },
                currSelected: function(){ return content[2]; },
                slotConnDir: function(){ return content[3]; }
            };
        }
        else if(whatForm == Enum.aopForms.protect){
            modalOptions.templateUrl = 'views/modalForms/wblProtectionSheet.html';
            modalOptions.controller = 'protectSheetCtrl';
            modalOptions.resolve = {
                protectSettings: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.addCustSlot){
            modalOptions.templateUrl = 'views/modalForms/addCustSlotSheet.html';
            modalOptions.controller = 'AddCustomSlotSheetCtrl';
            modalOptions.resolve = {
                wblView: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.infoMsg){
            modalOptions.templateUrl = 'views/modalForms/infoMsg.html';
            modalOptions.controller = 'infoMsgCtrl';
            modalOptions.resolve = {
                infoTitle: function(){ return content.title; },
                infoContent: function(){ return content.content; }
            };
        }
        else if(whatForm == Enum.aopForms.publishWebble){
            modalOptions.templateUrl = 'views/modalForms/publishWebbleSheet.html';
            modalOptions.controller = 'publishWebbleSheetCtrl';
            modalOptions.resolve = {
                formContent: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.bundle){
            modalOptions.templateUrl = 'views/modalForms/bundleSheet.html';
            modalOptions.controller = 'bundleSheetCtrl';
            modalOptions.resolve = {
                wblsSlots: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.loadWebble){
            modalOptions.templateUrl = 'views/modalForms/loadWebbleSheet.html';
            modalOptions.controller = 'loadWebbleSheetCtrl';
        }
        else if(whatForm == Enum.aopForms.platformProps){
            modalOptions.templateUrl = 'views/modalForms/platformPropsSheet.html';
            modalOptions.controller = 'platformPropsSheetCtrl';
            modalOptions.resolve = {
                platformProps: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.langChange){
            modalOptions.templateUrl = 'views/modalForms/platformLangSheet.html';
            modalOptions.controller = 'platformLangPickSheetCtrl';
        }
        else if(whatForm == Enum.aopForms.rateWbl){
            modalOptions.templateUrl = 'views/modalForms/rateWblSheet.html';
            modalOptions.controller = 'rateWblSheetCtrl';
            modalOptions.resolve = {
                wblDefData: function(){ return content; }
            };
        }
        else if(whatForm == Enum.aopForms.wblSearch){
            modalOptions.templateUrl = 'views/modalForms/searchWblSheet.html';
            modalOptions.controller = 'searchWblSheetCtrl';
            modalOptions.resolve = {
                platformScope: function(){ return content; }
            };
            modalOptions.size = 'lg';
        }
        else if(whatForm == Enum.aopForms.about){
            modalOptions.templateUrl = 'views/modalForms/about.html';
            modalOptions.controller = 'AboutSheetCtrl';
        }
        else{
            if(content.length && content.length > 1){
                modalOptions.templateUrl = content[0].templateUrl;
                modalOptions.controller = content[0].controller;
                modalOptions.resolve = {
                    props: function(){ return content[1]; }
                };
                modalOptions.size = content[0].size;
            }
            else{
                return;
            }
        }

        isFormOpen_ = true;
        var modalInstance = $modal.open(modalOptions);

        modalInstance.result.then(function (returnValue) {
            if(callbackFunc != undefined && callbackFunc != null){
                callbackFunc(returnValue);
            }
            isFormOpen_ = false;
        }, function () {
            if(callbackFunc != undefined && callbackFunc != null){
                callbackFunc();
            }
            isFormOpen_ = false;
        });
    };
    //========================================================================================


    //========================================================================================
    // Default Service Error
    // when a web service fails this method handles it by displaying an error message to the
    // user.
    //========================================================================================
    $scope.serviceError = function(errorMsg){
        $log.error('ERROR * ERROR * ERROR * ERROR\n' + errorMsg);
    };
    //========================================================================================


    //========================================================================================
    // Get Webbles By Template Id
    // This method return a list of Webbles with a specific template id.
    //========================================================================================
    $scope.getWebblesByTemplateId = function(whatTemplateid){
        var theFoundWebbles = [];

        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            if (aw.scope().theWblMetadata['templateid'] == whatTemplateid){
                theFoundWebbles.push(aw);
            }
        }

        return theFoundWebbles;
    };
    //========================================================================================


    //========================================================================================
    // Get Webble By Instance Id
    // This method return the unique Webbles with a specific instance id.
    //========================================================================================
    $scope.getWebbleByInstanceId = function(whatInstanceId){
        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            if (aw.scope() && aw.scope().getInstanceId() == whatInstanceId){
                return aw;
            }
        }
        return undefined;
    };
    //========================================================================================


    //========================================================================================
    // Get Webbles By Display Name
    // This method return a list of Webbles with a certain display name.
    //========================================================================================
    $scope.getWebblesByDisplayName = function(whatWebbleDisplayName){
        var theFoundWebbles = [];

        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            if (aw.scope().getInstanceName() == whatWebbleDisplayName){
                theFoundWebbles.push(aw);
            }
        }
        return theFoundWebbles;
    };
    //========================================================================================


    //========================================================================================
    // Add Undo
    // Adds another operation to the undo list (if the list allows it)
    //========================================================================================
    $scope.addUndo = function(newOp, isAllowedExternally){
        if(isAllowedExternally){
            $scope.getCurrWSUndoMemory().unshift(newOp);
        }
        else{
            doNotSaveUndoEnabled_ = false;
        }
    };
    //========================================================================================


    //========================================================================================
    // Select All Webbles
    // This method make all webbles selected
    //========================================================================================
    $scope.selectAllWebbles = function(){
        platformCurrentStates_ = bitflags.on(platformCurrentStates_, Enum.bitFlags_PlatformStates.WaitingForAllSelect);
        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            $scope.requestWebbleSelection(aw.scope().theView);
        }
        platformCurrentStates_ = bitflags.off(platformCurrentStates_, Enum.bitFlags_PlatformStates.WaitingForAllSelect);
    };
    //========================================================================================


    //========================================================================================
    // Unselect All Webbles
    // This method make all webbles unselected
    //========================================================================================
    $scope.unselectAllWebbles = function(){
        for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
            if(aw.scope() != undefined){
                aw.scope().setSelectionState(Enum.availableOnePicks_SelectTypes.AsNotSelected);
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Open Work Space  By Name
    // This method opens a work space with the specified name
    //========================================================================================
    $scope.openWSByName = function(selectedWS){
        for(var i = 0; i < availableWorkspaces_.length; i++){
            if(selectedWS == availableWorkspaces_[i].name){
                $scope.setEmitLockEnabled(true);
                $scope.insertWS(availableWorkspaces_[i]);
                recentWS_ = selectedWS;
                $scope.saveUserSettings(true);
                break;
            }
        }
    };
    //========================================================================================


    //========================================================================================
    // Save Work Space By Name
    // This method saves current work space with the specified name
    //========================================================================================
    $scope.saveWSByName = function(newWSName){
        if(newWSName != null){
            if(currWS_.name != newWSName){
                currWS_.id = undefined;
                currWS_.name = newWSName;
            }
            $timeout(function(){$scope.executeMenuSelection('savews', null);}, 100);
        }
    };
    //========================================================================================


    //========================================================================================
    // Execute Menu Selection
    // Execute the correct action, based on menu or shortcut selection.
    //========================================================================================
    $scope.executeMenuSelection = function(sublink, whatKeys) {
        if(isFormOpen_){
            return false;
        }

        if((parseInt(platformSettingsFlags_, 10) & parseInt(Enum.bitFlags_PlatformConfigs.PlatformInteractionBlockEnabled, 10)) === parseInt(Enum.bitFlags_PlatformConfigs.PlatformInteractionBlockEnabled, 10)){
            return false;
        }
        else if (currentPlatformPotential_ == Enum.availablePlatformPotentials.None) {
            return false;
        }

        var actionWasExecuted = true;
        if(whatKeys == null || $scope.getCurrentExecutionMode() != Enum.availableOnePicks_ExecutionModes.Developer){
            whatKeys = {theAltKey: false, theShiftKey: false, theCtrlKey: false, theKey: ''};
        }


        //==== NON-MENU KEYBOARD ============================
        if (sublink == 'altf1' || (whatKeys.theAltKey && whatKeys.theKey == 'F1'))
        {
            $scope.openForm(Enum.aopForms.infoMsg, {title: gettext('Non-Menu Shortcut Keys'), content:
                    '<strong>Alt+F1</strong>: Display non-menu Shortcut keys and additional quick help info.<br>' +
                        '<strong>Alt+F2</strong>: Toggle Main menu visibility.<br>' +
                        '<strong>Alt+F3</strong>: Toggle Console Debug Logging.<br>' +
                        '<strong>F4 (or Alt+F4)</strong>: Change Platform Language<br>' +
                        '<strong>Alt+F5</strong>: Quick Save Current Desktop.<br>' +
                        '<strong>Alt+F6</strong>: Quick Load Current Desktop.<br>' +
                        '<strong>F8 (or Alt+F8)</strong>: Quick Load A Fundamental Webble.<br>' +
                        '<strong>F9 (or Alt+F9)</strong>: Quick Toggles between System Language and English.<br>' +
                        '<strong>Alt+Shift+PageDown (or Ctrl+Shift+PageDown)</strong>: Reset Webble World Intro to first time visitor mode.<br>' +
                        '<strong>Alt+Shift+End (or Ctrl+Shift+End)</strong>: Clear all Webble world cookies and local storage user data.<br>' +
                        '<strong>Esc</strong>: Cancel what is currently going on (e.g. Close form).<br>' +
                        '<strong>Arrow Keys</strong>: Move current selected Webble in that directiont.<br>'}
            );
        }
        else if (sublink == 'altf2' || (whatKeys.theAltKey && whatKeys.theKey == 'F2')) //Toggle Main Menu visibility
        {
            if((parseInt(platformSettingsFlags_, 10) & parseInt(Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled, 10)) === parseInt(Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled, 10)){
                platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
            }
            else{
                platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
            }
        }
        else if (sublink == 'altf3' || (whatKeys.theAltKey && whatKeys.theKey == 'F3'))
        {
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited && currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                $scope.isLoggingEnabled = !$scope.isLoggingEnabled;
                wwGlobals.loggingEnabled = $scope.isLoggingEnabled;
                localStorageService.add('isLoggingEnabled', $scope.isLoggingEnabled.toString());
            }
        }
        else if (sublink == 'altf5' || (whatKeys.theAltKey && whatKeys.theKey == 'F5'))
        {
            if($scope.getActiveWebbles().length > 0){
                var rootPathName = 'guest';
                if($scope.user){
                    rootPathName = $scope.user.email;
                }
                localStorageService.add(rootPathName + wwConsts.workspaceQuickSavePathLastName, JSON.stringify(getWSDef(rootPathName)));

                $scope.showQIM(gettext("Current workspace quick saved"));
            }
        }
        else if (sublink == 'altf6' || (whatKeys.theAltKey && whatKeys.theKey == 'F6'))
        {
            $scope.cleanActiveWS();
            var rootPathName = 'guest';
            if($scope.user){
                rootPathName = $scope.user.email;
            }

            var quickSavedWS = localStorageService.get(rootPathName + wwConsts.workspaceQuickSavePathLastName);

            if(quickSavedWS){
                quickSavedWS = JSON.parse(quickSavedWS);
                wblFamiliesInLineForInsertion_ = quickSavedWS.webbles;
                $scope.loadWebbleFromDef(wblFamiliesInLineForInsertion_.shift());
                $scope.showQIM(gettext("Recent Quick saved workspace has been restored"));
            }
            else{
                $scope.showQIM(gettext("No Quick-Save Workspace in Storage"));
            }
        }
        else if (sublink == 'altf8' || (whatKeys.theKey == 'F8' || (whatKeys.theAltKey && whatKeys.theKey == 'F8')))
        {
            $scope.downloadWebbleDef("fundamental");
        }
        else if (sublink == 'altf9' || (whatKeys.theKey == 'F9' || (whatKeys.theAltKey && whatKeys.theKey == 'F9')))
        {
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited && currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                if(gettextCatalog.currentLanguage.search('en') == -1){
                    gettextCatalog.currentLanguage = 'en';
                    $scope.langChangeTooltipTxt = $filter('nativeString')($scope.getSysLanguage());
                }
                else if($scope.getSysLanguage().search(gettextCatalog.currentLanguage) == -1){
                    gettextCatalog.currentLanguage = $scope.getSysLanguage() || 'en';
                    $scope.langChangeTooltipTxt = "Change Language";
                }
            }
        }
        else if (sublink == 'altf10' || (whatKeys.theAltKey && whatKeys.theKey == 'F10'))
        {
            $scope.openForm(Enum.aopForms.langChange, null, function(){
                if(gettextCatalog.currentLanguage.search('en') == -1){
                    $scope.langChangeTooltipTxt = $filter('nativeString')($scope.getSysLanguage());
                }
                else if($scope.getSysLanguage().search(gettextCatalog.currentLanguage) == -1){
                    $scope.langChangeTooltipTxt = "Change Language";
                }
                else{
                    $scope.langChangeTooltipTxt = "";
                }
            });
        }
        else if(sublink == 'altshiftpagedown' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && whatKeys.theShiftKey && whatKeys.theKey == 'PageDown')){
            localStorageService.remove('IntroDisabled');
            $log.info('Intro video blocking was deleted and the intro will play next time the page is reloaded');
        }
        else if(sublink == 'altshiftend' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && whatKeys.theShiftKey && whatKeys.theKey == 'End')){
            localStorageService.clearAll();
            $log.info('All cookies and local storage data was just cleared.');
        }
        else if (sublink == 'esc' || (whatKeys.theKey == 'Esc'))
        {
            $scope.resetSelections();
        }
        else if ((sublink == 'leftarrow' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && whatKeys.theKey == 'Left Arrow')))
        {
            for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                if (aw.scope().getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked){
                    var valUnit = valMod.getValUnitSeparated(aw.scope().gimme('root:left'));
                    aw.scope().set('root:left', (isNaN(valUnit[0]) ? '' : (valUnit[0] - 2.0)) + valUnit[1]);
                }
            }
        }
        else if ((sublink == 'rightarrow' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && whatKeys.theKey == 'Right Arrow')))
        {
            for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                if (aw.scope().getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked){
                    var valUnit = valMod.getValUnitSeparated(aw.scope().gimme('root:left'));
                    aw.scope().set('root:left', (isNaN(valUnit[0]) ? '' : (valUnit[0] + 2.0)) + valUnit[1]);
                }
            }
        }
        else if ((sublink == 'uparrow' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && whatKeys.theKey == 'Up Arrow')))
        {
            for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                if (aw.scope().getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked){
                    var valUnit = valMod.getValUnitSeparated(aw.scope().gimme('root:top'));
                    aw.scope().set('root:top', (isNaN(valUnit[0]) ? '' : (valUnit[0] - 2.0)) + valUnit[1]);
                }
            }
        }
        else if ((sublink == 'downarrow' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && whatKeys.theKey == 'Down Arrow')))
        {
            for(var i = 0, aw; aw = $scope.getActiveWebbles()[i]; i++){
                if (aw.scope().getSelectionState() == Enum.availableOnePicks_SelectTypes.AsMainClicked){
                    var valUnit = valMod.getValUnitSeparated(aw.scope().gimme('root:top'));
                    aw.scope().set('root:top', (isNaN(valUnit[0]) ? '' : (valUnit[0] + 2.0)) + valUnit[1]);
                }
            }
        }

        //==== NON-MENU TOUCH GESTURES (On WorkSurface)============================

        else if (sublink == 'gestSwipeDown') //Show Main Menu visibility
        {
            platformSettingsFlags_ = bitflags.on(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
        }
        else if (sublink == 'gestSwipeUp') //Hide Main Menu visibility
        {
            platformSettingsFlags_ = bitflags.off(platformSettingsFlags_, Enum.bitFlags_PlatformConfigs.MainMenuVisibilityEnabled);
        }

        //==== MAIN MENU ============================

        //==== WORKSPACE ============================
        else if(sublink == 'newws' || (whatKeys.theAltKey && whatKeys.theKey == 'N')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                if(currWS_ && currWS_.webbles. length > 0){
                    var modalInstance = $modal.open({templateUrl: 'views/modalForms/clearSomething.html', windowClass: 'modal-wblwrldform small'});

                    modalInstance.result.then(function () {
                        if(currWS_ && currWS_.is_shared){
                            $scope.setEmitLockEnabled(true);
                            liveOnlineInteractionEnabled_ = false;
                            socket.emit('interaction:ended', currWS_.id);

                            socket.removeListener('interaction:info', onInfo);
                            socket.removeListener('interaction:move', onDraw);
                            socket.removeListener('interaction:save', onSave);
                            socket.removeListener('interaction:comm', onComm);
                            $log.log('Live Online Interaction for shared workspace turned OFF');
                        }
                        $scope.cleanActiveWS();
                    }, function () {
                    });
                }
                else{
                    $scope.cleanActiveWS();
                }
            }
        }
        else if(sublink == 'openws' || (whatKeys.theAltKey && whatKeys.theKey == 'O')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                dbService.getAvailableWorkspaces().then(
                    function(workspaces) {
                        availableWorkspaces_ = workspaces;
                        if(availableWorkspaces_.length > 0){
                            $scope.openForm(Enum.aopForms.openWorkspace, availableWorkspaces_, function(selectedWS){
                                if(selectedWS){
                                    listOfUntrustedWbls_ = [];
                                    for(var i = 0; i < availableWorkspaces_.length; i++){
                                        if(selectedWS == availableWorkspaces_[i].id){
                                            $scope.setEmitLockEnabled(true);
                                            $scope.insertWS(availableWorkspaces_[i]);
                                        }
                                    }
                                    recentWS_ = selectedWS;
                                    $scope.saveUserSettings(true);
                                }
                            });
                        }
                        else{
                            $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("No Workspaces Available"), content: gettext("You do not have any saved workspaces available to open. You must create some first.")}, null);
                        }
                    },
                    function () {
                        $log.log("ERROR WHILE LOADING LIST OF AVAILABLE WORKSPACES")
                    }
                );
            }
        }
        else if(sublink == 'savews' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'S')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                if(currWS_ && currWS_.name != ''){
                    if($scope.user && $scope.user.username){
                        dbService.saveWorkspace(getWSDef($scope.user.username)).then(function(data){
                            if(data.id){
                                currWS_.id = data.id;
                                currWS_.creator = $scope.user.username;
                                $location.search('workspace', data.id);

                                if(recentWS_ != currWS_.id){
                                    recentWS_ = currWS_.id;
                                    $scope.saveUserSettings(true);
                                }
                            }

                            var isNew = true;
                            for(var i = 0, aws; aws = $scope.getAvailableWorkspaces()[i]; i++){
                                if(aws.id == currWS_.id){
                                    isNew = false;
                                    break;
                                }
                            }

                            if(isNew){
                                $scope.getAvailableWorkspaces().push(data);
                            }

                            $scope.showQIM(gettext("Workspace Saved"));
                        },function(eMsg){
                            $scope.serviceError(eMsg);
                        });
                    }
                    else{
                        $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Save Workspace Not Available"), content: gettext("You must be logged in to Webble World in order to save Workspaces and publish Webbles and you need a valid username. Please sign in and/or make sure you have a proper username in your profile and try again.")}, null);
                    }
                }
                else{
                    $scope.executeMenuSelection('savewsas', null);
                }
            }
        }
        else if(sublink == 'savewsas' || (whatKeys.theAltKey && whatKeys.theShiftKey && whatKeys.theKey == 'S')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                if(currWS_ && $scope.user && $scope.user.username){
                    $scope.openForm(Enum.aopForms.saveWorkspaceAs, null, function(newWSName){
                        $scope.saveWSByName(newWSName);
                    });
                }
                else{
                    $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Save Workspace Not Available"), content: gettext("You must be logged in to Webble World in order to save Workspaces and publish Webbles and you need a valid username. Please sign in and/or make sure you have a proper username in your profile and try again.")}, null);
                }
            }
        }
        else if(sublink == 'sharews' || (whatKeys.theAltKey && whatKeys.theKey == 'J')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                if(currWS_ && currWS_.id != undefined){
                    if(currWS_.creator == $scope.user.name.full || currWS_.creator == $scope.user.username){
                        $scope.openForm(Enum.aopForms.shareWorkspaces, currWS_, null);
                    }
                    else{
                        $scope.showQIM(gettext("You Do not own this Workspace, and can therefore not share it."), 3300);
                    }
                }
                else{
                    $scope.showQIM(gettext("No Workspace to share."));
                }
            }
        }
        else if(sublink == 'deletews' || (whatKeys.theAltKey && whatKeys.theKey == 'X')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                if(currWS_ && currWS_.id != undefined){
                    if(currWS_.creator == $scope.user.name.full || currWS_.creator == $scope.user.username){
                        var modalInstance = $modal.open({templateUrl: 'views/modalForms/deleteSomething.html', windowClass: 'modal-wblwrldform small'});

                        modalInstance.result.then(function () {
                            dbService.deleteWS(currWS_.id).then(function(data){
                                for(var i = 0, aws; aws = $scope.getAvailableWorkspaces()[i]; i++){
                                    if(aws.id == currWS_.id){
                                        $scope.getAvailableWorkspaces().splice(i, 1);
                                        break;
                                    }
                                }
                                $scope.cleanActiveWS();
                                $scope.showQIM(gettext("Workspace successfully deleted from server"));
                            },function(eMsg){
                                $scope.serviceError(eMsg);
                            });
                        }, function () { });
                    }
                    else{
                        $scope.showQIM(gettext("You Do not own this Workspace, and can therefore not delete it. But you can remove yourself as a Workspace collaborator"), 4000, {w: 250, h: 90});
                        var modalInstance = $modal.open({templateUrl: 'views/modalForms/deleteSomething.html', windowClass: 'modal-wblwrldform small'});

                        modalInstance.result.then(function () {
                            dbService.removeMeAsWSCollaborator(currWS_.id).then(function(data){
                                $scope.cleanActiveWS();
                                $scope.showQIM(gettext("You were successfully rewmoved from the Workspace sharing collaboartor list"));
                            },function(eMsg){
                                $scope.serviceError(eMsg);
                            });
                        }, function () { });
                    }
                }
            }
        }
        else if(sublink == 'printws' || (whatKeys.theAltKey && whatKeys.theShiftKey && whatKeys.theKey == 'P')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                if(workSurfaceElement_){
                    autoGenImageFrame = angular.element(document.createElement("div"));
                    autoGenImageFrame.attr('id', 'autoGenImageFrame');
                    var allWbls = $scope.getActiveWebbles();
                    var ltrb = {l: 10000, t: 10000, r: 0, b: 0};
                    for(var i = 0, wbl; wbl = allWbls[i]; i++){
                        var wblLTPos = $scope.getWblAbsPosInPixels(wbl);
                        var wblLTRB = {l: wblLTPos.x, t: wblLTPos.y, r: wblLTPos.x + Math.round(getUnits(wbl.parent()[0], 'width').pixel), b: wblLTPos.y + Math.round(getUnits(wbl.parent()[0], 'height').pixel)};
                        if(wblLTRB.l < ltrb.l){
                            ltrb.l = wblLTRB.l;
                        }
                        if(wblLTRB.t < ltrb.t){
                            ltrb.t = wblLTRB.t;
                        }
                        if(wblLTRB.r > ltrb.r){
                            ltrb.r = wblLTRB.r;
                        }
                        if(wblLTRB.b > ltrb.b){
                            ltrb.b = wblLTRB.b;
                        }
                    }

                    $scope.getWSE().append(autoGenImageFrame);
                    autoGenImageFrame.css('background-color', 'transparent');
                    autoGenImageFrame.css('position', 'absolute');
                    autoGenImageFrame.css('left', ltrb.l);
                    autoGenImageFrame.css('top', ltrb.t);
                    autoGenImageFrame.css('width', (ltrb.r - ltrb.l + 7));
                    autoGenImageFrame.css('height', (ltrb.b - ltrb.t + 7));

                    for(var i = 0, wbl; wbl = allWbls[i]; i++){
                        var wblLTPos = $scope.getWblAbsPosInPixels(wbl);
                        wbl.parent().clone().css('left', (wblLTPos.x - ltrb.l)).css('top', (wblLTPos.y - ltrb.t)).prependTo(autoGenImageFrame);
                    }

                    workSurfaceElement_.find('#connViz').clone().css('left', 0 - ltrb.l).css('top', 0 - ltrb.t).prependTo(autoGenImageFrame);

                    var WinPrint = window.open('', '', 'letf=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
                    WinPrint.document.write(autoGenImageFrame[0].innerHTML);
                    WinPrint.document.close();
                    WinPrint.focus();
                    WinPrint.print();
                    WinPrint.close();
                    $scope.getWSE().find('#autoGenImageFrame').remove();
                }
            }
        }

        //==== WEBBLES ============================

        else if(sublink == 'browse' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'B')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
                $scope.openForm(Enum.aopForms.wblSearch, $scope, null);
            }
        }
        else if(sublink == 'loadwbl' || (whatKeys.theAltKey && whatKeys.theKey == 'L')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                $scope.openForm(Enum.aopForms.loadWebble, null, loadWebbleReturned);
            }
        }
        else if(sublink == 'recentwbl' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'R')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                if (recentWebble_){
                    $scope.loadWebbleFromDef(recentWebble_, null);
                }
            }
        }
        else if(sublink == 'pub' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'P')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                var selectedWbls = $scope.getSelectedWebbles();
                if(selectedWbls.length == 1){
                    $scope.requestPublishWebble(selectedWbls[0]);
                }
                else{
                    $scope.openForm(Enum.aopForms.infoMsg, {title: gettext("Cannot do that..."), content: gettext("This operation only works with one selected Webble at a time, and you have") + ' ' + selectedWbls.length + ' ' + gettext("Webbles selected.")}, null);
                }
            }
        }
        else if(sublink == 'upload' || (whatKeys.theAltKey && whatKeys.theKey == 'U')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                locationPathChangeRequest = '/templates';
                $scope.waiting(true);
                quickSaveWSInternal();
            }
        }

        //==== EDIT ============================
        else if(sublink == 'undo' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && whatKeys.theKey == 'Z')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                executeUndoRedo(false);
            }
        }
        else if(sublink == 'redo' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && whatKeys.theKey == 'Y')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                executeUndoRedo(true);
            }
        }
        else if(sublink == 'selectall' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'A')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                $scope.selectAllWebbles();
            }
        }
        else if(sublink == 'deselectall' || (whatKeys.theAltKey && whatKeys.theShiftKey && whatKeys.theKey == 'A')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                $scope.unselectAllWebbles();
            }
        }
        else if(sublink == 'duplicate' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'D')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                duplicateAllSelectedWebbles();
            }
        }
        else if(sublink == 'sharedduplicate' || (whatKeys.theAltKey && whatKeys.theShiftKey  && whatKeys.theKey == 'D')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                sharedModelDuplicateAllSelectedWebbles();
            }
        }
        else if(sublink == 'bundle' || (whatKeys.theAltKey && whatKeys.theShiftKey  && whatKeys.theKey == 'B')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                var selectionsCorrect = true;
                var bundleTopParents = getSelectedTopParents();
                for(var i = 0, tp; tp = bundleTopParents[i]; i++){
                    if(tp.scope().getParent() != undefined){
                        selectionsCorrect = false;
                        break;
                    }
                }

                if(selectionsCorrect){
                    var allWblsToBeBundled = [];
                    for(var i = 0, tp; tp = bundleTopParents[i]; i++){
                        allWblsToBeBundled = allWblsToBeBundled.concat($scope.getAllDescendants(tp));
                    }
                    $scope.configureBundle(allWblsToBeBundled);
                }
                else{
                    $scope.openForm(Enum.aopForms.infoMsg, {
                        title: gettext("Bundle Selection Broken"),
                        content: gettext("A Webble Bundle can only be made with complete Webble families, and not just with parts. Please select only single Webbles and/or super parents (Webbles with children and grandchildren but no parents of their own).")
                    });
                }
            }
        }
        else if(sublink == 'delete' || ((whatKeys.theAltKey || whatKeys.theCtrlKey) && !whatKeys.theShiftKey && whatKeys.theKey == 'Delete')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                var wblsToDel = getSelectedTopParents();
                for(var i = 0, dw; dw = wblsToDel[i]; i++){
                    $scope.requestDeleteWebble(dw);
                }
            }
        }
        else if(sublink == 'wblprops' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'E')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                $scope.setMWPVisibility('inline-block');
            }
        }
        else if(sublink == 'platformprops' || (whatKeys.theAltKey && whatKeys.theShiftKey && whatKeys.theKey == 'E')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                $scope.openForm(Enum.aopForms.platformProps, getPlatformPropsContent(), platformPropsReturned);
            }
        }

        //==== VIEW ============================
        else if(sublink == 'toggleconn' || (whatKeys.theAltKey && whatKeys.theKey == 'NUM 9')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                if(vcvVisibility_ == 'none'){
                    vcvVisibility_ = 'inline-block';
                }
                else{
                    vcvVisibility_ = 'none';
                }
            }
        }
        else if(sublink == 'wsinfo' || (whatKeys.theAltKey && whatKeys.theKey == 'I')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim) {
                var appTime = ((((new Date()).getTime() - applicationStartTime_.getTime())/1000)/60).toFixed(2);
                $scope.openForm(Enum.aopForms.infoMsg, {title: gettext('Webble World Platform Information'), content:
                    '<strong>Application Runtime</strong>: ' + appTime + ' minutes.<br>' +
                        '<strong>No of loaded Webbles</strong>: ' + $scope.getActiveWebbles().length + '<br>' +
                        '<strong>No of different Webble Templates used</strong>: ' + webbleTemplates_.length + '<br>' +
                        '<strong>No of different Webble Definitions used</strong>: ' + webbleDefs_.length + '<br>'
                });
            }
        }
        else if(sublink == 'fullscrn' || (whatKeys.theAltKey && !whatKeys.theShiftKey && whatKeys.theKey == 'F')){
            toggleFullScreen();
        }

        //==== HELP ============================
        else if(sublink == 'docs' || (whatKeys.theAltKey && whatKeys.theKey == 'M')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
                $window.open(appPaths.webbleDocRelPath);
            }
        }
        else if(sublink == 'faq' || (whatKeys.theAltKey && whatKeys.theShiftKey && whatKeys.theKey == 'F')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
                $scope.openForm(Enum.aopForms.faq, {userEmail: ($scope.user != undefined ? $scope.user.email : 'guest'), isAdmin: ($scope.user != undefined && $scope.user.role == 'adm')}, null);
            }
        }
        else if(sublink == 'openchat' || (whatKeys.theAltKey && whatKeys.theKey == 'C')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
                $scope.$broadcast("showChat");
            }
        }
        else if(sublink == 'support' || (whatKeys.theAltKey && whatKeys.theKey == 'H')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
                $window.location = "mailto:mkuwahara@meme.hokudai.ac.jp?subject=Webble World Support Request";
            }
        }
        else if(sublink == 'devpack' || (whatKeys.theAltKey && whatKeys.theKey == 'G')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
                $window.open('data/WebbleDevPack.zip');
            }
        }
        else if(sublink == 'bugreport' || (whatKeys.theAltKey && whatKeys.theKey == 'NUM 7')){
            if (currentPlatformPotential_ != Enum.availablePlatformPotentials.Slim && currentPlatformPotential_ != Enum.availablePlatformPotentials.Limited) {
                $window.location = "mailto:mkuwahara@meme.hokudai.ac.jp?subject=Webble World Bug Report";
            }
        }
        else if(sublink == 'about' || (whatKeys.theAltKey && whatKeys.theKey == 'NUM 5')){
            $scope.openForm(Enum.aopForms.about, null, null);
        }

        //==== USER MENU ============================
        else if(sublink == 'profile'){
            locationPathChangeRequest = '/profile';
            quickSaveWSInternal();
        }
        else if (sublink == 'notif'){
	        locationPathChangeRequest = '/profile'; // ditto
            quickSaveWSInternal();
        }
        else if (sublink == 'groups'){
	        locationPathChangeRequest = '/groups'; // ditto
            quickSaveWSInternal();
        }
        else if (sublink == 'adm'){
          locationPathChangeRequest = '/adm'; // ditto
          quickSaveWSInternal();
        }
        else if (sublink == 'logout'){
	        $scope.logout();
        }

        //==== AND OTHER ============================
        else{
            var testIfSBWClick = false;
            for(var i = 0; i < availableSandboxWebbles_.length; i++){
                if(sublink == availableSandboxWebbles_[i].id){
                    testIfSBWClick = true;
                    $scope.loadWebbleFromDef(availableSandboxWebbles_[i], null);
                    break;
                }
            }

            if(!testIfSBWClick){
                actionWasExecuted = false;

                //Easter egg check
                if (!whatKeys.theAltKey && whatKeys.theKey != null && whatKeys.theKey != '')
                {
                    var specialIndex = -1;
                    soFarWord_ += whatKeys.theKey.toString();
                    for (var i = 0; i < eeWord_.length; i++)
                    {
                        if (soFarWord_.toLowerCase() == eeWord_[i].substring(0, soFarWord_.length).toLowerCase()){
                            specialIndex = i;
                            break;
                        }
                    }

                    if(specialIndex != -1){
                        if(soFarWord_.length == eeWord_[specialIndex].length && soFarWord_ == eeWord_[specialIndex]){
                            eeFunc_[specialIndex]();
                            soFarWord_ = '';
                        }
                    }
                    else{
                        soFarWord_ = '';
                    }
                }
            }
        }

        $scope.eventInfoStack.push({event: "mainMenuExecuted", info: sublink});
        $timeout(function(){ var eisItem = $scope.eventInfoStack.shift(); $scope.eventInfo[eisItem.event] = eisItem.info; });
        $scope.eventInfoStack.push({event: "mainMenuExecuted", info: null});
        $timeout(function(){ var eisItem = $scope.eventInfoStack.shift(); $scope.eventInfo[eisItem.event] = eisItem.info; }, 10);

        return actionWasExecuted;
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //******************************************************************************************************************
    authService.tryLoginIfSessionActive();
    platformCtrlSetup();
});
//====================================================================================================================
