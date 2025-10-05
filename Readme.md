# How to run
- Start both of the servers for hand and speech recognition
- Start the web demo to visually see how you can control the UGV

### Hand Gestures
```
cd dynamic_gestures

conda create -n dynamic_gestures python=3.9 -y
conda activate dynamic_gestures

pip install -r requirements.txt

python run_demo.py
```

### Speech recognition

Setup your input device on your machine

```
cd ..
pip install -r requirements.txt
python speech-recognition.py
```

### Visual Demo (on http://localhost:3001)
```
cd visual_demo
npm i
npm run dev
```

