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

    @staticmethod
    def low_freq_central(shape, radius):
        h, w = shape
        cy, cx = h//2, w//2
        Y, X = np.ogrid[:h, :w]
        dist = np.sqrt((X-cx)**2 + (Y-cy)**2)
        return (dist <= radius).astype(float)

    @staticmethod
    def high_freq_outer(shape, radius):
        return 1.0 - MaskGenerator.low_freq_central(shape, radius)
