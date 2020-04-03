var GridSize= 16;
var GridHeight=0.83; //height in percent of window height 0-1
var GridLineWidth=2;
var GridLineColor='#1f1f1f';
var GridStandardColor='#000000';
var MaxPictures=30;
var Pictures=[];
var PicDelay=100;
var Borders=10; //Border thicknes in px

var Mobile=false;
var MobileBorders=5;
var MobileGridLineWidth=3
var MobileGridWidth=0.92;


var OccuredErrors=0;
var MaxError=2;

var MatrixColors;
var SelectedColor='#ffffff';

var canvas;
var code="";
var RgbaToRgbBackground=[0,0,0];
var funqueue = [];

function setup() {
    if(windowHeight>windowWidth){
        canvas=createCanvas(windowWidth*MobileGridWidth+Borders*2, windowWidth*MobileGridWidth+Borders*2);     
        Mobile=true;
        Borders=MobileBorders;
        GridLineWidth=MobileGridLineWidth;
        document.documentElement.style.setProperty('--Grid-Size', (windowWidth*MobileGridWidth+Borders*4)+"px");
        ColorBar=['#000000','#4dffa0','#4d98ff','#7d4dff','#ff233d','#ff984d','#fff84d','#ff8000','#00ff93','#00ceff','#ff4dea','#ff4d62','#000000','#ffffff'];
        for(var i=1; i<=13; i++){
            document.getElementById("MobileColorTab"+i).style.backgroundColor=ColorBar[i];
        }
        colorPicker= new window.iro.ColorPicker('#mobilepicker', {
        width: 100,
        color: "#ffffff"
    });
    }else{
        canvas=createCanvas(windowHeight*GridHeight+Borders*2, windowHeight*GridHeight+Borders*2);     
        document.documentElement.style.setProperty('--Grid-Size', windowHeight*GridHeight+"px");
        ColorBar=['#000000','#4dffa0','#4d98ff','#7d4dff','#ff4dea','#ff4d62','#ff984d','#fff84d','#000000','#ffffff'];
        for(var i=1; i<=9; i++){
            document.getElementById("ColorTab"+i).style.backgroundColor=ColorBar[i];
        }
        colorPicker= new window.iro.ColorPicker('#picker', {
        width: 100,
        color: "#ffffff"
    });
    }

    canvas.parent("Grid");

    MatrixColors=Create2DArray(GridSize,GridSize);
    for(var y=0; y<GridSize; y++){
        for( var x=0; x<GridSize; x++){
            MatrixColors[x][y]=GridStandardColor;
        }
    }
}

function draw() {
    DrawTiles();
    DrawGrid();
    //  RunQueue();
}

function DrawGrid(){
    var CellSize=(height-Borders*2)/GridSize;    
    var SX=width/2-(height)/2+Borders;
    var SY=height/2-(height)/2+Borders;
    strokeWeight(GridLineWidth);
    stroke(GridLineColor);
    noFill();
    for(var y=0; y<GridSize; y++){
        for(var x=0; x<GridSize; x++){
            rect(SX+CellSize*x,SY+CellSize*y,CellSize,CellSize);
        }
    }
    strokeWeight(Borders);
    strokeJoin(ROUND);
    rect(SX-Borders/2,SY-Borders/2, CellSize*GridSize+Borders, CellSize*GridSize+Borders);
}

function DrawTiles(){
    var CellSize=(height-Borders*2)/GridSize; 
    var SX=width/2-(height)/2+Borders;
    var SY=height/2-(height)/2+Borders;
    for(var y=0; y<GridSize; y++){
        for(var x=0; x<GridSize; x++){
            noStroke();
            fill(MatrixColors[x][y]);
            rect(SX+CellSize*x,SY+CellSize*y,CellSize,CellSize);
        }
    }
}

function Create2DArray(rows,columns) {
    var x = new Array(rows);
    for (var i = 0; i < rows; i++) {
        x[i] = new Array(columns);
    }
    return x;
}

function mousePressed(){
    if(!ColorPickerActive){
        var TileNumber=GetTileNumber(mouseX, mouseY);
        if(TileNumber[0]!=-1&&TileNumber[1]!=-1){
            switch(SelectedTool){
                case 0:
                    DrawPixel(TileNumber[0],TileNumber[1],SelectedColor, true);
                    break;
                case 1:
                    FillTool(TileNumber[0],TileNumber[1]);
                    break;
                case 2:
                    CircleStart[0]=TileNumber[0];
                    CircleStart[1]=TileNumber[1];
                    SetBuffer();
                    break;
                case 3:
                    LineStart[0]=TileNumber[0];
                    LineStart[1]=TileNumber[1];
                    SetBuffer();
                    break;

            }
        }
    }
}

function mouseDragged(){
    if(!ColorPickerActive){
        var TileNumber=GetTileNumber(mouseX, mouseY);
        if(TileNumber[0]!=-1&&TileNumber[1]!=-1){
            switch(SelectedTool){
                case 0:
                    DrawPixel(TileNumber[0],TileNumber[1],SelectedColor, true);
                    break;
                case 2:
                    CircleToolDrag(TileNumber[0],TileNumber[1]);
                    break;
                case 3:
                    LineToolDrag(TileNumber[0],TileNumber[1]);
                    break;
            }
        }
    }
}
function mouseReleased(){
    if(!ColorPickerActive){
        var TileNumber=GetTileNumber(mouseX, mouseY);
        if(TileNumber[0]!=-1&&TileNumber[1]!=-1){
            switch(SelectedTool){
                case 2:
                    SetMatrixFromBuffer(MatrixBuffer);
                    BleSetCircle();
                    CircleStart=[-1,-1];
                    CurrentCircleEnd=[-1,-1];
                    break;
                case 3:
                    SetMatrixFromBuffer(MatrixBuffer);
                    BleSetLine();
                    LineStart=[-1,-1];
                    CurrentLineEnd=[-1,-1];
                    break;
            }
        }
    }
}

function GetTileNumber(MX, MY){
    var CellSize=(height-Borders*2)/GridSize; 
    var SX=width/2-(height)/2+Borders;
    var SY=height/2-(height)/2+Borders;
    var x=-1;
    var y=-1;
    for(var i=0; i<GridSize; i++){
        if(MX<SX+CellSize*(i+1)){
            x=i;
            break;
        }
    }

    for(var i=0; i<GridSize; i++){
        if(MY<SY+CellSize*(i+1)){
            y=i;
            break;
        }
    }
    return [x,y];
}

function DrawPixel(PixelX,PixelY,PixelColor,SendBle){
    if(MatrixColors[PixelX][PixelY]!=PixelColor){
        MatrixColors[PixelX][PixelY]=PixelColor;
        if(SendBle){
            funqueue.push(wrapFunction(QueueDrawPixel, this, [PixelX,PixelY,PixelColor]));
            if(funqueue.length==1){
                RunQueue();
                // funqueue.shift()();
            }
        }
    }
}

function wrapFunction (fn, context, params) {
    return function() {
        fn.apply(context, params);
    };
}

function QueueDrawPixel (PX,PY,PC) {
    BleSetPixel(PC, PX, PY);
    RunQueue();
}

function RunQueue(){
    if(funqueue.length > 0){
        setTimeout(function(){funqueue.shift()()},70);
    }else if(OccuredErrors>=MaxError){
        BleMatrixUpdate();
    }

}

function BleMatrixUpdate(){
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

function BleSetPixel(hexColor, X, Y){  //DataValueFormat for SetPixel= PR[r]G[g]B[b]X[x]Y[y];   //P starts Pixel reading //[x] x is a var and no Brackets
    var RGB=hexToRgb(hexColor);         //New DataValueFormat for SetPixel= PC[HexColor]X[x]Y[y];   //P starts Pixel reading //[x] x is a var and no Brackets   //HexColor without #
    //var data="PR"+RGB.r.toString()+"G"+RGB.g.toString()+"B"+RGB.b.toString()+"X"+X.toString()+"Y"+Y.toString()+";";
    var data="PC"+hexColor.substr(1)+"X"+X.toString()+"Y"+Y.toString()+";";
    send(data);
}

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
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function ClearDisp(){
    for(var y=0; y<GridSize; y++){
        for( var x=0; x<GridSize; x++){
            MatrixColors[x][y]=GridStandardColor;
        }
    }
    funqueue=[];
    send("C;");

}

function SetBrightness(B){   //B in Percent
    B=map(B,0,100,0,255);  //Convert Percent to byte 255
    send("B"+B.toString()+";")   //Send coded as B[Value];
}


//////////////////ToolMenu///////////////////////////
var SelectedTool = 2;    //0=Pen, 1=fill, 2=Circle, 3=line

function SetTool(x){
    document.getElementById('ToolMenu').getElementsByTagName('div')[SelectedTool].style.color="#fff";
    SelectedTool=x;
    document.getElementById('ToolMenu').getElementsByTagName('div')[SelectedTool].style.color="#00ff76";
}

///////////////////FillTool//////////////////////////
function FillTool(x, y){
    var FillColor=MatrixColors[x][y];
    if(FillColor==SelectedColor){
        return;
    }
    var FillPoints=[];
    FillPoints.push([x,y]);
    while(FillPoints.length>0){
        var CheckX=FillPoints[0][0];
        var CheckY=FillPoints[0][1];
        if(MatrixColors[CheckX][CheckY]!=SelectedColor){
            if(CheckY<GridSize-1){
                if(MatrixColors[CheckX][CheckY+1]==FillColor){
                    FillPoints.push([CheckX,CheckY+1]);
                }
            }
            if(CheckX!=0){
                if(MatrixColors[CheckX-1][CheckY]==FillColor){
                    FillPoints.push([CheckX-1,CheckY]);
                }
            }
            if(CheckY!=0){
                if(MatrixColors[CheckX][CheckY-1]==FillColor){
                    FillPoints.push([CheckX,CheckY-1]);
                }
            }
            if(CheckX<GridSize-1){
                if(MatrixColors[CheckX+1][CheckY]==FillColor){
                    FillPoints.push([CheckX+1,CheckY]);
                } 
            }
        }
        DrawPixel(CheckX,CheckY,SelectedColor,true);
        FillPoints.shift();
    }
}

///////////////////Circle Tool//////////////////////
/////Brahams Algorithm. Basic ellipse implementation from: http://0x80.pl/articles/bresenham.js
var CircleStart = [0,0];
var CurrentCircleEnd=[-1,-1]

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


function CircleToolDrag(x, y) {   //x and y cordinates of the bottom left point
    CurrentCircleEnd[0]=x;     
    CurrentCircleEnd[1]=y;
    SetMatrixFromBuffer(MatrixBuffer);   //Clear previous Circle overlay

    var CEX=CurrentCircleEnd[0];     //Set Start and End point vars
    var CEY=CurrentCircleEnd[1];
    var CSX=CircleStart[0];
    var CSY=CircleStart[1];

    if(CEX<CSX){                     //Swap Cordinates if Start > End
        var c=CEX;
        CEX=CSX;
        CSX=c;
    }

    if(CEY<CSY){
        var c=CEY;
        CEY=CSY;
        CSY=c;
    }

    if(CEX==CSX&&CEY==CSY){    //Handle Special cases
        return;
    } else if(CEX==CSX || CEY==CSY){
        PixelLine(CSX,CSY,CEX,CEY,false);
        return;
    } else if(CEX-CSX==1){
        PixelLine(CSX,CSY,CEX-1,CEY,false);
        PixelLine(CSX+1,CSY,CEX,CEY,false);
        return;
    } else if(CEY-CSY==1){
        PixelLine(CSX,CSY,CEX,CEY-1,false);
        PixelLine(CSX,CSY+1,CEX,CEY,false);
        return;
    }

    var cx=CSX+ceil((CEX-CSX)/2);//center X
    var cy=CSY+ceil((CEY-CSY)/2);//center Y
    var rx=CEX-cx;   //x cordinate on radius
    var ry=CEY-cy;   //y cordinate on radius
    rasterize( cx, cy, rx, ry, true, false);  //Draw Circle
    rasterize( cx, cy, ry, rx, false, false);
}

function BleSetCircle(){
    SetMatrixFromBuffer(MatrixBuffer);   //Clear previous Circle overlay

    var CEX=CurrentCircleEnd[0];     //Set Start and End point vars
    var CEY=CurrentCircleEnd[1];
    var CSX=CircleStart[0];
    var CSY=CircleStart[1];

    if(CEX<CSX){                     //Swap Cordinates if Start > End
        var c=CEX;
        CEX=CSX;
        CSX=c;
    }

    if(CEY<CSY){
        var c=CEY;
        CEY=CSY;
        CSY=c;
    }

    if(CEX==CSX&&CEY==CSY){    //Handle Special cases
        return;
    } else if(CEX==CSX || CEY==CSY){
        PixelLine(CSX,CSY,CEX,CEY,true);
        return;
    } else if(CEX-CSX==1){
        PixelLine(CSX,CSY,CEX-1,CEY,true);
        PixelLine(CSX+1,CSY,CEX,CEY,true);
        return;
    } else if(CEY-CSY==1){
        PixelLine(CSX,CSY,CEX,CEY-1,true);
        PixelLine(CSX,CSY+1,CEX,CEY,true);
        return;
    }


    var cx=CSX+ceil((CEX-CSX)/2);//center X
    var cy=CSY+ceil((CEY-CSY)/2);//center Y
    var rx=CEX-cx;   //x cordinate on radius
    var ry=CEY-cy;   //y cordinate on radius
    rasterize( cx, cy, rx, ry, true, true);  //Draw Circle
    rasterize( cx, cy, ry, rx, false, true);
}

///////////////////Line Tool////////////////////////
var LineStart = [0,0];
var CurrentLineEnd=[-1,-1]
var MatrixBuffer=Create2DArray(GridSize,GridSize);;

function LineToolDrag(x,y){
    CurrentLineEnd[0]=x;
    CurrentLineEnd[1]=y;
    SetMatrixFromBuffer(MatrixBuffer);
    PixelLine(LineStart[0], LineStart[1], CurrentLineEnd[0], CurrentLineEnd[1], false);
}

function BleSetLine(){
    PixelLine(LineStart[0], LineStart[1], CurrentLineEnd[0], CurrentLineEnd[1], true);
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
function SetBuffer(){
    for(var y=0; y<GridSize; y++){
        for( var x=0; x<GridSize; x++){
            MatrixBuffer[x][y]=MatrixColors[x][y];
        }
    }
}

function SetMatrixFromBuffer(Buffer){
    for(var bx=0; bx<GridSize; bx++){
        for (var by=0; by<GridSize; by++){
            MatrixColors[bx][by]=Buffer[bx][by];
        }
    }
}


//////////////////Color Bar/////////////////////////
var ColorPickerActive=false;
var Opened=false;
var colorPicker;
var ColorBar;

function onColorChange(color, changes) {
    if(Mobile){
    document.getElementById("MCPC").style.color=color.hexString;
    }else{
        document.getElementById("CPC").style.color=color.hexString;
    document.getElementById("ColorTab0").style.color=color.hexString;
    }
    ColorBar[0]=color.hexString;
    SelectedColor=ColorBar[0];
}

function OpenColorPicker(){
    if(Mobile){
        for(var i=1; i<=13; i++){
            document.getElementById("MobileColorTab"+i).style["boxShadow"] = "0 0 0px #fff";
        }
    }else{
        for(var i=1; i<=9; i++){
            document.getElementById("ColorTab"+i).style["boxShadow"] = "0 0 0px #fff";
        }
    }
    colorPicker.on('color:change', onColorChange);
    document.getElementById("MCPC").style.display="block";
    ColorPickerActive=true; 
    Opened=true;
}

function SelectColor(c){
    if(Mobile){
        for(var i=1; i<=13; i++){
            document.getElementById("MobileColorTab"+i).style["boxShadow"] = "0 0 0px #fff";
        }
    }else{
        for(var i=1; i<=9; i++){
            document.getElementById("ColorTab"+i).style["boxShadow"] = "0 0 0px #fff";
        }
    }
    console.log(c);
    SelectedColor=ColorBar[c];
    if(Mobile){
        document.getElementById("MobileColorTab"+c).style["boxShadow"] = "0 0 10px #fff";
    }else{
        document.getElementById("ColorTab"+c).style["boxShadow"] = "0 0 10px #fff";
    }
}

document.addEventListener('click', function(e) {
    e = e || window.event;
    var target = e.target || e.srcElement;
    if(target.tagName=="BODY" && !Opened){
        if(Mobile){
        document.getElementById("MCPC").style.display="none";
        }else{
            document.getElementById("CPC").style.display="none";
        }
        ColorPickerActive=false;
        colorPicker.off('color:change', onColorChange);
    } else if(target.parentElement.parentElement.className!="ColorPicker" && target.parentElement.parentElement.className!="ColorBar" && !Opened){
        if(Mobile){
        document.getElementById("MCPC").style.display="none";
        }else{
            document.getElementById("CPC").style.display="none";
        }
        ColorPickerActive=false;
        colorPicker.off('color:change', onColorChange);
    }
    if(Opened){
        Opened=false;
    }
}, false);

//////////////////Bluetooth//////////////////////////
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

function handleDisconnection(event) {
    let device = event.target;

    console.log('"' + device.name +
                '" bluetooth device disconnected, trying to reconnect...');

    connectDeviceAndCacheCharacteristic(device).
    then(characteristic => startNotifications(characteristic)).
    catch(error => log(error));
}

function onStopButtonClick() {
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
        }
        else {
            readBuffer += c;
        }
    }
}

function send(data) {
    data = String(data);

    if (!data || !charackteristicsCache) {
        return;
    }

    //data += '\n';

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

function convertFromHex(hex) {
    var hex = hex.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}


//////////////////Mobile///////////////////////////
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