"""
Scenario Model for Beamforming Simulations
Represents array configuration presets for beamforming visualizations
"""

from typing import Optional


class Scenario:
    """
    Represents a beamforming scenario configuration
    Contains array parameters for visualization presets
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
            array_type: Type of array ("linear" or "curved")
        """
        self.name = name
        self.description = description
        self.num_elements = num_elements
        self.element_spacing = element_spacing
        self.frequency = frequency
        self.array_type = array_type
        

    
    def to_dict(self) -> dict:
        """Convert scenario to dictionary representation"""
        return {
            "name": self.name,
            "description": self.description,
            "num_elements": self.num_elements,
            "element_spacing": self.element_spacing,
            "frequency": self.frequency,
            "array_type": self.array_type
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Scenario':
        """Create scenario from dictionary representation"""
        return cls(
            name=data.get("name", "Default Scenario"),
            description=data.get("description", ""),
            num_elements=data.get("num_elements", 8),
            element_spacing=data.get("element_spacing", 0.5),
            frequency=data.get("frequency", 1e9),
            array_type=data.get("array_type", "linear")
        )


# Predefined scenario templates
class ScenarioTemplates:
    """Common scenario templates for quick setup"""
    

    
    @staticmethod
    def scenario_5g() -> Scenario:
        """
        5G mmWave Base Station Scenario
        Typical 5G base station with 64-element array at 28 GHz for beamforming to mobile users
        """
        return Scenario(
            name="5G Communications",
            description="5G mmWave base station with 64-element array at 28 GHz, beamforming to multiple users",
            num_elements=64,
            element_spacing=0.5,  # lambda/2 spacing
            frequency=28e9,  # 28 GHz mmWave
            array_type="linear"
        )
    
    @staticmethod
    def scenario_ultrasound() -> Scenario:
        """
        Medical Ultrasound Imaging Scenario
        128-element linear array at 5 MHz for focused beam imaging
        """
        return Scenario(
            name="Ultrasound Imaging",
            description="Medical ultrasound with 128-element linear array at 5 MHz for diagnostic imaging",
            num_elements=128,
            element_spacing=0.5,  # lambda/2 spacing for good resolution
            frequency=5e6,  # 5 MHz (typical for medical ultrasound)
            array_type="linear"
        )
    
    @staticmethod
    def scenario_tumor_ablation() -> Scenario:
        """
        Focused Ultrasound Surgery (Tumor Ablation) Scenario
        256-element curved array at 1 MHz for precise focused energy delivery
        """
        return Scenario(
            name="Tumor Ablation",
            description="Focused ultrasound surgery with 256-element hemispherical array at 1 MHz for non-invasive tumor ablation",
            num_elements=256,
            element_spacing=0.5,  # lambda/2 spacing
            frequency=1e6,  # 1 MHz (typical for HIFU therapy)
            array_type="curved"  # Hemispherical or curved for better focusing
        )

