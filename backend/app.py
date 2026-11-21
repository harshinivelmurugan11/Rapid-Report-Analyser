"""
Rapid Report Analyzer - Flask Backend Server
Provides OCR file extraction (PyMuPDF + Tesseract) and AI analysis (Gemini API).
"""

import os
import re
import json
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file in root or current dir
root_env = Path(__file__).resolve().parent.parent / '.env'
if root_env.exists():
    load_dotenv(dotenv_path=root_env)
else:
    load_dotenv()

app = Flask(__name__, static_folder="../", static_url_path="")
CORS(app)

# Configuration
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "./backend/uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = int(os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024))
ALLOWED_EXTENSIONS = set(os.getenv("ALLOWED_EXTENSIONS", "pdf,png,jpg,jpeg").lower().split(","))

# Configure Tesseract if configured in .env
tesseract_cmd = os.getenv("TESSERACT_CMD")
if tesseract_cmd and os.path.exists(tesseract_cmd):
    try:
        import pytesseract
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
    except ImportError:
        pass

# Configure Gemini if API key is present
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
gemini_model = None
if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        gemini_model = genai.GenerativeModel(model_name)
    except Exception as e:
        print(f"Warning: Gemini initialization failed: {e}")


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_pdf(pdf_path):
    """Extract text using PyMuPDF (fitz) with OCR fallback."""
    text = ""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(pdf_path)
        for page in doc:
            page_text = page.get_text()
            if page_text:
                text += page_text + "\n"
        doc.close()
    except Exception as e:
        print(f"PyMuPDF error: {e}")

    # Fallback to OCR if extracted text is sparse (scanned document)
    if len(text.strip()) < 50:
        try:
            import fitz
            from PIL import Image
            import pytesseract
            doc = fitz.open(pdf_path)
            ocr_text = ""
            for page in doc:
                pix = page.get_pixmap()
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                ocr_text += pytesseract.image_to_string(img) + "\n"
            doc.close()
            if ocr_text.strip():
                text = ocr_text
        except Exception as ocr_err:
            print(f"OCR fallback error: {ocr_err}")

    return text


def extract_text_from_image(image_path):
    """Extract text from image using Tesseract OCR."""
    try:
        from PIL import Image
        import pytesseract
        img = Image.open(image_path)
        return pytesseract.image_to_string(img)
    except Exception as e:
        print(f"Image OCR error: {e}")
        return ""


def parse_lab_parameters_rule_based(text):
    """Rule-based regex parser for common medical lab tests."""
    patterns = {
        "Haemoglobin": {
            "regex": r"(?:haemoglobin|hemoglobin|hb)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(g/dl)?",
            "unit": "g/dL",
            "ref": [12.0, 15.5]
        },
        "WBC": {
            "regex": r"(?:total\s+wbc|wbc\s+count|wbc)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:x10\^?3/ul|/cumm)?",
            "unit": "×10³/µL",
            "ref": [4.0, 11.0]
        },
        "Platelets": {
            "regex": r"(?:platelet\s+count|platelets)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:x10\^?3/ul|/cumm|lakhs)?",
            "unit": "×10³/µL",
            "ref": [150.0, 410.0]
        },
        "FBS": {
            "regex": r"(?:fasting\s+blood\s+sugar|fbs|fasting\s+glucose)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(mg/dl)?",
            "unit": "mg/dL",
            "ref": [70.0, 100.0]
        },
        "HbA1c": {
            "regex": r"(?:hba1c|glycated\s+hemoglobin)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)\s*%",
            "unit": "%",
            "ref": [4.0, 5.6]
        },
        "TSH": {
            "regex": r"(?:tsh|thyroid\s+stimulating\s+hormone)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(ui?u/ml)?",
            "unit": "µIU/mL",
            "ref": [0.4, 4.2]
        }
    }

    results = []
    text_lower = text.lower()
    for name, conf in patterns.items():
        m = re.search(conf["regex"], text_lower)
        if m:
            val = float(m.group(1))
            results.append([name, val, conf["unit"], conf["ref"][0], conf["ref"][1]])

    return results


def parse_lab_parameters_with_ai(text):
    """Use Gemini AI to extract structured lab parameters."""
    if not gemini_model:
        return parse_lab_parameters_rule_based(text)

    prompt = f"""
    You are a medical lab report data extractor.
    Extract all test parameters from the following report text into a JSON array of arrays.
    Format for each item: [test_name, result_value, unit, low_reference, high_reference]
    Example: [["Haemoglobin", 12.5, "g/dL", 12.0, 15.5], ["FBS", 105, "mg/dL", 70, 100]]

    Only output valid JSON, no markdown formatting, no code fences.
    
    Report Text:
    {text}
    """
    try:
        response = gemini_model.generate_content(prompt)
        raw_json = response.text.strip().replace("```json", "").replace("```", "").strip()
        data = json.loads(raw_json)
        if isinstance(data, list):
            return data
    except Exception as e:
        print(f"Gemini parsing failed, falling back to rules: {e}")

    return parse_lab_parameters_rule_based(text)


# ------------------------------------------------------------------------------
# API Endpoints
# ------------------------------------------------------------------------------
@app.route("/")
def index():
    """Serve the frontend index.html."""
    return send_from_directory("../", "index.html")


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "online",
        "service": "Rapid Report Analyzer Backend",
        "ocr_available": bool(tesseract_cmd or "fitz" in globals()),
        "ai_available": bool(gemini_model is not None)
    })


@app.route("/api/upload", methods=["POST"])
def upload_report():
    """Endpoint to upload and analyze report files."""
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file format"}), 400

    filename = re.sub(r"[^a-zA-Z0-9_.-]", "_", file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    category = request.form.get("category", "General")
    report_date = request.form.get("date", "")
    lab_name = request.form.get("lab", "Unknown Lab")

    # Extract text from PDF or Image
    ext = filename.rsplit(".", 1)[1].lower()
    if ext == "pdf":
        extracted_text = extract_text_from_pdf(filepath)
    else:
        extracted_text = extract_text_from_image(filepath)

    # Parse parameters using AI or rule-based fallback
    parameters = parse_lab_parameters_with_ai(extracted_text)

    response_data = {
        "file": filename,
        "cat": category,
        "date": report_date,
        "lab": lab_name,
        "p": parameters,
        "extracted_text_preview": extracted_text[:300] if extracted_text else ""
    }

    return jsonify(response_data)


@app.route("/api/chat", methods=["POST"])
def chat():
    """Interactive AI Assistant endpoint."""
    data = request.get_json() or {}
    query = data.get("query", "")
    language = data.get("language", "en")
    context = data.get("context", "")

    if not query:
        return jsonify({"error": "Query is required"}), 400

    if gemini_model:
        lang_instruction = "Respond in Tamil." if language == "ta" else "Respond in English."
        prompt = f"""
        You are the Rapid Report Analyzer AI Health Assistant.
        Provide educational explanations of lab results. Do not provide a formal medical diagnosis.
        Remind the user to consult their healthcare provider.
        {lang_instruction}

        Context of patient's reports:
        {context}

        User Question:
        {query}
        """
        try:
            res = gemini_model.generate_content(prompt)
            return jsonify({"reply": res.text.strip()})
        except Exception as e:
            print(f"Gemini chat failed: {e}")

    # Fallback response
    if language == "ta":
        reply = "உங்கள் அறிக்கைகளை மருத்துவருடன் கலந்து ஆலோசிக்கவும். இது மருத்துவ ஆலோசனைக்கு மாற்றாகாது."
    else:
        reply = "Please discuss your report values with a qualified healthcare professional. This is for educational purposes only."

    return jsonify({"reply": reply})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "1") == "1"
    print(f"Starting Rapid Report Analyzer server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=debug)
