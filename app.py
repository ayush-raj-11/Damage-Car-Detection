from flask import Flask, request, jsonify, render_template, send_from_directory
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import numpy as np
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Load the saved model
try:
    model = tf.keras.models.load_model('D:/AIML/Breach Hackathon/final Model Making/short model/car_damage_classification_model.h5')
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Define classes
class_names = ['damaged', 'not_damaged']

# Upload configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Prediction function
def predict_damage(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0  # Normalize

    predictions = model.predict(img_array)
    predicted_class = class_names[np.argmax(predictions)]
    prediction_percentage = predictions[0][np.argmax(predictions)] * 100
    return predicted_class, prediction_percentage

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file in the request'}), 400

    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not allowed_file(image_file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500

    try:
        image_filename = secure_filename(image_file.filename)
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
        image_file.save(image_path)

        predicted_class, prediction_percentage = predict_damage(image_path)

        # Optionally delete the file after prediction
        # os.remove(image_path)

        return jsonify({
            'predicted_class': predicted_class,
            'prediction_percentage': f'{prediction_percentage:.2f}',
            'image_url': f'/uploads/{image_filename}'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)