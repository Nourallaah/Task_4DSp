from PIL import Image
import numpy as np
from io import BytesIO

class ImageProcessor:
    def __init__(self, pil: Image.Image):
        self.original_pil = pil.convert("RGB")
        self.gray = self._to_gray_array(self.original_pil).astype(np.float32)
        # store fft shifted (centered)
        self.fft = np.fft.fftshift(np.fft.fft2(self.gray))

    @classmethod
    def from_bytes(cls, raw_bytes: bytes):
        pil = Image.open(BytesIO(raw_bytes))
        return cls(pil)

    def _to_gray_array(self, pil: Image.Image):
        arr = np.asarray(pil).astype(np.float32)
        if arr.ndim == 2:
            return arr
        r = arr[:,:,0]
        g = arr[:,:,1]
        b = arr[:,:,2]
        gray = 0.299*r + 0.587*g + 0.114*b
        return gray

    def resize_to(self, size_tuple):
        # size_tuple = (w, h)
        new_pil = self.original_pil.resize(size_tuple, Image.BILINEAR)
        self.original_pil = new_pil.convert("RGB")
        self.gray = self._to_gray_array(self.original_pil)
        self.fft = np.fft.fftshift(np.fft.fft2(self.gray))

    # visualization helpers (return PIL images)
    def get_display_original(self):
        arr = np.clip(self.gray, 0, 255).astype('uint8')
        return Image.fromarray(arr).convert("L")

    def get_magnitude_array(self):
        return np.log1p(np.abs(self.fft))

    def visualize_magnitude(self):
        mag = self.get_magnitude_array()
        # normalize to 0-255
        m = mag - mag.min()
        m = 255 * (m / (m.max() + 1e-9))
        return Image.fromarray(m.astype('uint8')).convert("L")

    def get_phase_array(self):
        return np.angle(self.fft)

    def visualize_phase(self):
        ph = self.get_phase_array()
        # map -pi..pi to 0..255
        scaled = (ph + np.pi) / (2*np.pi)
        return Image.fromarray((255*scaled).astype('uint8')).convert("L")

    def get_real_array(self):
        return np.real(self.fft)

    def visualize_real(self):
        r = self.get_real_array()
        r = r - r.min()
        r = 255 * (r / (r.max() + 1e-9))
        return Image.fromarray(r.astype('uint8')).convert("L")

    def get_imag_array(self):
        return np.imag(self.fft)

    def visualize_imag(self):
        im = self.get_imag_array()
        im = im - im.min()
        im = 255 * (im / (im.max() + 1e-9))
        return Image.fromarray(im.astype('uint8')).convert("L")

    def apply_mask(self, mask):
        # mask is float array same shape
        self.fft = self.fft * mask

    @staticmethod
    def reconstruct_from_fft(fft_array):
        # inverse: unshift then ifft2 -> real
        unshifted = np.fft.ifftshift(fft_array)
        img = np.fft.ifft2(unshifted)
        img = np.real(img)
        img = np.clip(img, 0, 255).astype('uint8')
        return img