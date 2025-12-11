"""
Scenario Model for Beamforming Simulations
Represents a complete beamforming scenario with sources, array configuration, and environment
"""

import numpy as np
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum


class SignalType(str, Enum):
    """Types of signal sources"""
    DESIRED = "desired"
    INTERFERENCE = "interference"
    NOISE = "noise"


@dataclass
class Source:
    """
    Represents a signal source in the scenario
    """
    id: str
    angle_azimuth: float  # degrees
    angle_elevation: float = 0.0  # degrees
    power: float = 1.0  # signal power
    signal_type: SignalType = SignalType.DESIRED
    frequency: Optional[float] = None  # Hz
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "angle_azimuth": self.angle_azimuth,
            "angle_elevation": self.angle_elevation,
            "power": self.power,
            "signal_type": self.signal_type.value,
            "frequency": self.frequency
        }


class Scenario:
    """
    Represents a complete beamforming scenario
    Contains sources, array configuration, and simulation parameters
    """
    
    def __init__(
        self,
        name: str = "Default Scenario",
        description: str = "",
        num_elements: int = 8,
        element_spacing: float = 0.5,
        frequency: float = 1e9,
        array_type: str = "linear"
    ):
        """
        Initialize a beamforming scenario
        
        Args:
            name: Scenario name
            description: Scenario description
            num_elements: Number of antenna elements
            element_spacing: Spacing between elements (in wavelengths)
            frequency: Operating frequency in Hz
            array_type: Type of array ("linear" or "planar")
        """
        self.name = name
        self.description = description
        self.num_elements = num_elements
        self.element_spacing = element_spacing
        self.frequency = frequency
        self.array_type = array_type
        self.sources: List[Source] = []
        self.noise_power = 0.01
        
    def add_source(
        self,
        source_id: str,
        azimuth: float,
        elevation: float = 0.0,
        power: float = 1.0,
        signal_type: SignalType = SignalType.DESIRED,
        frequency: Optional[float] = None
    ) -> Source:
        """
        Add a signal source to the scenario
        
        Args:
            source_id: Unique identifier for the source
            azimuth: Azimuth angle in degrees
            elevation: Elevation angle in degrees
            power: Signal power
            signal_type: Type of signal (DESIRED, INTERFERENCE, or NOISE)
            frequency: Optional frequency override
            
        Returns:
            Created Source object
        """
        source = Source(
            id=source_id,
            angle_azimuth=azimuth,
            angle_elevation=elevation,
            power=power,
            signal_type=signal_type,
            frequency=frequency or self.frequency
        )
        self.sources.append(source)
        return source
    
    def remove_source(self, source_id: str) -> bool:
        """
        Remove a source from the scenario
        
        Args:
            source_id: ID of source to remove
            
        Returns:
            True if source was removed, False if not found
        """
        for i, source in enumerate(self.sources):
            if source.id == source_id:
                self.sources.pop(i)
                return True
        return False
    
    def get_source(self, source_id: str) -> Optional[Source]:
        """Get a source by ID"""
        for source in self.sources:
            if source.id == source_id:
                return source
        return None
    
    def get_desired_sources(self) -> List[Source]:
        """Get all desired signal sources"""
        return [s for s in self.sources if s.signal_type == SignalType.DESIRED]
    
    def get_interference_sources(self) -> List[Source]:
        """Get all interference sources"""
        return [s for s in self.sources if s.signal_type == SignalType.INTERFERENCE]
    
    def clear_sources(self):
        """Remove all sources from the scenario"""
        self.sources = []
    
    def generate_received_signal(
        self,
        num_samples: int = 1000,
        snr_db: float = 20.0
    ) -> Tuple[np.ndarray, Dict[str, np.ndarray]]:
        """
        Generate simulated received signals at array elements
        
        Args:
            num_samples: Number of time samples
            snr_db: Signal-to-noise ratio in dB
            
        Returns:
            Tuple of (total_signal, signal_components)
            - total_signal: Combined signal at each element (num_elements x num_samples)
            - signal_components: Dictionary of individual signal components
        """
        signal = np.zeros((self.num_elements, num_samples), dtype=complex)
        components = {}
        
        # Generate signal for each source
        for source in self.sources:
            # Generate random signal
            source_signal = np.random.randn(num_samples) + 1j * np.random.randn(num_samples)
            source_signal *= np.sqrt(source.power)
            
            # Calculate steering delays based on source direction
            # This is a simplified version - full implementation would use PhasedArray
            theta_rad = np.deg2rad(source.angle_azimuth)
            delays = np.arange(self.num_elements) * np.sin(theta_rad)
            
            # Apply delays to create spatial signature
            for i in range(self.num_elements):
                phase_shift = np.exp(1j * 2 * np.pi * delays[i])
                signal[i, :] += source_signal * phase_shift
            
            components[source.id] = signal.copy()
        
        # Add noise
        snr_linear = 10 ** (snr_db / 10)
        signal_power = np.mean(np.abs(signal) ** 2)
        noise_power = signal_power / snr_linear
        noise = np.sqrt(noise_power / 2) * (np.random.randn(self.num_elements, num_samples) + 
                                            1j * np.random.randn(self.num_elements, num_samples))
        signal += noise
        components['noise'] = noise
        
        return signal, components
    
    def to_dict(self) -> dict:
        """Convert scenario to dictionary representation"""
        return {
            "name": self.name,
            "description": self.description,
            "num_elements": self.num_elements,
            "element_spacing": self.element_spacing,
            "frequency": self.frequency,
            "array_type": self.array_type,
            "noise_power": self.noise_power,
            "sources": [source.to_dict() for source in self.sources]
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Scenario':
        """Create scenario from dictionary representation"""
        scenario = cls(
            name=data.get("name", "Default Scenario"),
            description=data.get("description", ""),
            num_elements=data.get("num_elements", 8),
            element_spacing=data.get("element_spacing", 0.5),
            frequency=data.get("frequency", 1e9),
            array_type=data.get("array_type", "linear")
        )
        scenario.noise_power = data.get("noise_power", 0.01)
        
        # Restore sources
        for source_data in data.get("sources", []):
            scenario.add_source(
                source_id=source_data["id"],
                azimuth=source_data["angle_azimuth"],
                elevation=source_data.get("angle_elevation", 0.0),
                power=source_data.get("power", 1.0),
                signal_type=SignalType(source_data.get("signal_type", "desired")),
                frequency=source_data.get("frequency")
            )
        
        return scenario


# Predefined scenario templates
class ScenarioTemplates:
    """Common scenario templates for quick setup"""
    
    @staticmethod
    def simple_desired_signal() -> Scenario:
        """Single desired signal from 30 degrees"""
        scenario = Scenario(
            name="Simple Desired Signal",
            description="Single signal source from 30 degrees azimuth"
        )
        scenario.add_source("desired_1", azimuth=30, power=1.0, signal_type=SignalType.DESIRED)
        return scenario
    
    @staticmethod
    def interference_scenario() -> Scenario:
        """Desired signal with two interferers"""
        scenario = Scenario(
            name="Interference Scenario",
            description="Desired signal at 0° with interferers at -45° and 60°"
        )
        scenario.add_source("desired_1", azimuth=0, power=1.0, signal_type=SignalType.DESIRED)
        scenario.add_source("interference_1", azimuth=-45, power=0.8, signal_type=SignalType.INTERFERENCE)
        scenario.add_source("interference_2", azimuth=60, power=0.6, signal_type=SignalType.INTERFERENCE)
        return scenario
    
    @staticmethod
    def multi_user() -> Scenario:
        """Multiple desired signals from different directions"""
        scenario = Scenario(
            name="Multi-User Scenario",
            description="Multiple users at different angles"
        )
        scenario.add_source("user_1", azimuth=-30, power=1.0, signal_type=SignalType.DESIRED)
        scenario.add_source("user_2", azimuth=0, power=1.0, signal_type=SignalType.DESIRED)
        scenario.add_source("user_3", azimuth=30, power=1.0, signal_type=SignalType.DESIRED)
        return scenario
    
    @staticmethod
    def scenario_5g() -> Scenario:
        """
        5G mmWave Base Station Scenario
        Typical 5G base station with 64-element array at 28 GHz for beamforming to mobile users
        """
        scenario = Scenario(
            name="5G Communications",
            description="5G mmWave base station with 64-element array at 28 GHz, beamforming to multiple users",
            num_elements=64,
            element_spacing=0.5,  # lambda/2 spacing
            frequency=28e9,  # 28 GHz mmWave
            array_type="linear"
        )
        # Primary user at 15 degrees
        scenario.add_source("user_1", azimuth=15, power=1.0, signal_type=SignalType.DESIRED)
        # Secondary user at -25 degrees
        scenario.add_source("user_2", azimuth=-25, power=0.8, signal_type=SignalType.DESIRED)
        # Interference from adjacent cell at 60 degrees
        scenario.add_source("interference_1", azimuth=60, power=0.5, signal_type=SignalType.INTERFERENCE)
        return scenario
    
    @staticmethod
    def scenario_ultrasound() -> Scenario:
        """
        Medical Ultrasound Imaging Scenario
        128-element linear array at 5 MHz for focused beam imaging
        """
        scenario = Scenario(
            name="Ultrasound Imaging",
            description="Medical ultrasound with 128-element linear array at 5 MHz for diagnostic imaging",
            num_elements=128,
            element_spacing=0.5,  # lambda/2 spacing for good resolution
            frequency=5e6,  # 5 MHz (typical for medical ultrasound)
            array_type="linear"
        )
        # Focused beam at 0 degrees (straight ahead) for imaging
        scenario.add_source("target_tissue", azimuth=0, power=1.0, signal_type=SignalType.DESIRED)
        # Reflections from different angles (tissue interfaces)
        scenario.add_source("reflection_1", azimuth=10, power=0.3, signal_type=SignalType.INTERFERENCE)
        scenario.add_source("reflection_2", azimuth=-10, power=0.25, signal_type=SignalType.INTERFERENCE)
        return scenario
    
    @staticmethod
    def scenario_tumor_ablation() -> Scenario:
        """
        Focused Ultrasound Surgery (Tumor Ablation) Scenario
        256-element curved array at 1 MHz for precise focused energy delivery
        """
        scenario = Scenario(
            name="Tumor Ablation",
            description="Focused ultrasound surgery with 256-element hemispherical array at 1 MHz for non-invasive tumor ablation",
            num_elements=256,
            element_spacing=0.5,  # lambda/2 spacing
            frequency=1e6,  # 1 MHz (typical for HIFU therapy)
            array_type="curved"  # Hemispherical or curved for better focusing
        )
        # Target tumor location at focal point (0 degrees, straight ahead)
        scenario.add_source("tumor_target", azimuth=0, elevation=0, power=1.0, signal_type=SignalType.DESIRED)
        # Critical structure to avoid (e.g., bone, major vessel) - requires null steering
        scenario.add_source("critical_structure", azimuth=-15, power=0.0, signal_type=SignalType.INTERFERENCE)
        return scenario

