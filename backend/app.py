from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow React frontend to call this API

# Test GET endpoint
@app.route("/api/hello")
def hello():
    return jsonify({"message": "Hello from Flask backend!"})

# POST endpoint for FT Mixer
@app.route("/api/mixer", methods=["POST"])
def mixer():
    data = request.get_json()  # get JSON payload from React
    print("Received data:", data)
    
    # Example FT Mixer processing (replace with your real algorithm)
    processed_signal = [x * data["settings"]["gain"] for x in data["inputSignal"]]
    
    result = {"status": "success", "processed": processed_signal}
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
