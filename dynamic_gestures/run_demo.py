import argparse
import time

import cv2
import numpy as np

from main_controller import MainController
from utils import targets
from fastapi import FastAPI
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import threading
import asyncio


# Initialize FastAPI app
app = FastAPI()

# Allow CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared variable to store the latest command
latest_command = {"command": "", "timestamp": 0}

def update_command(command):
    """Function to update command from external sources (like speech recognition)"""
    global latest_command
    latest_command = {"command": command}
    print(f"Command updated to: {command}")

# Define the /set-command route for external command input
@app.post("/set-command")
async def set_command(request_data: dict):
    global latest_command
    if "command" in request_data:
        latest_command["command"] = request_data["command"]
        latest_command["timestamp"] = time.time()  # Add timestamp for voice commands
        return JSONResponse({"status": "success", "command": request_data["command"]})
    return JSONResponse({"status": "error", "message": "No command provided"}, status_code=400)

# Define the /give-command route for continuous streaming
@app.get("/give-command")
async def give_command():
    async def command_stream():
        prev_timestamp = None
        while True:
            # Send command if timestamp changed (allows duplicate commands)
            if latest_command["timestamp"] != prev_timestamp:
                yield f"data: {latest_command}\n\n"
                prev_timestamp = latest_command["timestamp"]
            await asyncio.sleep(0.1)

    return StreamingResponse(command_stream(), media_type="text/event-stream")

def run_fastapi():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

def run(args):
    global latest_command
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    controller = MainController(args.detector, args.classifier)
    debug_mode = args.debug
    prev_command = None
    command = ""
    last_turn_time = 0  # Track last turn command time for cooldown

    while cap.isOpened():
        ret, frame = cap.read()
        frame = cv2.flip(frame, 1)
        if ret:
            start_time = time.time()
            bboxes, ids, labels = controller(frame)
            if debug_mode:
                if bboxes is not None:
                    bboxes = bboxes.astype(np.int32)
                    for i in range(bboxes.shape[0]):
                        box = bboxes[i, :]
                        gesture = targets[labels[i]] if labels[i] is not None else "None"

                        if gesture == "fist":
                            command = "STOP"
                        elif gesture == "three_gun":
                            command = "SHOOT"
                        elif gesture == "palm":
                            command = "MOVE"
                        elif gesture == "dislike":
                            command = "LEFT"
                        elif gesture == "like":
                            command = "RIGHT"

                        # For turn commands (LEFT/RIGHT), check cooldown before sending
                        # For other commands, only send when changed to avoid spam
                        if command in ["LEFT", "RIGHT"]:
                            current_time = time.time()
                            # Only send turn command if 1.5 seconds have passed since last turn
                            if current_time - last_turn_time >= 1.5:
                                print(command)
                                latest_command = {"command": command, "timestamp": current_time}
                                last_turn_time = current_time
                                prev_command = command
                        elif command != prev_command:
                            print(command)
                            latest_command = {"command": command, "timestamp": time.time()}
                            prev_command = command

                        cv2.rectangle(frame, (box[0], box[1]), (box[2], box[3]), (255, 255, 0), 4)
                        cv2.putText(
                            frame,
                            f"ID {ids[i]} : {gesture}",
                            (box[0], box[1] - 10),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            1,
                            (0, 0, 255),
                            2,
                        )

                fps = 1.0 / (time.time() - start_time)
                cv2.putText(frame, f"fps {fps:.2f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow("frame", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Run demo")
    parser.add_argument(
        "--detector",
        default='models/hand_detector.onnx',
        type=str,
        help="Path to detector onnx model"
    )

    parser.add_argument(
        "--classifier",
        default='models/crops_classifier.onnx',
        type=str,
        help="Path to classifier onnx model",
    )

    parser.add_argument("--debug", required=False, action="store_true", help="Debug mode")
    args = parser.parse_args()

    # Enable debug mode by default
    args.debug = True

    # Start FastAPI server in a separate thread
    api_thread = threading.Thread(target=run_fastapi, daemon=True)
    api_thread.start()

    # Run the main demo
    run(args)
