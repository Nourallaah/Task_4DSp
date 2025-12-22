from pydantic import BaseModel
from typing import List, Optional

class Region(BaseModel):
    type: str = "rect"
    enabled: bool = False  
    x: Optional[int] = 60
    y: Optional[int] = 60
    width: Optional[int] = 50
    height: Optional[int] = 50
    inner: Optional[bool] = True
    radius: Optional[int] = 30  # For low-freq mode

class MixRequest(BaseModel):
    images_b64: List[str] 
    # fields for per-image mixing
    components: List[str] = ["Magnitude", "Magnitude", "Magnitude", "Magnitude"]
    weights: List[float] = [0,0,0,0]
    region: Region = Region()

class MixResponse(BaseModel):
    output_b64: str