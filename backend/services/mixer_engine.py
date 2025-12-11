import numpy as np

class FourierMixer:
    def __init__(self, ffts):
        self.ffts = ffts

    def apply_region(self, fft_list, mask):
        return [fft * mask for fft in fft_list]

    def mix_by_weights(self, weights):
        res = np.zeros_like(self.ffts[0], dtype=complex)
        for w, f in zip(weights, self.ffts):
            res += w * f
        return res

    def mix_mag_phase(self, mag_list, phase_list, w_mag, w_phase, mask=None):
        # mag_list & phase_list are arrays (not complex)
        # combine weighted mags & phases
        mag = np.zeros_like(mag_list[0])
        for w, m in zip(w_mag, mag_list):
            mag += w * m
        phase = np.zeros_like(phase_list[0])
        for w, p in zip(w_phase, phase_list):
            phase += w * p
        # rebuild complex FT
        out = np.exp(1j * phase) * mag
        if mask is not None:
            out = out * mask
        return out

    def mix_real_imag(self, real_parts, imag_parts, w_real, w_imag):
        r = sum(w * rp for w, rp in zip(w_real, real_parts))
        im = sum(w * ip for w, ip in zip(w_imag, imag_parts))
        return r + 1j * im
