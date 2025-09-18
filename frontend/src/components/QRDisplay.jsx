import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { 
  Beef, 
  MapPin, 
  Calendar, 
  Weight, 
  DollarSign, 
  Phone, 
  User,
  Stethoscope,
  TrendingUp,
  Download,
  Share2,
  QrCode
} from "lucide-react";
import { format, parseISO } from 'date-fns';
import { Line } from 'react-chartjs-2';

const QRDisplay = ({ data }) => {
  const [chartData, setChartData] = useState(null);
  const { bovino, finca, registros_medicos, produccion_leche, produccion_engorde } = data;

  useEffect(() => {
    // Prepare chart data based on cattle type
    if (bovino.tipo_ganado === 'leche' && produccion_leche?.length > 0) {
      const sortedData = produccion_leche.sort((a, b) => a.fecha_registro.localeCompare(b.fecha_registro));
      setChartData({
        labels: sortedData.map(p => format(parseISO(p.fecha_registro), 'dd/MM')),
        datasets: [{
          label: 'Litros de Leche',
          data: sortedData.map(p => p.leche_litros),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1
        }]
      });
    } else if ((bovino.tipo_ganado === 'carne' || bovino.tipo_ganado === 'dual') && produccion_engorde?.length > 0) {
      const sortedData = produccion_engorde.sort((a, b) => a.fecha_registro.localeCompare(b.fecha_registro));
      setChartData({
        labels: sortedData.map(p => format(parseISO(p.fecha_registro), 'dd/MM')),
        datasets: [{
          label: 'Peso (kg)',
          data: sortedData.map(p => p.peso_kg),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.1
        }]
      });
    }
  }, [bovino, produccion_leche, produccion_engorde]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${bovino.nombre || bovino.caravana} - Manea`,
          text: `Información del bovino ${bovino.caravana}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Beef className="h-10 w-10 text-emerald-600" />
            <h1 className="text-4xl font-bold text-gray-900">Manea</h1>
          </div>
          <p className="text-gray-600">Sistema Integral de Gestión Ganadera</p>
          <div className="flex justify-center gap-2 mt-4">
            <Button onClick={handleShare} variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
            <Button onClick={exportToPDF} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bovino Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Beef className="h-6 w-6" />
                  Información del Bovino
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {bovino.nombre || `Bovino ${bovino.caravana}`}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Caravana:</span>
                        <span className="font-medium">{bovino.caravana}</span>
                      </div>
                      {bovino.arete_oficial && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Arete Oficial:</span>
                          <span className="font-medium">{bovino.arete_oficial}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sexo:</span>
                        <Badge variant="secondary">
                          {bovino.sexo === 'H' ? 'Hembra' : 'Macho'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Raza:</span>
                        <span className="font-medium">{bovino.raza || 'No especificada'}</span>
                      </div>
                      {bovino.fecha_nacimiento && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fecha Nacimiento:</span>
                          <span className="font-medium">
                            {format(parseISO(bovino.fecha_nacimiento), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tipo:</span>
                        <Badge className="capitalize">
                          {bovino.tipo_ganado === 'leche' && '🥛 Leche'}
                          {bovino.tipo_ganado === 'carne' && '🍖 Carne'}
                          {bovino.tipo_ganado === 'dual' && '🥛+🍖 Dual'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estado:</span>
                        <Badge variant={bovino.estado_ganado === 'activo' ? 'default' : 'secondary'}>
                          {bovino.estado_ganado}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estado Venta:</span>
                        <Badge 
                          variant={
                            bovino.estado_venta === 'disponible' ? 'default' :
                            bovino.estado_venta === 'reservado' ? 'secondary' : 
                            'outline'
                          }
                        >
                          {bovino.estado_venta}
                        </Badge>
                      </div>
                      {bovino.peso_kg && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Peso:</span>
                          <span className="font-medium flex items-center gap-1">
                            <Weight className="h-4 w-4" />
                            {bovino.peso_kg} kg
                          </span>
                        </div>
                      )}
                      {bovino.precio && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Precio:</span>
                          <span className="font-bold text-green-600 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            ₡{bovino.precio.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {bovino.observaciones && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-2">Observaciones</h4>
                    <p className="text-gray-700">{bovino.observaciones}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Finca Information */}
            {finca && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Información de la Finca
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold">{finca.nombre}</h4>
                      {finca.direccion && <p className="text-gray-600">{finca.direccion}</p>}
                    </div>
                    <div className="text-right">
                      {finca.area_ha && (
                        <p className="text-sm text-gray-600">
                          Área: {finca.area_ha} hectáreas
                        </p>
                      )}
                      {finca.telefono && (
                        <p className="text-sm text-gray-600 flex items-center justify-end gap-1">
                          <Phone className="h-4 w-4" />
                          {finca.telefono}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Production Chart */}
            {chartData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {bovino.tipo_ganado === 'leche' ? 'Producción Láctea' : 'Control de Peso'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Line 
                      data={chartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: false
                          }
                        }
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Medical Records */}
            {registros_medicos?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Historial Médico Reciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {registros_medicos.slice(0, 5).map((registro, index) => (
                      <div key={index} className="border-l-4 border-emerald-500 pl-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold capitalize">{registro.tipo_registro}</h4>
                            {registro.descripcion && (
                              <p className="text-gray-700">{registro.descripcion}</p>
                            )}
                            {registro.medicamento && (
                              <p className="text-sm text-gray-600">
                                Medicamento: {registro.medicamento}
                                {registro.dosis && ` - ${registro.dosis}`}
                              </p>
                            )}
                            {registro.veterinario_nombre && (
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {registro.veterinario_nombre}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {format(parseISO(registro.fecha_evento), 'dd/MM/yyyy')}
                            </p>
                            {registro.fecha_proxima && (
                              <p className="text-xs text-blue-600">
                                Próximo: {format(parseISO(registro.fecha_proxima), 'dd/MM/yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            {(bovino.contacto_nombre || bovino.contacto_telefono) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bovino.contacto_nombre && (
                    <p className="font-medium">{bovino.contacto_nombre}</p>
                  )}
                  {bovino.contacto_telefono && (
                    <p className="text-gray-600 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {bovino.contacto_telefono}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Código QR
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {bovino.qr_clave && (
                  <img 
                    src={`data:image/png;base64,${bovino.qr_clave}`}
                    alt="QR Code"
                    className="mx-auto mb-2"
                    style={{ maxWidth: '150px' }}
                  />
                )}
                <p className="text-xs text-gray-600">
                  Escanea para acceder a la información completa
                </p>
              </CardContent>
            </Card>

            {/* Production Summary */}
            {(produccion_leche?.length > 0 || produccion_engorde?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Producción</CardTitle>
                </CardHeader>
                <CardContent>
                  {produccion_leche?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Producción Láctea</h4>
                      <div className="text-sm">
                        <p>Último registro: {produccion_leche[0].leche_litros} L</p>
                        <p>Promedio últimos 7 días: {
                          (produccion_leche.slice(0, 7).reduce((sum, p) => sum + p.leche_litros, 0) / 
                           Math.min(7, produccion_leche.length)).toFixed(1)
                        } L</p>
                      </div>
                    </div>
                  )}
                  
                  {produccion_engorde?.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h4 className="font-semibold text-sm">Control de Peso</h4>
                      <div className="text-sm">
                        <p>Peso actual: {produccion_engorde[0].peso_kg} kg</p>
                        {produccion_engorde[0].ganancia_kg && (
                          <p>Última ganancia: {produccion_engorde[0].ganancia_kg} kg</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Trust Badge */}
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Beef className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-800">Verificado por Manea</span>
                </div>
                <p className="text-xs text-emerald-700">
                  Información verificada y actualizada en tiempo real
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  Última actualización: {format(new Date(), 'dd/MM/yyyy HH:mm')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <Separator className="mb-4" />
          <p>© 2024 Manea - Sistema Integral de Gestión Ganadera</p>
          <p>Trazabilidad completa con códigos QR</p>
        </div>
      </div>
    </div>
  );
};

export default QRDisplay;