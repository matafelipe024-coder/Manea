import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { QrCode, Camera, Upload, Search, RefreshCw, X, Check } from 'lucide-react';
import { toast } from 'sonner';

const QRScanner = ({ isOpen, onClose, onScan, title = "Escanear Código QR" }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scanMode, setScanMode] = useState('camera'); // 'camera', 'manual', 'upload'
  const [cameraStarted, setCameraStarted] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setIsScanning(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Preferir cámara trasera
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraStarted(true);
        toast.success('Cámara QR iniciada');
        
        // Simular escaneo automático (en producción usarías una librería como jsQR)
        setTimeout(() => {
          simulateQRDetection();
        }, 3000);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('No se pudo acceder a la cámara para escanear QR');
      setScanMode('manual');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraStarted(false);
    }
  }, [stream]);

  // Simulación de detección de QR (en producción integrarías jsQR o similar)
  const simulateQRDetection = useCallback(() => {
    // Simular detección de QR después de unos segundos
    const mockQRData = 'https://maneadb.preview.emergentagent.com/qr/sample-bovino-id';
    
    // En una implementación real, aquí analizarías el frame del video
    toast.success('¡Código QR detectado!');
    if (onScan) {
      onScan(mockQRData);
    }
    handleClose();
  }, [onScan]);

  const handleManualScan = useCallback(() => {
    if (manualInput.trim()) {
      if (onScan) {
        onScan(manualInput.trim());
        toast.success('Código procesado manualmente');
      }
      handleClose();
    } else {
      toast.error('Ingresa un código QR válido');
    }
  }, [manualInput, onScan]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      // En producción, aquí procesarías la imagen para extraer el QR
      const reader = new FileReader();
      reader.onload = (e) => {
        // Simular extracción de QR de imagen
        toast.success('QR extraído de la imagen');
        const mockQRFromImage = 'https://maneadb.preview.emergentagent.com/qr/image-bovino-id';
        if (onScan) {
          onScan(mockQRFromImage);
        }
        handleClose();
      };
      reader.readAsDataURL(file);
    }
  }, [onScan]);

  const handleClose = useCallback(() => {
    stopCamera();
    setManualInput('');
    setScanMode('camera');
    onClose();
  }, [stopCamera, onClose]);

  useEffect(() => {
    if (isOpen && scanMode === 'camera' && !cameraStarted) {
      startCamera();
    }
    
    return () => {
      if (stream) {
        stopCamera();
      }
    };
  }, [isOpen, scanMode, startCamera, stopCamera, stream, cameraStarted]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-purple-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Scan Mode Selector */}
        <div className="flex justify-center space-x-2 mb-4">
          <Button
            size="sm"
            variant={scanMode === 'camera' ? 'default' : 'outline'}
            onClick={() => setScanMode('camera')}
            className="flex items-center space-x-2"
          >
            <Camera className="h-4 w-4" />
            <span>Cámara</span>
          </Button>
          <Button
            size="sm"
            variant={scanMode === 'manual' ? 'default' : 'outline'}
            onClick={() => setScanMode('manual')}
            className="flex items-center space-x-2"
          >
            <Search className="h-4 w-4" />
            <span>Manual</span>
          </Button>
          <Button
            size="sm"
            variant={scanMode === 'upload' ? 'default' : 'outline'}
            onClick={() => setScanMode('upload')}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Imagen</span>
          </Button>
        </div>

        <div className="space-y-4">
          {/* Camera Scanner */}
          {scanMode === 'camera' && (
            <Card>
              <CardContent className="p-0">
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  {cameraStarted ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      
                      {/* QR Scanner Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative">
                          {/* Scanner Frame */}
                          <div className="w-64 h-64 border-4 border-purple-400 rounded-2xl relative">
                            {/* Corner indicators */}
                            <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-purple-600 rounded-tl-2xl" />
                            <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-purple-600 rounded-tr-2xl" />
                            <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-purple-600 rounded-bl-2xl" />
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-purple-600 rounded-br-2xl" />
                            
                            {/* Scanning line animation */}
                            <div className="absolute inset-0 overflow-hidden rounded-2xl">
                              <div className="w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse" 
                                   style={{ 
                                     animation: 'scan 2s linear infinite',
                                     transform: 'translateY(0)'
                                   }} />
                            </div>
                          </div>
                          
                          {/* Instructions */}
                          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                            <p className="text-white text-center text-sm bg-black/50 px-4 py-2 rounded-lg">
                              Coloca el código QR dentro del marco
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center space-x-2 bg-black/50 px-3 py-2 rounded-lg">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-white text-sm">Escaneando...</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Button
                        onClick={startCamera}
                        disabled={isScanning}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isScanning ? (
                          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                          <Camera className="h-5 w-5 mr-2" />
                        )}
                        {isScanning ? 'Iniciando cámara...' : 'Iniciar Escáner QR'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Input */}
          {scanMode === 'manual' && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Entrada Manual</h3>
                  <p className="text-gray-600 text-sm">
                    Ingresa el ID del bovino o la URL completa del código QR
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="manual-qr">Código QR o ID del Bovino</Label>
                  <Input
                    id="manual-qr"
                    placeholder="Ej: abc123 o https://domain.com/qr/abc123"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="text-center"
                  />
                  <Button 
                    onClick={handleManualScan} 
                    disabled={!manualInput.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Buscar Bovino
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Image */}
          {scanMode === 'upload' && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Subir Imagen</h3>
                  <p className="text-gray-600 text-sm">
                    Selecciona una imagen que contenga un código QR
                  </p>
                </div>
                
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button className="w-full bg-purple-600 hover:bg-purple-700" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Seleccionar Imagen
                    </span>
                  </Button>
                </label>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(256px); }
        }
      `}</style>
    </Dialog>
  );
};

export default QRScanner;