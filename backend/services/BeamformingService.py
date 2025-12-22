"""
Beamforming Service - Orchestration Layer
Handles beamforming calculations and coordinates between PhasedArray and Scenario models
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from models.PhasedArray import PhasedArray
from models.Scenario import Scenario, ScenarioTemplates


class BeamformingService:
    """
    Service layer for beamforming calculations
    Orchestrates PhasedArray and Scenario objects
    """
    
    def __init__(self):
        """Initialize beamforming service"""
        self.phased_array: Optional[PhasedArray] = None
        self.scenario: Optional[Scenario] = None
    
    def create_phased_array(
        self,
        num_elements: int = 8,
        element_spacing: float = 0.5,
        frequency: float = 1e9,
        array_type: str = "linear",
        curvature: float = 0.0
    ) -> Dict:
        """
        Create a new phased array configuration
        
        Args:
            num_elements: Number of antenna elements
            element_spacing: Spacing in wavelengths
            frequency: Operating frequency in Hz
            array_type: "linear" or "curved"
            curvature: Curvature parameter for curved arrays
            
        Returns:
            Dictionary with array configuration
        """
        self.phased_array = PhasedArray(
            num_elements=num_elements,
            element_spacing=element_spacing,
            frequency=frequency,
            array_type=array_type,
            curvature=curvature
        )
        
        return {
            "num_elements": num_elements,
            "element_spacing": element_spacing,
            "frequency": frequency,
            "array_type": array_type,
            "curvature": curvature,
            "wavelength": self.phased_array.wavelength,
            "status": "Array created successfully"
        }
    
    def calculate_array_geometry(self) -> Dict:
        """
        Get array element positions for visualization
        
        Returns:
            Dictionary with element positions
        """
        if self.phased_array is None:
            raise ValueError("Phased array not initialized. Call create_phased_array() first.")
        
        positions = self.phased_array.element_positions
        
        return {
            "elements": [
                {"x": float(pos[0]), "y": float(pos[1]), "z": float(pos[2])}
                for pos in positions
            ],
            "num_elements": self.phased_array.num_elements,
            "array_type": self.phased_array.array_type
        }
    
    def calculate_azimuth_pattern(
        self,
        steering_angle: float = 0.0,
        theta_range: Optional[np.ndarray] = None
    ) -> Dict:
        """
        Calculate azimuth beam pattern
        
        Args:
            steering_angle: Desired beam steering angle in degrees
            theta_range: Optional angle range (default: -90 to 90 degrees)
            
        Returns:
            Dictionary with angles and magnitudes
        """
        if self.phased_array is None:
            raise ValueError("Phased array not initialized. Call create_phased_array() first.")
        
        # Calculate steering weights
        weights = self.phased_array.calculate_steering_vector(steering_angle, phi=0.0)
        
        # Compute azimuth pattern
        angles, magnitudes = self.phased_array.compute_azimuth_pattern(
            theta_range=theta_range,
            weights=weights
        )
        
        return {
            "angles": angles.tolist(),
            "magnitudes": magnitudes.tolist(),
            "steering_angle": steering_angle,
            "pattern_type": "azimuth"
        }
    
    def calculate_3d_pattern(
        self,
        steering_azimuth: float = 0.0,
        steering_elevation: float = 0.0,
        theta_range: Optional[np.ndarray] = None,
        phi_range: Optional[np.ndarray] = None
    ) -> Dict:
        """
        Calculate 3D radiation pattern
        
        Args:
            steering_azimuth: Azimuth steering angle in degrees
            steering_elevation: Elevation steering angle in degrees
            theta_range: Optional azimuth angle range
            phi_range: Optional elevation angle range
            
        Returns:
            Dictionary with 3D pattern data
        """
        if self.phased_array is None:
            raise ValueError("Phased array not initialized. Call create_phased_array() first.")
        
        # Calculate steering weights
        weights = self.phased_array.calculate_steering_vector(
            steering_azimuth,
            phi=steering_elevation
        )
        
        # Compute 3D pattern
        theta_grid, phi_grid, magnitude_grid = self.phased_array.compute_3d_pattern(
            theta_range=theta_range,
            phi_range=phi_range,
            weights=weights
        )
        
        return {
            "theta": theta_grid.tolist(),
            "phi": phi_grid.tolist(),
            "magnitude": magnitude_grid.tolist(),
            "steering_azimuth": steering_azimuth,
            "steering_elevation": steering_elevation,
            "pattern_type": "3d"
        }
    
    def calculate_interference_pattern(
        self,
        steering_azimuth: float = 0.0,
        steering_elevation: float = 0.0,
        resolution: int = 100
    ) -> Dict:
        """
        Calculate 2D spatial interference pattern
        
        Args:
            steering_azimuth: Azimuth steering angle in degrees
            steering_elevation: Elevation steering angle in degrees
            resolution: Grid resolution (default: 100x100)
            
        Returns:
            Dictionary with spatial interference pattern data
        """
        if self.phased_array is None:
            raise ValueError("Phased array not initialized. Call create_phased_array() first.")
        
        # Calculate steering weights
        weights = self.phased_array.calculate_steering_vector(
            steering_azimuth,
            phi=steering_elevation
        )
        
        # Compute spatial interference pattern
        x_grid, y_grid, magnitude_grid = self.phased_array.compute_spatial_interference_pattern(
            weights=weights,
            resolution=resolution
        )
        
        return {
            "x_grid": x_grid.tolist(),
            "y_grid": y_grid.tolist(),
            "magnitude": magnitude_grid.tolist(),
            "steering_azimuth": steering_azimuth,
            "steering_elevation": steering_elevation,
            "pattern_type": "interference",
            "resolution": resolution
        }
    
    def load_scenario_preset(self, preset_name: str) -> Dict:
        """
        Load a predefined scenario preset
        
        Args:
            preset_name: Name of preset ("5g", "ultrasound", "tumor_ablation")
            
        Returns:
            Dictionary with scenario configuration
        """
        preset_map = {
            "5g": ScenarioTemplates.scenario_5g,
            "ultrasound": ScenarioTemplates.scenario_ultrasound,
            "tumor_ablation": ScenarioTemplates.scenario_tumor_ablation
        }
        
        if preset_name.lower() not in preset_map:
            raise ValueError(f"Unknown preset: {preset_name}. Available: {list(preset_map.keys())}")
        
        # Load scenario
        self.scenario = preset_map[preset_name.lower()]()
        
        # Create corresponding phased array
        self.phased_array = PhasedArray(
            num_elements=self.scenario.num_elements,
            element_spacing=self.scenario.element_spacing,
            frequency=self.scenario.frequency,
            array_type=self.scenario.array_type,
            curvature=0.2 if self.scenario.array_type == "curved" else 0.0
        )
        
        return {
            "name": self.scenario.name,
            "description": self.scenario.description,
            "num_elements": self.scenario.num_elements,
            "frequency": self.scenario.frequency,
            "array_type": self.scenario.array_type,
            "status": f"Loaded {preset_name} scenario successfully"
        }
    
    def calculate_all_visualizations(
        self,
        steering_azimuth: float = 0.0,
        steering_elevation: float = 0.0
    ) -> Dict:
        """
        Calculate all visualization data at once
        
        Args:
            steering_azimuth: Azimuth steering angle
            steering_elevation: Elevation steering angle
            
        Returns:
            Dictionary containing all visualization data
        """
        if self.phased_array is None:
            raise ValueError("Phased array not initialized.")
        
        return {
            "array_geometry": self.calculate_array_geometry(),
            "azimuth_pattern": self.calculate_azimuth_pattern(steering_azimuth),
            "pattern_3d": self.calculate_3d_pattern(steering_azimuth, steering_elevation),
            "interference_pattern": self.calculate_interference_pattern(steering_azimuth, steering_elevation)
        }
