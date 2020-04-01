#include <Adafruit_NeoPixel.h>#include <avr/pgmspace.h> 
const int Hohe = 16; const int Breite = 16; const bool invert = true; const bool rightstart = true; const int Display = 6;
const PROGMEM byte C[16][16][3]={{{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0}},{{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{255,254,101},{255,254,101},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0}},{{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{255,254,101},{255,0,0},{255,0,0},{255,254,101},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0}},{{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{255,254,101},{255,254,71},{255,0,0},{255,0,0},{255,254,71},{255,254,101},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0}},{{0,0,0},{0,0,0},{0,0,0},{0,0,0},{255,254,101},{255,254,71},{255,209,0},{255,0,0},{255,0,0},{255,209,0},{255,254,71},{255,254,101},{0,0,0},{0,0,0},{0,0,0},{0,0,0}},{{0,0,0},{0,0,0},{0,0,0},{255,254,101},{255,254,71},{255,209,0},{255,149,0},{255,0,0},{255,0,0},{255,149,0},{255,209,0},{255,254,71},{255,254,101},{0,0,0},{0,0,0},{0,0,0}},{{0,0,0},{0,0,0},{255,254,101},{255,254,71},{255,209,0},{255,149,0},{255,104,0},{255,0,0},{255,0,0},{255,104,0},{255,149,0},{255,209,0},{255,254,71},{255,254,101},{0,0,0},{0,0,0}},{{0,0,0},{255,254,101},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,254,101},{0,0,0}},{{0,0,0},{245,244,116},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,0,0},{255,254,101},{0,0,0}},{{0,0,0},{0,0,0},{245,244,116},{255,254,71},{255,209,0},{255,149,0},{255,104,0},{255,0,0},{255,0,0},{255,104,0},{255,149,0},{255,209,0},{255,254,71},{245,244,116},{0,0,0},{0,0,0}},{{0,0,0},{0,0,0},{0,0,0},{245,244,116},{255,254,71},{255,209,0},{255,149,0},{255,0,0},{255,0,0},{255,149,0},{255,209,0},{255,254,71},{245,244,116},{0,0,0},{0,0,0},{0,0,0}},{{0,0,0},{0,0,0},{0,0,0},{0,0,0},{245,244,116},{255,254,71},{255,209,0},{255,0,0},{255,0,0},{255,209,0},{255,254,71},{245,244,116},{0,0,0},{0,0,0},{0,0,0},{0,0,0}},{{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{245,244,116},{255,254,71},{255,0,0},{255,0,0},{255,254,71},{245,244,116},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0}},{{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{245,244,116},{255,0,0},{255,0,0},{245,244,116},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0}},{{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{245,244,116},{245,244,116},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0}},{{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0},{0,0,0}}};
#define NUMPIXELS Hohe*Breite
Adafruit_NeoPixel Matrix(NUMPIXELS, Display, NEO_GRB + NEO_KHZ800);
void setup() {Matrix.begin();}

void loop() {
    for (int i = 0; i <= Breite; i++) {
        for (int j = 0; j <= Hohe; j++) {
            Matrix.setPixelColor(MatrixConvert(i+1, j+1), Matrix.Color(pgm_read_byte(&C[j][i][0]), pgm_read_byte(&C[j][i][1]), pgm_read_byte(&C[j][i][2])));
        }
    }
    Matrix.show();
    delay(1000);
}

int MatrixConvert(int x, int y) {int nummer = 0; if (x <= Breite && x > 0 && y <= Hohe && y > 0) { if (invert) { if (rightstart) { if (y % 2 != 0) { nummer = 16 * (y - 1) + x; } else { nummer = 16 * y - x + 1; } } else { if (y % 2 == 0) { nummer = 16 * (y - 1) + x; } else { nummer = 16 * y - x + 1; } } } else { nummer = 16 * (y - 1) + x; } } else { Error("Der Wert darf nicht höher als die max Höhe und Breite sein"); } return nummer - 1; }void Error(String Code) { Serial.println(Code); }