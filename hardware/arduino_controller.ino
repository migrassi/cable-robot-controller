/*
 * Cable Robot Hardware Controller - Arduino/ESP32
 * Receives commands via Serial and controls stepper motors
 */

#include <AccelStepper.h>

// Motor definitions (adjust pins according to your hardware)
#define MOTOR_X_STEP 2
#define MOTOR_X_DIR  3
#define MOTOR_Y_STEP 4
#define MOTOR_Y_DIR  5
#define MOTOR_Z_STEP 6
#define MOTOR_Z_DIR  7

// Emergency stop and status pins
#define EMERGENCY_STOP_PIN 8
#define STATUS_LED_PIN 13

// Create stepper motor objects
AccelStepper motorX(AccelStepper::DRIVER, MOTOR_X_STEP, MOTOR_X_DIR);
AccelStepper motorY(AccelStepper::DRIVER, MOTOR_Y_STEP, MOTOR_Y_DIR);
AccelStepper motorZ(AccelStepper::DRIVER, MOTOR_Z_STEP, MOTOR_Z_DIR);

// Robot state variables
struct Position {
  float x, y, z;
};

Position currentPosition = {0.0, 0.0, 2.5};
Position targetPosition = {0.0, 0.0, 2.5};

bool systemActive = false;
bool emergencyStop = false;
bool isCalibrated = false;
bool isMoving = false;

// Motor configuration
const float STEPS_PER_MM = 80;  // Adjust based on your pulley/gear ratio
const float MAX_SPEED = 1000;   // steps per second
const float ACCELERATION = 500; // steps per second^2

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(EMERGENCY_STOP_PIN, INPUT_PULLUP);
  pinMode(STATUS_LED_PIN, OUTPUT);
  
  // Configure motors
  motorX.setMaxSpeed(MAX_SPEED);
  motorX.setAcceleration(ACCELERATION);
  motorY.setMaxSpeed(MAX_SPEED);
  motorY.setAcceleration(ACCELERATION);
  motorZ.setMaxSpeed(MAX_SPEED);
  motorZ.setAcceleration(ACCELERATION);
  
  // Send startup message
  Serial.println("Cable Robot Controller Started");
  Serial.println("STATUS:READY");
  
  // Flash status LED
  for (int i = 0; i < 3; i++) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(200);
    digitalWrite(STATUS_LED_PIN, LOW);
    delay(200);
  }
}

void loop() {
  // Check emergency stop
  checkEmergencyStop();
  
  // Process serial commands
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    handleCommand(command);
  }
  
  // Update motor positions
  if (systemActive && !emergencyStop) {
    updateMotors();
  }
  
  // Update status LED
  updateStatusLED();
  
  // Send periodic position updates
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 100) { // 10Hz update rate
    if (systemActive) {
      sendPositionUpdate();
    }
    lastUpdate = millis();
  }
}

void checkEmergencyStop() {
  bool emergencyPressed = (digitalRead(EMERGENCY_STOP_PIN) == LOW);
  
  if (emergencyPressed && !emergencyStop) {
    emergencyStop = true;
    systemActive = false;
    
    // Stop all motors immediately
    motorX.stop();
    motorY.stop();
    motorZ.stop();
    
    Serial.println("STATUS:EMERGENCY");
    Serial.println("Emergency stop activated!");
  }
}

void handleCommand(String command) {
  if (command.startsWith("MOVE:")) {
    handleMoveCommand(command);
  }
  else if (command == "ACTIVATE") {
    handleActivateCommand();
  }
  else if (command == "DEACTIVATE") {
    handleDeactivateCommand();
  }
  else if (command == "EMERGENCY_STOP") {
    handleEmergencyStopCommand();
  }
  else if (command == "HOME") {
    handleHomeCommand();
  }
  else if (command == "CALIBRATE") {
    handleCalibrateCommand();
  }
  else if (command == "GET_POS") {
    sendPositionUpdate();
  }
  else if (command == "RESET_EMERGENCY") {
    handleResetEmergency();
  }
  else {
    Serial.println("ERROR:Unknown command: " + command);
  }
}

void handleMoveCommand(String command) {
  if (!systemActive || emergencyStop) {
    Serial.println("ERROR:System not active or emergency stop");
    return;
  }
  
  // Parse coordinates: "MOVE:1.500,2.000,3.000"
  String coords = command.substring(5);
  int firstComma = coords.indexOf(',');
  int secondComma = coords.indexOf(',', firstComma + 1);
  
  if (firstComma == -1 || secondComma == -1) {
    Serial.println("ERROR:Invalid move command format");
    return;
  }
  
  float x = coords.substring(0, firstComma).toFloat();
  float y = coords.substring(firstComma + 1, secondComma).toFloat();
  float z = coords.substring(secondComma + 1).toFloat();
  
  // Validate workspace limits
  if (x < -2.5 || x > 2.5 || y < -2.5 || y > 2.5 || z < 0.5 || z > 4.5) {
    Serial.println("ERROR:Position out of workspace bounds");
    return;
  }
  
  // Set target position
  targetPosition.x = x;
  targetPosition.y = y;
  targetPosition.z = z;
  
  // Calculate motor positions and start movement
  moveToTarget();
  
  Serial.println("Moving to position: " + String(x) + "," + String(y) + "," + String(z));
}

void handleActivateCommand() {
  if (emergencyStop) {
    Serial.println("ERROR:Clear emergency stop first");
    return;
  }
  
  if (!isCalibrated) {
    Serial.println("ERROR:Robot not calibrated");
    return;
  }
  
  systemActive = true;
  Serial.println("STATUS:ACTIVE");
  Serial.println("System activated");
}

void handleDeactivateCommand() {
  systemActive = false;
  
  // Stop all motors
  motorX.stop();
  motorY.stop();
  motorZ.stop();
  
  Serial.println("STATUS:INACTIVE");
  Serial.println("System deactivated");
}

void handleEmergencyStopCommand() {
  emergencyStop = true;
  systemActive = false;
  
  // Stop all motors immediately
  motorX.stop();
  motorY.stop();
  motorZ.stop();
  
  Serial.println("STATUS:EMERGENCY");
  Serial.println("Emergency stop activated via command");
}

void handleHomeCommand() {
  if (!systemActive || emergencyStop) {
    Serial.println("ERROR:System not active or emergency stop");
    return;
  }
  
  targetPosition.x = 0.0;
  targetPosition.y = 0.0;
  targetPosition.z = 2.5;
  
  moveToTarget();
  Serial.println("Moving to home position");
}

void handleCalibrateCommand() {
  if (systemActive) {
    Serial.println("ERROR:Deactivate system before calibration");
    return;
  }
  
  if (emergencyStop) {
    Serial.println("ERROR:Clear emergency stop before calibration");
    return;
  }
  
  Serial.println("Starting calibration...");
  
  // Implement your calibration routine here
  // This might involve moving to limit switches, etc.
  
  // For now, just simulate calibration
  delay(2000);
  
  // Set current position as 0,0,2.5 (home)
  currentPosition.x = 0.0;
  currentPosition.y = 0.0;
  currentPosition.z = 2.5;
  targetPosition = currentPosition;
  
  // Reset motor positions
  motorX.setCurrentPosition(0);
  motorY.setCurrentPosition(0);
  motorZ.setCurrentPosition(positionToSteps(2.5));
  
  isCalibrated = true;
  Serial.println("CALIBRATED");
  Serial.println("Calibration completed");
}

void handleResetEmergency() {
  if (digitalRead(EMERGENCY_STOP_PIN) == HIGH) { // Emergency stop released
    emergencyStop = false;
    Serial.println("STATUS:READY");
    Serial.println("Emergency stop cleared");
  } else {
    Serial.println("ERROR:Release emergency stop button first");
  }
}

void moveToTarget() {
  // Convert positions to motor steps
  long stepsX = positionToSteps(targetPosition.x);
  long stepsY = positionToSteps(targetPosition.y);
  long stepsZ = positionToSteps(targetPosition.z);
  
  // Set target positions for motors
  motorX.moveTo(stepsX);
  motorY.moveTo(stepsY);
  motorZ.moveTo(stepsZ);
  
  isMoving = true;
}

void updateMotors() {
  if (!isMoving) return;
  
  // Run motors toward target
  bool xRunning = motorX.run();
  bool yRunning = motorY.run();
  bool zRunning = motorZ.run();
  
  // Check if movement is complete
  if (!xRunning && !yRunning && !zRunning) {
    isMoving = false;
    
    // Update current position
    currentPosition.x = stepsToPosition(motorX.currentPosition());
    currentPosition.y = stepsToPosition(motorY.currentPosition());
    currentPosition.z = stepsToPosition(motorZ.currentPosition());
    
    Serial.println("Movement completed");
    sendPositionUpdate();
  }
}

void sendPositionUpdate() {
  Serial.println("POS:" + 
                String(currentPosition.x, 3) + "," +
                String(currentPosition.y, 3) + "," +
                String(currentPosition.z, 3));
}

void updateStatusLED() {
  static unsigned long lastBlink = 0;
  static bool ledState = false;
  
  if (emergencyStop) {
    // Fast blink for emergency
    if (millis() - lastBlink > 100) {
      ledState = !ledState;
      digitalWrite(STATUS_LED_PIN, ledState);
      lastBlink = millis();
    }
  }
  else if (systemActive) {
    // Solid on when active
    digitalWrite(STATUS_LED_PIN, HIGH);
  }
  else if (isCalibrated) {
    // Slow blink when ready
    if (millis() - lastBlink > 1000) {
      ledState = !ledState;
      digitalWrite(STATUS_LED_PIN, ledState);
      lastBlink = millis();
    }
  }
  else {
    // Off when not calibrated
    digitalWrite(STATUS_LED_PIN, LOW);
  }
}

// Helper functions for coordinate conversion
long positionToSteps(float position) {
  return (long)(position * STEPS_PER_MM);
}

float stepsToPosition(long steps) {
  return (float)steps / STEPS_PER_MM;
}
