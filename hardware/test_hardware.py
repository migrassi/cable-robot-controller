#!/usr/bin/env python3
"""
Test script for Cable Robot Hardware Communication
Demonstrates how to test the WebSocket server and hardware communication
"""

import asyncio
import websockets
import json
import time

async def test_websocket_communication():
    """Test WebSocket communication with the robot server"""
    uri = "ws://localhost:8765"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket server")
            
            # Test commands
            test_commands = [
                {"action": "get_status"},
                {"action": "calibrate"},
                {"action": "activate"},
                {"action": "move", "x": 1.0, "y": 1.0, "z": 2.0},
                {"action": "home"},
                {"action": "get_position"},
                {"action": "deactivate"}
            ]
            
            for command in test_commands:
                print(f"\n📤 Sending: {command}")
                await websocket.send(json.dumps(command))
                
                # Wait for response
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    response_data = json.loads(response)
                    print(f"📥 Response: {response_data}")
                except asyncio.TimeoutError:
                    print("⏰ Timeout waiting for response")
                except json.JSONDecodeError:
                    print(f"📥 Raw response: {response}")
                
                # Wait between commands
                await asyncio.sleep(1)
                
    except ConnectionRefusedError:
        print("❌ Could not connect to WebSocket server")
        print("   Make sure the server is running: python websocket_server.py")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_serial_communication():
    """Test direct serial communication with hardware"""
    try:
        import serial
        
        # Try common serial ports
        test_ports = ['COM3', 'COM4', 'COM5', '/dev/ttyUSB0', '/dev/ttyACM0']
        
        for port in test_ports:
            try:
                print(f"🔌 Testing port: {port}")
                ser = serial.Serial(port, 115200, timeout=2)
                time.sleep(2)  # Wait for Arduino reset
                
                # Send test command
                ser.write(b"GET_POS\n")
                response = ser.readline().decode().strip()
                
                if response:
                    print(f"✅ Port {port} responded: {response}")
                    
                    # Send more test commands
                    test_commands = [
                        "CALIBRATE",
                        "ACTIVATE", 
                        "MOVE:0.500,0.500,2.000",
                        "HOME",
                        "DEACTIVATE"
                    ]
                    
                    for cmd in test_commands:
                        print(f"📤 Sending: {cmd}")
                        ser.write((cmd + "\n").encode())
                        time.sleep(0.5)
                        
                        if ser.in_waiting:
                            response = ser.readline().decode().strip()
                            print(f"📥 Response: {response}")
                    
                    ser.close()
                    return port
                else:
                    print(f"⚠️ Port {port} no response")
                
                ser.close()
                
            except serial.SerialException:
                print(f"❌ Cannot open port {port}")
            except Exception as e:
                print(f"❌ Error on port {port}: {e}")
        
        print("❌ No responsive hardware found")
        return None
        
    except ImportError:
        print("❌ pyserial not installed. Install with: pip install pyserial")
        return None

def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    required_modules = [
        ('websockets', 'pip install websockets'),
        ('serial', 'pip install pyserial'),
        ('asyncio', 'Built-in Python module')
    ]
    
    missing_modules = []
    
    for module, install_cmd in required_modules:
        try:
            __import__(module)
            print(f"✅ {module} - OK")
        except ImportError:
            print(f"❌ {module} - Missing")
            missing_modules.append((module, install_cmd))
    
    if missing_modules:
        print("\n📦 Install missing dependencies:")
        for module, cmd in missing_modules:
            print(f"   {cmd}")
        return False
    
    return True

def main():
    """Main test function"""
    print("🤖 Cable Robot Hardware Communication Test")
    print("=" * 50)
    
    # Check dependencies
    if not check_dependencies():
        return
    
    print("\n1️⃣ Testing direct serial communication...")
    hardware_port = test_serial_communication()
    
    print("\n2️⃣ Testing WebSocket server communication...")
    print("   (Make sure to start the server first: python websocket_server.py)")
    
    try:
        asyncio.run(test_websocket_communication())
    except KeyboardInterrupt:
        print("\n⏹️ Test interrupted by user")
    
    print("\n📋 Test Summary:")
    if hardware_port:
        print(f"✅ Hardware found on port: {hardware_port}")
        print("✅ Ready for WebSocket server integration")
    else:
        print("⚠️ No hardware detected - using simulation mode")
    
    print("\n🚀 Next Steps:")
    print("1. Connect your Arduino/ESP32 hardware")
    print("2. Upload the arduino_controller.ino sketch")
    print("3. Update config.py with the correct serial port")
    print("4. Start the WebSocket server: python websocket_server.py")
    print("5. Open the web interface and test the connection")

if __name__ == "__main__":
    main()
