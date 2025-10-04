from vosk import Model, KaldiRecognizer
import sounddevice as sd
import json
import requests
import time

# Load vosk model
model = Model("./vosk-model-small-en-us-0.15")

# Define wake word and command keywords
wake_word = "transmit"
commands = ["move", "stop", "shoot", "revert"]
keywords = [wake_word] + commands

# Create recognizer with keywords
rec = KaldiRecognizer(model, 16000, json.dumps(keywords))

# Command mapping for visual demo
command_mapping = {
    "move": "MOVE",
    "stop": "STOP", 
    "shoot": "SHOOT",
    "revert": "STOP"
}

def send_command_directly(command):
    """Send command to the gesture server endpoint"""
    try:
        mapped_command = command_mapping.get(command, command.upper())
        response = requests.post("http://127.0.0.1:8000/set-command", 
                               json={"command": mapped_command},
                               timeout=1.0)
        if response.status_code == 200:
            print(f"Command '{mapped_command}' sent successfully")
        else:
            print(f"Failed to send command: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error sending command: {e}")

# State variable: waiting for wake word or command
waiting_for_wake = True

def callback(indata, frames, time, status):
    global waiting_for_wake

    if rec.AcceptWaveform(bytes(indata)):
        result = rec.Result()
        text = json.loads(result).get("text", "").strip().lower()
        if not text:
            return

        print("Recognized:", text)
        words = text.split()
        
        for word in words:
            if word == wake_word:
                print(f"Wake word '{wake_word}' detected. Ready for commands...")
                waiting_for_wake = False
            elif word in commands:
                if word == "revert":
                    waiting_for_wake = True
                    print("Waiting for wake word again...")
                if not waiting_for_wake:
                    print(f"Command: {word.capitalize()}")
                    send_command_directly(word)
                    waiting_for_wake = True
                    print("Waiting for wake word again...")
            else:
                partial = json.loads(rec.PartialResult()).get("partial", "").lower()
                if wake_word in partial:
                    print(f"(Partial) Wake word '{wake_word}' detected...")
                    waiting_for_wake = False


def add_keyword(new_word):
    global keywords, rec
    if new_word not in keywords:
        keywords.append(new_word)
        rec = KaldiRecognizer(model, 16000, json.dumps(keywords))
        print(f"Added new keyword: {new_word}")

with sd.RawInputStream(samplerate=16000, blocksize=4000, dtype='int16', channels=1, callback=callback):
    print("Listening... Say the wake word before giving a command. Press Ctrl+C to stop.")
    while True:
        sd.sleep(1000)
