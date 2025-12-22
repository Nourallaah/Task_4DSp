import numpy as np

class FourierMixer:
    def __init__(self, ffts):
        self._ffts = ffts
    
    # Property getters and setters
    @property
    def ffts(self):
        """Get the FFT arrays"""
        return self._ffts
    
    @ffts.setter
    def ffts(self, value):
        """Set the FFT arrays"""
        self._ffts = value

    # def mix_mag_phase(self, mag_list, phase_list, w_mag, w_phase, mask=None):
    #     # mag_list & phase_list are arrays (not complex)
    #     # combine weighted mags & phases
    #     mag = np.zeros_like(mag_list[0])
    #     for w, m in zip(w_mag, mag_list):
    #         mag += w * m
    #     phase = np.zeros_like(phase_list[0])
    #     for w, p in zip(w_phase, phase_list):
    #         phase += w * p
    #     # rebuild complex FT
    #     out = np.exp(1j * phase) * mag
    #     if mask is not None:
    #         out = out * mask
    #     return out

    # def mix_real_imag(self, real_parts, imag_parts, w_real, w_imag):
    #     r = sum(w * rp for w, rp in zip(w_real, real_parts))
    #     im = sum(w * ip for w, ip in zip(w_imag, imag_parts))
    #     return r + 1j * im

    def mix_hybrid(self, processors, components, weights, mask=None):
        # Initialize accumulators
        # processors is list of ImageProcessor objects
        # We need the shape from the first valid processor
        if not processors:
            return np.array([])
        
        # Assumption: processors are already resized to same shape
        shape = processors[0].fft.shape
        dtype = processors[0].fft.dtype
        
        accum_mag = np.zeros(shape, dtype=float)
        accum_phase = np.zeros(shape, dtype=float)
        accum_real = np.zeros(shape, dtype=float)
        accum_imag = np.zeros(shape, dtype=float)
        
        # Track if we have any contributions to Mag/Phase groups
        has_mag = False
        has_phase = False
        
        for p, comp, w in zip(processors, components, weights):
            if p is None: continue
            
            if comp == "Magnitude":
                accum_mag += w * np.abs(p.fft)
                has_mag = True
            elif comp == "Phase":
                accum_phase += w * p.get_phase_array()
                has_phase = True
            elif comp == "Real":
                accum_real += w * p.fft.real
            elif comp == "Imaginary":
                accum_imag += w * p.fft.imag
                
        # Reconstruction
        # Part 1: Mag/Phase
        # Note: If we have Phase contributions but NO Mag contributions, 
        # standard behavior is strictly 0 mag -> result 0.
        # But if we have Mag but no Phase -> Phase 0.
        part1 = np.zeros(shape, dtype=complex)
        if has_mag or has_phase:
             part1 = accum_mag * np.exp(1j * accum_phase)
             
        # Part 2: Real/Imag
        part2 = accum_real + 1j * accum_imag
        
        # Combine
        total = part1 + part2
        
        if mask is not None:
            total = total * mask
            
        return total