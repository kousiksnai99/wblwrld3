//====================================================================================================================
// Webble World
// [IntelligentPad system for the web]
// Copyright (c) 2010 Micke Nicander Kuwahara, Giannis Georgalis, Yuzuru Tanaka in Meme Media R&D Group of Hokkaido University
// v3.0 (2013), v3.1(2015)
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
// PLATFORM PROPERTIES FORM CONTROLLER
// This controls the form for managing platform properties
//====================================================================================================================
ww3Controllers.controller('platformPropsSheetCtrl', function ($scope, $uibModalInstance, $log, gettext, platformProps, Enum) {

    //=== PROPERTIES ================================================================

    // Form content needed for proper processing
    $scope.formItems = platformProps;
    $scope.execModeOptions = [];
	$scope.templateRevisionBehaviorOptions = [];
	$scope.untrustedWblsBehaviorOptions = [];
    $scope.browser = BrowserDetect.browser;

    // Information tooltip texts
    $scope.infoTooltips = {
        platformBkgColor: gettext("This is the background color of you workspace"),
        currentExecutionMode: gettext("This is the execution mode the system is currently in. Developer opens up all locks, Admin is for working Webble maintanance and user modes are for basic usage."),
        popupEnabled: gettext("If this is unchecked, some of the more tutorial-like and repetetive informative Message popups will be disabled."),
        autoBehaviorEnabled: gettext("If this is unchecked, Webble will no longer try to auto connects default slots etc."),
		loggingEnabled: gettext("If this is checked, log texts will be written to the JavaScript console for development support [$log.log()], if unckecked all log commands in the code will be ignored."),
		templateRevisionBehavior: gettext("This allows the user to define the automatic behavior for the system when a requested version of a Webble Template exists as a newer version as well. Upgrade or not."),
		untrustedWblsBehavior: gettext("This allows the user to define the automatic behavior for the system when a trying to load a Webble which is untrusted; allow it automatically, ask first time, ask every time or never allow."),
		slimWblBrowserEnabled: gettext("If this is checked, the Webble browser will only show Webble name and trust level in the browser and hide all other info, unless the user single-clicks the Webble in question twice."),
		sharedWS_NoQIM_Enabled: gettext("If this is checked, there will be no messages displayed when external changes are made by other users in a current open shared workspace.")
    };

    // Form validation error message
    $scope.errorMsg = '';

    //=== EVENT HANDLERS =====================================================================



    //*****************************************************************************************************************
    //=== PRIVATE FUNCTIONS ===========================================================================================
    //*****************************************************************************************************************



    //*****************************************************************************************************************
    //=== PUBLIC FUNCTIONS ============================================================================================
    //*****************************************************************************************************************

    //========================================================================================
    // Adjust Tooltip Placement By Device Width
    // the placement of the tooltip is by default at the bottom, but with smaller devices in
    // some rare cases that should be set to right instead.
    //========================================================================================
    $scope.adjustTooltipPlacementByDeviceWidth = function(){
        if($(document).width() < 410){
            return 'right';
        }
        else{
            return 'left';
        }
    };
    //========================================================================================

    //========================================================================================
    // Close
    // Closes the modal form and send the resulting content back to the creator
    //========================================================================================
    $scope.close = function (result) {
        if (result == 'submit') {
			$uibModalInstance.close($scope.formItems);
        }
        else{
			$uibModalInstance.close(null);
        }
    };
    //========================================================================================



    //******************************************************************************************************************
    //=== CTRL MAIN CODE ===============================================================================================
    //*****************************************************************************************************************
    var index = 0;
    for(var mode in Enum.availableOnePicks_ExecutionModesDisplayText){
        $scope.execModeOptions.push({key: index, val: Enum.availableOnePicks_ExecutionModesDisplayText[mode]});
        index++;
    }

	index = 0;
	for(var behavior in Enum.availableOnePicks_templateRevisionBehaviorDisplayText){
		$scope.templateRevisionBehaviorOptions.push({key: index, val: Enum.availableOnePicks_templateRevisionBehaviorDisplayText[behavior]});
		index++;
	}

	index = 0;
	for(var behavior in Enum.availableOnePicks_untrustedWebblesBehaviorDisplayText){
		$scope.untrustedWblsBehaviorOptions.push({key: index, val: Enum.availableOnePicks_untrustedWebblesBehaviorDisplayText[behavior]});
		index++;
	}
});
//======================================================================================================================
