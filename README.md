# Driver Drowsiness Detection System (DDDS)

A full-stack AI-powered system that detects driver drowsiness 
in real time using webcam feeds and static image uploads.

## Tech Stack
- **Frontend:** React + Vite, TailwindCSS
- **Backend:** Node.js, Express.js
- **AI/ML:** Python, Flask, TensorFlow/Keras, MediaPipe
- **Database:** MongoDB Atlas
- **Auth:** JWT

## Features
- User Authentication (Register / Login)
- Image Upload Detection — upload a driver photo for analysis
- Live Webcam Detection — real-time frame-by-frame analysis
- MediaPipe EAR (Eye Aspect Ratio) for eye closure detection
- Alarm system with user-selectable duration (5s / 10s / 15s / 20s)
- Consecutive drowsy frame detection before triggering alarm
- DROWSY state held in UI for 10 seconds after detection
- MongoDB prediction history storage
- JWT protected routes

## Model
- Architecture: MobileNetV2 (Transfer Learning)
- Dataset: NTHU Driver Drowsiness Detection Dataset
- Classes: `notdrowsy`, `sleepy`, `slowBlink`, `yawning`
- Two-phase training: frozen base → fine-tuned top 30 layers

## Setup

### Backend (Node.js)
cd backend
npm install
node server.js

### Python/Flask
cd backend
pip install -r requirements.txt
python app.py

### Frontend
cd frontend
npm install
npm run dev

## Environment Variables (.env)
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret

# Screenshots

## Home Page
![Home Page](screenshots/home_page.png)

## Login Page
![Login](screenshots/login_page.png)

## Register Page
![Register](screenshots/register_page.png)

## Detection Page
![Detect](screenshots/image_upload.png)
![Upload](screenshots/live_detection_page.png)

## Prediction Result
![Result](screenshots/detection_result1.png)
![Result](screenshots/detection_result2.png)

### Live Webcam Detection
![Live Detection](screenshots/live_detection._result1.png)
![Live Detection](screenshots/live_detection._result2.png)

