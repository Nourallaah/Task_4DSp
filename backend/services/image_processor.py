from PIL import Image, ImageOps
import numpy as np
from io import BytesIO
import pillow_heif
import base64
from PIL import Image

pillow_heif.register_heif_opener()

class ImageProcessor:
    def __init__(self, pil: Image.Image):
        # Ensure we work with RGB and the orientation is fixed before we start
        self._original_pil = pil.convert("RGB")
        
        # Initialize arrays
        self._gray = self._to_gray_array(self._original_pil).astype(np.float32)
        # store fft shifted (centered)
        self._fft = np.fft.fftshift(np.fft.fft2(self._gray))
    
    # Property getters and setters
    @property
    def original_pil(self) -> Image.Image:
        """Get the original PIL image"""
        return self._original_pil
    
    @original_pil.setter
    def original_pil(self, value: Image.Image) -> None:
        """Set the original PIL image and recalculate gray and fft"""
        self._original_pil = value.convert("RGB")
        self._gray = self._to_gray_array(self._original_pil).astype(np.float32)
        self._fft = np.fft.fftshift(np.fft.fft2(self._gray))
    
    @property
    def gray(self) -> np.ndarray:
        """Get the grayscale array (read-only, computed from original_pil)"""
        return self._gray
    
    @property
    def fft(self) -> np.ndarray:
        """Get the FFT array (read-only, computed from gray)"""
        return self._fft

    @classmethod
    def from_bytes(cls, raw_bytes: bytes):
        pil = Image.open(BytesIO(raw_bytes))
        
        # --- FIX 1: Handle EXIF Rotation ---
        # This reads the orientation tag and physically rotates the image data
        pil = ImageOps.exif_transpose(pil)
        
        return cls(pil)

    def _to_gray_array(self, pil: Image.Image):
        arr = np.asarray(pil).astype(np.float32)
        if arr.ndim == 2:
            return arr
        r = arr[:,:,0]
        g = arr[:,:,1]
        b = arr[:,:,2]
        # Standard luminance formula
        gray = 0.299*r + 0.587*g + 0.114*b
        return gray

    def resize_to(self, size_tuple):
        """
        Resizes the image to the specific viewport dimensions (w, h).
        This ensures the numpy arrays match for mixing.
        """
        # --- FIX 2: Use LANCZOS for better quality ---
        # Resize the internal PIL image to the target size
        new_pil = self._original_pil.resize(size_tuple, Image.LANCZOS)
        
        # Update internal state with new dimensions
        self._original_pil = new_pil.convert("RGB")
        self._gray = self._to_gray_array(self._original_pil)
        
        # Re-calculate FFT based on the new size
        self._fft = np.fft.fftshift(np.fft.fft2(self._gray))

    # --- Visualization helpers (return PIL images) ---

    def get_display_original(self):
        arr = np.clip(self._gray, 0, 255).astype('uint8')
        return Image.fromarray(arr).convert("L")

    def get_magnitude_array(self):
        return np.log1p(np.abs(self._fft))

    def visualize_magnitude(self):
        mag = self.get_magnitude_array()
        # normalize to 0-255
        m = mag - mag.min()
        m = 255 * (m / (m.max() + 1e-9))
        return Image.fromarray(m.astype('uint8')).convert("L")

    def get_phase_array(self):
        return np.angle(self._fft)

    def visualize_phase(self):
        ph = self.get_phase_array()
        # map -pi..pi to 0..255
        scaled = (ph + np.pi) / (2*np.pi)
        return Image.fromarray((255*scaled).astype('uint8')).convert("L")

    def get_real_array(self):
        return np.real(self._fft)

    def visualize_real(self):
        r = self.get_real_array()
        r = r - r.min()
        r = 255 * (r / (r.max() + 1e-9))
        return Image.fromarray(r.astype('uint8')).convert("L")

    def get_imag_array(self):
        return np.imag(self._fft)

    def visualize_imag(self):
        im = self.get_imag_array()
        im = im - im.min()
        im = 255 * (im / (im.max() + 1e-9))
        return Image.fromarray(im.astype('uint8')).convert("L")

    # def apply_mask(self, mask):
    #     # mask is float array same shape
    #     self.fft = self.fft * mask

    @staticmethod
    def reconstruct_from_fft(fft_array):
        # inverse: unshift then ifft2 -> real
        unshifted = np.fft.ifftshift(fft_array)
        img = np.fft.ifft2(unshifted)
        img = np.real(img)
        img = np.clip(img, 0, 255).astype('uint8')
        return img
    
    def pil_to_base64_png(im: Image.Image) -> str:
        buf = BytesIO()
        im.save(buf, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()