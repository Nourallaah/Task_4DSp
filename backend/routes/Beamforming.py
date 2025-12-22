"""
FastAPI Routes for Beamforming Simulator
Handles HTTP requests for beamforming calculations and visualizations
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from services.BeamformingService import BeamformingService

# Create router
router = APIRouter(prefix="/api/beamforming", tags=["beamforming"])

# Global service instance (in production, use dependency injection)
beamforming_service = BeamformingService()


# ==================== Request/Response Models ====================

class ArrayConfigRequest(BaseModel):
    """Request model for array configuration"""
    num_elements: int = Field(default=8, ge=2, le=512, description="Number of array elements")
    element_spacing: float = Field(default=0.5, gt=0, le=2, description="Element spacing in wavelengths")
    frequency: float = Field(default=1e9, gt=0, description="Operating frequency in Hz")
    array_type: str = Field(default="linear", description="Array type: linear or curved")
    curvature: float = Field(default=0.0, ge=0, le=1, description="Curvature parameter for curved arrays")


class BeamSteeringRequest(BaseModel):
    """Request model for beam steering calculations"""
    array_config: ArrayConfigRequest
    azimuth_angle: float = Field(default=0.0, ge=-90, le=90, description="Azimuth steering angle in degrees")
    elevation_angle: float = Field(default=0.0, ge=-90, le=90, description="Elevation steering angle in degrees")


class ArrayGeometryResponse(BaseModel):
    """Response model for array geometry"""
    elements: List[Dict[str, float]]
    num_elements: int
    array_type: str


class AzimuthPatternResponse(BaseModel):
    """Response model for azimuth pattern"""
    angles: List[float]
    magnitudes: List[float]
    steering_angle: float
    pattern_type: str


class Pattern3DResponse(BaseModel):
    """Response model for 3D pattern"""
    theta: List[List[float]]
    phi: List[List[float]]
    magnitude: List[List[float]]
    steering_azimuth: float
    steering_elevation: float
    pattern_type: str


class ScenarioResponse(BaseModel):
    """Response model for scenario"""
    name: str
    description: str
    num_elements: int
    frequency: float
    array_type: str
    status: str


# ==================== API Endpoints ====================

@router.post("/create-array", response_model=Dict)
async def create_array(config: ArrayConfigRequest):
    """
    Create a new phased array configuration
    """
    try:
        result = beamforming_service.create_phased_array(
            num_elements=config.num_elements,
            element_spacing=config.element_spacing,
            frequency=config.frequency,
            array_type=config.array_type,
            curvature=config.curvature
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/array-geometry", response_model=ArrayGeometryResponse)
async def get_array_geometry():
    """
    Get current array element positions for visualization
    """
    try:
        result = beamforming_service.calculate_array_geometry()
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/azimuth-pattern", response_model=AzimuthPatternResponse)
async def calculate_azimuth_pattern(request: BeamSteeringRequest):
    """
    Calculate azimuth beam pattern
    """
    try:
        # Create/update array first
        beamforming_service.create_phased_array(
            num_elements=request.array_config.num_elements,
            element_spacing=request.array_config.element_spacing,
            frequency=request.array_config.frequency,
            array_type=request.array_config.array_type,
            curvature=request.array_config.curvature
        )
        
        # Calculate pattern
        result = beamforming_service.calculate_azimuth_pattern(
            steering_angle=request.azimuth_angle
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/3d-pattern", response_model=Pattern3DResponse)
async def calculate_3d_pattern(request: BeamSteeringRequest):
    """
    Calculate 3D radiation pattern
    """
    try:
        # Create/update array first
        beamforming_service.create_phased_array(
            num_elements=request.array_config.num_elements,
            element_spacing=request.array_config.element_spacing,
            frequency=request.array_config.frequency,
            array_type=request.array_config.array_type,
            curvature=request.array_config.curvature
        )
        
        # Calculate pattern
        result = beamforming_service.calculate_3d_pattern(
            steering_azimuth=request.azimuth_angle,
            steering_elevation=request.elevation_angle
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/calculate-all", response_model=Dict)
async def calculate_all_visualizations(request: BeamSteeringRequest):
    """
    Calculate all visualization data at once (array geometry, azimuth pattern, 3D pattern)
    """
    try:
        # Create/update array
        beamforming_service.create_phased_array(
            num_elements=request.array_config.num_elements,
            element_spacing=request.array_config.element_spacing,
            frequency=request.array_config.frequency,
            array_type=request.array_config.array_type,
            curvature=request.array_config.curvature
        )
        
        # Calculate all visualizations
        result = beamforming_service.calculate_all_visualizations(
            steering_azimuth=request.azimuth_angle,
            steering_elevation=request.elevation_angle
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/templates", response_model=Dict)
async def get_scenario_templates():
    """
    Get list of available scenario templates
    """
    return {
        "templates": [
            {
                "id": "5g",
                "name": "5G Communications",
                "description": "5G mmWave base station with 64-element array at 28 GHz"
            },
            {
                "id": "ultrasound",
                "name": "Ultrasound Imaging",
                "description": "Medical ultrasound with 128-element array at 5 MHz"
            },
            {
                "id": "tumor_ablation",
                "name": "Tumor Ablation",
                "description": "Focused ultrasound surgery with 256-element curved array at 1 MHz"
            }
        ]
    }


@router.post("/load-scenario/{preset_name}", response_model=ScenarioResponse)
async def load_scenario_preset(preset_name: str):
    """
    Load a predefined scenario preset (5g, ultrasound, tumor_ablation)
    """
    try:
        result = beamforming_service.load_scenario_preset(preset_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
