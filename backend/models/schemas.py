from pydantic import BaseModel
from typing import List, Optional

class Region(BaseModel):
    type: str = "rect"
    enabled: bool = False  # Add this field
    x: Optional[int] = 60
    y: Optional[int] = 60
    width: Optional[int] = 50
    height: Optional[int] = 50
    inner: Optional[bool] = True
    radius: Optional[int] = 30  # For low-freq mode

class MixRequest(BaseModel):
    images_b64: List[str] 
    mix_mode: str = "magphase"  # "magphase", "realimag", "spatial", or "hybrid"
    weights_global: List[float] = [0,0,0,0] # For spatial mixing
    weights_mag: List[float] = [0,0,0,0]
    weights_phase: List[float] = [0,0,0,0]
    weights_real: List[float] = [0,0,0,0]
    weights_imag: List[float] = [0,0,0,0]
    # New fields for per-image mixing
    components: List[str] = ["Magnitude", "Magnitude", "Magnitude", "Magnitude"]
    weights: List[float] = [0,0,0,0]
    region: Region = Region()

class MixResponse(BaseModel):
    output_b64: str