import React, { useRef, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Camera, RefreshCw, Check, X, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';

const CameraCapture = ({ isOpen, onClose, onCapture, title = "Capturar Foto" }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Usar cámara trasera en móviles
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraStarted(true);
        toast.success('Cámara iniciada correctamente');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('No se pudo acceder a la cámara');
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraStarted(false);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageDataUrl);
      toast.success('Foto capturada exitosamente');
    }
  }, []);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  const confirmPhoto = useCallback(() => {
    if (capturedImage && onCapture) {
      onCapture(capturedImage);
      setCapturedImage(null);
      stopCamera();
      onClose();
      toast.success('Foto guardada');
    }
  }, [capturedImage, onCapture, stopCamera, onClose]);

  const handleClose = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    onClose();
  }, [stopCamera, onClose]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen && !cameraStarted) {
      startCamera();
    }
    
    return () => {
      if (stream) {
        stopCamera();
      }
    };
  }, [isOpen, startCamera, stopCamera, stream, cameraStarted]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-600" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Camera Preview or Captured Image */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {!capturedImage ? (
                  <>
                    {/* Live Camera Feed */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }} // Mirror effect
                    />
                    
                    {/* Camera Controls Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                        <div className="flex items-center space-x-4">
                          {cameraStarted ? (
                            <Button
                              size="lg"
                              onClick={capturePhoto}
                              className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 hover:bg-emerald-50"
                            >
                              <div className="w-12 h-12 bg-emerald-500 rounded-full" />
                            </Button>
                          ) : (
                            <Button
                              size="lg"
                              onClick={startCamera}
                              disabled={isCapturing}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              {isCapturing ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                              ) : (
                                <Camera className="h-5 w-5" />
                              )}
                              {isCapturing ? 'Iniciando...' : 'Iniciar Cámara'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Camera Viewfinder */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-64 h-64 border-2 border-white/50 rounded-lg">
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Captured Image Preview */}
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Image Controls Overlay */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                      <div className="flex items-center space-x-4">
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={retakePhoto}
                          className="bg-white/90 hover:bg-white"
                        >
                          <RefreshCw className="h-5 w-5 mr-2" />
                          Repetir
                        </Button>
                        <Button
                          size="lg"
                          onClick={confirmPhoto}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Check className="h-5 w-5 mr-2" />
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alternative Upload Option */}
          <div className="flex items-center justify-center space-x-4">
            <div className="text-sm text-gray-500">o</div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" className="flex items-center space-x-2" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  <span>Subir desde galería</span>
                </span>
              </Button>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;