import React, { useState, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Use environment variable or default to the deployed backend URL
const API_URL = process.env.REACT_APP_API_URL || 'https://tumor-detection-rhy4.onrender.com';

function App() {
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [overlayImage, setOverlayImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setPrediction(null);
        setOverlayImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to detect tumor using the backend API
  const detectTumor = async () => {
    if (!image) {
      setError('Please upload an MRI image first');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // Create FormData to send the image to the backend
      const formData = new FormData();
      // Convert base64 image back to a file
      const response = await fetch(image);
      const blob = await response.blob();
      const file = new File([blob], "mri_image.jpg", { type: blob.type });
      formData.append('image', file);

      // Call the backend API
      const apiResponse = await fetch(`${API_URL}/api/detect-tumor`, {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        throw new Error('Server error');
      }

      const result = await apiResponse.json();

      // Set prediction from the API response
      setPrediction({
        hasTumor: result.hasTumor,
        confidence: result.confidence.toFixed(2),
      });

      // If tumor is detected, set the overlay image
      if (result.hasTumor && result.overlayImage) {
        setOverlayImage(result.overlayImage);
      }
    } catch (err) {
      setError('Error processing image. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-12 text-center mb-4">
          <h1>Brain Tumor Detection</h1>
          <p className="lead">Upload an MRI scan to detect brain tumors</p>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Upload MRI Image</h5>
              <div className="mb-3">
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={detectTumor}
                disabled={!image || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  'Detect Tumor'
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {image && (
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Uploaded Image</h5>
                <img src={image} alt="Uploaded MRI" className="img-fluid" />
              </div>
            </div>
          )}
        </div>

        <div className="col-md-6">
          {prediction && (
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Detection Results</h5>
                <div className="alert alert-info">
                  <h4>
                    {prediction.hasTumor ? (
                      <span className="text-danger">Tumor Detected</span>
                    ) : (
                      <span className="text-success">No Tumor Detected</span>
                    )}
                  </h4>
                  <p>Confidence: {prediction.confidence}%</p>
                  {overlayImage && (
                    <div className="mt-3">
                      <h5>Tumor Segmentation</h5>
                      <img src={overlayImage} alt="Tumor Segmentation" className="img-fluid" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
