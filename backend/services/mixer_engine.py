import numpy as np

class FourierMixer:
    def __init__(self, ffts):
        self.ffts = ffts

    def apply_mask(self, fft_list, mask):
        """Apply mask to list of FFTs"""
        return [fft * mask for fft in fft_list]

    def mix_magnitude_only(self, mag_list, weights, mask=None):
        """Mix magnitudes while preserving phase from first image"""
        mixed_mag = np.zeros_like(mag_list[0])
        for w, mag in zip(weights, mag_list):
            mixed_mag += w * mag
        
        if mask is not None:
            mixed_mag = mixed_mag * mask
            
        return mixed_mag

    def mix_phase_only(self, phase_list, weights, mask=None):
        """Mix phases while preserving magnitude from first image"""
        mixed_phase = np.zeros_like(phase_list[0])
        for w, phase in zip(weights, phase_list):
            mixed_phase += w * phase
        
        if mask is not None:
            mixed_phase = mixed_phase * mask
            
        return mixed_phase