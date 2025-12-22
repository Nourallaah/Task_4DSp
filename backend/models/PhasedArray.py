"""
Phased Array Model for Beamforming Simulation
Represents an antenna array configuration and its properties
"""

import numpy as np
from typing import List, Optional, Tuple


class PhasedArray:
    """
    Represents a phased array antenna system for beamforming operations
    """
    
    def __init__(
        self, 
        num_elements: int = 8,
        element_spacing: float = 0.5,  # in wavelengths
        frequency: float = 1e9,  # Hz
        array_type: str = "linear",  # "linear" or "curved"
        curvature: float = 0.0  # curvature parameter for curved arrays (0 = linear)
    ):
        """
        Initialize a phased array
        
        Args:
            num_elements: Number of antenna elements
            element_spacing: Spacing between elements (in wavelengths)
            frequency: Operating frequency in Hz
            array_type: Type of array ("linear" or "curved")
            curvature: Curvature parameter for curved arrays (radians per element)
        """
        self.num_elements = num_elements
        self.element_spacing = element_spacing
        self.frequency = frequency
        self.array_type = array_type
        self.curvature = curvature
        self.wavelength = 3e8 / frequency  # c / f
        self.element_positions = self._calculate_positions()
        
    def _calculate_positions(self) -> np.ndarray:
        """Calculate the physical positions of array elements"""
        if self.array_type == "linear":
            # Linear array along x-axis
            positions = np.zeros((self.num_elements, 3))
            positions[:, 0] = np.arange(self.num_elements) * self.element_spacing * self.wavelength
            return positions
        elif self.array_type == "curved":
            # Curved array (arc shape)
            positions = np.zeros((self.num_elements, 3))
            spacing = self.element_spacing * self.wavelength
            
            if self.curvature == 0:
                # Fallback to linear if curvature is zero
                positions[:, 0] = np.arange(self.num_elements) * spacing
            else:
                # Calculate arc radius from curvature
                # Curvature defines the angle span: larger = more curved
                total_angle = self.curvature * (self.num_elements - 1)
                radius = spacing / (2 * np.sin(self.curvature / 2)) if self.curvature > 0 else spacing * self.num_elements
                
                # Position elements along arc
                angles = np.linspace(-total_angle/2, total_angle/2, self.num_elements)
                positions[:, 0] = radius * np.sin(angles)
                positions[:, 1] = radius * (1 - np.cos(angles))
                
            return positions
        else:
            raise ValueError(f"Unknown array type: {self.array_type}")
    
    def calculate_steering_vector(
        self, 
        theta: float, 
        phi: float = 0.0
    ) -> np.ndarray:
        """
        Calculate the steering vector for a given direction
        
        Args:
            theta: Azimuth angle in degrees
            phi: Elevation angle in degrees
            
        Returns:
            Complex steering vector
        """
        theta_rad = np.deg2rad(theta)
        phi_rad = np.deg2rad(phi)
        
        # Direction vector (original working version)
        # For linear arrays along X-axis, this convention works correctly
        k = 2 * np.pi / self.wavelength
        k_vec = k * np.array([
            np.sin(theta_rad) * np.cos(phi_rad),
            np.sin(theta_rad) * np.sin(phi_rad),
            np.cos(theta_rad)
        ])
        
        # Calculate phase shifts for each element
        phase_shifts = np.dot(self.element_positions, k_vec)
        steering_vector = np.exp(1j * phase_shifts)
        
        return steering_vector
    
    # def apply_weights(
    #     self, 
    #     signal: np.ndarray, 
    #     weights: np.ndarray
    # ) -> np.ndarray:
    #     """
    #     Apply beamforming weights to the received signal
        
    #     Args:
    #         signal: Received signal array (num_elements x num_samples)
    #         weights: Complex weights for each element
            
    #     Returns:
    #         Beamformed output signal
    #     """
    #     if len(weights) != self.num_elements:
    #         raise ValueError(f"Number of weights ({len(weights)}) must match number of elements ({self.num_elements})")
        
    #     # Apply weights and sum across elements
    #     weighted_signal = signal * weights[:, np.newaxis]
    #     output = np.sum(weighted_signal, axis=0)
        
    #     return output
    
    def calculate_array_factor(
        self, 
        theta_range: np.ndarray, 
        weights: Optional[np.ndarray] = None,
        phi: float = 0.0
    ) -> np.ndarray:
        """
        Calculate the array factor pattern
        
        Args:
            theta_range: Array of azimuth angles in degrees
            weights: Optional weights (default: uniform)
            phi: Elevation angle in degrees (default: 90° for azimuth pattern in horizontal plane)
            
        Returns:
            Array factor magnitude
        """
        if weights is None:
            weights = np.ones(self.num_elements)
        
        array_factor = np.zeros(len(theta_range), dtype=complex)
        
        for i, theta in enumerate(theta_range):
            steering_vec = self.calculate_steering_vector(theta, phi)
            array_factor[i] = np.dot(weights, steering_vec)
        
        return np.abs(array_factor)
    
    def compute_azimuth_pattern(
        self,
        theta_range: Optional[np.ndarray] = None,
        weights: Optional[np.ndarray] = None
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Compute azimuth pattern for visualization
        
        Args:
            theta_range: Azimuth angles to compute (default: -90 to 90 degrees)
            weights: Beamforming weights (default: uniform)
            
        Returns:
            Tuple of (angles, magnitudes in dB)
        """
        if theta_range is None:
            theta_range = np.linspace(-90, 90, 361)  # Forward hemisphere only
        
        if weights is None:
            weights = np.ones(self.num_elements)
        
        # Calculate array factor
        af = self.calculate_array_factor(theta_range, weights)
        
        # Convert to dB
        af_db = 20 * np.log10(af / np.max(af) + 1e-10)
        
        return theta_range, af_db
    
    def compute_3d_pattern(
        self,
        theta_range: Optional[np.ndarray] = None,
        phi_range: Optional[np.ndarray] = None,
        weights: Optional[np.ndarray] = None
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Compute 3D radiation pattern
        
        Args:
            theta_range: Azimuth angles (default: 0 to 360 degrees)
            phi_range: Elevation angles (default: 0 to 180 degrees)
            weights: Beamforming weights (default: uniform)
            
        Returns:
            Tuple of (theta_grid, phi_grid, magnitude_grid)
        """
        if theta_range is None:
            theta_range = np.linspace(0, 360, 72)
        
        if phi_range is None:
            phi_range = np.linspace(0, 180, 36)
        
        if weights is None:
            weights = np.ones(self.num_elements)
        
        # Create meshgrid
        theta_grid, phi_grid = np.meshgrid(theta_range, phi_range)
        magnitude_grid = np.zeros_like(theta_grid)
        
        # Calculate pattern for each direction
        for i in range(len(phi_range)):
            for j in range(len(theta_range)):
                steering_vec = self.calculate_steering_vector(theta_grid[i, j], phi_grid[i, j])
                af = np.abs(np.dot(weights, steering_vec))
                magnitude_grid[i, j] = af
        
        # Normalize
        magnitude_grid = magnitude_grid / np.max(magnitude_grid)
        
        return theta_grid, phi_grid, magnitude_grid
    
    def compute_spatial_interference_pattern(
        self,
        weights: Optional[np.ndarray] = None,
        x_range: Optional[Tuple[float, float]] = None,
        y_range: Optional[Tuple[float, float]] = None,
        resolution: int = 100
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Compute 2D spatial interference pattern showing field strength in space
        
        Args:
            weights: Beamforming weights (default: uniform)
            x_range: X axis range in wavelengths (default: auto-scaled)
            y_range: Y axis range in wavelengths (default: auto-scaled)
            resolution: Grid resolution (default: 100x100)
            
        Returns:
            Tuple of (x_grid, y_grid, magnitude_grid)
        """
        if weights is None:
            weights = np.ones(self.num_elements, dtype=complex)
        
        # Normalize weights
        weights = weights / np.max(np.abs(weights))
        
        # Auto-scale range based on array geometry if not provided
        if x_range is None:
            x_positions = self.element_positions[:, 0] / self.wavelength
            x_span = max(np.max(x_positions) - np.min(x_positions), 1.0)
            x_center = (np.max(x_positions) + np.min(x_positions)) / 2
            x_range = (x_center - x_span * 2, x_center + x_span * 2)
        
        if y_range is None:
            # Default: symmetric range around array elements
            y_range = (-3.0, 8.0)  # Show field propagating forward (positive Y)
        
        # Create spatial grid
        x = np.linspace(x_range[0], x_range[1], resolution)
        y = np.linspace(y_range[0], y_range[1], resolution)
        x_grid, y_grid = np.meshgrid(x, y)
        
        # Convert grid to physical coordinates (in wavelengths)
        x_phys = x_grid * self.wavelength
        y_phys = y_grid * self.wavelength
        
        # Initialize field magnitude
        field_magnitude = np.zeros_like(x_grid)
        
        # Wave number
        k = 2 * np.pi / self.wavelength
        
        # Calculate field at each point by summing contributions from all elements
        total_field = np.zeros_like(x_grid, dtype=complex)
        
        for elem_idx in range(self.num_elements):
            elem_pos = self.element_positions[elem_idx]
            
            # Distance from element to each grid point
            dx = x_phys - elem_pos[0]
            dy = y_phys - elem_pos[1]
            dz = 0 - elem_pos[2]  # Assume observation plane at z=0
            
            distance = np.sqrt(dx**2 + dy**2 + dz**2)
            
            # Avoid division by zero at element positions
            distance = np.maximum(distance, self.wavelength / 100)
            
            # Complex field contribution (plane wave approximation for clearer interference)
            # Use negative phase for proper interference visualization
            # Remove 1/r falloff to show pure interference pattern
            element_field = weights[elem_idx] * np.exp(-1j * k * distance)
            
            # Accumulate complex field
            total_field += element_field
        
        # Calculate magnitude (field strength)
        field_magnitude = np.abs(total_field)
        
        # Square the magnitude for better contrast (intensity pattern)
        field_magnitude = field_magnitude ** 2
        
        # Normalize to [0, 1]
        max_val = np.max(field_magnitude)
        if max_val > 0:
            field_magnitude = field_magnitude / max_val
        
        return x_grid, y_grid, field_magnitude
    
    def set_geometry(
        self,
        array_type: str,
        curvature: float = 0.0
    ) -> None:
        """
        Update array geometry and recalculate positions
        
        Args:
            array_type: "linear" or "curved"
            curvature: Curvature parameter for curved arrays
        """
        self.array_type = array_type
        self.curvature = curvature
        self.element_positions = self._calculate_positions()
    
    def to_dict(self) -> dict:
        """Convert phased array to dictionary representation"""
        return {
            "num_elements": self.num_elements,
            "element_spacing": self.element_spacing,
            "frequency": self.frequency,
            "array_type": self.array_type,
            "wavelength": self.wavelength,
            "element_positions": self.element_positions.tolist()
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'PhasedArray':
        """Create phased array from dictionary representation"""
        return cls(
            num_elements=data["num_elements"],
            element_spacing=data["element_spacing"],
            frequency=data["frequency"],
            array_type=data["array_type"]
        )
