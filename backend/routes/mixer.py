from fastapi import APIRouter
from models.schemas import MixRequest, MixResponse
from services.image_processor import ImageProcessor
from services.mixer_engine import FourierMixer
from services.mask_generator import MaskGenerator
import base64
from PIL import Image
import numpy as np

router = APIRouter()

@router.post("/mix", response_model=MixResponse)
def mix(mreq: MixRequest):
    # 1. Load and standardize images
    processors = []
    for b64_str in mreq.images_b64:
        if not b64_str:
            processors.append(None)
            continue
        header, data = b64_str.split(",", 1)
        raw = base64.b64decode(data)
        processors.append(ImageProcessor.from_bytes(raw))

    valid_procs = [p for p in processors if p is not None]
    if not valid_procs:
        return MixResponse(output_b64="")

    # unify size
    min_h = min(p.gray.shape[0] for p in valid_procs)
    min_w = min(p.gray.shape[1] for p in valid_procs)
    for p in valid_procs:
        p.resize_to((min_w, min_h))

    # 2. Prepare FT components
    ffts   = [p.fft for p in valid_procs]
    mags   = [np.abs(p.fft) for p in valid_procs]
    phases = [p.get_phase_array() for p in valid_procs]
    mixer  = FourierMixer(ffts)

    # 3. Generate mask (only if region is enabled)
    if hasattr(mreq.region, 'enabled') and mreq.region.enabled:
        if mreq.region.type == "rect":
            mask = MaskGenerator.rectangular_mask(
                (min_h, min_w),
                (mreq.region.x, mreq.region.y),
                mreq.region.width,
                mreq.region.height
            )

        if not mreq.region.inner:
            mask = 1.0 - mask
    else:
        # No mask - full image mixing (mask of all 1s)
        mask = np.ones((min_h, min_w), dtype=np.float32)

    # 4. Hybrid Mixing (Unified Logic)
    # We prioritize the new `components` and `weights` fields.
    # We pass the full list of processors (including Nones) to mix_hybrid
    # because it iterates zip(processors, components, weights).
    
    out_fft = mixer.mix_hybrid(
        processors=processors,
        components=mreq.components,
        weights=mreq.weights,
        mask=mask
    )

    out_img = ImageProcessor.reconstruct_from_fft(out_fft)
    return MixResponse(output_b64=ImageProcessor.pil_to_base64_png(Image.fromarray(out_img)))