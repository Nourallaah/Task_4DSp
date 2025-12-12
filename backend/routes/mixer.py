from fastapi import APIRouter
from models.schemas import MixRequest, MixResponse
from services.image_processor import ImageProcessor
from services.mixer_engine import FourierMixer
from services.mask_generator import MaskGenerator
import base64
from PIL import Image
import numpy as np

router = APIRouter()


def pil_to_b64(im: Image.Image) -> str:
    from io import BytesIO
    buf = BytesIO()
    im.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


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

    # 3. Generate mask (rect or low‑freq)
    if mreq.region.type == "rect":
        mask = MaskGenerator.rectangular_mask(
            (min_h, min_w),
            (mreq.region.x, mreq.region.y),
            mreq.region.width,
            mreq.region.height
        )
    else:
        mask = MaskGenerator.low_freq_central(
            (min_h, min_w),
            mreq.region.radius
        )

    if not mreq.region.inner:
        mask = 1.0 - mask

    # map weights to valid processors
    w_mag   = [mreq.weights_mag[i]   for i, p in enumerate(processors) if p]
    w_phase = [mreq.weights_phase[i] for i, p in enumerate(processors) if p]

    # 4. Fourier mag+phase mixing
    out_fft = mixer.mix_mag_phase(
        mag_list=mags,
        phase_list=phases,
        w_mag=w_mag,
        w_phase=w_phase,
        mask=mask
    )

    out_img = ImageProcessor.reconstruct_from_fft(out_fft)
    return MixResponse(output_b64=pil_to_b64(Image.fromarray(out_img)))
