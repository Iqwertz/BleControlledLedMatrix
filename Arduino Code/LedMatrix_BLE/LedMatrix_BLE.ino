/*
 * LedMatrix_BLE.ino
 * Author: Julius Hussl
 * Description: This code is used to receive and decode serial signals from an Website and draw the information to an ws2821b Led Matrix
 * 
 * Ble Commands:
 * Note: An ; signals an Command end //no \n
 * Set Pixel: PC[HexColor]X[x]Y[y]; Bsp: P000000X12Y10; This would set the Pixel at position (12,10) black
 * Clear: C;
 * Set Brightness: B[Brightness Value (0-255)];
 */

/*Libraries*/
#include <Adafruit_NeoPixel.h>
#include <SoftwareSerial.h>
#include <avr/pgmspace.h>
#include <ctype.h>

/*Buffer*/
#define MaxBuffer (64)
char Buffer[MaxBuffer];
int BufferIndex;

/*Led Matrix consts*/
const int Hohe = 16;
const int Breite = 16;
const bool invert = true; 
const bool rightstart = true;
const int Display = 6;

const int MaxLengthP = 15; //Max Amount of Chars for P command (Used for Error detection)

SoftwareSerial SerialBt(4, 5);   //RX TX

#define NUMPIXELS Hohe*Breite
Adafruit_NeoPixel Matrix(NUMPIXELS, Display, NEO_GRB + NEO_KHZ800);

/*Setup*/
void setup() {
  Serial.begin(230400);
  SerialBt.begin(19200);

  Matrix.begin(); //Start Matrix
  Matrix.setBrightness(100);  //Set inititial Brightness
  Matrix.clear();
  Matrix.show();
}

/*Loop*/
void loop() {
  if (SerialBt.available()) {  //Check for Ble Command
    char c = SerialBt.read();  //Get the sent char
    Serial.write(c);           //write it to serial for debugginbg
    if (BufferIndex < MaxBuffer) Buffer[BufferIndex++] = c; //Check if the Buffer Length is greater than max Buffer to avoid overflow
    if (c == ';') {  //if an command end is detected Process input and restet Buffer length
      ProcessInput();
      BufferIndex = 0;
    }
  }
}


void ProcessInput() {                            //Processes the Ble Input
  char CommandType = Buffer[0];                  //The first Letter always determins the Commandtype
  if (CommandType == 'P') {                      //Process as Pixel Command
    if (BufferIndex > MaxLengthP) {              //Check if the Command has the Correct length (faulty commands are always longer)
      SerialBt.println("E");                     //Sends an Error report to the Website
    } else {                                     //if everything is fine
      byte r;                                    //define color vars
      byte g;
      byte b;
      HexToRGB(FindHexValue('C'), r, g, b);      //Convert the Hex Color to rgb values and set it to the rgb vars
      byte x = FindByteValue('X');               //Get the X value
      byte y = FindByteValue('Y');               //Get the Y value

      Matrix.setPixelColor(MatrixConvert(x + 1, y + 1), Matrix.Color(r, g, b)); //Set Color on the Display
      Matrix.show();
      SerialBt.println("F");   //Finished Processing //everything fine
    }
  } else if (CommandType == 'C') {  //Process as Clear
    Matrix.clear();                 //Clear Matrix
    Matrix.show();
    Serial.println("Cleard");
  } else if (CommandType == 'B') {  //Process as Brightness
    byte B = FindByteValue('B');    //Get the Brightness Value
    Matrix.setBrightness(B);        //Set the Brightness
    Matrix.show();
  }
}

byte FindByteValue(char c) {                  //Finds the Byte Value after a char  (Max 3 digits)
  for (int i = 0; i <= BufferIndex; i++) {    //Loops threw Buuffer
    if (Buffer[i] == c) {                     //Checks if Buffer equals search value
      byte n;                                 //Value for the Number
      if (isdigit(Buffer[i + 1])) {           //Checks if the char after the search value is a digit
        n = Buffer[i + 1] - '0';              //if yes it adds the number to n   (-'0' is to convert char to int
        if (isdigit(Buffer[i + 2])) {         //repeat this for the next to indexes to also find 3 digit numbers
          n = n * 10;
          n += Buffer[i + 2] - '0';
          if (isdigit(Buffer[i + 3])) {
            n = n * 10;
            n += Buffer[i + 3] - '0';
            return n;
          } else {
            return n;
          }
        } else {
          return n;
        }
      } else {
        return NULL;
      }
    }
    if (i == BufferIndex) {
      return NULL;
    }
  }
}

String FindHexValue(char c) {                 //Finds the Hex Value after a char  (Max 3 digits)
  for (int i = 0; i <= BufferIndex; i++) {    //Loops threw Buuffer
    if (Buffer[i] == c) {                     //Checks if Buffer equals search value
      String n;                               //Value for the String
      for (int f = 1; f <= 6; f++) {          //gets all 6 chars
        n += Buffer[i + f];
      }
      return n;
    }
    if (i == BufferIndex) {
      return "NoHex";
    }
  }
}

void HexToRGB(String hex, byte & r, byte & g, byte & b) {     //Converts the Hex value to RGB value
  char charbuf[8];
  hex.toCharArray(charbuf, 8);
  long int rgb = strtol(charbuf, 0, 16); //=>rgb=0x001234FE;
  r = (byte)(rgb >> 16);
  g = (byte)(rgb >> 8);
  b = (byte)(rgb);
}
/*
  if(SerialBt.find('C')){
    Matrix.clear();
    Matrix.show();
    Serial.println("Clear");
   }else if(SerialBt.find('P')){
    int r = SerialBt.parseByte();
    int g = SerialBt.parseInt();
    int b = SerialBt.parseInt();
    int x = SerialBt.parseInt();
    int y = SerialBt.parseInt();

        Serial.println(r);
    Serial.println(g);
    Serial.println(b);
    Serial.println(x);
    Serial.println(y);
    if (SerialBt.read() == ';') {
      Matrix.setPixelColor(MatrixConvert(x + 1, y + 1), Matrix.Color(r, g, b));;
      Matrix.show();
    }
   }
  }

  if (Serial.available()) {
    SerialBt.write(Serial.read());
  }
*/

int MatrixConvert(int x, int y) {                    //Converts x and y Value to the Pixel Number
  int nummer = 0;
  if (x <= Breite && x > 0 && y <= Hohe && y > 0) {
    if (invert) {
      if (rightstart) {
        if (x % 2 != 0) {
          nummer = 16 * (x - 1) + y;
        } else {
          nummer = 16 * x - y + 1;
        }
      } else {
        if (y % 2 == 0) {
          nummer = 16 * (x - 1) + y;
        } else {
          nummer = 16 * x - y + 1;
        }
      }
    } else {
      nummer = 16 * (y - 1) + x;
    }
  } else {
    Error("Der Wert darf nicht höher als die max Höhe und Breite sein");
  } return nummer - 1;
}

void Error(String Code) {   //Print Errors
  Serial.println(Code);
}
