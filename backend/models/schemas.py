from pydantic import BaseModel
from typing import List

class Region(BaseModel):
    type: str = "rect"
    x: int = 0
    y: int = 0
    width: int = 50
    height: int = 50
    inner: bool = True 

class MixRequest(BaseModel):
    images_b64: List[str] 
    mix_mode: str = "magphase"  # "magphase", "realimag", or "spatial"
    weights_global: List[float] = [0,0,0,0] # For spatial mixing
    weights_mag: List[float] = [0,0,0,0]
    weights_phase: List[float] = [0,0,0,0]
    weights_real: List[float] = [0,0,0,0]
    weights_imag: List[float] = [0,0,0,0]
    region: Region = Region()

class MixResponse(BaseModel):
    output_b64: str