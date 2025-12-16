from fastapi import APIRouter, UploadFile, File
from services.image_processor import ImageProcessor
import base64
from pydantic import BaseModel

router = APIRouter()

class UploadResponse(BaseModel):
    image_b64: str
    width: int
    height: int

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    bytes_data = await file.read()
    proc = ImageProcessor.from_bytes(bytes_data)
    pil = proc.get_display_original()
    b64 = ImageProcessor.pil_to_base64_png(pil)
    return UploadResponse(image_b64=b64, width=pil.width, height=pil.height)

@router.post("/component")
async def component_view(payload: dict):
    """
    payload: { "image_b64": <base64 PNG>, "component": "mag"|"phase"|"real"|"imag" }
    returns base64 PNG for requested FT visualization.
    """
    b64 = payload.get("image_b64")
    comp = payload.get("component", "mag")
    header, data = b64.split(",", 1)
    raw = base64.b64decode(data)
    proc = ImageProcessor.from_bytes(raw)
    if comp == "mag":
        pil = proc.visualize_magnitude()
    elif comp == "phase":
        pil = proc.visualize_phase()
    elif comp == "real":
        pil = proc.visualize_real()
    elif comp == "imag":
        pil = proc.visualize_imag()
    else:
        pil = proc.get_display_original()
    return {"component_b64": ImageProcessor.pil_to_base64_png(pil)}