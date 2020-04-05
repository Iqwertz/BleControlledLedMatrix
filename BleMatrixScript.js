//////////////////////////////////////////////////
//BleControlledLedMatrix
//Author: Julius Hussl
/////////////////////////////////////////////////

//////////////General Settings/////////////////////
var GridSize= 16;                   //Defines the Size of the Led Matrix in Pixels
var GridHeight=0.83;                //height in percent of window height 0-1
var GridLineWidth=2;                //width of the Grid Lines
var GridLineColor='#1f1f1f';        //Color of the Grid Lines
var GridStandardColor='#000000';    //Pixel Color on Startup
var Borders=10;                     //Border thicknes in px
/*var MaxPictures=30;    
var Pictures=[];
var PicDelay=100;*/

///////////Mobile Settings///////////////
var Mobile=false;          //Bool if mobile phone
var MobileBorders=5;       //Border thickness on phone
var MobileGridLineWidth=3  //Gridlinewidth on phone
var MobileGridWidth=0.92;  //percentage of the screen width for the Grid on phone

/////////////Error vars/////////////
var OccuredErrors=0;    //Amount of errors that occured during ble data transmitting
var MaxError=2;         //max amount of Errors until Screen gets updated

////////////Global Sys Vars/////////////
var MatrixColors;               //2d Array which stores current colors of the screen
var SelectedColor='#ffffff';    //Current Color for drawing Tools
var funqueue = [];              //Array that stores functions for the ble sending queue
var canvas;
var RgbaToRgbBackground=[0,0,0];

////////////////setup//////////////////////
function setup() {
    if(windowHeight>windowWidth){                                                                                                                                  //Load as mobile side when screen height is greater than screen width
        canvas=createCanvas(windowWidth*MobileGridWidth+Borders*2, windowWidth*MobileGridWidth+Borders*2);                                                         //set canvas size
        Mobile=true;                                                                                                                                               //set mobile var
        Borders=MobileBorders;                                                                                                                                     //set mobile vars
        GridLineWidth=MobileGridLineWidth; //set mobile vars
        document.documentElement.style.setProperty('--Grid-Size', (windowWidth*MobileGridWidth+Borders*4)+"px");                                                   //set css var
        ColorBar=['#000000','#4dffa0','#4d98ff','#7d4dff','#ff233d','#ff984d','#fff84d','#ff8000','#00ff93','#00ceff','#ff4dea','#ff4d62','#000000','#ffffff'];    //Set mobile preset colors
        for(var i=1; i<=13; i++){
            document.getElementById("MobileColorTab"+i).style.backgroundColor=ColorBar[i];                                                                         //Set preset colors 
        }
        colorPicker= new window.iro.ColorPicker('#mobilepicker', {                                                                                                 //initialize color picker
            width: 100,
            color: "#ffffff"
        });
    }else{                                                                                                                        //Load normal
        canvas=createCanvas(windowHeight*GridHeight+Borders*2, windowHeight*GridHeight+Borders*2);                                //set canvas size
        document.documentElement.style.setProperty('--Grid-Size', windowHeight*GridHeight+"px");                                  //set grid size
        ColorBar=['#000000','#4dffa0','#4d98ff','#7d4dff','#ff4dea','#ff4d62','#ff984d','#fff84d','#000000','#ffffff'];           //set preset colors
        for(var i=1; i<=9; i++){
            document.getElementById("ColorTab"+i).style.backgroundColor=ColorBar[i];                                              //Set preset colors 
        }
        colorPicker= new window.iro.ColorPicker('#picker', {                                                                      //initialize Colorpicker
            width: 100,
            color: "#ffffff"
        });
    }

    canvas.parent("Grid");                                  //attache Grid to the container div

    MatrixColors=Create2DArray(GridSize,GridSize);          //create 2d array for the Matrix
    for(var y=0; y<GridSize; y++){
        for( var x=0; x<GridSize; x++){
            MatrixColors[x][y]=GridStandardColor;           //set every Pixel to the Standard color
        }
    }
}

function draw() {
    DrawTiles();   //Draw Tiles
    DrawGrid();    //Draw Grid
}

function DrawGrid(){                             //Draws Grid on canvas
    var CellSize=(height-Borders*2)/GridSize;    //Calculate Cell size
    var SX=width/2-(height)/2+Borders;           //left cordinate of starting point
    var SY=height/2-(height)/2+Borders;          //top cordinate of starting point
    strokeWeight(GridLineWidth);                 //Set stroke width
    stroke(GridLineColor);                       //Set line Color
    noFill();                                    //turn of fill for Grid
    for(var y=0; y<GridSize; y++){
        for(var x=0; x<GridSize; x++){
            rect(SX+CellSize*x,SY+CellSize*y,CellSize,CellSize);   //Draw rectangles for the Grid
        }
    }
    strokeWeight(Borders);                                                                 //set Border width
    strokeJoin(ROUND);                                                                     //Make round Corners
    rect(SX-Borders/2,SY-Borders/2, CellSize*GridSize+Borders, CellSize*GridSize+Borders); //draw frame
}

function DrawTiles(){                                                    //Draws the MatrixColors array to canvas
    var CellSize=(height-Borders*2)/GridSize;                            //calculate Cell size
    var SX=width/2-(height)/2+Borders;                                   //left cordinate of starting point
    var SY=height/2-(height)/2+Borders;                                  //top cordinate of starting point
    for(var y=0; y<GridSize; y++){
        for(var x=0; x<GridSize; x++){
            noStroke();                                                  //turn of stroke
            fill(MatrixColors[x][y]);                                    //fill the drawn rectangles with the Colors at x and y from the MatrixColor array
            rect(SX+CellSize*x,SY+CellSize*y,CellSize,CellSize);         //draw the rectangles
        }
    }
}

function Create2DArray(rows,columns) {   //creates and returns a 2d array
    var x = new Array(rows);
    for (var i = 0; i < rows; i++) {
        x[i] = new Array(columns);
    }
    return x;
}


function DrawPixel(PixelX,PixelY,PixelColor,SendBle){                                        //Draws Pixel to Matrix array and pushes it in the Bluetooth send queue if SendBle==true
    if(MatrixColors[PixelX][PixelY]!=PixelColor){                                            //Checks if it is a new Pixel
        MatrixColors[PixelX][PixelY]=PixelColor;                                             //Sets Color to matrix Array
        if(SendBle){
            funqueue.push(wrapFunction(QueueDrawPixel, this, [PixelX,PixelY,PixelColor]));   //wrap function with parameters and push it to the queue
            if(funqueue.length==1){                                                          //When the Queue was empty
                RunQueue();                                                                  //Start executing Queue
            }
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////Mouse Events//////////////////////
function mousePressed(){                                                            //called when mouse pressed
    if(!ColorPickerActive){                                                         //disable drawing when color picker is active
        var TileNumber=GetTileNumber(mouseX, mouseY);                               //gets the x and y position on the Matrix array scale
        if(TileNumber[0]!=-1&&TileNumber[1]!=-1){                                   //check if the ckick was on the canvas
            switch(SelectedTool){                                                   //check which tool is curently selected
                case 0:                                                             //Pen tool
                    DrawPixel(TileNumber[0],TileNumber[1],SelectedColor, true);     //Draw one Pixel on mouse Position  
                    break;
                case 1:                                                             //Fill tool
                    FillTool(TileNumber[0],TileNumber[1]);                          //Start fill at clicked Tile
                    break;
                case 2:                                                             //Circle tool
                    CircleStart[0]=TileNumber[0];                                   //Set Circle Start X cordinate
                    CircleStart[1]=TileNumber[1];                                   //Set Circle Start Y cordinate
                    SetBuffer();                                                    //Creates Buffer for Circle Preview
                    break;
                case 3:                                                             //Line tool
                    LineStart[0]=TileNumber[0];                                     //Set Line Start X cordinate 
                    LineStart[1]=TileNumber[1];                                     //Set Line Start Y cordinate
                    SetBuffer();                                                    //Creates Buffer for Circle Preview
                    break; 
            }
        }
    }
}

function mouseDragged(){                                                         //called when mouse dragged 
    if(!ColorPickerActive){                                                      //disable drawing when color picker is active
        var TileNumber=GetTileNumber(mouseX, mouseY);                            //gets the x and y position on the Matrix array scale
        if(TileNumber[0]!=-1&&TileNumber[1]!=-1){                                //check if the ckick was on the canvas
            switch(SelectedTool){                                                //check which tool is curently selected
                case 0:     	                                                 //Pen tool
                    DrawPixel(TileNumber[0],TileNumber[1],SelectedColor, true);  //Draw one Pixel on mouse Position  
                    break;
                case 2:                                                          //Circle tool
                    CircleToolDrag(TileNumber[0],TileNumber[1]);                 //Move Circle on Buffer Canvas
                    break;
                case 3:                                                          //Line tool
                    LineToolDrag(TileNumber[0],TileNumber[1]);                   //Move Line on Buffer Canvas
                    break;
            }
        }
    }
}
function mouseReleased(){                               //called when mouse released
    if(!ColorPickerActive){                             //disable drawing when color picker is active
        var TileNumber=GetTileNumber(mouseX, mouseY);   //gets the x and y position on the Matrix array scale
        if(TileNumber[0]!=-1&&TileNumber[1]!=-1){       //check if the ckick was on the canvas
            switch(SelectedTool){                       //check which tool is curently selected
                case 2:                                 //Circle tool
                    SetMatrixFromBuffer(MatrixBuffer);  //Reset Matrix to previous state
                    BleSetCircle();                     //Draw Circle to Matrix Array and send data over Bluetooth
                    CircleStart=[-1,-1];                //Reset Circle Start
                    CurrentCircleEnd=[-1,-1];           //Reset Circle End
                    break;
                case 3:                                 //Line tool
                    SetMatrixFromBuffer(MatrixBuffer);  //Reset Matrix to previous state
                    BleSetLine();                       //Draw Line to Matrix Array and send data over Bluetooth
                    LineStart=[-1,-1];                  //Reset Line Start
                    CurrentLineEnd=[-1,-1];             //Reset Line End
                    break;
            }
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function GetTileNumber(MX, MY){                  //returns the Grid x and Grid y cordinate based on the Mouse X and Y data
    var CellSize=(height-Borders*2)/GridSize;    //Calculate Cell size
    var SX=width/2-(height)/2+Borders;           //left cordinate of starting point
    var SY=height/2-(height)/2+Borders;          //top cordinate of starting point
    var x=-1;                                    //calculated x value (when no value found -1 is returned)
    var y=-1;                                    //calculated y value (when no value found -1 is returned)
    for(var i=0; i<GridSize; i++){               //Loops threw every x cordinate of the Grid and Check when Mouse X is in bounds
        if(MX<SX+CellSize*(i+1)){ 
            x=i; 
            break;
        }
    }

    for(var i=0; i<GridSize; i++){               //Loops threw every x cordinate of the Grid and Check when Mouse X is in bounds
        if(MY<SY+CellSize*(i+1)){
            y=i;
            break;
        }
    }
    return [x,y];                                //return the cordinates in an array
}

function ClearDisp(){                               //Clear display function
    for(var y=0; y<GridSize; y++){
        for( var x=0; x<GridSize; x++){
            MatrixColors[x][y]=GridStandardColor;   //Set all Matrix Array Values to standard
        }
    }
    funqueue=[];                                    //reset Send queue
    send("C;");                                     //Send Clear Command to Matrix
    
}

function SetBrightness(B){        //Sets Brightness of Matrix //B in Percent
    B=map(B,0,100,0,255);         //Convert Percent to byte 255  //Maps Percentage to Byte value
    send("B"+B.toString()+";")    //Send coded as B[Value];  //Send the Value over Ble 
}

function hexToRgb(hex) {  //converts hex color to rgb
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////ToolMenu///////////////////////////
var SelectedTool = 0;    //0=Pen, 1=fill, 2=Circle, 3=line

function SetTool(x){     //Sets Tool and colors the Toolicon
    document.getElementById('ToolMenu').getElementsByTagName('div')[SelectedTool].style.color="#fff";
    SelectedTool=x;
    document.getElementById('ToolMenu').getElementsByTagName('div')[SelectedTool].style.color="#00ff76";
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////FillTool//////////////////////////
function FillTool(x, y){                //Start Fill at position x and y   
    var FillColor=MatrixColors[x][y];   //Get the Color of the clicked Tile
    if(FillColor==SelectedColor){       //If the filled Color is the same as the selected Color stop fill because it wouldnt change anything
        return;
    }
    var FillPoints=[];                                          //Array which holds markers
    FillPoints.push([x,y]);                                     //Sets first marker at clicked point
    while(FillPoints.length>0){                                 //Fill until all Points are Filled
        var CheckX=FillPoints[0][0];                            //Get the next Check X point in Array
        var CheckY=FillPoints[0][1];                            //Get the next Check Y point in Array
        if(MatrixColors[CheckX][CheckY]!=SelectedColor){        //Check if the Checked Tile already has the Fillcolor to avoid recursion
            if(CheckY<GridSize-1){                              //Checks if Pixel is in Bonds to avoid overflow
                if(MatrixColors[CheckX][CheckY+1]==FillColor){  //Check if Color above Pixel is the Color to be filled
                    FillPoints.push([CheckX,CheckY+1]);         //Add new Marker
                }
            }
            if(CheckX!=0){                                      //Checks if Pixel is in Bonds to avoid overflow
                if(MatrixColors[CheckX-1][CheckY]==FillColor){  //Check if Color beside Pixel is the Color to be filled
                    FillPoints.push([CheckX-1,CheckY]);         //Add new Marker
                }
            }  
            if(CheckY!=0){                                      //Checks if Pixel is in Bonds to avoid overflow
                if(MatrixColors[CheckX][CheckY-1]==FillColor){  //Check if Color below Pixel is the Color to be filled
                    FillPoints.push([CheckX,CheckY-1]);         //Add new Marker
                }
            }
            if(CheckX<GridSize-1){                              //Checks if Pixel is in Bonds to avoid overflow
                if(MatrixColors[CheckX+1][CheckY]==FillColor){  //Check if Color beside Pixel is the Color to be filled
                    FillPoints.push([CheckX+1,CheckY]);         //Add new Marker
                } 
            }
        }
        DrawPixel(CheckX,CheckY,SelectedColor,true);            //Draw Pixel at Marker
        FillPoints.shift();                                     //Delete the Marker
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////Circle Tool//////////////////////
var CircleStart = [0,0];        //The Starting Point of the Circle (Set when Mouse Clicked)
var CurrentCircleEnd=[-1,-1]    //The End Point of the Circle (CHenges during Drag)

/////Brahams Algorithm. Basic ellipse implementation from: http://0x80.pl/articles/bresenham.js
function ellipse_points( x0, y0, x, y, Ble) {
    DrawPixel( x0 + x, y0 + y, SelectedColor, Ble);
    DrawPixel( x0 - x, y0 + y, SelectedColor, Ble);
    DrawPixel( x0 + x, y0 - y, SelectedColor, Ble);
    DrawPixel( x0 - x, y0 - y, SelectedColor, Ble);
}

function rasterize( x0, y0, a, b, hw, Ble) {
    var a2 = a*a;
    var b2 = b*b;

    var d  = 4*b2 - 4*b*a2 + a2;
    var delta_A = 4*3*b2;
    var delta_B = 4*(3*b2 - 2*b*a2 + 2*a2);

    var limit   = (a2*a2)/(a2+b2);

    var x = 0;
    var y = b;
    while (true) {
        if (hw)
            ellipse_points( x0, y0, x, y, Ble);
        else
            ellipse_points( x0, y0, y, x, Ble);

        if (x * x >= limit)
            break;

        if (d > 0) {
            d       += delta_B;
            delta_A += 4*2*b2;
            delta_B += 4*(2*b2 + 2*a2);

            x += 1;
            y -= 1;
        }
        else {
            d       += delta_A;
            delta_A += 4*2*b2;
            delta_B += 4*2*b2;

            x += 1;
        }
    }
}


function CircleToolDrag(x, y) {          //Draws Circle on Buffer during Drag   //x and y cordinates of the bottom right point
    CurrentCircleEnd[0]=x;
    CurrentCircleEnd[1]=y;
    SetMatrixFromBuffer(MatrixBuffer);   //Clear previous Circle overlay

    var CEX=CurrentCircleEnd[0];         //Set Start and End point vars
    var CEY=CurrentCircleEnd[1];         //Set Start and End point vars
    var CSX=CircleStart[0];              //Set Start and End point vars
    var CSY=CircleStart[1];              //Set Start and End point vars
    
    ///////Swap Cordinates if Start > End in order to make the draged point on the bottom left///////
    if(CEX<CSX){                     
        var c=CEX;
        CEX=CSX;
        CSX=c;
    }

    if(CEY<CSY){
        var c=CEY;
        CEY=CSY;
        CSY=c;
    }
    
    /////Handle special cases/////
    if(CEX==CSX&&CEY==CSY){           //Check if clicked point is same as started point
        return;     
    } else if(CEX==CSX || CEY==CSY){  //Check if clicked point is in the same Row or Column as Start
        PixelLine(CSX,CSY,CEX,CEY,false);
        return;
    } else if(CEX-CSX==1){            //Check if clicked Point is 1 column beside
        PixelLine(CSX,CSY,CEX-1,CEY,false);
        PixelLine(CSX+1,CSY,CEX,CEY,false);
        return;
    } else if(CEY-CSY==1){            //Check if clicked Point is 1 column beside
        PixelLine(CSX,CSY,CEX,CEY-1,false);
        PixelLine(CSX,CSY+1,CEX,CEY,false);
        return;
    }

    var cx=CSX+ceil((CEX-CSX)/2);               //center X
    var cy=CSY+ceil((CEY-CSY)/2);               //center Y
    var rx=CEX-cx;                              //x cordinate on radius
    var ry=CEY-cy;                              //y cordinate on radius
    rasterize( cx, cy, rx, ry, true, false);    //Draw Circle
    rasterize( cx, cy, ry, rx, false, false);   //Draw Circle
}

function BleSetCircle(){                 //Draw Circle on Matrix Canvas and send with Bluetooth
    SetMatrixFromBuffer(MatrixBuffer);   //REsets Matrix from Buffer to clear last drag move

    var CEX=CurrentCircleEnd[0];         //Set Start and End point vars
    var CEY=CurrentCircleEnd[1];         //Set Start and End point vars
    var CSX=CircleStart[0];              //Set Start and End point vars
    var CSY=CircleStart[1];              //Set Start and End point vars
    
    ///////Swap Cordinates if Start > End in order to make the draged point on the bottom left///////
    if(CEX<CSX){                     
        var c=CEX;
        CEX=CSX;
        CSX=c;
    }

    if(CEY<CSY){
        var c=CEY;
        CEY=CSY;
        CSY=c;
    }
    
    /////Handle special cases/////
    if(CEX==CSX&&CEY==CSY){             //Check if clicked point is same as started point
        return;     
    } else if(CEX==CSX || CEY==CSY){    //Check if clicked point is in the same Row or Column as Start
        PixelLine(CSX,CSY,CEX,CEY,false);
        return;
    } else if(CEX-CSX==1){              //Check if clicked Point is 1 column beside
        PixelLine(CSX,CSY,CEX-1,CEY,false);
        PixelLine(CSX+1,CSY,CEX,CEY,false);
        return;
    } else if(CEY-CSY==1){              //Check if clicked Point is 1 column beside
        PixelLine(CSX,CSY,CEX,CEY-1,false);
        PixelLine(CSX,CSY+1,CEX,CEY,false);
        return;
    }

    var cx=CSX+ceil((CEX-CSX)/2);               //center X
    var cy=CSY+ceil((CEY-CSY)/2);               //center Y
    var rx=CEX-cx;                              //x cordinate on radius
    var ry=CEY-cy;                              //y cordinate on radius
    rasterize( cx, cy, rx, ry, true, true);     //Draw Circle
    rasterize( cx, cy, ry, rx, false, true);    //Draw Circle
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////Line Tool////////////////////////
var LineStart = [0,0];          //Starting Point of the Line
var CurrentLineEnd=[-1,-1];     //End Point of the Line

function LineToolDrag(x,y){     //Draws Line to Buffer during Drag  //End X, End Y
    CurrentLineEnd[0]=x;
    CurrentLineEnd[1]=y;
    SetMatrixFromBuffer(MatrixBuffer);                                                     //REsets Matrix from Buffer to clear last drag move
    PixelLine(LineStart[0], LineStart[1], CurrentLineEnd[0], CurrentLineEnd[1], false);    //Draws Line
}

function BleSetLine(){                                                                  //Draws Line to Matrix Array and sends it over Bluetooth
    PixelLine(LineStart[0], LineStart[1], CurrentLineEnd[0], CurrentLineEnd[1], true);  //Draws Line
}

function PixelLine(x0, y0, x1, y1, Ble) {  //bresenham Algorithm
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx - dy;
    while(true) {
        DrawPixel(x0, y0, SelectedColor, Ble);
        if ((x0 === x1) && (y0 === y1)) break;
        var e2 = 2*err;
        if (e2 > -dy) { err -= dy; x0  += sx; }
        if (e2 < dx) { err += dx; y0  += sy; }
    }
}

//////////////////Matrix Buffer function (for Moving Line, when selecting)/////////////
var MatrixBuffer=Create2DArray(GridSize,GridSize); //Creates Buffer which stores a copie of the MAtrix before a draggable Tool started to be able to reset during moving

function SetBuffer(){                              //Initalizes Buffer by coping the Matrix Array
    for(var y=0; y<GridSize; y++){
        for( var x=0; x<GridSize; x++){
            MatrixBuffer[x][y]=MatrixColors[x][y];
        }
    }
}

function SetMatrixFromBuffer(Buffer){              //Set Matrix to Buffer state
    for(var bx=0; bx<GridSize; bx++){
        for (var by=0; by<GridSize; by++){
            MatrixColors[bx][by]=Buffer[bx][by];
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////Color Bar/////////////////////////

var ColorPickerActive=false;  
var Opened=false;
var colorPicker;
var ColorBar;


/////Color Picker//////
function onColorChange(color, changes) {                                        //called when a new color is selected in the color Picker
    if(Mobile){
        document.getElementById("MCPC").style.color=color.hexString;            //Set Mobile Color Picker shadow to selected color
    }else{
        document.getElementById("CPC").style.color=color.hexString;             //Set Mobile Color Picker shadow to selected color
        document.getElementById("ColorTab0").style.color=color.hexString;       //Set Icon shadow of the Color Picker to selected color
    }   
    ColorBar[0]=color.hexString;                                                //Set Color in Color array
    SelectedColor=ColorBar[0];                                                  //Set the selected COlor
}

function OpenColorPicker(){                                                                     //Called when COlor Picke is opened
    if(Mobile){ 
        for(var i=1; i<=13; i++){
            document.getElementById("MobileColorTab"+i).style["boxShadow"] = "0 0 0px #fff";    //Delete all mobile "selected" shadows
        }
    }else{
        for(var i=1; i<=9; i++){
            document.getElementById("ColorTab"+i).style["boxShadow"] = "0 0 0px #fff";          //Delete all "selected" shadows
        }
    }
    colorPicker.on('color:change', onColorChange);                                              //turn on Color Picker
    document.getElementById("MCPC").style.display="block";                                      //display Color Picker
    ColorPickerActive=true;                                                                     //Set COlor Picker State
    Opened=true;                                                                                //Set Color Picker as opened (this var is needed to avoid instant closing after opening)
}

/////Select Color/////
function SelectColor(c){
    if(Mobile){
        for(var i=1; i<=13; i++){
            document.getElementById("MobileColorTab"+i).style["boxShadow"] = "0 0 0px #fff";    //Delete all mobile "selected" shadows
        }
    }else{
        for(var i=1; i<=9; i++){
            document.getElementById("ColorTab"+i).style["boxShadow"] = "0 0 0px #fff";          //Delete all "selected" shadows
        }
    }
    SelectedColor=ColorBar[c];  //Set the new selected color
    if(Mobile){
        document.getElementById("MobileColorTab"+c).style["boxShadow"] = "0 0 10px #fff";       //Set mobile "selected" Shadow
    }else{
        document.getElementById("ColorTab"+c).style["boxShadow"] = "0 0 10px #fff";             //Set "selected" Shadow
    }
}

document.addEventListener('click', function(e) {                                                                                                   //called on Window click // closes Color Picker when not Clicked on itself
    e = e || window.event;
    var target = e.target || e.srcElement;
    if(target.tagName=="BODY" && !Opened){                                                                                                          //Check if clicked on Body, if true close Color Picker and turn it off
        if(Mobile){
            document.getElementById("MCPC").style.display="none";
        }else{
            document.getElementById("CPC").style.display="none";
        }
        ColorPickerActive=false;
        colorPicker.off('color:change', onColorChange);
    } else if(target.parentElement.parentElement.className!="ColorPicker" && target.parentElement.parentElement.className!="ColorBar" && !Opened){   //Check if clicked anywhere else than Color Bar or Color Picker if true close Color Picker and turn it off
        if(Mobile){
            document.getElementById("MCPC").style.display="none";
        }else{
            document.getElementById("CPC").style.display="none";
        }
        ColorPickerActive=false;
        colorPicker.off('color:change', onColorChange);
    }
    if(Opened){         //if the Color Picker the Event Listner gets triggered. To avioid instantly closing it again the first click (when Opened==true) gets ignored
        Opened=false;
    }
}, false);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////Mobile//////////////////////////////////////
/////////////////Mobile Ble Menu functions ///////////////////
function OpenBleMenu(){
    if(document.getElementById("MBB").getElementsByClassName("MobileButtons")[0].style.display!="block"){
        document.getElementById("MBB").style.borderBottomLeftRadius="0px";
        document.getElementById("MBB").style.borderBottomRightRadius="0px";
        document.getElementById("MBB").getElementsByClassName("MobileButtons")[0].style.display="block";
        document.getElementById("MBB").getElementsByClassName("MobileButtons")[1].style.display="block";
        document.getElementById("MBB").getElementsByClassName("MobileButtons")[2].style.display="block";
        document.getElementById("MBB").getElementsByClassName("BrightnessSlider")[0].style.display="block";
    }else{
        CloseBleMenu();
    }
}

function CloseBleMenu(){
    document.getElementById("MBB").style.borderBottomLeftRadius="20px";
    document.getElementById("MBB").style.borderBottomRightRadius="20px";
    document.getElementById("MBB").getElementsByClassName("MobileButtons")[0].style.display="none";
    document.getElementById("MBB").getElementsByClassName("MobileButtons")[1].style.display="none";
    document.getElementById("MBB").getElementsByClassName("MobileButtons")[2].style.display="none";
    document.getElementById("Brightness").style.display="none";
    document.getElementById("MBB").getElementsByClassName("BrightnessSlider")[0].style.display="none";
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////Bluetooth///////////////////////////////////////////////////
///////////////////////Ble Send Queue///////////////////////////
function wrapFunction (fn, context, params) {  //wraps function with parametera
    return function() {
        fn.apply(context, params);
    };
}

function QueueDrawPixel (PX,PY,PC) {          //Sends Pixel data over Bluetooth and reruns queue
    BleSetPixel(PC, PX, PY);
    RunQueue();
}

function RunQueue(){                                    //executes first function in array with timeout and deletes it afterwards. If queue is empty and more errors occured than allowed Matrix gets updated
    if(funqueue.length > 0){
        setTimeout(function(){funqueue.shift()()},70);  //execute first function in array after delay and shift it
    }else if(OccuredErrors>=MaxError){
        BleMatrixUpdate();
    }

}

function BleMatrixUpdate(){                        //Updates Led Matrix from Matrix Array (Used when to many Errors Occured)
    OccuredErrors=0;
    for(var x=0; x<GridSize; x++){
        for( var y=0; y<GridSize; y++) {
            var TempColor=MatrixColors[x][y];
            MatrixColors[x][y]="#";
            DrawPixel(x,y,TempColor,true);
        }
    }
    console.log("Update");
}

function BleSetPixel(hexColor, X, Y){              //Formats Pixel data and sends it  //DataValueFormat for SetPixel= PC[HexColor]X[x]Y[y];   //P starts Pixel reading //[x] x is a var and no Brackets   //HexColor without #
    var RGB=hexToRgb(hexColor);         
    var data="PC"+hexColor.substr(1)+"X"+X.toString()+"Y"+Y.toString()+";";
    send(data);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////Bluetooth Web Api////////////////////////////////////////////
////////Using Code from the Google Chrome Web Ble example////////////
var charackteristicsCache = null;
var serviceUuid = "0xFFE0";
var characteristicUuid = "0xFFE1";
let deviceCache = null;
let readBuffer = '';

var currentServiceUuid;
var currentCharacteristicUuid;

function onStartButtonClick() {
    if (serviceUuid.startsWith('0x')) {
        currentServiceUuid = parseInt(serviceUuid);
    }

    if (characteristicUuid.startsWith('0x')) {
        currentCharacteristicUuid = parseInt(characteristicUuid);
    }
    console.log('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice({filters: [{services: [currentServiceUuid]}]})
        .then(device => {
        console.log('Connecting to GATT Server...');
        console.log('Connected to '+ device.name)
        deviceCache = device;
        deviceCache.addEventListener('gattserverdisconnected', handleDisconnection);

        return device.gatt.connect();
    })
        .then(server => {
        console.log('Getting Service...');
        return server.getPrimaryService(currentServiceUuid);
    })
        .then(service => {
        console.log('Getting Characteristic...');
        return service.getCharacteristic(currentCharacteristicUuid);
    })
        .then(characteristic => {
        charackteristicsCache = characteristic;
        return charackteristicsCache.startNotifications().then(_ => {

            console.log('> Notifications started');
            charackteristicsCache.addEventListener('characteristicvaluechanged',
                                                   handleNotifications);
            send("C;");
        });
    })
        .catch(error => {
        console.log('Argh! ' + error);
    });
}

function handleDisconnection(event) {   //function that tries to reconnect if connection is suddenly lost
    let device = event.target;
    console.log('"' + device.name +
                '" bluetooth device disconnected, trying to reconnect...');
    connectDeviceAndCacheCharacteristic(device).
    then(characteristic => startNotifications(characteristic)).
    catch(error => log(error));
}

function onStopButtonClick() {    //function not working because only notification is stopped
    if (charackteristicsCache) {
        charackteristicsCache.stopNotifications()
            .then(_ => {
            console.log('> Notifications stopped');
            charackteristicsCache.removeEventListener('characteristicvaluechanged',
                                                      handleNotifications);
        })
            .catch(error => {
            console.log('Argh! ' + error);
        });
    }
}

function connectDeviceAndCacheCharacteristic(device) {
    if (device.gatt.connected && characteristicCache) {
        return Promise.resolve(characteristicCache);
    }

    console.log('Connecting to GATT server...');

    return device.gatt.connect().
    then(server => {
        console.log('GATT server connected, getting service...');

        return server.getPrimaryService(0xFFE0);
    }).
    then(service => {
        console.log('Service found, getting characteristic...');

        return service.getCharacteristic(0xFFE1);
    }).
    then(characteristic => {
        console.log('Characteristic found');
        characteristicCache = characteristic;

        return characteristicCache;
    });
}

function handleNotifications(event) {
    let value = event.target.value;
    let text = new TextDecoder().decode(event.target.value);
    for (let c of text) {
        if (c === '\n') {
            let data = readBuffer.trim();
            readBuffer = '';
            if (data) {
                if(data=="E"){
                    console.log(("Error"));
                    OccuredErrors++;
                }
            }
            console.log(readBuffer);
        }
        else {
            readBuffer += c;
        }
    }
}

function send(data) {    //function that sends data and splits it up if to big
    data = String(data);

    if (!data || !charackteristicsCache) {
        return;
    }

    if (data.length > 20) {
        let chunks = data.match(/(.|[\r\n]){1,20}/g);

        writeToCharacteristic(charackteristicsCache, chunks[0]);

        for (let i = 1; i < chunks.length; i++) {
            setTimeout(() => {
                writeToCharacteristic(charackteristicsCache, chunks[i]);
            }, i * 100);
        }
    }
    else {
        writeToCharacteristic(charackteristicsCache, data);
    }

    log(data, 'out');
}

function writeToCharacteristic(characteristic, data) {
    characteristic.writeValue(new TextEncoder().encode(data));
}

/////////////////EOC//////////////////////

///////Commented Code for later purposes/////////////
/*
function AddPicture(){
    var l=Pictures.length
    Pictures[l]=[];
    for(var i=0; i<GridSize; i++){
        Pictures[l][i]=[];
        for(var j=0; j<GridSize; j++){
            Pictures[l][i][j]=[];
            for(var c=0; c<3; c++){
                Pictures[l][i][j][c]=0;
            }
        }
    }
    PushPictures(l);
}

function InitializePictureArray(n){
    for(var l=0; l<n; l++){
        Pictures[l]=[];
        for(var i=0; i<GridSize; i++){
            Pictures[l][i]=[];
            for(var j=0; j<GridSize; j++){
                Pictures[l][i][j]=[];
                for(var c=0; c<3; c++){
                    Pictures[l][i][j][c]=0;
                }
            }
        }
    }
}

function PushPictures(l){
    for(var i=0; i<GridSize; i++){
        for(var j=0; j<GridSize; j++){
            var c=MatrixColors[i][j];
            Pictures[l][i][j][0]=hexToRgb(c).r;
            Pictures[l][i][j][1]=hexToRgb(c).g;
            Pictures[l][i][j][2]=hexToRgb(c).b;
        }
    }
    Pictures[l].reverse();
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rgba2rgb(RGB_background, RGBA_color)
{
    var alpha = RGBA_color[3];
    if(alpha>=0 &&alpha<=1){
        return{
            r: (1 - alpha) * RGB_background[0] + alpha * RGBA_color[0],
            g: (1 - alpha) * RGB_background[1] + alpha * RGBA_color[1],
            b: (1 - alpha) * RGB_background[2] + alpha * RGBA_color[2]
        }
    }else{
        console.log("alphaWert darf nicht höher als 1 sein")
    }
}*/
