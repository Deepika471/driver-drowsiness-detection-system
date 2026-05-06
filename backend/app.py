import numpy as np
from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import os

app = Flask(__name__)

# Load your trained model
model = load_model("best_model.h5")

# Your 4 classes (CHANGE according to your dataset)
classes = [
    "notdrowsy",
    "sleepy",
    "slowBlink",
    "yawning"
]

def preprocess_image(img_path):
    img = image.load_img(img_path, target_size=(224, 224))  # for MobileNetV2
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

    result = {}
    for i, cls in enumerate(classes):
        result[cls] = float(preds[i]) * 100

    predicted_class = classes[np.argmax(preds)]

    # Final label logic
    if predicted_class in ["sleepy", "slowBlink", "yawning"]:
        state = "DROWSY"
    else:
        state = "NOT_DROWSY"

    return jsonify({
        "predicted_class": predicted_class,
        "state": state,
        "confidence": result
    })

if __name__ == "__main__":
    os.makedirs("uploads", exist_ok=True)
    app.run(debug=True)