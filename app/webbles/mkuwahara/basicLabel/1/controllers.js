//======================================================================================================================
// Controllers for LABEL for Webble World v3.0 (2013)
// Created By: truemrwalker (Micke Kuwahara)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file (with this name) must exist in order for the Webble to load but it
//       does not require to be a proper angularJS controller. It can work as a simple
//       javascript function collection file, but the developer would then miss out on
//       all nice AngularJS developers possibilities.
//=======================================================================================
wblwrld3App.controller('labelWebbleCtrl', function($scope, $log, Slot, Enum, gettext) {

    //=== PROPERTIES ====================================================================

    $scope.stylesToSlots = {
        labelContainer: ['background-color', 'border', 'width', 'height', 'text-align'],
        labelTxt: ['font-size', 'font-weight', 'font-family', 'padding', 'color', 'text-shadow']
    };


    //=== EVENT HANDLERS ================================================================


    //=== METHODS & FUNCTIONS ===========================================================

    //===================================================================================
    // Webble template Initialization
    //===================================================================================
    $scope.coreCall_Init = function(theInitWblDef){
        $scope.addSlot(new Slot('labelTxt',
            gettext("Label"),
            'Label Text',
            'The text of the Label webble',
            $scope.theWblMetadata['templateid'],
            undefined,
            undefined
        ));

        $scope.addSlot(new Slot('googleFont',
            '',
            'Google Font',
            'Type the fontfamily string provided for javascript for any online google font here, and it will be used instead of default fonts. (empty for default options)',
            $scope.theWblMetadata['templateid'],
            {inputType: Enum.aopInputTypes.TextBox},
            undefined
        ));

        $scope.setDefaultSlot('labelTxt');

        $scope.setResizeSlots('labelContainer:width', 'labelContainer:height');

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			if(eventData.slotValue != ''){
				try {
					WebFont.load({ google: { families: [ eventData.slotValue ] } });
					var fontName = eventData.slotValue.substr(0, eventData.slotValue.indexOf(':')).replace(/\+/g, ' ');
					$scope.theView.find('#labelTxt').css('font-family', fontName);
				}
				catch(err) { }
			}
		}, undefined, 'googleFont');
    };
    //===================================================================================


    //=== CTRL MAIN CODE ======================================================================

});
//======================================================================================================================
