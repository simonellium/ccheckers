//
// Chinese Checker Solitaire game. 
// 
// Copyright (c) 2011 Simon Yau 
// 
// Licensed under the GPL (http://www.gnu.org/licenses/gpl.html)

// Constants
var BACKGROUND = "url('wood-maple-background-repeat.jpg')";
var IMAGEOCCUPIED = "3dsphere-sample.gif";
var IMAGENOTOCCUPIED = "whiteCircle.png";
var PICKEDUPANIMATIONSPEED = 500;
var MOVEANIMATIONSPEED = 500;

var TILESIZE = 70;

CChecker = new Object();

// For UI
CChecker.paper = null;
CChecker.images = new Object;
CChecker.tmpImageSet = null; // image set to help with animation

// For state
CChecker.slots = { }; 
CChecker.undoStack = [ ]; 

// For user interaction; stores coordinate of picked up marble.
CChecker.pickedUp = null;


// ------------------ functions -----------------

// Event handlers
CChecker.clickOn = function(i,j,image) {

    // it's a pick-up; animate the picture
    if (CChecker.pickedUp == null) {
	// first make sure the slot *has* something to be pickedup. 
	if (CChecker.slots[CChecker.coordLabel(i,j)].occupied) {
	    var animation = Raphael.animation({ "transform": "r360" }, PICKEDUPANIMATIONSPEED)
		                   .repeat(Infinity);
	    image.animate(animation); 
	    CChecker.pickedUp = CChecker.coordLabel(i,j);
	}
    }
    else // it's a drop-off, requires redraw
    {
	var origI = parseInt(CChecker.pickedUp.split(",")[0]);
	var origJ = parseInt(CChecker.pickedUp.split(",")[1]);
	var hasMoved = CChecker.moveTo(origI, origJ, i,j);

	// move is valid... 
	if(hasMoved) { 
	    // insert into undo stack
	    var move = CChecker.coordLabel(origI,origJ) + "," + CChecker.coordLabel(i,j);
	    CChecker.undoStack.push(move);

            // Animate: 
	    CChecker.moveAnimation(origI, origJ, i, j, function() { CChecker.redraw(); } );
	} else {
	    CChecker.redraw();
	}
    }

};

// helpers
CChecker.moveTo = function (origI, origJ, i, j) {
    // make a move if it's valid
    if(! ((origI == i && (Math.abs(origJ - j) == 2)) ||
	  (origJ == j && (Math.abs(origI - i) == 2))) ) {
	// Not directly one slot across
	return false; 
    }
    var middleI, middleJ;
    if(origI == i) {
	middleI = i;
	middleJ = origJ > j ? j+1 : origJ+1;
    } else {
	middleJ = j;
	middleI = origI > i ? i+1 : origI+1;
    }
    var slot = CChecker.slots[CChecker.coordLabel(i,j)];
    var origSlot = CChecker.slots[CChecker.coordLabel(origI,origJ)];
    var middleSlot = CChecker.slots[CChecker.coordLabel(middleI,middleJ)];
    if(! (slot.occupiable && !slot.occupied &&
	  middleSlot.occupied) ) {
	// Not an occupied slot in between
	return false; 
    };

    // Now make the move
    slot.occupied = true;
    origSlot.occupied = false;
    middleSlot.occupied = false;

    // Debug
    // alert("" + origI + "," + origJ + " => " + i + "," + j);

    return true;
};

CChecker.coordLabel = function(i,j) {
    return "" + i + "," + j;
}

// Redraw
CChecker.redraw = function() {
    CChecker.tmpImageSet.remove();
    CChecker.tmpImageSet = CChecker.paper.set(); // looks like "set.remove()" removes the set itself.

    for (var i in CChecker.images) {
        CChecker.images[i].remove();
    }
    CChecker.pickedUp = null;

    for (var i = -3; i <= 3; i++) {
	for (var j = -3; j <= 3; j++) {
	    var coord = CChecker.coordLabel(i,j);
	    var slot = CChecker.slots[coord];
	    CChecker.paintSlot (i,j, slot.occupiable, slot.occupied);
	}
    }
};
// Drawing helper function
CChecker.paintSlot = function (i,j, occupiable, occupied) {
    var shiftI = i+3;
    var shiftJ = j+3;
    if (occupiable) {
	// paint occupied or not image
	var image = CChecker.paper.image(occupied ? IMAGEOCCUPIED : IMAGENOTOCCUPIED,
                                         shiftI*TILESIZE, shiftJ*TILESIZE, TILESIZE, TILESIZE);
	CChecker.images[CChecker.coordLabel(i,j)] = image;
	image.click(function () { CChecker.clickOn(i,j, image); });
    }
};

// animates a move 
CChecker.moveAnimation = function (origI, origJ, i, j, callback) {
    // update the record
    document.getElementById('record').innerHTML += "" + origI + "," + origJ + " => " + i + "," + j + "<br>";

    var shiftI = i+3;
    var shiftJ = j+3;
    var shiftOrigI = origI+3;
    var shiftOrigJ = origJ+3;

    // you can't actually animate an image element on top of another (spinning) animation. 
    // So, hacking it by hiding it and putting another image element on top of it. 
    CChecker.images[CChecker.coordLabel(origI,origJ)].stop().hide(); 

    var tmpImageBackground = CChecker.paper.image(IMAGENOTOCCUPIED,
					shiftOrigI*TILESIZE, shiftOrigJ*TILESIZE, 
					TILESIZE, TILESIZE);
    CChecker.tmpImageSet.push(tmpImageBackground);
    var tmpImage = CChecker.paper.image(IMAGEOCCUPIED,
					shiftOrigI*TILESIZE, shiftOrigJ*TILESIZE, 
					TILESIZE, TILESIZE);
    CChecker.tmpImageSet.push(tmpImage);
    tmpImage.animate(
	{ 
	    "x" : shiftI*TILESIZE, 
	    "y" : shiftJ*TILESIZE
	}, 
        MOVEANIMATIONSPEED, 
	callback
    );
};

// undo function. Assumes undoStack is correct
CChecker.undo = function() {
    if (CChecker.undoStack.length > 0) {
	var undoMove = CChecker.undoStack.pop();
	var origI = parseInt(undoMove.split(",")[0]);
	var origJ = parseInt(undoMove.split(",")[1]);
	var i = parseInt(undoMove.split(",")[2]);
	var j = parseInt(undoMove.split(",")[3]);
	var middleI, middleJ;
	if(origI == i) {
	    middleI = i;
	    middleJ = origJ > j ? j+1 : origJ+1;
	} else {
	    middleJ = j;
	    middleI = origI > i ? i+1 : origI+1;
	}
	var slot = CChecker.slots[CChecker.coordLabel(i,j)];
	var origSlot = CChecker.slots[CChecker.coordLabel(origI,origJ)];
	var middleSlot = CChecker.slots[CChecker.coordLabel(middleI,middleJ)];
	slot.occupied = false;
	origSlot.occupied = true;
	middleSlot.occupied = true;
        CChecker.moveAnimation(i, j, origI, origJ, function() { CChecker.redraw(); } );
    }
};

// reset function. Starts a new game
CChecker.reset = function () {
    // reset the slots
    for (var i = -3; i <= 3; i++) {
	for (var j = -3; j <= 3; j++) {
	    var coord = CChecker.coordLabel(i,j);
	    var occupiable = (Math.abs(i) + Math.abs(j) < 5);
	    var occupied = occupiable && (!(i==0 &&j==0));
	    var slot = { "occupiable" : occupiable,
		         "occupied" : occupied };
	    CChecker.slots[coord] = slot;
	}
    }

    // reset the undo stack and picked up coords
    CChecker.undoStack = [ ]; 
    CChecker.pickedUp = null;

    // Debug
    // alert(JSON.stringify(CChecker.slots));

    // log
    document.getElementById('record').innerHTML += "<hr>";

    // redraw
    CChecker.redraw();
};

// Initialization
CChecker.init = function () {

    // initialize UI
    CChecker.paper = Raphael("main", TILESIZE*7, TILESIZE*8);
    CChecker.paper.clear();
    CChecker.paper.rect(0, 0, TILESIZE*7, TILESIZE*8, 10)
                  .attr({fill: BACKGROUND, stroke: "none"});
    CChecker.paper.text(10, TILESIZE*7.5, "Chinese Checker Solitaire\nby Simon Yau\n")
                  .attr("font-size", "12")
                  .attr("text-anchor", "start")
                  .click(function () { window.open ("http://www.cs.nyu.edu/~smyau"); });
    CChecker.paper.text(TILESIZE*6.5, TILESIZE*7.5 , "Undo")
                  .attr("stroke", "#999999")
                  .click(function () { CChecker.undo(); });
    CChecker.paper.text(TILESIZE*6.5, TILESIZE*7.7 , "Reset")
                  .attr("stroke", "#999999")
                  .click(function () { CChecker.reset(); });

    CChecker.tmpImageSet = CChecker.paper.set();

    // reset a new game
    CChecker.reset();
};

