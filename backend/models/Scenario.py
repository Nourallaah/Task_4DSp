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
        self._name = name
        self._description = description
        self._num_elements = num_elements
        self._element_spacing = element_spacing
        self._frequency = frequency
        self._array_type = array_type
    
    # Property getters and setters
    @property
    def name(self) -> str:
        """Get the scenario name"""
        return self._name
    
    @name.setter
    def name(self, value: str) -> None:
        """Set the scenario name"""
        self._name = value
    
    @property
    def description(self) -> str:
        """Get the scenario description"""
        return self._description
    
    @description.setter
    def description(self, value: str) -> None:
        """Set the scenario description"""
        self._description = value
    
    @property
    def num_elements(self) -> int:
        """Get the number of elements"""
        return self._num_elements
    
    @num_elements.setter
    def num_elements(self, value: int) -> None:
        """Set the number of elements"""
        self._num_elements = value
    
    @property
    def element_spacing(self) -> float:
        """Get the element spacing"""
        return self._element_spacing
    
    @element_spacing.setter
    def element_spacing(self, value: float) -> None:
        """Set the element spacing"""
        self._element_spacing = value
    
    @property
    def frequency(self) -> float:
        """Get the frequency"""
        return self._frequency
    
    @frequency.setter
    def frequency(self, value: float) -> None:
        """Set the frequency"""
        self._frequency = value
    
    @property
    def array_type(self) -> str:
        """Get the array type"""
        return self._array_type
    
    @array_type.setter
    def array_type(self, value: str) -> None:
        """Set the array type"""
        self._array_type = value
        

    
    def to_dict(self) -> dict:
        """Convert scenario to dictionary representation"""
        return {
            "name": self._name,
            "description": self._description,
            "num_elements": self._num_elements,
            "element_spacing": self._element_spacing,
            "frequency": self._frequency,
            "array_type": self._array_type
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

