#!/usr/bin/env python3
"""
Cable Robot WebSocket Server
Receives commands from web interface and controls hardware
"""

import asyncio
import websockets
import json
import logging
import time
from typing import Dict, Any, Optional
import serial
import threading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CableRobotController:
    """Hardware controller for cable robot"""
    # Para simular sin Hardware conectado se cambiaron estas dos lineas por las dos siguientes
    #def __init__(self, serial_port: str = "COM3", baud_rate: int = 115200):
    #   self.serial_port = serial_port
    def __init__(self, serial_port=None, baud_rate: int = 115200):  # None = modo simulación
        self.simulation_mode = (serial_port is None)
    
        self.baud_rate = baud_rate
        self.serial_connection = None
        self.position = {"x": 0.0, "y": 0.0, "z": 2.5}
        self.is_connected = False
        self.is_calibrated = False
        self.emergency_stop = False
        self.system_active = False
        
        self.connect_hardware()
    
    def connect_hardware(self):
        """Connect to hardware via serial"""
        try:
            self.serial_connection = serial.Serial(
                port=self.serial_port,
                baudrate=self.baud_rate,
                timeout=1
            )
            self.is_connected = True
            logger.info(f"Connected to hardware on {self.serial_port}")
            
            # Start background thread to read hardware responses
            self.reader_thread = threading.Thread(target=self._read_hardware_responses)
            self.reader_thread.daemon = True
            self.reader_thread.start()
            
        except Exception as e:
            logger.error(f"Failed to connect to hardware: {e}")
            self.is_connected = False
    
    def _read_hardware_responses(self):
        """Background thread to read responses from hardware"""
        while self.is_connected and self.serial_connection:
            try:
                if self.serial_connection.in_waiting > 0:
                    response = self.serial_connection.readline().decode().strip()
                    self._process_hardware_response(response)
            except Exception as e:
                logger.error(f"Error reading hardware: {e}")
                time.sleep(0.1)
    
    def _process_hardware_response(self, response: str):
        """Process responses from hardware"""
        try:
            # Parse hardware response (format depends on your hardware)
            if response.startswith("POS:"):
                # Example: "POS:1.5,2.0,3.0"
                coords = response[4:].split(",")
                self.position = {
                    "x": float(coords[0]),
                    "y": float(coords[1]),
                    "z": float(coords[2])
                }
            elif response.startswith("STATUS:"):
                # Example: "STATUS:ACTIVE" or "STATUS:EMERGENCY"
                status = response[7:]
                if status == "EMERGENCY":
                    self.emergency_stop = True
                    self.system_active = False
                elif status == "ACTIVE":
                    self.system_active = True
                    self.emergency_stop = False
            elif response.startswith("CALIBRATED"):
                self.is_calibrated = True
                
        except Exception as e:
            logger.error(f"Error processing hardware response: {e}")
    
    def send_command(self, command: str) -> bool:
        """Send command to hardware"""
        if not self.is_connected or not self.serial_connection:
            return False
        
        try:
            self.serial_connection.write(f"{command}\n".encode())
            logger.info(f"Sent to hardware: {command}")
            return True
        except Exception as e:
            logger.error(f"Error sending command: {e}")
            return False
    
    def move_to_position(self, x: float, y: float, z: float) -> bool:
        """Move robot to specific position"""
        if self.emergency_stop or not self.system_active:
            return False
        
        # Validate workspace limits
        if not (-2.5 <= x <= 2.5 and -2.5 <= y <= 2.5 and 0.5 <= z <= 4.5):
            logger.warning(f"Position out of bounds: ({x}, {y}, {z})")
            return False
        
        command = f"MOVE:{x:.3f},{y:.3f},{z:.3f}"
        return self.send_command(command)
    
    def activate_system(self) -> bool:
        """Activate robot system"""
        if self.emergency_stop:
            return False
        
        self.system_active = True
        return self.send_command("ACTIVATE")
    
    def deactivate_system(self) -> bool:
        """Deactivate robot system"""
        self.system_active = False
        return self.send_command("DEACTIVATE")
    
    def emergency_stop_command(self) -> bool:
        """Emergency stop"""
        self.emergency_stop = True
        self.system_active = False
        return self.send_command("EMERGENCY_STOP")
    
    def home_position(self) -> bool:
        """Move to home position"""
        return self.move_to_position(0.0, 0.0, 2.5)
    
    def calibrate(self) -> bool:
        """Calibrate robot"""
        return self.send_command("CALIBRATE")
    
    def get_status(self) -> Dict[str, Any]:
        """Get current robot status"""
        return {
            "position": self.position,
            "is_connected": self.is_connected,
            "is_calibrated": self.is_calibrated,
            "emergency_stop": self.emergency_stop,
            "system_active": self.system_active
        }

class WebSocketServer:
    """WebSocket server for robot communication"""
    
    def __init__(self, host: str = "localhost", port: int = 8080):
        self.host = host
        self.port = port
        self.robot = CableRobotController()
        self.connected_clients = set()
        
    async def register_client(self, websocket):
        """Register new client"""
        self.connected_clients.add(websocket)
        logger.info(f"Client connected: {websocket.remote_address}")
        
        # Send initial status
        await self.send_status_update(websocket)
    
    async def unregister_client(self, websocket):
        """Unregister client"""
        self.connected_clients.discard(websocket)
        logger.info(f"Client disconnected: {websocket.remote_address}")
    
    async def send_status_update(self, websocket=None):
        """Send status update to client(s)"""
        status_message = {
            "type": "status_update",
            "data": self.robot.get_status(),
            "timestamp": time.time()
        }
        
        if websocket:
            await websocket.send(json.dumps(status_message))
        else:
            # Broadcast to all clients
            if self.connected_clients:
                await asyncio.gather(
                    *[client.send(json.dumps(status_message)) for client in self.connected_clients],
                    return_exceptions=True
                )
    
    async def send_position_update(self):
        """Send position update to all clients"""
        if not self.connected_clients:
            return
        
        position_message = {
            "type": "position_update",
            "data": self.robot.position,
            "timestamp": time.time()
        }
        
        await asyncio.gather(
            *[client.send(json.dumps(position_message)) for client in self.connected_clients],
            return_exceptions=True
        )
    
    async def handle_command(self, websocket, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle command from client"""
        command = message_data.get("command")
        data = message_data.get("data", {})
        
        logger.info(f"Received command: {command} with data: {data}")
        
        try:
            if command == "move":
                x = float(data.get("x", 0))
                y = float(data.get("y", 0))
                z = float(data.get("z", 0))
                success = self.robot.move_to_position(x, y, z)
                
                if success:
                    # Send position update to all clients
                    await asyncio.sleep(0.1)  # Wait for movement to start
                    await self.send_position_update()
                
                return {
                    "success": success,
                    "data": {"position": self.robot.position}
                }
            
            elif command == "activate":
                success = self.robot.activate_system()
                await self.send_status_update()
                return {"success": success}
            
            elif command == "deactivate":
                success = self.robot.deactivate_system()
                await self.send_status_update()
                return {"success": success}
            
            elif command == "emergency_stop":
                success = self.robot.emergency_stop_command()
                await self.send_status_update()
                return {"success": success}
            
            elif command == "home":
                success = self.robot.home_position()
                if success:
                    await asyncio.sleep(0.1)
                    await self.send_position_update()
                return {"success": success}
            
            elif command == "calibrate":
                success = self.robot.calibrate()
                return {"success": success}
            
            elif command == "get_status":
                return {
                    "success": True,
                    "data": self.robot.get_status()
                }
            
            else:
                return {
                    "success": False,
                    "error": f"Unknown command: {command}"
                }
        
        except Exception as e:
            logger.error(f"Error handling command {command}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def handle_client(self, websocket, path):
        """Handle client connection"""
        await self.register_client(websocket)
        
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    
                    if data.get("type") == "command":
                        response = await self.handle_command(websocket, data)
                        
                        # Send response back to client
                        response_message = {
                            "id": data.get("id"),
                            "success": response.get("success", False),
                            "data": response.get("data"),
                            "error": response.get("error")
                        }
                        
                        await websocket.send(json.dumps(response_message))
                
                except json.JSONDecodeError:
                    logger.error("Invalid JSON received")
                except Exception as e:
                    logger.error(f"Error handling message: {e}")
        
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister_client(websocket)
    
    async def start_server(self):
        """Start WebSocket server"""
        logger.info(f"Starting WebSocket server on {self.host}:{self.port}")
        
        # Start position update broadcaster
        asyncio.create_task(self.position_broadcaster())
        
        # Start WebSocket server
        await websockets.serve(self.handle_client, self.host, self.port)
        logger.info("WebSocket server started successfully")
    
    async def position_broadcaster(self):
        """Periodically broadcast position updates"""
        while True:
            await asyncio.sleep(0.1)  # 10Hz update rate
            if self.connected_clients and self.robot.system_active:
                await self.send_position_update()

async def main():
    """Main function"""
    server = WebSocketServer(host="localhost", port=8080)
    
    try:
        await server.start_server()
        
        # Keep server running
        await asyncio.Future()  # Run forever
        
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")

if __name__ == "__main__":
    # Install required packages:
    # pip install websockets pyserial
    
    print("Cable Robot WebSocket Server")
    print("Installing required packages...")
    print("pip install websockets pyserial")
    print("\nStarting server...")
    
    asyncio.run(main())
