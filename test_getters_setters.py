"""
Test script to verify getters and setters implementation
"""
import sys
sys.path.insert(0, 'backend')

from models.PhasedArray import PhasedArray
from models.Scenario import Scenario
from services.BeamformingService import BeamformingService
from services.image_processor import ImageProcessor
from services.mixer_engine import FourierMixer
from PIL import Image
import numpy as np

print("=" * 60)
print("Testing Getters and Setters Implementation")
print("=" * 60)

# Test PhasedArray
print("\n1. Testing PhasedArray...")
try:
    array = PhasedArray(num_elements=8, frequency=1e9)
    
    # Test getters
    assert array.num_elements == 8, "Getter failed for num_elements"
    assert array.frequency == 1e9, "Getter failed for frequency"
    assert array.wavelength > 0, "Getter failed for wavelength"
    
    # Test setters
    array.num_elements = 16
    assert array.num_elements == 16, "Setter failed for num_elements"
    
    array.frequency = 2e9
    assert array.frequency == 2e9, "Setter failed for frequency"
    assert abs(array.wavelength - 0.15) < 0.01, "Wavelength not recalculated"
    
    print("   ✓ PhasedArray: All tests passed")
except Exception as e:
    print(f"   ✗ PhasedArray: {e}")

# Test Scenario
print("\n2. Testing Scenario...")
try:
    scenario = Scenario(name="Test", num_elements=10)
    
    # Test getters
    assert scenario.name == "Test", "Getter failed for name"
    assert scenario.num_elements == 10, "Getter failed for num_elements"
    
    # Test setters
    scenario.name = "Updated"
    assert scenario.name == "Updated", "Setter failed for name"
    
    scenario.frequency = 5e9
    assert scenario.frequency == 5e9, "Setter failed for frequency"
    
    print("   ✓ Scenario: All tests passed")
except Exception as e:
    print(f"   ✗ Scenario: {e}")

# Test BeamformingService
print("\n3. Testing BeamformingService...")
try:
    service = BeamformingService()
    
    # Test getters
    assert service.phased_array is None, "Initial getter failed"
    
    # Test setters
    test_array = PhasedArray()
    service.phased_array = test_array
    assert service.phased_array is not None, "Setter failed for phased_array"
    
    # Test type validation
    try:
        service.phased_array = "invalid"
        print("   ✗ BeamformingService: Type validation failed")
    except TypeError:
        print("   ✓ BeamformingService: All tests passed (including type validation)")
except Exception as e:
    print(f"   ✗ BeamformingService: {e}")

# Test ImageProcessor
print("\n4. Testing ImageProcessor...")
try:
    # Create a simple test image
    test_img = Image.new('RGB', (100, 100), color='white')
    processor = ImageProcessor(test_img)
    
    # Test getters
    assert processor.original_pil is not None, "Getter failed for original_pil"
    assert processor.gray is not None, "Getter failed for gray"
    assert processor.fft is not None, "Getter failed for fft"
    
    # Test setter
    new_img = Image.new('RGB', (50, 50), color='black')
    processor.original_pil = new_img
    assert processor.original_pil.size == (50, 50), "Setter failed for original_pil"
    
    print("   ✓ ImageProcessor: All tests passed")
except Exception as e:
    print(f"   ✗ ImageProcessor: {e}")

# Test FourierMixer
print("\n5. Testing FourierMixer...")
try:
    test_ffts = [np.array([[1, 2], [3, 4]])]
    mixer = FourierMixer(test_ffts)
    
    # Test getters
    assert mixer.ffts is not None, "Getter failed for ffts"
    
    # Test setters
    new_ffts = [np.array([[5, 6], [7, 8]])]
    mixer.ffts = new_ffts
    assert np.array_equal(mixer.ffts[0], new_ffts[0]), "Setter failed for ffts"
    
    print("   ✓ FourierMixer: All tests passed")
except Exception as e:
    print(f"   ✗ FourierMixer: {e}")

print("\n" + "=" * 60)
print("All tests completed!")
print("=" * 60)
