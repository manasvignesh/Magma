from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from gradio_client import Client
from PIL import Image
import shutil
import uuid
import os
import traceback

# ============================================
# APP SETUP
# ============================================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# FOLDERS
# ============================================

UPLOAD_FOLDER = "uploads"
RESULT_FOLDER = "results"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

# ============================================
# HELPER FUNCTIONS
# ============================================

def validate_image(image_path):
    """
    Basic validation for uploaded images
    """

    try:
        img = Image.open(image_path)

        width, height = img.size

        # Prevent tiny images/screenshots
        if width < 200 or height < 200:
            return False, "Image too small."

        # Prevent weird aspect ratios
        ratio = width / height

        if ratio > 3 or ratio < 0.3:
            return False, "Invalid image ratio."

        return True, None

    except Exception:
        return False, "Invalid image file."


# ============================================
# TRY-ON ROUTE
# ============================================

@app.post("/virtual-tryon")
async def virtual_tryon(
    person_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    garment_description: str = Form("A stylish outfit")
):

    try:

        print("\n===================================")
        print("TRY-ON REQUEST RECEIVED")
        print("===================================\n")

        # ============================================
        # SAVE USER IMAGE
        # ============================================

        person_filename = f"{uuid.uuid4()}_{person_image.filename}"
        person_path = os.path.join(UPLOAD_FOLDER, person_filename)

        with open(person_path, "wb") as buffer:
            shutil.copyfileobj(person_image.file, buffer)

        print("User image saved:", person_path)

        # ============================================
        # SAVE GARMENT IMAGE
        # ============================================

        garment_filename = f"{uuid.uuid4()}_{garment_image.filename}"
        garment_path = os.path.join(UPLOAD_FOLDER, garment_filename)

        with open(garment_path, "wb") as buffer:
            shutil.copyfileobj(garment_image.file, buffer)

        print("Garment image saved:", garment_path)

        # ============================================
        # VALIDATE IMAGES
        # ============================================

        valid_person, person_error = validate_image(person_path)

        if not valid_person:
            return JSONResponse(
                status_code=400,
                content={"error": f"Person Image Error: {person_error}"}
            )

        valid_garment, garment_error = validate_image(garment_path)

        if not valid_garment:
            return JSONResponse(
                status_code=400,
                content={"error": f"Garment Image Error: {garment_error}"}
            )

        # ============================================
        # CONNECT TO IDM-VTON
        # ============================================

        print("\nConnecting to IDM-VTON...\n")

        client = Client("yisol/IDM-VTON")

        print("Connected successfully!")

        # ============================================
        # GENERATE TRY-ON
        # ============================================

        print("\nGenerating virtual try-on...\n")

        result = client.predict(
            dict={
                "background": person_path,
                "layers": [],
                "composite": None
            },
            garm_img=garment_path,
            garment_des=garment_description,
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=30,
            seed=42,
            api_name="/tryon"
        )

        print("\nGeneration completed!")
        print("Raw Result:", result)

        # ============================================
        # HANDLE RESULT
        # ============================================

        if not result:
            return JSONResponse(
                status_code=500,
                content={"error": "No output returned from IDM-VTON"}
            )

        # Sometimes Gradio returns tuple/list
        output_image = result

        if isinstance(result, (list, tuple)):
            output_image = result[0]

        print("Final Output Image:", output_image)

        # Serve static file if local path
        if os.path.isabs(output_image) and os.path.exists(output_image):
            # To avoid local path issues in browser, copy to results folder and serve via URL
            final_filename = f"{uuid.uuid4()}.jpg"
            final_path = os.path.join(RESULT_FOLDER, final_filename)
            shutil.copy(output_image, final_path)
            output_image = f"http://127.0.0.1:8000/results/{final_filename}"
        
        return {
            "success": True,
            "generated_image": output_image
        }

    except Exception as e:

        print("\n===================================")
        print("ERROR OCCURRED")
        print("===================================\n")

        traceback.print_exc()

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )

# ============================================
# ROOT ROUTE & STATIC FILES
# ============================================
from fastapi.staticfiles import StaticFiles
app.mount("/results", StaticFiles(directory="results"), name="results")

@app.get("/")
def home():
    return {
        "message": "VYRA Virtual Try-On API Running"
    }
