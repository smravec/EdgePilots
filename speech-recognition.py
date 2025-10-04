from vosk import Model, KaldiRecognizer
import sounddevice as sd
import json
import socket

model = Model("./vosk-model-small-en-us-0.15")
keywords = ["forward", "backward", "left", "right", "stop"]
rec = KaldiRecognizer(model, 16000, json.dumps(keywords))

UDP_IP = "127.0.0.1"
UDP_PORT = 5005
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

def callback(indata, frames, time, status):
    if rec.AcceptWaveform(bytes(indata)):
        result = rec.Result()
        text = json.loads(result).get("text", "").strip().lower()
        if text:
            print("Recognized:", text)

            if text == "forward":
                print("Command: Move Forward")
                sock.sendto(text.encode(), (UDP_IP, UDP_PORT))
            elif text == "backward":
                print("Command: Move Backward")
                sock.sendto(text.encode(), (UDP_IP, UDP_PORT))
            elif text == "left":
                print("Command: Turn Left")
                sock.sendto(text.encode(), (UDP_IP, UDP_PORT))
            elif text == "right":
                print("Command: Turn Right")
                sock.sendto(text.encode(), (UDP_IP, UDP_PORT))
            elif text == "stop":
                print("Command: Stop")
                sock.sendto(text.encode(), (UDP_IP, UDP_PORT))

def add_keyword(new_word):
    global keywords, rec
    if new_word not in keywords:
        keywords.append(new_word)
        rec = KaldiRecognizer(model, 16000, json.dumps(keywords))
        print(f"Added new keyword: {new_word}")

with sd.RawInputStream(samplerate=16000, blocksize=4000, dtype='int16', channels=1, callback=callback):
    print("Listening... Press Ctrl+C to stop.")
    while True:
        sd.sleep(1000)