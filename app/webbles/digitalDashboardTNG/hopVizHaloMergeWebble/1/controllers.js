//======================================================================================================================
// Controllers for Digital Dashboard 3.0 TNG HoP Halo Merge Visualisation Webble for Webble World v3.0 (2013)
// Created By: Jonas Sjobergh
// Edited By: Micke Kuwahara (truemrwalker)
//======================================================================================================================

//=======================================================================================
// WEBBLE CONTROLLER
// This is the Main controller for this Webble Template
// NOTE: This file must exist and be an AngularJS Controller declared as seen below.
//=======================================================================================
wblwrld3App.controller('hopVizHaloMergeWebbleCtrl', function($scope, $log, Slot, Enum, $timeout) {

	//=== PROPERTIES ====================================================================

	$scope.stylesToSlots = {
		DrawingArea: ['width', 'height']
	};

	$scope.displayText = "Halo Merge Plot";
	var preDebugMsg = "hopVizHaloMergePlotWebble: ";

	var myInstanceId = -1;
	var dataMappings = [];

	// graphics
	var bgCanvas = null;
	var bgCtx = null;
	var dropCanvas = null;
	var dropCtx = null;
	var axCanvas = null;
	var axCtx = null;
	var lineCanvas = null;
	var lineCtx = null;
	var uCanvas = null;
	var uCtx = null;
	var dotCanvas = null;
	var dotCtx = null;
	var quickRenderThreshold = 500;
	var textColor = "#000000";
	var currentColors = null;
	var hoverText = null;
	var mouseIsOverMe = false;
	var selectionCanvas = null;
	var selectionCtx = null;
	var selectionColors = null;
	var selectionTransparency = 0.33;
	var selectionHolderElement = null;
	var selectionRect = null;
	var selections = []; // the graphical ones

	var lastSeenGlobalSelections = [];

	// layout
	var leftMarg = 35;
	var topMarg = 20;
	var rightMarg = 20;
	var bottomMarg = 5;
	var fontSize = 11;
	var colorPalette = null;
	var useGlobalGradients = false;
	var transparency = 1;
	var clickStart = null;
	var parsingDataNow = false;
	var grouping = true;
	var nullAsUnselected = false;
	var nullGroup = 0;
	var highlightedHalo = {};
	var highlightedDescendants = {};
	var highlightedAncestors = {};

	// data from parent
	var xName = "";
	var yName = "";
	var sName = "";

	var haveIDs = false;
	var timeSpan = [];
	var timeDelta = 1;

	var limits = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0, 'maxSize':0, 'minSize':0, 'sizeSpan':1};
	var zoomMinX = 0;
	var zoomMaxX = 0;
	var zoomMinY = 0;
	var zoomMaxY = 0;

	var unique = 0; // number of data points with non-null values
	var NULLs = 0;

	var drawH = 1;
	var drawW = 1;

	var internalSelectionsInternallySetTo = {};

	var minDotSize = 3;
	var maxDotSize = 15;
	var logScale = false;

	var storyGraphMode = false;

	var lastDrawW = null;
	var lastDrawH = null;
	var lastFontSize = null;
	var lastTextColor = null;
	var lastColors = null;
	var lastZoomMinX = null;
	var lastZoomMaxX = null;
	var lastZoomMinY = null;
	var lastZoomMaxY = null;
	var lastMinDotSize = null;
	var lastMaxDotSize = null;
	var lastHaveIDs = null;
	var lastStoryGraphMode = false;

	var dropX = {'left':leftMarg, 'top':topMarg, 'right':leftMarg*2, 'bottom':topMarg * 2, "forMapping":{'name':'X', 'type':['number']}, "label":"X-axis Data", "rotate":false};
	var dropY = {'left':2, 'top':topMarg, 'right':leftMarg, 'bottom':topMarg * 2, "forMapping":{'name':'Y', 'type':['number']}, "label":"Y-axis Data", "rotate":true};
	var dropSize = {'left':leftMarg*3, 'top':topMarg*2, 'right':leftMarg*4, 'bottom':topMarg * 4, "forMapping":{'name':'Size', 'type':['number']}, "label":"Size", "rotate":true};
	var dropTime = {'left':leftMarg*3, 'top':topMarg*2, 'right':leftMarg*4, 'bottom':topMarg * 4, "forMapping":{'name':'Time stamp', 'type':['number', 'time', 'date']}, "label":"Timestamp", "rotate":true};
	var dropID = {'left':leftMarg*3, 'top':topMarg*2, 'right':leftMarg*4, 'bottom':topMarg * 4, "forMapping":{'name':'ID', 'type':['number']}, "label":"ID", "rotate":false};
	var dropChID = {'left':leftMarg*3, 'top':topMarg*2, 'right':leftMarg*4, 'bottom':topMarg * 4, "forMapping":{'name':'Descendant ID', 'type':['number']}, "label":"Child ID", "rotate":false};
	var allDropZones = [dropX, dropY, dropSize, dropID, dropChID, dropTime];
	var dragZoneX = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
	var dragZoneY = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
	var dragZoneSize = {'left':-1, 'top':-1, 'right':-1, 'bottom':-1, 'name':"", 'ID':""};
	var allDragNames = [dragZoneX, dragZoneY, dragZoneSize];
	$scope.dragNdropRepr = "Nothing to drag.";
	$scope.dragNdropID = "No drag data.";

	var lastSeenDataSeqNo = -1;
	var lastSeenSelectionSeqNo = -1;



	//=== EVENT HANDLERS ================================================================

	//===================================================================================
	// My Slot Change
	// This event handler manages all internal slot changes.
	//===================================================================================
	function mySlotChange(eventData) {
		// $log.log(preDebugMsg + "mySlotChange() " + eventData.slotName + " = " + JSON.stringify(eventData.slotValue));
		// $log.log(preDebugMsg + "mySlotChange() " + eventData.slotName);
		try {
			switch(eventData.slotName) {
				case "ClearData":
					if(eventData.slotValue) {
						$scope.clearData();
						$scope.set("ClearData",false);
					}
					break;
				case "Transparency":
					var newTransp = eventData.slotValue;
					if(newTransp < 0) {
						newTransp = 0;
					}
					else if(newTransp > 1) {
						newTransp = 1;
					}
					if(newTransp != transparency) {
						transparency = newTransp;
					}
					updateGraphicsHelper(false, true, true, false);
					break;
				case "StoryGraphMode":
					var newStoryGraphMode = eventData.slotValue;
					if(newStoryGraphMode) {
						if(!storyGraphMode) {
							if(haveIDs) {
								storyGraphMode = true; // if no IDs, never set to storyGraphMode
								updateGraphicsHelper(false, true, true, true);
							}
						}
					}
					else {
						if(storyGraphMode) {
							storyGraphMode = false;
							if(haveIDs) {
								updateGraphicsHelper(false, true, true, true);
							}
						}
					}
					break;
				case "SelectAll":
					if(eventData.slotValue) {
						$scope.selectAll();
						$scope.set("SelectAll",false);
					}
					break;
				case "InternalSelections":
					if(eventData.slotValue != internalSelectionsInternallySetTo) {
						setSelectionsFromSlotValue();
					}
					break;
				case "QuickRenderThreshold":
					var newThreshold = parseFloat($scope.gimme("QuickRenderThreshold"));
					if(!isNaN(newThreshold) && isFinite(newThreshold) && newThreshold > 0) {
						if(newThreshold != quickRenderThreshold) {
							var oldState = unique > quickRenderThreshold;
							var newState = unique > newThreshold;

							quickRenderThreshold = newThreshold;
							if(oldState != newState) {
								updateGraphicsHelper(false, true, true, false);
							}
						}
					}
					break;
				case "MultipleSelectionsDifferentGroups":
					var newGrouping = $scope.gimme('MultipleSelectionsDifferentGroups');
					if(newGrouping != grouping) {
						grouping = newGrouping;
						updateLocalSelections(false);
					}
					break;
				case "TreatNullAsUnselected":
					updateLocalSelections(false);
					break;
				case "MaxX":
					var newZoomMaxX = Math.min(parseFloat($scope.gimme("MaxX")), limits.maxX);
					if(!isNaN(newZoomMaxX)) {
						if(newZoomMaxX <= zoomMinX) {
							newZoomMaxX = Math.min(zoomMinX + 1, limits.maxX, zoomMaxX);
						}

						$scope.set("MaxX", newZoomMaxX);

						if(newZoomMaxX != zoomMaxX) {
							zoomMaxX = newZoomMaxX;
							updateSelectionsWhenZoomingOrResizing();
							updateGraphicsHelper(false, true, true, true);
						}
					}
					break;
				case "MaxY":
					var newZoomMaxY = Math.min(parseFloat($scope.gimme("MaxY")), limits.maxY);
					if(!isNaN(newZoomMaxY)) {
						if(newZoomMaxY <= zoomMinY) {
							newZoomMaxY = Math.min(zoomMinY + 1, limits.maxY, zoomMaxY);
						}

						$scope.set("MaxY", newZoomMaxY);

						if(newZoomMaxY != zoomMaxY) {
							zoomMaxY = newZoomMaxY;
							updateSelectionsWhenZoomingOrResizing();
							updateGraphicsHelper(false, true, true, true);
						}
					}
					break;
				case "MinX":
					var newZoomMinX = Math.max(parseFloat($scope.gimme("MinX")), limits.minX);
					if(!isNaN(newZoomMinX)) {
						if(newZoomMinX >= zoomMaxX) {
							newZoomMinX = Math.max(zoomMaxX - 1, limits.minX, zoomMinX);
						}

						$scope.set("MinX", newZoomMinX);

						if(newZoomMinX != zoomMinX) {
							zoomMinX = newZoomMinX;
							updateSelectionsWhenZoomingOrResizing();
							updateGraphicsHelper(false, true, true, true);
						}
					}
					break;
				case "MinY":
					var newZoomMinY = Math.max(parseFloat($scope.gimme("MinY")), limits.minY);
					if(!isNaN(newZoomMinY)) {
						if(newZoomMinY >= zoomMaxY) {
							newZoomMinY = Math.max(zoomMaxY - 1, limits.minY, zoomMinY);
						}

						$scope.set("MinY", newZoomMinY);

						if(newZoomMinY != zoomMinY) {
							zoomMinY = newZoomMinY;
							updateSelectionsWhenZoomingOrResizing();
							updateGraphicsHelper(false, true, true, true);
						}
					}
					break;
				case "FontSize":
					updateSize();
					updateGraphicsHelper(false, false, false, true);
					break;
				case "DrawingArea:height":
					updateSize();
					updateGraphicsHelper(true, true, true, true);
					break;
				case "DrawingArea:width":
					updateSize();
					updateGraphicsHelper(true, true, true, true);
					break;
				case "root:height":
					updateSize();
					updateGraphicsHelper(true, true, true, true);
					break;
				case "root:width":
					updateSize();
					updateGraphicsHelper(true, true, true, true);
					break;
				case "LogScaleForDots":
					var newLogScale = $scope.gimme("LogScaleForDots");
					if(newLogScale) {
						if(!logScale) {
							logScale = true;
							updateGraphicsHelper(false, false, true, false);
						}
					}
					else {
						if(logScale) {
							logScale = false;
							updateGraphicsHelper(false, false, true, false);
						}
					}
					break;

				case "MaxDotSize":
					var maxDotSizeNew = $scope.gimme('MaxDotSize');
					if(typeof maxDotSizeNew !== 'number') {
						try {
							maxDotSizeNew = parseInt(maxDotSizeNew);
						} catch(e) {
							maxDotSizeNew = 1;
						}
					}
					if(maxDotSizeNew < 1) {
						maxDotSizeNew = 1;
					}
					if(maxDotSizeNew < minDotSize) {
						minDotSize = maxDotSizeNew;
						maxDotSize = maxDotSizeNew;
						updateGraphicsHelper(false, false, false, false);
					}
					else if(maxDotSizeNew != maxDotSize) {
						maxDotSize = maxDotSizeNew;
						updateGraphicsHelper(false, false, false, false);
					}
					break;
				case "MinDotSize":
					var minDotSizeNew = $scope.gimme('MinDotSize');
					if(typeof minDotSizeNew !== 'number') {
						try {
							minDotSizeNew = parseInt(minDotSizeNew);
						} catch(e) {
							minDotSizeNew = 1;
						}
					}
					if(minDotSizeNew < 1) {
						minDotSizeNew = 1;
					}
					if(minDotSizeNew > maxDotSize) {
						maxDotSize = minDotSizeNew;
						minDotSize = minDotSizeNew;
						updateGraphicsHelper(false, false, false, false);
					}
					else if(minDotSizeNew != minDotSize) {
						minDotSize = minDotSizeNew;
						updateGraphicsHelper(false, false, false, false);
					}
					break;
				case "UseGlobalColorGradients":
					if(eventData.slotValue) {
						if(!useGlobalGradients) {
							useGlobalGradients = true;

							updateGraphicsHelper(false, false, true, false);
						}
					}
					else {
						if(useGlobalGradients) {
							useGlobalGradients = false;
							updateGraphicsHelper(false, false, true, false);
						}
					}
					break;
				case "PluginName":
					$scope.displayText = eventData.slotValue;
					break;
				case "PluginType":
					if(eventData.slotValue != "VisualizationPlugin") {
						$scope.set("PluginType", "VisualizationPlugin");
					}
					break;
				case "ColorScheme":
					colorPalette = null;
					parseSelectionColors();
					var colors = $scope.gimme("ColorScheme");
					if(typeof colors === 'string') {
						colors = JSON.parse(colors);
					}
					currentColors = legacyDDSupLib.copyColors(colors);
					updateGraphics();
					drawSelections();
					break;
			};
		} catch(exc) {
			$log.log(preDebugMsg + "Something went wrong when we tried to react to slot changes");
			console.dir(exc);
		}
	}
	//===================================================================================


	//===================================================================================
	// On Mouse Move
	// This event handler manages mouse movement.
	//===================================================================================
	var onMouseMove = function(e){
		if(unique > 0) {
			var currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};
			mouseIsOverMe = true;

			// hover text
			if(hoverText === null) {
				var elmnt = $scope.theView.parent().find('#mouseOverText');
				if(elmnt.length > 0) {
					hoverText = elmnt[0];
				}
				else {
					$log.log(preDebugMsg + "No hover text!");
				}
			}

			if(hoverText !== null) {
				if(mousePosIsInSelectableArea(currentMouse)) {
					var s = "[";

					if(storyGraphMode) {
						var x = pixel2time(currentMouse.x);
						s += legacyDDSupLib.number2text(x, timeDelta);
					}
					else {
						var x = legacyDDSupLib.pixel2valX(currentMouse.x, unique, drawW, leftMarg, zoomMinX, zoomMaxX);
						var y = legacyDDSupLib.pixel2valY(currentMouse.y, unique, drawW, leftMarg, zoomMinX, zoomMaxX);
						s += legacyDDSupLib.number2text(x, limits.spanX);
						s += ",";
						s += legacyDDSupLib.number2text(y, limits.spanY);
					}

					s += "]";
					var textW = legacyDDSupLib.getTextWidthCurrentFont(axCtx, s);
					hoverText.style.font = fontSize + "px Arial";
					hoverText.style.left = Math.floor(currentMouse.x - textW/2) + "px";
					hoverText.style.top = Math.floor(currentMouse.y - fontSize - 5) + "px";
					hoverText.innerHTML = s;
					hoverText.style.display = "block";
				}
				else {
					hoverText.style.display = "none";
				}
			}

			// selection rectangle, if clicked
			if(clickStart !== null) {
				if(selectionRect === null) {
					var selectionRectElement = $scope.theView.parent().find('#selectionRectangle');
					if(selectionRectElement.length > 0) {
						selectionRect = selectionRectElement[0];
					}
					else {
						$log.log(preDebugMsg + "No selection rectangle!");
					}
				}
				if(selectionRect !== null) {
					var x1 = currentMouse.x;
					var w = 1;
					if(clickStart.x < x1) {
						x1 = clickStart.x;
						w = currentMouse.x - x1;
					}
					else {
						w = clickStart.x - x1;
					}

					var y1 = currentMouse.y;
					var h = 1;
					if(clickStart.y < y1) {
						y1 = clickStart.y;
						h = currentMouse.y - y1;
					}
					else {
						h = clickStart.y - y1;
					}

					var selectionRectCtx = selectionRect.getContext("2d");
					selectionRectCtx.clearRect(0,0,selectionRect.width, selectionRect.height);

					if(selectionColors === null) {
						parseSelectionColors();
					}

					selectionRectCtx.fillStyle = selectionColors.color;
					selectionRectCtx.fillRect(x1, y1, w, h);
					selectionRectCtx.save();
					selectionRectCtx.strokeStyle = selectionColors.border;
					selectionRectCtx.strokeRect(x1, y1, w, h);
					selectionRectCtx.restore();
				}
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// On Mouse Down
	// This event handler manages mouse button down.
	//===================================================================================
	var onMouseDown = function(e){
		if(unique > 0) {
			// $log.log(preDebugMsg + "mouse down");
			if(e.shiftKey) {
				if(e.which === 1){
					currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

					if(mousePosIsInSelectableArea(currentMouse)) {
						selectClosestHalo(currentMouse);
					}
				}
			}
			else {
				if(!storyGraphMode) {
					if(e.which === 1){
						currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};

						if(mousePosIsInSelectableArea(currentMouse)) {
							clickStart = currentMouse;
							if(e.ctrlKey || e.metaKey) {
								clickStart.ctrl = true;
							}
							else {
								clickStart.ctrl = false;
							}

							selectionHolderElement.bind('mouseup', onMouseUp);
							e.stopPropagation();
						}
						else {
							clickStart = null;

							// also do the drag&drop related stuff
							var x = currentMouse.x;
							var y = currentMouse.y;

							var found = false;
							for(var dr = 0; dr < allDragNames.length; dr++){
								var drag = allDragNames[dr];
								if(drag.left >= 0 && x >= drag.left && x <= drag.right && y >= drag.top && y <= drag.bottom) {
									$scope.dragNdropRepr = drag.name;
									$scope.dragNdropID = drag.ID;
									$scope.theView.find('.dragSrc').draggable( 'enable' );
									$scope.theView.find('.dragSrc').attr("id", drag.ID);
									found = true;
								}
							}
							if(!found) {
								$scope.dragNdropRepr = "Nothing to drag.";
								$scope.dragNdropID = "No drag data.";
								$scope.theView.find('.dragSrc').attr("id", "no drag data");
								$scope.theView.find('.dragSrc').draggable( 'disable' );
							}
						}
					}
				}
				else {// storyGraphMode
					clickStart = null;

					// also do the drag&drop related stuff
					var x = currentMouse.x;
					var y = currentMouse.y;
					var found = false;
					for(var dr = 0; dr < allDragNames.length; dr++){
						var drag = allDragNames[dr];
						if(drag.left >= 0 && x >= drag.left && x <= drag.right && y >= drag.top && y <= drag.bottom) {
							$scope.dragNdropRepr = drag.name;
							$scope.dragNdropID = drag.ID;
							$scope.theView.find('.dragSrc').draggable( 'enable' );
							$scope.theView.find('.dragSrc').attr("id", drag.ID);
							found = true;
						}
					}
					if(!found) {
						$scope.dragNdropRepr = "Nothing to drag.";
						$scope.dragNdropID = "No drag data.";
						$scope.theView.find('.dragSrc').attr("id", "no drag data");
						$scope.theView.find('.dragSrc').draggable( 'disable' );
					}
				}
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// On Mouse Up
	// This event handler manages mouse button up.
	//===================================================================================
	var onMouseUp = function(e){
		if(unique > 0) {
			selectionHolderElement.unbind('mouseup');

			// check new selection rectangle
			if(clickStart !== null) {
				hideSelectionRect();
				currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};
				var x1 = currentMouse.x;
				var x2 = clickStart.x;
				if(x2 < x1) {
					x1 = clickStart.x;
					x2 = currentMouse.x;
				}

				var y1 = currentMouse.y;
				var y2 = clickStart.y;
				if(y2 < y1) {
					y1 = clickStart.y;
					y2 = currentMouse.y;
				}

				if(x1 == x2 && y1 == y2) {
					// selection is too small, disregard
					// $log.log(preDebugMsg + "ignoring a selection because it is too small");
				}
				else {
					newSelection(x1,x2, y1,y2, clickStart.ctrl);
				}
			}
		}
		clickStart = null;
	};
	//===================================================================================


	//===================================================================================
	// On Mouse Out
	// This event handler manages mouse leaving hover area.
	//===================================================================================
	var onMouseOut = function(e) {
		mouseIsOverMe = false;

		if(unique > 0) {
			if(hoverText === null) {
				var elmnt = $scope.theView.parent().find('#mouseOverText');
				if(elmnt.length > 0) {
					hoverText = elmnt[0];
				}
				else {
					$log.log(preDebugMsg + "No hover text!");
				}
			}
			if(hoverText !== null) {
				hoverText.style.display = "none";
			}

			if(clickStart !== null) {
				hideSelectionRect();
				currentMouse = {x: (e.offsetX || e.clientX - $(e.target).offset().left), y: (e.offsetY || e.clientY - $(e.target).offset().top)};
				var x1 = currentMouse.x;
				var x2 = clickStart.x;
				if(x2 < x1) {
					x1 = clickStart.x;
					x2 = currentMouse.x;
				}

				var y1 = currentMouse.y;
				var y2 = clickStart.y;
				if(y2 < y1) {
					y1 = clickStart.y;
					y2 = currentMouse.y;
				}

				if(x1 == x2 && y1 == y2) {
					// selection is too small, disregard
					// $log.log(preDebugMsg + "ignoring a selection because it is too small");
				}
				else {
					newSelection(x1,x2, y1,y2, clickStart.ctrl);
				}
			}
		}
		clickStart = null;
	};
	//===================================================================================


	//===================================================================================
	// Fixed Key Press
	// This event handler handles keyboard strokes.
	//===================================================================================
	function fixedKeypress(event){
		if(mouseIsOverMe) {
			var x = event.which || event.keyCode;
			// $log.log(preDebugMsg + "keyPressed over me: " + x);
			switch(x) {
				case 43: // +
				case 107:
				case 187:
				case 59: // ; (also on the plus key)
					event.stopPropagation();
					event.preventDefault();
					zoomIn();
					break;
				case 45: // -
				case 109:
				case 189:
				case 61: // = (also on the minus key)
				case 95: // _
					event.stopPropagation();
					event.preventDefault();
					zoomOut();
					break;
				case 37: // left arrow
					event.stopPropagation();
					event.preventDefault();
					panLeft();
					break;
				case 39: // right arrow
					event.stopPropagation();
					event.preventDefault();
					panRight();
					break;
				case 40: // down arrow
					event.stopPropagation();
					event.preventDefault();
					panDown();
					break;
				case 38: // up arrow
					event.stopPropagation();
					event.preventDefault();
					panUp();
					break;

				case 122: // z
				case 90: // Z
					event.stopPropagation();
					event.preventDefault();
					zoomIn();
					break;
				case 120: // x
				case 88: // X
					event.stopPropagation();
					event.preventDefault();
					zoomOut();
					break;
				case 97: // a
				case 65: // A
					event.stopPropagation();
					event.preventDefault();
					panLeft();
					break;
				case 100: // d
				case 68: // D
					event.stopPropagation();
					event.preventDefault();
					panRight();
					break;
				case 115: // s
				case 83: // S
					event.stopPropagation();
					event.preventDefault();
					panDown();
					break;
				case 119: // w
				case 87: // W
					event.stopPropagation();
					event.preventDefault();
					panUp();
					break;
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Zoom In
	// This event handler manages zoom in events.
	//===================================================================================
	function zoomIn() {
		var midX = (zoomMinX + zoomMaxX) / 2;
		var halfSpan = (zoomMaxX - zoomMinX) / 2;
		zoomMinX = midX - halfSpan / 2;
		zoomMaxX = midX + halfSpan / 2;
		var midY = (zoomMinY + zoomMaxY) / 2;
		halfSpan = (zoomMaxY - zoomMinY) / 2;
		zoomMinY = midY - halfSpan / 2;
		zoomMaxY = midY + halfSpan / 2;
		$scope.set("MinX", zoomMinX);
		$scope.set("MaxX", zoomMaxX);
		$scope.set("MinY", zoomMinY);
		$scope.set("MaxY", zoomMaxY);
		updateSelectionsWhenZoomingOrResizing();
		updateGraphicsHelper(false, false, false, false);
	}
	//===================================================================================


	//===================================================================================
	// Zoom Out
	// This event handler manages zoom out events.
	//===================================================================================
	function zoomOut() {
		var midX = (zoomMinX + zoomMaxX) / 2;
		var halfSpan = (zoomMaxX - zoomMinX)/ 2;
		zoomMinX = Math.max(limits.minX, midX - halfSpan * 2);
		zoomMaxX = Math.min(limits.maxX, midX + halfSpan * 2);
		var midY = (zoomMinY + zoomMaxY) / 2;
		halfSpan = (zoomMaxY - zoomMinY) / 2;
		zoomMinY = Math.max(limits.minY, midY - halfSpan * 2);
		zoomMaxY = Math.min(limits.maxY, midY + halfSpan * 2);
		$scope.set("MinX", zoomMinX);
		$scope.set("MaxX", zoomMaxX);
		$scope.set("MinY", zoomMinY);
		$scope.set("MaxY", zoomMaxY);
		updateSelectionsWhenZoomingOrResizing();
		updateGraphicsHelper(false, false, false, false);
	}
	//===================================================================================


	//===================================================================================
	// Pan Left
	// This event handler manages pan left events.
	//===================================================================================
	function panLeft() {
		if(zoomMinX > limits.minX) {
			var shift = zoomMinX - limits.minX;
			var halfSpan = (zoomMaxX - zoomMinX) / 2;
			if(shift < halfSpan) {
				zoomMinX = limits.minX;
			}
			else {
				zoomMinX -= halfSpan;
			}
			zoomMaxX = zoomMinX + halfSpan*2;

			$scope.set("MinX", zoomMinX);
			$scope.set("MaxX", zoomMaxX);
			updateSelectionsWhenZoomingOrResizing();
			updateGraphicsHelper(false, true, true, true);
		}
	}
	//===================================================================================


	//===================================================================================
	// Pan Right
	// This event handler manages pan right events.
	//===================================================================================
	function panRight() {
		if(zoomMaxX < limits.maxX) {
			var shift = limits.maxX - zoomMaxX;
			var halfSpan = (zoomMaxX - zoomMinX) / 2;
			if(shift < halfSpan) {
				zoomMaxX = limits.maxX;
			}
			else {
				zoomMaxX += halfSpan;
			}
			zoomMinX = zoomMaxX - halfSpan*2;

			$scope.set("MinX", zoomMinX);
			$scope.set("MaxX", zoomMaxX);
			updateSelectionsWhenZoomingOrResizing();
			updateGraphicsHelper(false, true, true, true);
		}
	}
	//===================================================================================


	//===================================================================================
	// Pan Down
	// This event handler manages pan down events.
	//===================================================================================
	function panDown() {
		if(zoomMinY > limits.minY) {
			var shift = zoomMinY - limits.minY;
			var halfSpan = (zoomMaxY - zoomMinY) / 2;
			if(shift < halfSpan) {
				zoomMinY = limits.minY;
			}
			else {
				zoomMinY -= halfSpan;
			}
			zoomMaxY = zoomMinY + halfSpan*2;

			$scope.set("MinY", zoomMinY);
			$scope.set("MaxY", zoomMaxY);
			updateSelectionsWhenZoomingOrResizing();
			updateGraphicsHelper(false, true, true, true);
		}
	}
	//===================================================================================


	//===================================================================================
	// Pan Up
	// This event handler manages pan up events.
	//===================================================================================
	function panUp() {
		if(zoomMaxY < limits.maxY) {
			var shift = limits.maxY - zoomMaxY;
			var halfSpan = (zoomMaxY - zoomMinY) / 2;
			if(shift < halfSpan) {
				zoomMaxY = limits.maxY;
			}
			else {
				zoomMaxY += halfSpan;
			}
			zoomMinY = zoomMaxY - halfSpan*2;

			$scope.set("MinY", zoomMinY);
			$scope.set("MaxY", zoomMaxY);
			updateSelectionsWhenZoomingOrResizing();
			updateGraphicsHelper(false, true, true, true);
		}
	}
	//===================================================================================



	//=== METHODS & FUNCTIONS ===========================================================

	//===================================================================================
	// Webble template Initialization
	//===================================================================================
	$scope.coreCall_Init = function(theInitWblDef){
		$scope.addPopupMenuItemDisabled('EditCustomMenuItems');
		$scope.addPopupMenuItemDisabled('EditCustomInteractionObjects');
		$scope.addPopupMenuItemDisabled('AddCustomSlots');

		var ios = $scope.theInteractionObjects;
		for(var i = 0, io; i < ios.length; i++){
			io = ios[i];
			if(io.scope().getName() == 'Resize'){
				io.scope().setIsEnabled(false);
			}
			if(io.scope().getName() == 'Rotate'){
				io.scope().setIsEnabled(false);
			}
		}

		$scope.addSlot(new Slot('MultipleSelectionsDifferentGroups',
			grouping,
			"Multiple Selections -> Different Groups",
			'If true, multiple selections will generate subsets of data in different colors. If false, the subsets of data will just be "selected" and "not selected".',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('SelectAll',
			false,
			"Select All",
			'Slot to quickly reset all selections to select all available data.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('ClearData',
			false,
			"Clear Data",
			'Slot to quickly reset to having no data.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// internal slots specific to this Webble -----------------------------------------------------------

		$scope.addSlot(new Slot('FontSize',
			fontSize,
			"Font Size",
			'The font size to use in the Webble interface.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('MinDotSize',
			minDotSize,
			"MinDotSize",
			'The size (in pixels) of the smallest dots in the plot.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));
		$scope.addSlot(new Slot('MaxDotSize',
			maxDotSize,
			"MaxDotSize",
			'The size (in pixels) of the largest dots in the plot.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('LogScaleForDots',
			logScale,
			"Log Scale for Dots",
			'Use the logarithm of the size parameter to scale the dots (instead of the raw value).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('Transparency',
			transparency,
			"Transparency",
			'Transparency, from 0 to 1, of the dots and lines to draw.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('UseGlobalColorGradients',
			useGlobalGradients,
			"Use Global Color Gradients",
			'Should each bar be shaded individually (all get same colors) or should the color gradient span across all the bars.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('MinX',
			0,
			"Minimum X",
			'The minimum X value to display (used when zooming).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('MaxX',
			1,
			"Maximum X",
			'The maximum X value to display (used when zooming).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('MinY',
			0,
			"Minimum Y",
			'The minimum Y value to display (used when zooming).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('MaxY',
			1,
			"Maximum Y",
			'The maximum Y value to display (used when zooming).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('QuickRenderThreshold',
			quickRenderThreshold,
			"Quick Render Threshold",
			'The number of data items to accept before switching to faster (but less pretty) rendering.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('StoryGraphMode',
			storyGraphMode,
			"StoryGraph Mode",
			'Rendering as StoryGraph (3-dimensional plotting, left side X axis, right side Y axis, x-axis as time).',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		// Dashboard Plugin slots -----------------------------------------------------------

		$scope.addSlot(new Slot('ColorScheme',
			{"skin":{"text":"#000000","color":"#fff2e6","border":"#663300","gradient":[{"pos":0,"color":"#ffffff"},{"pos":0.75,"color":"#fff2e6"},{"pos":1,"color":"#fff2e6"}]},
				"selection":{"color":"#ffbf80","border":"#ffa64d","gradient":[{"pos":0,"color":"#ffd9b3"},{"pos":1,"color":"#ffbf80"}]},
				"groups":{0:{"color":"#A9A9A9","gradient":[{"pos":0,"color":"#EEEEEE"},{"pos":0.75,"color":"#A9A9A9"}]},
					1:{"color":"#0000FF","gradient":[{"pos":0,"color":"#CCCCFF"},{"pos":0.75,"color":"#0000FF"}]},
					2:{"color":"#7FFF00","gradient":[{"pos":0,"color":"#E5FFCC"},{"pos":0.75,"color":"#7FFF00"}]},
					3:{"color":"#8A2BE2","gradient":[{"pos":0,"color":"#E8D5F9"},{"pos":0.75,"color":"#8A2BE2"}]},
					4:{"color":"#FF7F50","gradient":[{"pos":0,"color":"#FFE5DC"},{"pos":0.75,"color":"#FF7F50"}]},
					5:{"color":"#DC143C","gradient":[{"pos":0,"color":"#F8D0D8"},{"pos":0.75,"color":"#DC143C"}]},
					6:{"color":"#006400","gradient":[{"pos":0,"color":"#CCE0CC"},{"pos":0.75,"color":"#006400"}]},
					7:{"color":"#483D8B","gradient":[{"pos":0,"color":"#DAD8E8"},{"pos":0.75,"color":"#483D8B"}]},
					8:{"color":"#FF1493","gradient":[{"pos":0,"color":"#FFD0E9"},{"pos":0.75,"color":"#FF1493"}]},
					9:{"color":"#1E90FF","gradient":[{"pos":0,"color":"#D2E9FF"},{"pos":0.75,"color":"#1E90FF"}]},
					10:{"color":"#FFD700","gradient":[{"pos":0,"color":"#FFF7CC"},{"pos":0.75,"color":"#FFD700"}]},
					11:{"color":"#8B4513","gradient":[{"pos":0,"color":"#E8DAD0"},{"pos":0.75,"color":"#8B4513"}]},
					12:{"color":"#FFF5EE","gradient":[{"pos":0,"color":"#FFFDFC"},{"pos":0.75,"color":"#FFF5EE"}]},
					13:{"color":"#00FFFF","gradient":[{"pos":0,"color":"#CCFFFF"},{"pos":0.75,"color":"#00FFFF"}]},
					14:{"color":"#000000","gradient":[{"pos":0,"color":"#CCCCCC"},{"pos":0.75,"color":"#000000"}]}}},
			"Color Scheme",
			'Input Slot. Mapping group numbers to colors.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('PluginName',
			"Halo Merger Plot",
			'Plugin Name',
			'The name to display in menus etc.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('PluginType',
			"VisualizationPlugin",
			"Plugin Type",
			'The type of plugin this is. Should always be "VisualizationPlugin".',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.addSlot(new Slot('InternalSelections',
			{},
			"Internal Selections",
			'Slot to save the internal state of what is selected.',
			$scope.theWblMetadata['templateid'],
			undefined,
			undefined
		));

		$scope.setDefaultSlot('ColorScheme');
		myInstanceId = $scope.getInstanceId();

		$scope.registerWWEventListener(Enum.availableWWEvents.slotChanged, function(eventData){
			mySlotChange(eventData);
		});

		updateSize();

		var maxDotSizeNew = $scope.gimme('MaxDotSize');
		if(typeof maxDotSizeNew !== 'number') {
			try {
				maxDotSizeNew = parseInt(maxDotSizeNew);
			} catch(e) {
				maxDotSizeNew = 1;
			}
		}
		if(maxDotSizeNew < 1) {
			maxDotSizeNew = 1;
		}
		maxDotSize = maxDotSizeNew;

		var minDotSizeNew = $scope.gimme('MinDotSize');
		if(typeof minDotSizeNew !== 'number') {
			try {
				minDotSizeNew = parseInt(minDotSizeNew);
			} catch(e) {
				minDotSizeNew = 1;
			}
		}
		if(minDotSizeNew < 1) {
			minDotSizeNew = 1;
		}
		if(minDotSizeNew > maxDotSize) {
			maxDotSize = minDotSizeNew;
		}
		minDotSize = minDotSizeNew;

		updateGraphicsHelper(true, true, true, true);

		selectionHolderElement = $scope.theView.parent().find('#selectionHolder');
		if(selectionHolderElement !== null){
			selectionHolderElement.bind('mousedown', onMouseDown);
			selectionHolderElement.bind('mousemove', onMouseMove);
			selectionHolderElement.bind('mouseout', onMouseOut);
		}
		else {
			$log.log(preDebugMsg + "No selectionHolderElement, could not bind mouse listeners");
		}

		window.addEventListener( 'keydown', fixedKeypress );
		$scope.fixDroppable();
		$scope.fixDraggable();
	};
	//===================================================================================


	// ============================================================
	// ------- Methods Similar to all Visualization Webbles -------
	// ============================================================

	//===================================================================================
	// Fix Draggable
	// This method fixes the draggable behavior to behave as wanted.
	//===================================================================================
	$scope.fixDraggable = function () {
		$scope.theView.find('.dragSrc').draggable({
			helper: function() {
				return $("<div id=\"" + $scope.dragNdropID + "\">" + $scope.dragNdropRepr + "</div>");
			},
			cursorAt: {top: 5, left: 5}
		});
	};
	//===================================================================================


	//===================================================================================
	// Fix Droppable
	// This method fixes the droppable behavior to behave as wanted.
	//===================================================================================
	$scope.fixDroppable = function () {
		$scope.theView.find('.canvasStuffForHopVizHaloMergeWebble').droppable({
			over: function(e, ui) {
				if(e.target.id == "selectionHolder") {
					updateDropZones(textColor, 1, true);
				}
			},
			out: function() {
				updateDropZones(textColor, 0.3, false);
			},
			tolerance: 'pointer',
			drop: function(e, ui){
				if(e.target.id == "selectionHolder") {
					e.preventDefault();
					var xpos = e.offsetX;
					var ypos = e.offsetY;
					var ok = false;
					var x = e.originalEvent.pageX - $(this).offset().left;
					var y = e.originalEvent.pageY - $(this).offset().top;
					xpos = x;
					ypos = y;

					for(var d = 0; !ok && d < allDropZones.length; d++) {
						var dropZone = allDropZones[d];

						if(xpos <= dropZone.right && xpos >= dropZone.left && ypos >= dropZone.top && ypos < dropZone.bottom) {
							f = dropZone.forMapping;
							ok = true;
						}
					}
					if(ok) {
						dataDropped(ui.draggable.attr('id'), f);
					}
				}
				updateDropZones(textColor, 0.3, false);
			}
		});
	};
	//===================================================================================


	//===================================================================================
	// Fake Drop
	// This method imitates a file drop.
	//===================================================================================
	$scope.fakeDrop = function(dataSourceInfo, vizualizationFieldName) {
		var ok = false;
		var f = null;

		for(var d = 0; !ok && d < allDropZones.length; d++) {
			var dropZone = allDropZones[d];

			if(dropZone.forMapping.name == vizualizationFieldName) {
				f = dropZone.forMapping;
				ok = true;
			}
		}

		if(ok) {
			dataDropped(dataSourceInfo, f);
		}
	};
	//===================================================================================


	//===================================================================================
	// Clear Data
	// This method clears away all data.
	//===================================================================================
	$scope.clearData = function() {
		var oldMappings = dataMappings;

		resetVars();
		dataMappings = [];
		updateGraphics();

		for(var src = 0; src < oldMappings.length; src++) {
			if(oldMappings[src].hasOwnProperty("newSelections") && oldMappings[src].newSelections !== null) {
				oldMappings[src].newSelections(myInstanceId, null, false, true);
			}

			if(oldMappings[src].hasOwnProperty("listen") && oldMappings[src].listen !== null) {
				oldMappings[src].listen(myInstanceId, false, null, null, []);
			}

			for(var i = 0; i < oldMappings[src].map.length; i++) {
				if(oldMappings[src].map[i].hasOwnProperty("listen") && oldMappings[src].map[i].listen !== null) {
					oldMappings[src].map[i].listen(myInstanceId, false, null, null, []);
				}

				if(oldMappings[src].map[i].hasOwnProperty("newSelections") && oldMappings[src].map[i].newSelections !== null) {
					oldMappings[src].map[i].newSelections(myInstanceId, null, false, true);
				}
			}
		}
	};
	//===================================================================================


	//===================================================================================
	// Type Check
	// This method check the types for the specified parameters.
	//===================================================================================
	function typeCheck(t1, t2) {
		for(var i = 0; i < t1.length; i++) {
			for(var j = 0; j < t2.length; j++) {
				if(t1[i] == t2[j]) {
					// found a compatible interpretation of the types
					return 1;
				}
			}
		}
		return 0;
	}
	//===================================================================================


	//===================================================================================
	// Check Mappings and Parse Data
	// This method checks the mappings and parse the data.
	//===================================================================================
	function checkMappingsAndParseData() {
		// $log.log(preDebugMsg + "checkMappingsAndParseData");
		parsingDataNow = true;
		var somethingChanged = false;
		var atLeastOneActive = false;

		for(var src = 0; src < dataMappings.length; src++) {
			var typeError = false;
			var w = $scope.getWebbleByInstanceId(dataMappings[src].srcID);
			var ls = w.scope().gimme(dataMappings[src].slotName);
			var haveX = false;
			var haveY = false;
			var haveSize = false;
			var haveHaloID = false;
			var haveTime = false;
			var haveDescendantID = false;
			haveIDs = false;
			storyGraphMode = false;
			var xdesc = "";
			var ydesc = "";
			var sdesc = "";

			for(var f = 0; f < dataMappings[src].map.length; f++) {
				if(dataMappings[src].map[f].srcIdx < ls.length) {
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];

					if(dataMappings[src].map[f].name == "X") {
						if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropX.forMapping.type)) {
							typeError = true;
							dataMappings[src].map[f].active = false;
						}
						else {
							dataMappings[src].map[f].listen = fieldInfo.listen;
							dataMappings[src].map[f].active = true;
							haveX = true;
							xdesc = fieldInfo.name;
							xName = legacyDDSupLib.shortenName(xdesc);
						}
					}

					if(dataMappings[src].map[f].name == "Y") {
						if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropY.forMapping.type)) {
							typeError = true;
							dataMappings[src].map[f].active = false;
						}
						else {
							dataMappings[src].map[f].listen = fieldInfo.listen;
							dataMappings[src].map[f].active = true;
							haveY = true;
							ydesc = fieldInfo.name;
							yName = legacyDDSupLib.shortenName(ydesc);
						}
					}

					if(dataMappings[src].map[f].name == "Size") {
						if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropSize.forMapping.type)) {
							typeError = true;
							dataMappings[src].map[f].active = false;
						}
						else {
							dataMappings[src].map[f].listen = fieldInfo.listen;
							dataMappings[src].map[f].active = true;
							haveSize = true;
							sdesc = fieldInfo.name;
							sName =  legacyDDSupLib.shortenName(sdesc);
						}
					}

					if(dataMappings[src].map[f].name == "Time stamp") {
						if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropTime.forMapping.type)) {
							typeError = true;
							dataMappings[src].map[f].active = false;
						}
						else {
							dataMappings[src].map[f].listen = fieldInfo.listen;
							dataMappings[src].map[f].active = true;
							haveTime = true;
						}
					}

					if(dataMappings[src].map[f].name == "ID") {
						if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropID.forMapping.type)) {
							typeError = true;
							dataMappings[src].map[f].active = false;
						}
						else {
							dataMappings[src].map[f].listen = fieldInfo.listen;
							dataMappings[src].map[f].active = true;
							haveHaloID = true;
						}
					}

					if(dataMappings[src].map[f].name == "Descendant ID") {
						if(dataMappings[src].map[f].srcIdx >= ls.length || !typeCheck(fieldInfo.type, dropChID.forMapping.type)) {
							typeError = true;
							dataMappings[src].map[f].active = false;
						}
						else {
							dataMappings[src].map[f].listen = fieldInfo.listen;
							dataMappings[src].map[f].active = true;
							haveDescendantID = true;
						}
					}
				}
			}

			var canActivate = false;
			if(haveX && haveY && haveSize) {
				canActivate = true;
				atLeastOneActive = true;
			}

			if(canActivate && haveTime && haveHaloID && haveDescendantID) {
				haveIDs = true;
			}

			storyGraphMode = false;
			if($scope.gimme("StoryGraphMode")) {
				storyGraphMode = true;
			}

			if(dataMappings[src].active != canActivate) {
				// we can start visualizing this data
				dataMappings[src].clean = false;
				somethingChanged = true;
			}

			if(canActivate) {
				var ls2 = [];
				for(var ff = 0; ff < dataMappings[src].map.length; ff++) {
					// lex[dataMappings[src].map[ff].idx] = true;
					ls2.push(dataMappings[src].map[ff].srcIdx);
				}

				// start listening to updates
				for(var i = 0; i < dataMappings[src].map.length; i++) {
					// $log.log(preDebugMsg + "Start listening to " + dataMappings[src].map[i].name + " " + dataMappings[src].map[i].srcIdx);
					if(dataMappings[src].map[i].active && dataMappings[src].map[i].hasOwnProperty("listen") && dataMappings[src].map[i].listen !== null) {
						dataMappings[src].map[i].listen(myInstanceId, canActivate, redrawOnNewSelections, redrawOnNewData, ls2);
					} else {
						// $log.log(preDebugMsg + "Stop listening to " + dataMappings[src].map[i].name + " " + dataMappings[src].map[i].srcIdx);
						if(dataMappings[src].map[i].hasOwnProperty("listen") && dataMappings[src].map[i].listen !== null) {
							dataMappings[src].map[i].listen(myInstanceId, false, null, null, []);
						}
					}
				}
			} else {
				// stop listening to updates
				for(var i = 0; i < dataMappings[src].map.length; i++) {
					dataMappings[src].map[i].active = false;

					if(dataMappings[src].map[i].hasOwnProperty("listen") && dataMappings[src].map[i].listen !== null) {
						// $log.log(preDebugMsg + "Not active, stop listening to " + dataMappings[src].map[i].name + " " + dataMappings[src].map[i].srcIdx);
						dataMappings[src].map[i].listen(myInstanceId, false, null, null, []);
					}
				}
			}
			dataMappings[src].active = canActivate;
		}

		if(somethingChanged || atLeastOneActive) {
			parseData();
		}
		else {
			parsingDataNow = false;
		}
	}
	//===================================================================================


	//===================================================================================
	// Redraw on New Data
	// This method checks weather it is time to redraw based on new data.
	//===================================================================================
	function redrawOnNewData(seqNo) {
		if(lastSeenDataSeqNo != seqNo) {
			lastSeenDataSeqNo = seqNo;
			checkMappingsAndParseData();
		}
	}
	//===================================================================================


	//===================================================================================
	// Redraw on New Selections
	// This method checks weather it is time to redraw based on new Selections.
	//===================================================================================
	function redrawOnNewSelections(seqNo) {
		if(lastSeenSelectionSeqNo != seqNo) {
			lastSeenSelectionSeqNo = seqNo;
			updateGraphicsHelper(false, true, true, true);
		}
	}
	//===================================================================================


	//===================================================================================
	// Data Dropped
	// This method manages what to do with the data being dropped.
	//===================================================================================
	function dataDropped(dataSourceInfoStr, targetField) {
		$log.log(preDebugMsg + "data dropped");
		try {
			var dataSourceInfo = JSON.parse(dataSourceInfoStr);

			if(typeCheck(dataSourceInfo.type, targetField.type)) {
				var srcWebble = $scope.getWebbleByInstanceId(dataSourceInfo.webbleID);
				var accessorFunctionList = srcWebble.scope().gimme(dataSourceInfo.slotName);
				var accessorFunctions = accessorFunctionList[dataSourceInfo.fieldIdx];
				var displayNameS = dataSourceInfo.sourceName;
				var displayNameF = dataSourceInfo.fieldName;
				var somethingChanged = false;
				var newSrc = true;
				var mapSrcIdx = 0;
				for(var i = 0; i < dataMappings.length; i++) {
					if(dataMappings[i].srcID == dataSourceInfo.webbleID) {
						newSrc = false;
						mapSrcIdx = i;
						break;
					}
				}
				if(newSrc) {
					mapSrcIdx = dataMappings.length;
					dataMappings.push({'srcID':dataSourceInfo.webbleID, 'map':[], 'active':false, 'clean':true, 'slotName':dataSourceInfo.slotName});
					somethingChanged = true;
				}

				var found = false;
				for(var i = 0; i < dataMappings[mapSrcIdx].map.length; i++) {
					if(dataMappings[mapSrcIdx].map[i].name == targetField.name) { // already had something mapped here
						if(dataMappings[mapSrcIdx].map[i].srcIdx == dataSourceInfo.fieldIdx) {
							// same field dropped in same place again, nothing to do
						}
						else {
							// inform previous source that we are no longer using the data
							if(dataMappings[mapSrcIdx].hasOwnProperty("newSelections") && dataMappings[mapSrcIdx].newSelections !== null) {
								dataMappings[mapSrcIdx].newSelections(myInstanceId, null, false, true); // let them know we are no longer actively visualizing (which we maybe were before)
							}

							var onlyOne = true;
							for(var ii = 0; ii < dataMappings[mapSrcIdx].map.length; ii++) {
								if(ii != i && dataMappings[mapSrcIdx].map[ii].srcIdx == dataMappings[mapSrcIdx].map[i].srcIdx) {
									// same data field on a different axis
									onlyOne = false;
								}
							}
							if(onlyOne) {
								//  if this was the only field listening to updates, stop listening
								// $log.log(preDebugMsg + "Last one, stop listening to " + dataMappings[mapSrcIdx].map[i].name);

								if(dataMappings[mapSrcIdx].map[i].hasOwnProperty("listen") && dataMappings[mapSrcIdx].map[i].listen !== null) {
									dataMappings[mapSrcIdx].map[i].listen(myInstanceId, false, null, null, []);
								}
							}

							// replace old mapping
							dataMappings[mapSrcIdx].map[i].srcIdx = dataSourceInfo.fieldIdx;
							dataMappings[mapSrcIdx].map[i].drag = dataSourceInfoStr;
							dataMappings[mapSrcIdx].clean = false;
							somethingChanged = true;
						}
						found = true;
						break;
					}
				}

				if(!found) {
					dataMappings[mapSrcIdx].map.push({'srcIdx':dataSourceInfo.fieldIdx, 'name':targetField.name, 'listen':null, 'drag':dataSourceInfoStr}); // we need to rename the "New Coordinate" field
					dataMappings[mapSrcIdx].clean = false;
					somethingChanged = true;
				}

				if(targetField.name == "X") {
					dragZoneX.ID = JSON.stringify(dataSourceInfo);
				}
				if(targetField.name == "Y") {
					dragZoneY.ID = JSON.stringify(dataSourceInfo);
				}
				if(targetField.name == "Size") {
					dragZoneSize.ID = JSON.stringify(dataSourceInfo);
				}

				if(somethingChanged) {
					checkMappingsAndParseData();
				}
			}
			else {
				$log.log(preDebugMsg + dataSourceInfo.sourceName + " field " + dataSourceInfo.fieldName + " and " + $scope.displayText + " field " + targetField.name + " do not have compatible types.");
			}
		} catch(e) {
			$log.log(preDebugMsg + "FAIL");
			// not proper JSON, probably something random was dropped on us so let's ignore this event
		}
	}
	//===================================================================================


	//===================================================================================
	// Save Selections in Slot
	// This method saves the selection into a slot.
	//===================================================================================
	function saveSelectionsInSlot() {
		// $log.log(preDebugMsg + "saveSelectionsInSlot");
		var result = {};
		result.selections = [];
		for(var sel = 0; sel < selections.length; sel++) {
			result.selections.push({'minX':selections[sel][0], 'maxX':selections[sel][1], 'minY':selections[sel][2], 'maxY':selections[sel][3]});
		}

		internalSelectionsInternallySetTo = result;
		$scope.set('InternalSelections', result);
	}
	//===================================================================================


	//===================================================================================
	// Set Selections From a Slot
	// This method sets the selections based on the value in a slot.
	//===================================================================================
	function setSelectionsFromSlotValue() {
		// $log.log(preDebugMsg + "setSelectionsFromSlotValue");
		var slotSelections = $scope.gimme("InternalSelections");
		if(typeof slotSelections === 'string') {
			slotSelections = JSON.parse(slotSelections);
		}

		if(JSON.stringify(slotSelections) == JSON.stringify(internalSelectionsInternallySetTo)) {
			// $log.log(preDebugMsg + "setSelectionsFromSlotValue got identical value");
			return;
		}

		if(slotSelections.hasOwnProperty("selections")) {
			var newSelections = [];

			if(unique > 0) {
				for(var sel = 0; sel < slotSelections.selections.length; sel++) {
					var newSel = slotSelections.selections[sel];
					var X1 = newSel.minX;
					var X2 = newSel.maxX;
					var Y1 = newSel.minY;
					var Y2 = newSel.maxY;
					if(X2 < limits.minX || X1 > limits.maxX || Y2 < limits.minY || Y1 > limits.maxY) {
						// completely outside
						continue;
					}

					X1 = Math.max(limits.minX, X1);
					X2 = Math.min(limits.maxX, X2);
					Y1 = Math.max(limits.minY, Y1);
					Y2 = Math.min(limits.maxY, Y2);

					newSelections.push([X1,X2,Y1,Y2, val2pixelXcrimp(X1),val2pixelXcrimp(X2),val2pixelYcrimp(Y2),val2pixelYcrimp(Y1)]); // flip Y-axis
				}

				// $log.log(preDebugMsg + "new selections: " + JSON.stringify(newSelections));
				if(newSelections.length > 0) {
					selections = newSelections;
					updateLocalSelections(false);
					drawSelections();
				}
			}
			else { // no data
				for(var sel = 0; sel < slotSelections.selections.length; sel++) {
					var newSel = slotSelections.selections[sel];
					var X1 = newSel.minX;
					var X2 = newSel.maxX;
					var Y1 = newSel.minY;
					var Y2 = newSel.maxY;

					newSelections.push([X1,X2,Y1,Y2, 0,0,0,0]);
				}
				selections = newSelections;
			}
		}
		saveSelectionsInSlot();
	}
	//===================================================================================


	//===================================================================================
	// Check Selections After New Data
	// This method checks the validity of the selection after new data have been added.
	//===================================================================================
	function checkSelectionsAfterNewData() {
		// $log.log(preDebugMsg + "checkSelectionsAfterNewData");
		var newSelections = [];

		for(var sel = 0; sel < selections.length; sel++) {
			var newSel = selections[sel];
			var X1 = newSel[0];
			var X2 = newSel[1];
			var Y1 = newSel[2];
			var Y2 = newSel[3];

			if(X2 < limits.minX || X1 > limits.maxX || Y2 < limits.minY || Y1 > limits.maxY) {
				// completely outside
				continue;
			}

			X1 = Math.max(limits.minX, X1);
			X2 = Math.min(limits.maxX, X2);
			Y1 = Math.max(limits.minY, Y1);
			Y2 = Math.min(limits.maxY, Y2);

			newSelections.push([X1,X2,Y1,Y2, val2pixelXcrimp(X1),val2pixelXcrimp(X2),val2pixelYcrimp(Y2),val2pixelYcrimp(Y1)]); // flip Y-axis
		}

		if(newSelections.length > 0) {
			selections = newSelections;
			drawSelections();
			return false;
		}
		return true;
	}
	//===================================================================================


	//===================================================================================
	// Update Local Selections
	// This method updates the local selections to be in phase with global ones.
	//===================================================================================
	function updateLocalSelections(selectAll) {
		// $log.log(preDebugMsg + "updateLocalSelections");
		var newnullAsUnselected = $scope.gimme('TreatNullAsUnselected');
		if(newnullAsUnselected != nullAsUnselected) {
			nullAsUnselected = newnullAsUnselected;
			dirty = true;
		}

		var newnullGroup = 0;
		if(!nullAsUnselected) {
			newnullGroup = selections.length + 1; // get unused groupId
		}
		if(nullGroup != newnullGroup) {
			nullGroup = newnullGroup;
			dirty = true;
		}

		var newGrouping = $scope.gimme('MultipleSelectionsDifferentGroups');
		if(newGrouping != grouping) {
			grouping = newGrouping;
			dirty = true;
		}

		selections.sort(function(a,b){return ((a[1]-a[0]) * (a[3]-a[2])) - ((b[1]-b[0]) * (b[3]-b[2]));}); // sort selections so smaller (area) ones are checked first.

		if(!selectAll) {
			if(selections.length == 1 && selections[0][0] <= limits.minX && selections[0][1] >= limits.maxX && selections[0][2] <= limits.minY && selections[0][3] >= limits.maxY) {
				selectAll = true;
			}
		}

		for(var src = 0; src < dataMappings.length; src++) {
			if(dataMappings[src].active) {
				var srcsrc = src;
				dataMappings[src].newSelections(myInstanceId, function(idx) { return mySelectionStatus(srcsrc, idx); }, false, selectAll);
			}
			else {
				dataMappings[src].newSelections(myInstanceId, null, false, true); // let them know we are no longer actively visualizing (which we maybe were before)

				for(var ff = 0; ff < dataMappings[src].map.length; ff++) {
					if(dataMappings[src].map[ff].hasOwnProperty("listen") && dataMappings[src].map[ff].listen !== null) {
						// $log.log(preDebugMsg + "Not active (selection), stop listening to " + dataMappings[src].map[ff].name + " " + dataMappings[src].map[ff].srcIdx);
						dataMappings[src].map[ff].listen(myInstanceId, false, null, null, []);
					}
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// My Selection Status
	// This method returns this Webbles selection status.
	//===================================================================================
	function mySelectionStatus(src, idx) {
		if(parsingDataNow) {
			return 1;
		}

		if(dataMappings[src].active) {
			if(highlightedHalo.hasOwnProperty("src") && highlightedHalo.src == src) {
				if(highlightedHalo.idx == idx) {
					return selections.length + 1;
				}

				if(highlightedDescendants.hasOwnProperty("src") && highlightedDescendants.src == src && highlightedDescendants.hasOwnProperty("idxs") && highlightedDescendants.idxs.hasOwnProperty(idx)) {
					return selections.length + 2;
				}

				if(highlightedAncestors.hasOwnProperty("src") && highlightedAncestors.src == src && highlightedAncestors.hasOwnProperty("idxs") && highlightedAncestors.idxs.hasOwnProperty(idx)) {
					return selections.length + 3;
				}
			}

			if(storyGraphMode) {
				var x = dataMappings[src].funX(idx);
				var y = dataMappings[src].funY(idx);
				var s = dataMappings[src].funSize(idx);
				var t = dataMappings[src].funTime(idx);

				if(x === null || y === null || s === null || t === null) {
					return nullGroup;
				}

				var px = val2pixelXtime(t);
				var py = val2pixelYstory(x, y, t);

				if(selections.length > 0) {
					var groupId = 0;
					for(var span = 0; span < selections.length; span++) {
						if(selections[span][0] <= px && px <= selections[span][1] && selections[span][2] <= py && py <= selections[span][3]) {
							groupId = span + 1;
							break;
						}
					}

					if(!grouping && groupId > 0) {
						groupId = 1;
					}

					return groupId;
				}

			}
			else {
				var x = dataMappings[src].funX(idx);
				var y = dataMappings[src].funY(idx);
				var s = dataMappings[src].funSize(idx);

				if(x === null || y === null || s === null) {
					return nullGroup;
				}

				if(selections.length > 0) {
					var groupId = 0;
					for(var span = 0; span < selections.length; span++) {
						if(selections[span][0] <= x && x <= selections[span][1] && selections[span][2] <= y && y <= selections[span][3]) {
							groupId = span + 1;
							break;
						}
					}

					if(!grouping && groupId > 0) {
						groupId = 1;
					}

					return groupId;
				}
			}
		}
		return 1;
	}
	//===================================================================================


	//===================================================================================
	// Reset Vars
	// This method resets all the main variables for the plugin Webble getting it ready
	// for new fresh data.
	//===================================================================================
	function resetVars() {
		xName = "";
		yName = "";
		storyGraphMode = false;
		limits = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0};
		unique = 0;
		NULLs = 0;
	}
	//===================================================================================


	//===================================================================================
	// Parse Data
	// This method parses the data.
	//===================================================================================
	function parseData() {
		// $log.log(preDebugMsg + "parseData");
		parsingDataNow = true;
		resetVars();
		var dataIsCorrupt = false;

		for(var src = 0; src < dataMappings.length; src++) {
			if(dataMappings[src].active) {
				var w = $scope.getWebbleByInstanceId(dataMappings[src].srcID);
				var ls = w.scope().gimme(dataMappings[src].slotName);

				for(var f = 0; f < dataMappings[src].map.length; f++) {
					var fieldInfo = ls[dataMappings[src].map[f].srcIdx];
					dataMappings[src].map[f].listen = fieldInfo.listen;

					if(dataMappings[src].map[f].name == "X") {
						var lenX = fieldInfo.size;

						dataMappings[src].funX = fieldInfo.val;
						dataMappings[src].funSel = fieldInfo.sel;
						dataMappings[src].size = lenX;
						dataMappings[src].newSelections = fieldInfo.newSel;
					}
					if(dataMappings[src].map[f].name == "Y") {
						var lenY = fieldInfo.size;
						dataMappings[src].funY = fieldInfo.val;
					}
					if(dataMappings[src].map[f].name == "Size") {
						var lenSize = fieldInfo.size;
						dataMappings[src].funSize = fieldInfo.val;
					}
					if(haveIDs && dataMappings[src].map[f].name == "Time stamp") {
						var lenTime = fieldInfo.size;
						dataMappings[src].funTime = fieldInfo.val;
					}
					if(haveIDs && dataMappings[src].map[f].name == "ID") {
						var lenID = fieldInfo.size;
						dataMappings[src].funID = fieldInfo.val;
					}
					if(haveIDs && dataMappings[src].map[f].name == "Descendant ID") {
						var lenChID = fieldInfo.size;
						dataMappings[src].funChID = fieldInfo.val;
					}
				}
			}
			dataMappings[src].clean = true;
		}

		if(lenX != lenY || lenX != lenSize || (haveIDs && (lenID != lenChID || lenTime != lenID || lenTime != lenX))) {
			$log.log(preDebugMsg + "Data fields have different numbers of data items.");
			dataIsCorrupt = true;
		}

		firstNonNullData = true;

		for(var src = 0; !dataIsCorrupt && src < dataMappings.length; src++) {
			var fx = dataMappings[src].funX;
			var fy = dataMappings[src].funY;
			var fs = dataMappings[src].funSize;

			for(var i = 0; !dataIsCorrupt && i < dataMappings[src].size; i++) {
				var x = fx(i);
				var y = fy(i);
				var s = fs(i);

				var t = 0;
				if(haveIDs) {
					t = dataMappings[src].funTime(i);
				}

				if(x !== null && y !== null && s !== null && t !== null) {
					unique++;

					if(isNaN(x) || isNaN(y) || isNaN(s)) {
						dataIsCorrupt = true;
					}

					if(firstNonNullData) {
						firstNonNullData = false;
						minXVal = x;
						maxXVal = x;
						minYVal = y;
						maxYVal = y;
						minSize = s;
						maxSize = s;

						if(haveIDs) {
							timeSpan = [t,t];
						}

					}
					else {
						minXVal = Math.min(x, minXVal);
						maxXVal = Math.max(x, maxXVal);
						minYVal = Math.min(y, minYVal);
						maxYVal = Math.max(y, maxYVal);
						minSize = Math.min(s, minSize);
						maxSize = Math.max(s, maxSize);
						if(haveIDs) {
							timeSpan[0] = Math.min(t, timeSpan[0]);
							timeSpan[1] = Math.max(t, timeSpan[1]);
						}
					}
				}
				else {
					NULLs++;
				}
			}
		}

		if(firstNonNullData) {
			dataIsCorrupt = true; // only null values
		}
		else {
			limits = {};

			if(minSize >= maxSize) {
				limits.sizeSpan = 1;
			}
			else {
				limits.sizeSpan = maxSize - minSize;
			}
			limits.maxSize = maxSize;
			limits.minSize = minSize;

			if(minXVal == maxXVal) {
				minXVal--;
				maxXVal++;
			}

			if(minYVal == maxYVal) {
				minYVal--;
				maxYVal++;
			}

			limits.minX = minXVal;
			limits.maxX = maxXVal;

			limits.minY = minYVal;
			limits.maxY = maxYVal;

			limits.spanX = maxXVal - minXVal;
			limits.spanY = maxYVal - minYVal;
			if(limits.spanX <= 0) {
				limits.spanX = 1;
			}
			if(limits.spanY <= 0) {
				limits.spanY = 1;
			}

			zoomMinX = limits.minX;
			zoomMaxX = limits.maxX;
			zoomMinY = limits.minY;
			zoomMaxY = limits.maxY;
			$scope.set("MinX", limits.minX);
			$scope.set("MaxX", limits.maxX);
			$scope.set("MinY", limits.minY);
			$scope.set("MaxY", limits.maxY);

			if(haveIDs) {
				timeDelta = timeSpan[1] - timeSpan[0];
				if(timeDelta < 0) {
					timeDelta = 1;
				}
			}

		} // data is not corrupt

		if(dataIsCorrupt) {
			$log.log(preDebugMsg + "data is corrupt");
			resetVars();
		}
		else {
			// TODO: check if we should keep the old selections
			// selections = [[limits.min, limits.max]];
		}

		if(unique > 0) {
			var giveUp = checkSelectionsAfterNewData();
			if(giveUp) {
				$scope.selectAll();
			}
			else {
				updateLocalSelections(false);
				saveSelectionsInSlot();
			}
		}
		else { // no data
			if(selectionCtx === null) {
				selectionCtx = selectionCanvas.getContext("2d");
				var W = selectionCanvas.width;
				var H = selectionCanvas.height;
				selectionCtx.clearRect(0,0, W,H);
			}
		}

		parsingDataNow = false;
		updateGraphicsHelper(false, true, true, true);
	}
	//===================================================================================


	//===================================================================================
	// Update Graphics
	// This method updates the graphics.
	//===================================================================================
	function updateGraphics() {
		updateGraphicsHelper(false, false, false, false);
	}
	//===================================================================================


	//===================================================================================
	// Update Graphics Helper
	// This method updates the graphics based on specific parameters.
	//===================================================================================
	function updateGraphicsHelper(forceBackground, forceLines, forceDots, forceAxes) {
		if(parsingDataNow) {
			return;
		}

		var startTime = Date.now();
		// $log.log(preDebugMsg + "updateGraphics() start " + startTime);
		var redrawBackground = forceBackground;
		var redrawLines = forceLines;
		var redrawDots = forceDots;
		var redrawAxes = forceAxes;

		if(bgCanvas === null) {
			var bgCanvasElement = $scope.theView.parent().find('#theBgCanvas');
			if(bgCanvasElement.length > 0) {
				bgCanvas = bgCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		var W = bgCanvas.width;
		if(typeof W === 'string') {
			W = parseFloat(W);
		}
		if(W < 1) {
			W = 1;
		}

		var H = bgCanvas.height;
		if(typeof H === 'string') {
			H = parseFloat(H);
		}
		if(H < 1) {
			H = 1;
		}

		drawW = W - leftMarg - rightMarg;
		drawH = H - topMarg - bottomMarg * 2 - fontSize;

		if(currentColors === null) {
			var colors = $scope.gimme("ColorScheme");
			if(typeof colors === 'string') {
				colors = JSON.parse(colors);
			}
			currentColors = legacyDDSupLib.copyColors(colors);

			if(!currentColors) {
				currentColors = {};
			}
		}

		if(currentColors.hasOwnProperty("skin") && currentColors.skin.hasOwnProperty("text")) {
			textColor = currentColors.skin.text;
		}
		else {
			textColor = "#000000";
		}

		updateDropZones(textColor, 0.3, false);

		zoomMinX = Math.max(parseFloat($scope.gimme("MinX")), limits.minX);
		zoomMaxX = Math.min(parseFloat($scope.gimme("MaxX")), limits.maxX);
		zoomMinY = Math.max(parseFloat($scope.gimme("MinY")), limits.minY);
		zoomMaxY = Math.min(parseFloat($scope.gimme("MaxY")), limits.maxY);

		// Check what needs to be redrawn
		if(drawW != lastDrawW || drawH != lastDrawH) {
			redrawBackground = true;
			redrawLines = true;
			redrawDots = true;
			redrawAxes = true;
		}

		if(lastStoryGraphMode != storyGraphMode) {
			redrawLines = true;
			redrawDots = true;
			redrawAxes = true;
		}

		if(!redrawBackground && currentColors != lastColors) {
			redrawBackground = legacyDDSupLib.backgroundColorCheck(currentColors, lastColors);
		}

		if(!redrawAxes && (textColor != lastTextColor || fontSize != lastFontSize)) {
			redrawAxes = true;
		}

		if(lastHaveIDs != haveIDs) {
			redrawLines = true;
		}

		if(!redrawDots && (lastMinDotSize != minDotSize || lastMaxDotSize != maxDotSize)) {
			redrawDots = true;
		}

		if(!redrawAxes || !redrawLines || !redrawDots) {
			if(zoomMinX != lastZoomMinX || zoomMaxX != lastZoomMaxX || zoomMinY != lastZoomMinY || zoomMaxY != lastZoomMaxY) {
				redrawAxes = true;
				redrawLines = true;
				redrawDots = true;
			}
		}

		if(!redrawDots || (haveIDs && !redrawLines)) {
			if(legacyDDSupLib.checkColors(currentColors, lastColors)) {
				redrawDots = true;
				redrawLines = true;
			}
		}

		// $log.log(preDebugMsg + "Need to redraw: " + redrawBackground + " " + redrawLines + " " + redrawDots + " " + redrawAxes);

		// Draw background
		if(redrawBackground) {
			drawBackground(W, H);
		}

		// Draw data
		if(redrawLines) {
			drawLines(W, H);
		}

		if(redrawDots) {
			drawHalos(W, H);
		}

		// Draw axes and labels
		if(redrawAxes) {
			drawAxes(W, H);
		}

		lastDrawW = drawW;
		lastDrawH = drawH;
		lastFontSize = fontSize;
		lastTextColor = textColor;
		lastColors = currentColors;
		lastZoomMinX = zoomMinX;
		lastZoomMaxX = zoomMaxX;
		lastZoomMinY = zoomMinY;
		lastZoomMaxY = zoomMaxY;
		lastMinDotSize = minDotSize;
		lastMaxDotSize = maxDotSize;
		lastHaveIDs = haveIDs;
		lastStoryGraphMode = storyGraphMode;

		var endTime = Date.now();
		// $log.log(preDebugMsg + "updateGraphics() end " + endTime + ", total: " + (endTime - startTime));
	}
	//===================================================================================


	//===================================================================================
	// Draw Background
	// This method draws the background based on the specified width and height.
	//===================================================================================
	function drawBackground(W,H) {
		if(bgCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theBgCanvas');
			if(myCanvasElement.length > 0) {
				bgCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no background canvas to draw on!");
				return;
			}
		}

		if(bgCtx === null) {
			bgCtx = bgCanvas.getContext("2d");
		}

		bgCtx.clearRect(0,0, W,H);

		if(currentColors.hasOwnProperty("skin")) {
			var drewBack = false
			if(currentColors.skin.hasOwnProperty("gradient") && W > 0 && H > 0) {
				var OK = true;
				var grd = bgCtx.createLinearGradient(0,0,W,H);
				for(var i = 0; i < currentColors.skin.gradient.length; i++) {
					var cc = currentColors.skin.gradient[i];
					if(cc.hasOwnProperty('pos') && cc.hasOwnProperty('color')) {
						grd.addColorStop(cc.pos, cc.color);
					}
					else {
						OK = false;
					}
				}
				if(OK) {
					bgCtx.fillStyle = grd;
					bgCtx.fillRect(0,0,W,H);
					drewBack = true;
				}
			}

			if(!drewBack && currentColors.skin.hasOwnProperty("color")) {
				bgCtx.fillStyle = currentColors.skin.color;
				bgCtx.fillRect(0,0,W,H);
				drewBack = true;
			}

			if(currentColors.skin.hasOwnProperty("border")) {
				bgCtx.fillStyle = currentColors.skin.border;
				bgCtx.fillRect(0,0, W,1);
				bgCtx.fillRect(0,H-1, W,H);
				bgCtx.fillRect(0,0, 1,H);
				bgCtx.fillRect(W-1,0, W,H);
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Update Drop Zones
	// This method update the drop zones, based on mouse movement etc.
	//===================================================================================
	function updateDropZones(col, alpha, hover) {
		// $log.log(preDebugMsg + "update the data drop zone locations");
		if(dropCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theDropCanvas');
			if(myCanvasElement.length > 0) {
				dropCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no drop canvas to draw on!");
				return;
			}
		}

		if(dropCtx === null) {
			dropCtx = dropCanvas.getContext("2d");
		}

		if(!dropCtx) {
			$log.log(preDebugMsg + "no canvas to draw drop zones on");
			return;
		}

		if(dropCtx) {
			var W = dropCanvas.width;
			var H = dropCanvas.height;

			dropCtx.clearRect(0,0, W,H);

			var marg1 = 8;
			if(drawW < 40) {
				marg1 = 0;
			}
			var marg2 = 8;
			if(drawH < 40) {
				marg2 = 0;
			}

			dropY.left = 0;
			dropY.top = topMarg + marg2;
			dropY.right = leftMarg;
			dropY.bottom = topMarg + drawH - marg2;

			dropX.left = leftMarg + marg1;
			dropX.top = topMarg + drawH;
			dropX.right = leftMarg + drawW - marg1;
			dropX.bottom = H;

			dropSize.left = leftMarg + drawW;
			dropSize.top = dropY.top;
			dropSize.right = W;
			dropSize.bottom = Math.floor(topMarg + drawH / 2) - marg2;

			dropTime.left = dropSize.left;
			dropTime.top = Math.floor(topMarg + drawH / 2) + marg2;
			dropTime.right = dropSize.right;
			dropTime.bottom = dropY.bottom;

			dropID.left = dropX.left;
			dropID.top = 0;
			dropID.right = Math.floor(leftMarg + drawW / 2) - marg1;
			dropID.bottom = topMarg;

			dropChID.left = Math.floor(leftMarg + drawW / 2) + marg1;
			dropChID.top = dropID.top;
			dropChID.right = dropX.right;
			dropChID.bottom = dropID.bottom;

			if(hover) {
				dropCtx.save();
				dropCtx.fillStyle = "rgba(0, 0, 0, 0.75)";
				dropCtx.fillRect(0,0, W, H);
				dropCtx.restore();

				var fnt = "bold " + (fontSize + 5) + "px Arial";
				dropCtx.font = fnt;
				dropCtx.fillStyle = textColor;
				dropCtx.fillStyle = "black";

				for(var d = 0; d < allDropZones.length; d++) {
					var dropZone = allDropZones[d];

					dropCtx.save();
					var l = Math.max(0, dropZone.left - fontSize/2);
					var t = Math.max(0, dropZone.top - fontSize/2);
					var w = Math.min(W - l, dropZone.right - dropZone.left + fontSize / 2 + dropZone.left - l)
					var h = Math.min(H - t, dropZone.bottom - dropZone.top + fontSize / 2 + dropZone.top - t )
					dropCtx.clearRect(l, t, w, h);

					dropCtx.fillStyle = "rgba(255, 255, 255, 0.75)";
					dropCtx.fillRect(l, t, w, h);
					dropCtx.restore();
				}
				for(var d = 0; d < allDropZones.length; d++) {
					var dropZone = allDropZones[d];

					dropCtx.save();
					dropCtx.globalAlpha = alpha;
					dropCtx.strokeStyle = "black";
					dropCtx.strokeWidth = 1;
					dropCtx.lineWidth = 2;
					dropCtx.setLineDash([2, 3]);
					dropCtx.beginPath();
					dropCtx.moveTo(dropZone.left, dropZone.top);
					dropCtx.lineTo(dropZone.left, dropZone.bottom);
					dropCtx.lineTo(dropZone.right, dropZone.bottom);
					dropCtx.lineTo(dropZone.right, dropZone.top);
					dropCtx.lineTo(dropZone.left, dropZone.top);
					dropCtx.stroke();
					if(hover) {
						var str = dropZone.label;
						var tw = legacyDDSupLib.getTextWidth(axCtx, str, fnt);
						var labelShift = Math.floor(fontSize / 2);
						if(dropZone.rotate) {
							if(dropZone.left > W / 2) {
								dropCtx.translate(dropZone.left - labelShift, dropZone.top + Math.floor((dropZone.bottom - dropZone.top - tw) / 2));
							}
							else {
								dropCtx.translate(dropZone.right - labelShift, dropZone.top + Math.floor((dropZone.bottom - dropZone.top - tw) / 2));
							}
							dropCtx.rotate(Math.PI/2);
						}
						else {
							if(dropZone.top < H / 2) {
								dropCtx.translate(dropZone.left + Math.floor((dropZone.right - dropZone.left - tw) / 2), dropZone.bottom + labelShift);
							}
							else {
								dropCtx.translate(dropZone.left + Math.floor((dropZone.right - dropZone.left - tw) / 2), dropZone.top + labelShift);
							}
						}
						dropCtx.fillText(str, 0, 0);
					}
					dropCtx.restore();
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Axes
	// This method draws the axes.
	//===================================================================================
	function drawAxes(W, H) {
		if(axCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theAxesCanvas');
			if(myCanvasElement.length > 0) {
				axCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no axes canvas to draw on!");
				return;
			}
		}

		if(axCtx === null) {
			axCtx = axCanvas.getContext("2d");
		}

		axCtx.clearRect(0,0, W,H);
		axCtx.fillStyle = textColor;
		axCtx.font = fontSize + "px Arial";

		// top label
		var str = "";
		var xw = -1;
		var yw = -1;
		var sw = -1;
		var endw = 0;

		if(xName != "" && yName != "") {
			str = xName + " --> " + yName;
			xw = legacyDDSupLib.getTextWidthCurrentFont(axCtx, xName);
			yw = legacyDDSupLib.getTextWidthCurrentFont(axCtx, yName);
		}
		else if(xName != "") {
			str = xName;
			xw = legacyDDSupLib.getTextWidthCurrentFont(axCtx, xName);
		}
		else if(yName != "") {
			str = yName;
			yw = legacyDDSupLib.getTextWidthCurrentFont(axCtx, yName);
		}
		if(sName != "") {
			var temp = "(size: " + sName + ")";
			str += temp;
			sw = legacyDDSupLib.getTextWidthCurrentFont(axCtx, sName);
			endw = legacyDDSupLib.getTextWidthCurrentFont(axCtx, temp);
		}

		if(str != "") {
			var w = legacyDDSupLib.getTextWidthCurrentFont(axCtx, str);
			var top = 0;
			if(fontSize < topMarg) {
				top = Math.floor((topMarg - fontSize) / 2);
			}
			var left = 0;
			if(w < W) {
				left = Math.floor((W - w) / 2);
			}

			axCtx.fillText(str, left, top + fontSize);

			if(xw >= 0) {
				dragZoneX = {'left':left, 'top':top, 'right':(left + xw), 'bottom':(top + fontSize), 'name':xName, 'ID':dragZoneX.ID};
			}
			if(yw >= 0) {
				dragZoneY = {'left':(left + w - yw - endw), 'top':top, 'right':(left + w - endw), 'bottom':(top + fontSize), 'name':yName, 'ID':dragZoneY.ID};
			}
			if(sw >= 0) {
				dragZoneSize = {'left':(left + w - endw), 'top':top, 'right':(left + w), 'bottom':(top + fontSize), 'name':sName, 'ID':dragZoneSize.ID};
			}
			allDragNames = [dragZoneX, dragZoneY, dragZoneSize];
		}

		if(storyGraphMode) {
			// X Axis, should be time now
			axCtx.fillRect(leftMarg - 3, topMarg + drawH, drawW+2, 2);

			if(unique > 0) {
				var LABELS = 5;
				for(var i = 0; i < LABELS+1; i++) {
					var pos = leftMarg + i/LABELS*drawW;
					var s = "";
					s = legacyDDSupLib.number2text(pixel2time(pos), timeDelta);
					var textW = legacyDDSupLib.getTextWidthCurrentFont(axCtx, s);
					axCtx.fillText(s, pos - textW/2, H - bottomMarg);
					axCtx.fillRect(pos, topMarg + drawH - 2, 1, 6);
				}
			}

			// Left Y Axis
			axCtx.fillRect(leftMarg - 3, topMarg, 2, drawH + 2);

			if(unique > 0) {
				var LABELS = 5;
				for(var i = 0; i < LABELS+1; i++) {
					var pos = topMarg + i/LABELS*drawH;
					var s = "";
					s = legacyDDSupLib.number2text(pixel2leftY(pos), limits.spanX);
					var textW = legacyDDSupLib.getTextWidthCurrentFont(axCtx, s);
					if(leftMarg > textW + 5) {
						axCtx.fillText(s, leftMarg - 6 - textW, pos + fontSize/2);
					}
					else {
						axCtx.fillText(s, 0, pos + fontSize/2);
					}
					axCtx.fillRect(leftMarg - 5, pos, 6, 1);
				}
			}

			// Right Y Axis
			axCtx.fillRect(leftMarg + drawW + 1, topMarg, 2, drawH + 2);

			if(unique > 0) {
				var LABELS = 5;
				for(var i = 0; i < LABELS+1; i++) {
					var pos = topMarg + i/LABELS*drawH;
					var s = "";
					s = legacyDDSupLib.number2text(pixel2rightY(pos), limits.spanY);
					var textW = legacyDDSupLib.getTextWidthCurrentFont(axCtx, s);
					if(textW + 5 + leftMarg + drawW >= W) {
						axCtx.fillText(s, W - 1 - textW, pos + fontSize/2);
					}
					else {
						axCtx.fillText(s, leftMarg + drawW + 5, pos + fontSize/2);
					}
					axCtx.fillRect(leftMarg + drawW + 5, pos, 6, 1);
				}
			}

		}
		else {
			// X Axis
			axCtx.fillRect(leftMarg - 3, topMarg + drawH, drawW+2, 2);

			if(unique > 0) {
				var LABELS = 5;
				for(var i = 0; i < LABELS+1; i++) {
					var pos = leftMarg + i/LABELS*drawW;
					var s = "";
					s = legacyDDSupLib.number2text(legacyDDSupLib.pixel2valX(pos, unique, drawW, leftMarg, zoomMinX, zoomMaxX), limits.spanX);
					var textW = legacyDDSupLib.getTextWidthCurrentFont(axCtx, s);
					axCtx.fillText(s, pos - textW/2, H - bottomMarg);
					axCtx.fillRect(pos, topMarg + drawH - 2, 1, 6);
				}
			}

			// Y Axis
			axCtx.fillRect(leftMarg - 3, topMarg, 2, drawH + 2);

			if(unique > 0) {
				var LABELS = 5;
				for(var i = 0; i < LABELS+1; i++) {
					var pos = topMarg + i/LABELS*drawH;
					var s = "";
					s = legacyDDSupLib.number2text(legacyDDSupLib.pixel2valY(pos, unique, drawH, topMarg, zoomMinY, zoomMaxY), limits.spanY);
					var textW = legacyDDSupLib.getTextWidthCurrentFont(axCtx, s);
					if(leftMarg > textW + 5) {
						axCtx.fillText(s, leftMarg - 6 - textW, pos + fontSize/2);
					}
					else {
						axCtx.fillText(s, 0, pos + fontSize/2);
					}
					axCtx.fillRect(leftMarg - 5, pos, 6, 1);
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Update Size
	// This method updates the size.
	//===================================================================================
	function updateSize() {
		// $log.log(preDebugMsg + "updateSize");
		fontSize = parseInt($scope.gimme("FontSize"));
		if(fontSize < 5) {
			fontSize = 5;
		}

		var rw = $scope.gimme("DrawingArea:width");
		if(typeof rw === 'string') {
			rw = parseFloat(rw);
		}
		if(rw < 1) {
			rw = 1;
		}

		var rh = $scope.gimme("DrawingArea:height");
		if(typeof rh === 'string') {
			rh = parseFloat(rh);
		}
		if(rh < 1) {
			rh = 1;
		}

		if(bgCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theBgCanvas');
			if(myCanvasElement.length > 0) {
				bgCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		bgCanvas.width = rw;
		bgCanvas.height = rh;

		if(lineCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theLineCanvas');
			if(myCanvasElement.length > 0) {
				lineCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		lineCanvas.width = rw;
		lineCanvas.height = rh;

		if(dotCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theDotCanvas');
			if(myCanvasElement.length > 0) {
				dotCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		dotCanvas.width = rw;
		dotCanvas.height = rh;

		if(uCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theUCanvas');
			if(myCanvasElement.length > 0) {
				uCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to resize!");
				return;
			}
		}
		uCanvas.width = rw;
		uCanvas.height = rh;

		if(axCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theAxesCanvas');
			if(myCanvasElement.length > 0) {
				axCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no axes canvas to resize!");
			}
		}
		if(axCanvas) {
			axCanvas.width = rw;
			axCanvas.height = rh;
		}

		if(dropCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theDropCanvas');
			if(myCanvasElement.length > 0) {
				dropCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no drop canvas to resize!");
			}
		}
		if(dropCanvas) {
			dropCanvas.width = rw;
			dropCanvas.height = rh;
		}

		if(selectionCanvas === null) {
			var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
			if(selectionCanvasElement.length > 0) {
				selectionCanvas = selectionCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no selectionCanvas to resize!");
				return;
			}
		}
		selectionCanvas.width = rw;
		selectionCanvas.height = rh;
		selectionCanvas.style.left = 0;
		selectionCanvas.style.top = 0;

		if(selectionHolderElement === null) {
			selectionHolderElement = $scope.theView.parent().find('#selectionHolder');
		}
		selectionHolderElement.width = rw;
		selectionHolderElement.height = rh;
		selectionHolderElement.top = 0;
		selectionHolderElement.left = 0;

		var selectionRectElement = $scope.theView.parent().find('#selectionRectangle');
		selectionRectElement.width = rw;
		selectionRectElement.height = rh;
		selectionRectElement.top = 0;
		selectionRectElement.left = 0;
		if(selectionRectElement.length > 0) {
			selectionRect = selectionRectElement[0];
			selectionRect.width = rw;
			selectionRect.height = rh;
			selectionRect.top = 0;
			selectionRect.left = 0;
		}

		var W = selectionCanvas.width;
		var H = selectionCanvas.height;
		drawW = W - leftMarg - rightMarg;
		drawH = H - topMarg - bottomMarg * 2 - fontSize;

		// $log.log(preDebugMsg + "updateSize found selections: " + JSON.stringify(selections));
		updateSelectionsWhenZoomingOrResizing();
		updateDropZones(textColor, 0.3, false);
		// $log.log(preDebugMsg + "updateSize updated selections to: " + JSON.stringify(selections));
	}
	//===================================================================================


	//===================================================================================
	// New Selection
	// This method handles new selections.
	//===================================================================================
	function newSelection(x1,x2, y1,y2, keepOld) {
		// $log.log(preDebugMsg + "newSelection");
		// $log.log(preDebugMsg + "newSelection " + x1 + " " + x2 + " " + y1 + " " + y2 + " " + keepOld);
		if(unique > 0) {
			x1 = Math.max(x1, leftMarg);
			x2 = Math.min(x2, leftMarg + drawW);
			y1 = Math.max(y1, topMarg);
			y2 = Math.min(y2, topMarg + drawH);

			var newSel = [legacyDDSupLib.pixel2valX(x1, unique, drawW, leftMarg, zoomMinX, zoomMaxX), legacyDDSupLib.pixel2valX(x2, unique, drawW, leftMarg, zoomMinX, zoomMaxX), legacyDDSupLib.pixel2valY(y2, unique, drawH, topMarg, zoomMinY, zoomMaxY), legacyDDSupLib.pixel2valY(y1, unique, drawH, topMarg, zoomMinY, zoomMaxY), x1,x2,y1,y2]; // y1 and y2 need to be switched here, because we flip the y axis
			// $log.log(preDebugMsg + "newSel: " + JSON.stringify(newSel));
			var overlap = false;
			for(var s = 0; s < selections.length; s++) {
				var sel = selections[s];
				if(sel[4] == newSel[4] && sel[5] == newSel[5] && sel[6] == newSel[6] && sel[7] == newSel[7]) {
					// $log.log(preDebugMsg + "Ignoring selection because it overlaps 100% with already existing selection");
					overlap = true;
					break;
				}
			}

			if(!overlap) {
				if(!keepOld) {
					selections = [];
				}
				selections.push(newSel);
				drawSelections();
				updateLocalSelections(false);
				saveSelectionsInSlot();
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Select All
	// This method selects all data points.
	//===================================================================================
	$scope.selectAll = function() {
		if(unique <= 0) {
			selections = [];
		}
		else {
			selections = [[limits.minX, limits.maxX, limits.minY, limits.maxY, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH]];
		}
		drawSelections();
		updateLocalSelections(true);
		saveSelectionsInSlot();
	}
	//===================================================================================


	//===================================================================================
	// Parse Selection Colors
	// This method parses the selection colors.
	//===================================================================================
	function parseSelectionColors() {
		// $log.log(preDebugMsg + "parseSelectionColors");
		var colors = $scope.gimme("ColorScheme");
		if(typeof colors === 'string') {
			colors = JSON.parse(colors);
		}

		selectionColors = {};

		if(colors.hasOwnProperty('selection')) {
			if(colors['selection'].hasOwnProperty('border')) {
				selectionColors.border = colors['selection']['border'];
			}
			else {
				selectionColors.border = '#FFA500'; // orange
			}

			if(colors['selection'].hasOwnProperty('color')) {
				selectionColors.color = hexColorToRGBA(colors['selection']['color'], selectionTransparency);
			}
			else {
				selectionColors.color = hexColorToRGBA('#FFA500', selectionTransparency); // orange
			}

			if(colors['selection'].hasOwnProperty('gradient') && selectionCanvas !== null && selectionCanvas.width > 0 && selectionCanvas.height > 0) {
				if(selectionCanvas === null || selectionCtx === null) {
					var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
					if(selectionCanvasElement.length > 0) {
						selectionCanvas = selectionCanvasElement[0];
						selectionCtx = selectionCanvas.getContext("2d");
					}
					else {
						$log.log(preDebugMsg + "no selectionCanvas to resize!");
						return;
					}
				}

				selectionColors.grad = selectionCtx.createLinearGradient(0, 0, selectionCanvas.width, selectionCanvas.height);
				var atLeastOneAdded = false;
				for(var p = 0; p < colors['selection']['gradient'].length; p++) {
					if(colors['selection']['gradient'][p].hasOwnProperty('pos') && colors['selection']['gradient'][p].hasOwnProperty('color')) {
						selectionColors.grad.addColorStop(colors['selection']['gradient'][p]['pos'], hexColorToRGBA(colors['selection']['gradient'][p]['color'], selectionTransparency));
						atLeastOneAdded = true;
					}
				}
				if(!atLeastOneAdded) {
					selectionColors.grad = selectionColors.color;
				}
			} else {
				selectionColors.grad = selectionColors.color;
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Selections
	// This method draws the selections.
	//===================================================================================
	function drawSelections() {
		if(selectionCanvas === null) {
			var selectionCanvasElement = $scope.theView.parent().find('#theSelectionCanvas');
			if(selectionCanvasElement.length > 0) {
				selectionCanvas = selectionCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to draw selections on!");
				return;
			}
		}

		if(selectionCtx === null) {
			selectionCtx = selectionCanvas.getContext("2d");
		}

		var W = selectionCanvas.width;
		var H = selectionCanvas.height;
		selectionCtx.clearRect(0,0, W,H);

		if(selectionColors === null) {
			parseSelectionColors(W, H);
		}

		for(sel = 0; sel < selections.length; sel++) {
			if(selections[sel][2] > zoomMaxY || selections[sel][3] < zoomMinY || selections[sel][0] > zoomMaxX || selections[sel][1] < zoomMinX) {
				continue;
			}

			selectionCtx.fillStyle = selectionColors.grad;
			var x1 = selections[sel][4];
			var x2 = selections[sel][5];
			var y1 = selections[sel][6];
			var y2 = selections[sel][7];

			selectionCtx.fillRect(x1, y1, x2 - x1, y2 - y1);

			selectionCtx.fillStyle = selectionColors.border;
			selectionCtx.fillRect(x1,   y1, 1, y2-y1);
			selectionCtx.fillRect(x1,   y1, x2 - x1, 1);
			selectionCtx.fillRect(x1,   y2-1, x2 - x1, 1);
			selectionCtx.fillRect(x2-1, y1, 1, y2-y1);
		}
		hideSelectionRect();
	}
	//===================================================================================


	//===================================================================================
	// Hide Selection Rectangle
	// This method hides the selection rectangle the user created.
	//===================================================================================
	function hideSelectionRect() {
		if(selectionRect === null) {
			var selectionRectElement = $scope.theView.parent().find('#selectionRectangle');
			if(selectionRectElement.length > 0) {
				selectionRect = selectionRectElement[0];
			}
			else {
				$log.log(preDebugMsg + "No selection rectangle!");
			}
		}
		if(selectionRect !== null) {
			selectionRect.getContext("2d").clearRect(0,0, selectionRect.width, selectionRect.height);
		}
	}
	//===================================================================================

	//===================================================================================
	// Mouse Position in Selectable Area
	// This method checks whether the mouse pointer is within the selectable area.
	//===================================================================================
	function mousePosIsInSelectableArea(pos) {
		if(pos.x > leftMarg - 5 && pos.x <= leftMarg + drawW + 5 && pos.y > topMarg - 5 && pos.y <= topMarg + drawH + 5) {
			return true;
		}
		return false;
	}
	//===================================================================================


	// ==============================================
	// ------- Unique Methods for this Webble -------
	// ==============================================

	//===================================================================================
	// Pixel to Time
	// This method converts a pixel to a time value.
	//===================================================================================
	function pixel2time(p) {
		if(unique <= 0) {
			return 0;
		}

		if(p < leftMarg) {
			return timeSpan[0];
		}
		if(p > leftMarg + drawW) {
			return timeSpan[1];
		}
		return timeSpan[0] + (p - leftMarg) / drawW * timeDelta;
	}
	//===================================================================================


	//===================================================================================
	// Pixel to Left Y
	// This method converts a pixel to a left Y value.
	//===================================================================================
	function pixel2leftY(p) {
		if(unique <= 0) {
			return 0;
		}

		if(p < topMarg) {
			return limits.maxX; // flip Y-axis
		}
		if(p > topMarg + drawH) {
			return limits.minX; // flip Y-axis
		}
		return limits.minX + (drawH - (p - topMarg)) / drawH * (limits.maxX - limits.minX); // flip Y-axis
	}
	//===================================================================================


	//===================================================================================
	// Pixel to Right Y
	// This method converts a pixel to a right Y value.
	//===================================================================================
	function pixel2rightY(p) {
		if(unique <= 0) {
			return 0;
		}

		if(p < topMarg) {
			return limits.maxY; // flip Y-axis
		}
		if(p > topMarg + drawH) {
			return limits.minY; // flip Y-axis
		}
		return limits.minY + (drawH - (p - topMarg)) / drawH * (limits.maxY - limits.minY); // flip Y-axis
	}
	//===================================================================================


	//===================================================================================
	// Value to Size
	// This method converts a value to a size.
	//===================================================================================
	function val2Size(v, maxDotSize, minDotSize) {
		if(limits.sizeSpan == 1) {
			return maxDotSize;
		}
		if(v >= limits.maxSize) {
			return maxDotSize;
		}
		if(v <= limits.minSize) {
			return minDotSize;
		}
		if(logScale) {
			return minDotSize + (maxDotSize - minDotSize) * (Math.log(v) - Math.log(limits.minSize)) / (Math.log(limits.maxSize) - Math.log(limits.minSize));
		} else {
			return minDotSize + (maxDotSize - minDotSize) * (v - limits.minSize) / (limits.sizeSpan);
		}
	}
	//===================================================================================


	//===================================================================================
	// Value to Pixel X Crimp
	// This method converts a value to an X pixel (taking regard for margins).
	//===================================================================================
	function val2pixelXcrimp(v) {
		if(unique <= 0) {
			return 0;
		}

		if(v < zoomMinX) {
			return leftMarg;
		}
		if(v > zoomMaxX) {
			return leftMarg + drawW;
		}

		return leftMarg + (v - zoomMinX) / (zoomMaxX - zoomMinX) * drawW;
	}
	//===================================================================================


	//===================================================================================
	// Value to Pixel X
	// This method converts a value to an X pixel.
	//===================================================================================
	function val2pixelX(v) {
		if(unique <= 0) {
			return 0;
		}
		return leftMarg + (v - zoomMinX) / (zoomMaxX - zoomMinX) * drawW;
	}
	//===================================================================================


	//===================================================================================
	// Value to Pixel Y Crimp
	// This method converts a value to an Y pixel (taking regard for margins).
	//===================================================================================
	function val2pixelYcrimp(v) {
		if(unique <= 0) {
			return 0;
		}

		if(v < zoomMinY) {
			return topMarg + drawH; // flip Y-axis
		}
		if(v > zoomMaxY) {
			return topMarg; // flip Y-axis
		}

		return topMarg + drawH - ((v - zoomMinY) / (zoomMaxY - zoomMinY) * drawH); // flip Y-axis
	}
	//===================================================================================


	//===================================================================================
	// Value to Pixel Y
	// This method converts a value to an Y pixel.
	//===================================================================================
	function val2pixelY(v) {
		if(unique <= 0) {
			return 0;
		}
		return topMarg + drawH - ((v - zoomMinY) / (zoomMaxY - zoomMinY) * drawH); // flip Y-axis
	}
	//===================================================================================


	//===================================================================================
	// Value to Pixel X Time
	// This method converts a value to an X pixel (taking regard for Time).
	//===================================================================================
	function val2pixelXtime(v) {
		if(unique <= 0) {
			return 0;
		}

		if(v < timeSpan[0]) {
			return leftMarg;
		}
		if(v > timeSpan[1]) {
			return leftMarg + drawW;
		}

		return leftMarg + (v - timeSpan[0]) / timeDelta * drawW;
	}
	//===================================================================================


	//===================================================================================
	// Value to Pixel Y Story
	// This method converts a value to an Y pixel (taking regard for Time).
	//===================================================================================
	function val2pixelYstory(x, y, time) {
		if(unique <= 0) {
			return 0;
		}

		var left = y;
		var right = x;
		if(y < limits.minY) {
			left = limits.minY;
		}
		if(x < limits.minX) {
			right = limit.minX;
		}
		if(y > limits.maxY) {
			left = limits.maxY;
		}
		if(x > limits.maxX) {
			right = limits.maxX;
		}

		left = topMarg + drawH - (left - limits.minY) / (limits.maxY - limits.minY) * drawH;
		right = topMarg + drawH - (right - limits.minX) / (limits.maxX - limits.minX) * drawH;

		var dt = (time - timeSpan[0]) / timeDelta;

		return left * (1 - dt) + dt * right;
	}
	//===================================================================================


	//===================================================================================
	// Draw Lines
	// This method draw lines in the plot
	//===================================================================================
	function drawLines(W, H) {
		if(lineCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theLineCanvas');
			if(myCanvasElement.length > 0) {
				lineCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no background canvas to draw on!");
				return;
			}
		}

		if(lineCtx === null) {
			lineCtx = lineCanvas.getContext("2d");
		}

		lineCtx.clearRect(0,0, W,H);

		if(unique <= 0) {
			return;
		}

		if(!haveIDs) {
			return;
		}

		var zeroTransp = 0.33 * transparency;

		var drawPretty = true;
		if(unique > quickRenderThreshold) {
			drawPretty = false;
			var rgba0 = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), zeroTransp);
			var rgbaText = hexColorToRGBAvec(textColor, transparency);
			var imData = lineCtx.getImageData(0, 0, lineCanvas.width, lineCanvas.height);
			var pixels = imData.data;
		}

		for(var src = 0; src < dataMappings.length; src++) {
			if(dataMappings[src].active) {
				var fsel = dataMappings[src].funSel;
				var fx = dataMappings[src].funX;
				var fy = dataMappings[src].funY;
				var ft = dataMappings[src].funTime;
				var fid = dataMappings[src].funID;
				var fchid = dataMappings[src].funChID;

				for(var i = 0; i < dataMappings[src].size; i++) {
					var chid = fchid(i);
					var t = ft(i);
					var lastT = t;

					if(chid !== null && chid >= 0) { // this halo has a descendant, so we should draw a line
						for(var j = i+1; j < dataMappings[src].size; j++) { // should appear later in the data. Note: there are halos with same IDs in other series, should we also check the "time" field from the original data to classify the series?
							var jID = fid(j);
							var jt = ft(j);

							if(lastT > jt) {
								j = dataMappings[src].size + 1; // we have reached a new series of data
							}
							else if(jID == chid) { // we found the descendant
								var x1 = fx(i);
								var y1 = fy(i);
								var x2 = fx(j);
								var y2 = fy(j);
								if(x1 === null || y1 === null || x2 === null || y2 === null) {
									// nothing to do
								}
								else {
									if(!storyGraphMode && ((x1 < zoomMinX && x2 < zoomMinX) || (x1 > zoomMaxX && x2 > zoomMaxX) || (y1 < zoomMinY && y2 < zoomMinY) || (y1 > zoomMaxY && y2 > zoomMaxY))) {
										// nothing to do // outside zoomed range
									}
									else {
										var groupId1 = fsel(i);
										var groupId2 = fsel(j);

										if(storyGraphMode) {
											var px1 = val2pixelXtime(t);
											var py1 = val2pixelYstory(x1, y1, t);
											var px2 = val2pixelXtime(jt);
											var py2 = val2pixelYstory(x2, y2, jt);
										}
										else {
											var px1 = val2pixelX(x1);
											var py1 = val2pixelY(y1);
											var px2 = val2pixelX(x2);
											var py2 = val2pixelY(y2);
										}

										if(drawPretty) {
											var col = textColor;
											lineCtx.save();
											if(groupId1 <= 0 && groupId2 <= 0) {
												col = legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors);
												lineCtx.setLineDash([3, 5]);
											}
											else if(groupId1 > 0 && groupId2 > 0) {
												if(groupId1 == groupId2) {
													col = hexColorToRGBA(legacyDDSupLib.getColorForGroup(groupId1, colorPalette, currentColors), transparency);
												}
												else {
													col = textColor;
												}
											}
											else {
												col = legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors);
											}

											lineCtx.strokeStyle = col;
											lineCtx.lineWidth = 1;
											lineCtx.beginPath();
											lineCtx.moveTo(px1, py1);
											lineCtx.lineTo(px2, py2);
											lineCtx.stroke();
											lineCtx.restore();
										}
										else {
											var col = rgba0;
											var dashed = false;
											if(groupId1 <= 0 && groupId2 <= 0) {
												col = rgba0;
												dashed = true;
											}
											else if(groupId1 > 0 && groupId2 > 0) {
												if(groupId1 == groupId2) {
													col = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId1, colorPalette, currentColors), transparency);
												}
												else {
													col = rgbaText;
												}
											}
											else {
												col = rgba0;
											}

											if(col[3] >= 255) {
												drawLineDDAfullalpha(pixels, lineCanvas.width, lineCanvas.height, px1, py1, px2, py2, col[0], col[1], col[2], col[3], dashed, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH);
											}
											else {
												drawLineDDA(pixels, lineCanvas.width, lineCanvas.height, px1, py1, px2, py2, col[0], col[1], col[2], col[3], dashed, leftMarg, leftMarg + drawW, topMarg, topMarg + drawH);
											}
										}
									}
								}
								j = dataMappings[src].size + 1; // we found the descendant
							}
							lastT = jt;
						}
					}
				}
			}
		}

		if(!drawPretty) {
			lineCtx.putImageData(imData, 0, 0);
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Halos
	// This method draw Halos
	//===================================================================================
	function drawHalos(W, H) {
		if(dotCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theDotCanvas');
			if(myCanvasElement.length > 0) {
				dotCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		if(dotCtx === null) {
			dotCtx = dotCanvas.getContext("2d");
		}

		dotCtx.clearRect(0,0, W,H);

		if(uCanvas === null) {
			var myCanvasElement = $scope.theView.parent().find('#theUCanvas');
			if(myCanvasElement.length > 0) {
				uCanvas = myCanvasElement[0];
			}
			else {
				$log.log(preDebugMsg + "no canvas to draw on!");
				return;
			}
		}

		if(uCtx === null) {
			uCtx = uCanvas.getContext("2d");
		}

		uCtx.clearRect(0,0, W,H);

		if(unique <= 0) {
			return;
		}

		// first draw all the unselected data
		var zeroTransp = 0.33 * transparency;
		var drawPretty = true;
		if(unique > quickRenderThreshold) {
			drawPretty = false;
			var rgba0 = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), zeroTransp);
			var imData = dotCtx.getImageData(0, 0, dotCanvas.width, dotCanvas.height);
			var pixels = imData.data;
			var imData0 = uCtx.getImageData(0, 0, uCanvas.width, uCanvas.height);
			var pixels0 = imData0.data;
		}
		else {
			var col0 = hexColorToRGBA(legacyDDSupLib.getColorForGroup(0, colorPalette, currentColors), zeroTransp);
			var fill0 = legacyDDSupLib.getGradientColorForGroup(0, 0,0,W,H, zeroTransp, uCanvas, uCtx, useGlobalGradients, $scope.theView.parent().find('#theBgCanvas'), colorPalette, currentColors);
		}

		for(var src = 0; src < dataMappings.length; src++) {
			if(dataMappings[src].active) {
				var fsel = dataMappings[src].funSel;
				var fx = dataMappings[src].funX;
				var fy = dataMappings[src].funY;
				var fs = dataMappings[src].funSize;

				if(storyGraphMode) {
					var ft = dataMappings[src].funTime;
				}

				for(var i = 0; i < dataMappings[src].size; i++) {
					var x = fx(i);
					var y = fy(i);
					var s = fs(i);
					var t = 1;
					if(storyGraphMode) {
						t = ft(i);
					}

					if(x === null || y === null || s === null || t === null) {
						continue;
					}

					if(!storyGraphMode && (x < zoomMinX || x > zoomMaxX || y < zoomMinY || y > zoomMaxY)) {
						continue; // outside zoomed range
					}

					var groupId = fsel(i);

					if(storyGraphMode) {
						var px = val2pixelXtime(t);
						var py = val2pixelYstory(x, y, t);
					}
					else {
						var px = val2pixelX(x);
						var py = val2pixelY(y);
					}
					var dotSize = val2Size(s, maxDotSize, minDotSize);

					if(groupId == 0) {
						if(drawPretty) {
							if(!useGlobalGradients) {
								fill = legacyDDSupLib.getGradientColorForGroup(0, px-dotSize,py-dotSize,px+dotSize,py+dotSize, zeroTransp, uCanvas, uCtx, useGlobalGradients, $scope.theView.parent().find('#theBgCanvas'), colorPalette, currentColors);
							}
							else {
								fill = fill0;
							}

							uCtx.beginPath();
							uCtx.arc(px, py, dotSize, 0, 2 * Math.PI, false);
							uCtx.fillStyle = fill;
							uCtx.fill();
							uCtx.lineWidth = 1;
							uCtx.strokeStyle = col0;
							uCtx.stroke();
						}
						else {
							drawDotfullalpha(px, py, dotSize, rgba0[3], rgba0[0], rgba0[1], rgba0[2], W, H, pixels0);
						}
					}
					else {
						if(drawPretty) {
							var col = hexColorToRGBA(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), transparency);
							var fill = legacyDDSupLib.getGradientColorForGroup(groupId, px-dotSize,py-dotSize,px+dotSize,py+dotSize, transparency, dotCanvas, dotCtx, useGlobalGradients, $scope.theView.parent().find('#theBgCanvas'), colorPalette, currentColors);

							dotCtx.beginPath();
							dotCtx.arc(px, py, dotSize, 0, 2 * Math.PI, false);
							dotCtx.fillStyle = fill;
							dotCtx.fill();
							dotCtx.lineWidth = 1;
							dotCtx.strokeStyle = col;
							dotCtx.stroke();
						}
						else {
							rgba = hexColorToRGBAvec(legacyDDSupLib.getColorForGroup(groupId, colorPalette, currentColors), transparency);
							if(rgba[3] >= 255) {
								drawDotfullalpha(px, py, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], W, H, pixels);
							}
							else {
								drawDot(px, py, dotSize, rgba[3], rgba[0], rgba[1], rgba[2], W, H, pixels);
							}
						}

					}
				}
			}
		}

		if(!drawPretty) {
			$timeout(function() {
				dotCtx.putImageData(imData, 0, 0);
			}, 1);
			$timeout(function() {
				uCtx.putImageData(imData0, 0, 0);
			}, 1);
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Line DDA
	// This method Draws a colored line by connecting two points using a DDA algorithm
	// (Digital Differential Analyzer).
	// This line drawing function was copied from
	// http://kodierer.blogspot.jp/2009/10/drawing-lines-silverlight.html
	// The code is not our original, only slightly modified by us.
	//===================================================================================
	function drawLineDDA(pixels, Width, Height, X1, Y1, X2, Y2, r, g, b, alpha, dashed, MINX, MAXX, MINY, MAXY) {
		var W = Math.floor(Width);
		var H = Math.floor(Height);
		var x1 = Math.round(X1);
		var y1 = Math.round(Y1);
		var x2 = Math.round(X2);
		var y2 = Math.round(Y2);
		var minX = Math.round(MINX);
		var maxX = Math.round(MAXX);
		var minY = Math.round(MINY);
		var maxY = Math.round(MAXY);

		// Distance start and end point
		var dx = x2 - x1;
		var dy = y2 - y1;

		// Determine slope (absoulte value)
		var len = dy >= 0 ? dy : -dy;
		var lenx = dx >= 0 ? dx : -dx;
		if (lenx > len) {
			len = lenx;
		}

		// Prevent divison by zero
		if (len != 0) {
			// Init steps and start
			var incx = dx / len;
			var incy = dy / len;
			var x = x1;
			var y = y1;

			// Walk the line!
			for (var i = 0; i < len; i++) {
				if(!dashed || (i % 5 < 3)) { // if dashed, draw 3, skip 2, draw 3, skip 2 etc.
					var ry = Math.round(y);
					var rx = Math.round(x);
					if(ry >= minY && ry < maxY && rx >= minX && rx < maxX) {
						var offset = (ry * W + rx) * 4;
						legacyDDSupLib.blendRGBAs(r,g,b,alpha, offset, pixels);
					}
				}
				x += incx;
				y += incy;
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Line DDA Full Alpha
	// This method Draws a colored (with full alpha) line by connecting two points using
	// a DDA algorithm (Digital Differential Analyzer).
	// This line drawing function was copied from
	// http://kodierer.blogspot.jp/2009/10/drawing-lines-silverlight.html
	// The code is not our original, only slightly modified by us.
	//===================================================================================
	function drawLineDDAfullalpha(pixels, Width, Height, X1, Y1, X2, Y2, r, g, b, alpha, dashed, MINX, MAXX, MINY, MAXY) {
		var W = Math.floor(Width);
		var H = Math.floor(Height);
		var x1 = Math.round(X1);
		var y1 = Math.round(Y1);
		var x2 = Math.round(X2);
		var y2 = Math.round(Y2);
		var minX = Math.round(MINX);
		var maxX = Math.round(MAXX);
		var minY = Math.round(MINY);
		var maxY = Math.round(MAXY);

		// Distance start and end point
		var dx = x2 - x1;
		var dy = y2 - y1;

		// Determine slope (absoulte value)
		var len = dy >= 0 ? dy : -dy;
		var lenx = dx >= 0 ? dx : -dx;
		if (lenx > len) {
			len = lenx;
		}

		// Prevent divison by zero
		if (len != 0) {
			// Init steps and start
			var incx = dx / len;
			var incy = dy / len;
			var x = x1;
			var y = y1;

			// Walk the line!
			for (var i = 0; i < len; i++) {
				if(!dashed || (i % 5 < 3)) { // if dashed, draw 3, skip 2, draw 3, skip 2 etc.
					var ry = Math.round(y);
					var rx = Math.round(x);
					if(ry >= minY && ry < maxY && rx >= minX && rx < maxX) {
						var offset = (ry * W + rx) * 4;
						pixels[offset] = r;
						pixels[offset+1] = g;
						pixels[offset+2] = b;
						pixels[offset+3] = alpha;
					}
				}
				x += incx;
				y += incy;
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Dot
	// This method draws a dot.
	//===================================================================================
	function drawDot(X, Y, DOTSIZE, alpha, r, g, b, Width, Height, pixels) {
		var xpos = Math.round(X);
		var ypos = Math.round(Y);
		var W = Math.floor(Width);
		var H = Math.floor(Height);
		var dotSize = Math.round(DOTSIZE);
		var halfDot = Math.round(DOTSIZE/2);
		var startPixelIdx = (ypos * W + xpos) * 4;
		var r2 = Math.ceil(dotSize * dotSize / 4.0);

		for (var x = -halfDot; x < halfDot + 1; x++) {
			if (x + xpos >= 0 && x + xpos < W) {
				var x2 = x * x;

				for (var y = -halfDot; y < halfDot + 1; y++) {
					if(y + ypos >= 0 && y + ypos < H) {
						var y2 = y * y;

						if (y2 + x2 <= r2) {
							var offset = (y * W + x) * 4;
							legacyDDSupLib.blendRGBAs(r,g,b,alpha, startPixelIdx + offset, pixels);
						}
					}
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Draw Dot Full Alpha
	// This method draws a dot with full alpha.
	//===================================================================================
	function drawDotfullalpha(X, Y, DOTSIZE, alpha, r, g, b, Width, Height, pixels) {
		var xpos = Math.round(X);
		var ypos = Math.round(Y);
		var W = Math.floor(Width);
		var H = Math.floor(Height);
		var dotSize = Math.round(DOTSIZE);
		var halfDot = Math.round(DOTSIZE/2);
		var startPixelIdx = (ypos * W + xpos) * 4;
		var r2 = Math.ceil(dotSize * dotSize / 4.0);

		for (var x = -halfDot; x < halfDot + 1; x++) {
			if (x + xpos >= 0 && x + xpos < W) {
				var x2 = x * x;

				for (var y = -halfDot; y < halfDot + 1; y++) {
					if(y + ypos >= 0 && y + ypos < H) {
						var y2 = y * y;

						if (y2 + x2 <= r2) {
							var offset = (y * W + x) * 4;
							pixels[startPixelIdx + offset] = r;
							pixels[startPixelIdx + offset + 1] = g;
							pixels[startPixelIdx + offset + 2] = b;
							pixels[startPixelIdx + offset + 3] = alpha;
						}
					}
				}
			}
		}
	}
	//===================================================================================


	//===================================================================================
	// Update Selections when Zooming or Resizing
	// This method updates the selection when zooming or resizing.
	//===================================================================================
	function updateSelectionsWhenZoomingOrResizing() {
		if(unique > 0) {
			for(var sel = 0; sel < selections.length; sel++) {
				var s = selections[sel];
				s[4] = val2pixelXcrimp(s[0]);
				s[5] = val2pixelXcrimp(s[1]);
				s[7] = val2pixelYcrimp(s[2]);
				s[6] = val2pixelYcrimp(s[3]);
			}
		}
		drawSelections();
	}
	//===================================================================================


	//===================================================================================
	// Select Closest Halo
	// This method finds and select the closest halo from a mouse interaction.
	//===================================================================================
	function selectClosestHalo(currentMouse) {
		var dirty = false;
		var limit = (maxDotSize + 1) * (maxDotSize + 1);
		var first = true;
		var bestDist = -1;
		var bestSrc = -1;
		var bestIdx = -1;

		for(var src = 0; src < dataMappings.length; src++) {
			if(dataMappings[src].active) {
				var fx = dataMappings[src].funX;
				var fy = dataMappings[src].funY;
				var ft = dataMappings[src].funTime;

				for(var i = 0; i < dataMappings[src].size; i++) {
					var x1 = fx(i);
					var y1 = fy(i);

					if(x1 < zoomMinX || x1 > zoomMaxX || y1 < zoomMinY || y1 > zoomMaxY) {
						// no in drawable area
					}
					else {
						if(storyGraphMode) {
							var t = ft(i);
							var px1 = val2pixelXtime(t);
							var py1 = val2pixelYstory(x1, y1, t);
						}
						else {
							var px1 = value2pixelX(x1);
							var py1 = value2pixelY(y1);
						}

						var dx = px1 - currentMouse.x;
						var dy = py1 - currentMouse.y;
						var dist = dx*dx + dy*dy;

						if(dist <= limit) {
							if(first || dist < bestDist) {
								bestSrc = src;
								bestIdx = i;
								bestDist = dist;
								first = false;
							}
						}
					}
				}
			}
		}

		if(first) {
			if(highlightedHalo.hasOwnProperty("src")) {
				// we had something selected before, remove this selection
				highlightedHalo = {};
				highlightedDescendants = {};
				highlightedAncestors = {};
				dirty = true;
			}
		}

		if(!first) {
			dirty = false;

			if(!highlightedHalo.hasOwnProperty("src") || highlightedHalo.src != bestSrc) {
				dirty = true;
				highlightedHalo.src = bestSrc;
			}

			if(!highlightedHalo.hasOwnProperty("idx") || highlightedHalo.idx != bestIdx) {
				dirty = true;
				highlightedHalo.idx = bestIdx;
			}

			if(haveIDs) {
				highlightedDescendants = {"src":bestSrc, "idxs":{}};
				highlightedAncestors = {"src":bestSrc, "idxs":{}};

				var src = bestSrc;
				var fx = dataMappings[src].funX;
				var fy = dataMappings[src].funY;
				var ft = dataMappings[src].funTime;
				var fid = dataMappings[src].funID;
				var fchid = dataMappings[src].funChID;

				// ---------------------  find descendants --------------------------------
				var i = bestIdx;
				var chid = fchid(i);
				var t = ft(i);
				var lastT = t;

				while(chid !== null && chid >= 0 && i < dataMappings[src].size - 1) { // this halo has a descendant
					var found = false;
					for(var j = i+1; j < dataMappings[src].size; j++) { // should appear later in the data.
						var jID = fid(j);
						var jt = ft(j);

						if(lastT > jt) {
							j = dataMappings[src].size + 1; // we have reached a new series of data
							i = j;
							chid = null;
						}
						else if(jID == chid) { // we found the descendant
							highlightedDescendants.idxs[j] = true;
							found = true;
							i = j;
							chid = fchid(i); // try with descendants of the descendant
							j = dataMappings[src].size + 1;
						}
						lastT = jt;
					}

					if(!found) {
						i = dataMappings[src].size; // stop searching
					}
				}

				// ---------------------  find ancestors --------------------------------
				var i = bestIdx;
				var iid = fid(i);
				var t = ft(i);
				var lastT = t;

				while(i > 0) {
					var found = false;

					for(var j = i - 1; j >= 0; j--) { // should appear earlier in the data.
						var jchid = fchid(j);
						var jt = ft(j);

						if(jt > lastT) { // we entered another time series, no more ancestors can be found
							i = 0;
							j = -1;
						}
						else if(jchid == iid) { // child of j is i, found ancestor
							highlightedAncestors.idxs[j] = true;
							found = true;
							i = j; // try again with ancestor, to find more ancestors
							iid = fid(i);
							j = -1;
						}
						lastT = jt;
					}

					if(!found) {
						i = 0; // stop searching
					}
				}

			} // if have IDs
		} // if we found something that was clicked

		if(dirty) {
			updateLocalSelections(false);
		}
	}
	//===================================================================================


	//===================================================================================
	// Hex Color to RGBA Vector
	// This method converts a hexadecimal color value to a RGBA vector.
	//===================================================================================
	function hexColorToRGBAvec(color, alpha) {
		var res = [];

		if(typeof color === 'string' && color.length == 7) {
			var r = parseInt(color.substr(1,2), 16);
			var g = parseInt(color.substr(3,2), 16);
			var b = parseInt(color.substr(5,2), 16);
			var a = Math.max(0, Math.min(255, Math.round(alpha * 255)));
			return [r, g, b, a];
		}
		return [0, 0, 0, 255];
	}
	//===================================================================================


	//===================================================================================
	// Hex Color to RGBA
	// This method converts a hexadecimal color value to a RGBA color.
	//===================================================================================
	function hexColorToRGBA(color, alpha) {
		if(typeof color === 'string' && color.length == 7) {
			var r = parseInt(color.substr(1,2), 16);
			var g = parseInt(color.substr(3,2), 16);
			var b = parseInt(color.substr(5,2), 16);
			return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
		}
		return color;
	}
	//===================================================================================



	//=== CTRL MAIN CODE ======================================================================

});
//=======================================================================================

//======================================================================================================================
