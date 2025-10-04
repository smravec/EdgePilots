from vosk import Model, KaldiRecognizer
import sounddevice as sd
import json
import socket

# Load vosk model
model = Model("./vosk-model-small-en-us-0.15")

# Define wake word and command keywords
wake_word = "transmitter"
commands = ["forward", "backward", "left", "right", "stop"]
keywords = [wake_word] + commands

# Create recognizer with keywords
rec = KaldiRecognizer(model, 16000, json.dumps(keywords))

UDP_IP = "127.0.0.1"
UDP_PORT = 5005
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# State variable: waiting for wake word or command
waiting_for_wake = True

def callback(indata, frames, time, status):
    global waiting_for_wake, rec

    if rec.AcceptWaveform(bytes(indata)):
        result = rec.Result()
        text = json.loads(result).get("text", "").strip().lower()
        if not text:
            return

        print("Recognized:", text)

        words = text.split()

        # Case 1: Both wake word and command are in same phrase
        if wake_word in words:
            # Find if any command is also in the same phrase
            found_command = next((cmd for cmd in commands if cmd in words), None)
            if found_command:
                print(f"Wake word '{wake_word}' detected with command '{found_command}'.")
                print(f"Command: {found_command.capitalize()}")
                sock.sendto(found_command.encode(), (UDP_IP, UDP_PORT))
                waiting_for_wake = True  # back to waiting for wake
                print("Waiting for wake word again...")
                return
            else:
                print(f"Wake word '{wake_word}' detected. Listening for a command...")
                waiting_for_wake = False
                return

        # Case 2: Already heard wake word, now waiting for command
        if not waiting_for_wake:
            found_command = next((cmd for cmd in commands if cmd in words), None)
            if found_command:
                print(f"Command: {found_command.capitalize()}")
                sock.sendto(found_command.encode(), (UDP_IP, UDP_PORT))
                waiting_for_wake = True
                print("Waiting for wake word again...")
            else:
                print("No valid command detected.")
        # Case 3: Heard something else entirely
        else:
            # Ignore anything without wake word when waiting
            pass

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
