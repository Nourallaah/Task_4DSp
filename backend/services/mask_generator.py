import numpy as np

class MaskGenerator:

    @staticmethod
    def rectangular_mask(shape, center, width, height):
        h, w = shape
        cx, cy = center
        mask = np.zeros(shape, dtype=float)
        x0 = max(0, int(cx - width//2))
        x1 = min(w, int(cx + width//2))
        y0 = max(0, int(cy - height//2))
        y1 = min(h, int(cy + height//2))
        mask[y0:y1, x0:x1] = 1.0
        return mask
