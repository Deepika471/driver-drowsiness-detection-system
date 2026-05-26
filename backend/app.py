import numpy as np
import base64
import io
from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from PIL import Image
import os

app = Flask(__name__)

# Load your trained model
model = load_model("best_model.h5")

# Your 4 classes
classes = [
    "notdrowsy",
    "sleepy",
    "slowBlink",
    "yawning"
]

# ── Shared state logic ─────────────────────────────────────────
def get_state(predicted_class):
    if predicted_class in ["sleepy", "slowBlink", "yawning"]:
        return "DROWSY"
    return "NOT_DROWSY"

# ── Existing route: /predict (file upload from image module) ───
def preprocess_image(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0
    return img_array

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    file_path = os.path.join("uploads", file.filename)
    file.save(file_path)

    img = preprocess_image(file_path)
    preds = model.predict(img)[0]

    confidence = {}
    for i, cls in enumerate(classes):
        confidence[cls] = float(preds[i]) * 100

    predicted_class = classes[np.argmax(preds)]

    return jsonify({
        "predicted_class": predicted_class,
        "state": get_state(predicted_class),
        "confidence": confidence
    })

# ── New route: /predict-base64 (webcam frames from live module) ─
@app.route("/predict-base64", methods=["POST"])
def predict_base64():
    try:
        data = request.get_json()
        if not data or "image" not in data:
            return jsonify({"error": "No image data"}), 400

        # Strip data URL header if present (e.g. "data:image/jpeg;base64,...")
        img_data = data["image"]
        if "," in img_data:
            img_data = img_data.split(",")[1]

        # Decode base64 → PIL Image → numpy array
        img_bytes = base64.b64decode(img_data)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img = img.resize((224, 224))

        img_array = np.array(img, dtype=np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)  # shape: (1, 224, 224, 3)

        preds = model.predict(img_array)[0]

        confidence = {}
        for i, cls in enumerate(classes):
            confidence[cls] = float(round(preds[i] * 100, 2))

        predicted_class = classes[np.argmax(preds)]

        return jsonify({
            "predicted_class": predicted_class,
            "state": get_state(predicted_class),
            "confidence": confidence
        })

    except Exception as e:
        print(f"predict_base64 error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    os.makedirs("uploads", exist_ok=True)
    app.run(debug=True)


# import numpy as np
# from flask import Flask, request, jsonify
# from tensorflow.keras.models import load_model
# from tensorflow.keras.preprocessing import image
# import os

# app = Flask(__name__)

# # Load your trained model
# model = load_model("best_model.h5")

# # Your 4 classes (CHANGE according to your dataset)
# classes = [
#     "notdrowsy",
#     "sleepy",
#     "slowBlink",
#     "yawning"
# ]

# def preprocess_image(img_path):
#     img = image.load_img(img_path, target_size=(224, 224))  # for MobileNetV2
#     img_array = image.img_to_array(img)
#     img_array = np.expand_dims(img_array, axis=0)
#     img_array = img_array / 255.0
#     return img_array

# @app.route("/predict", methods=["POST"])
# def predict():
#     if "file" not in request.files:
#         return jsonify({"error": "No file uploaded"}), 400

#     file = request.files["file"]
#     file_path = os.path.join("uploads", file.filename)
#     file.save(file_path)

#     img = preprocess_image(file_path)
#     preds = model.predict(img)[0]

#     result = {}
#     for i, cls in enumerate(classes):
#         result[cls] = float(preds[i]) * 100

#     predicted_class = classes[np.argmax(preds)]

#     # Final label logic
#     if predicted_class in ["sleepy", "slowBlink", "yawning"]:
#         state = "DROWSY"
#     else:
#         state = "NOT_DROWSY"

#     return jsonify({
#         "predicted_class": predicted_class,
#         "state": state,
#         "confidence": result
#     })

# if __name__ == "__main__":
#     os.makedirs("uploads", exist_ok=True)
#     app.run(debug=True)