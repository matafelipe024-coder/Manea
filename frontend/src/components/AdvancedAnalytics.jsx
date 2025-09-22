import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Target, 
  Award, Zap, AlertTriangle, CheckCircle, Clock, DollarSign,
  Calendar, Users, Beef, Milk, Weight, Heart, Shield, Star
} from 'lucide-react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';

const AdvancedAnalytics = ({ data, timeRange = '30d' }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de analytics avanzados
    const generateAnalytics = () => {
      const mockAnalytics = {
        performance: {
          score: 87,
          trend: 5.2,
          status: 'excellent'
        },
        kpis: [
          {
            id: 'productivity',
            name: 'Productividad General',
            value: 94.5,
            target: 90,
            unit: '%',
            trend: 3.2,
            icon: Target,
            color: 'emerald'
          },
          {
            id: 'health',
            name: 'Salud del Rebaño',
            value: 98.1,
            target: 95,
            unit: '%',
            trend: 1.8,
            icon: Heart,
            color: 'red'
          },
          {
            id: 'efficiency',
            name: 'Eficiencia Operativa',
            value: 86.7,
            target: 85,
            unit: '%',
            trend: -0.5,
            icon: Zap,
            color: 'blue'
          },
          {
            id: 'profitability',
            name: 'Rentabilidad',
            value: 78.9,
            target: 80,
            unit: '%',
            trend: 2.1,
            icon: DollarSign,
            color: 'green'
          }
        ],
        predictions: {
          nextMonth: {
            milkProduction: { value: 2840, trend: 'up', confidence: 92 },
            cattleGrowth: { value: 15, trend: 'stable', confidence: 87 },
            healthIssues: { value: 3, trend: 'down', confidence: 95 }
          }
        },
        benchmarks: {
          industry: {
            productivity: 82.3,
            health: 91.4,
            efficiency: 79.8,
            profitability: 72.1
          },
          position: 'top-10%'
        },
        alerts: {
          critical: 1,
          warning: 3,
          info: 8
        },
        insights: [
          {
            type: 'positive',
            title: 'Excelente Producción Láctea',
            description: 'Tu producción está 18% por encima del promedio de la industria',
            impact: 'high',
            action: 'Mantener las prácticas actuales'
          },
          {
            type: 'warning',
            title: 'Control de Peso Atrasado',
            description: '12 bovinos requieren control de peso esta semana',
            impact: 'medium',
            action: 'Programar controles pendientes'
          },
          {
            type: 'opportunity',
            title: 'Optimización de Alimentación',
            description: 'Potencial ahorro del 8% en costos de alimentación',
            impact: 'high',
            action: 'Revisar plan nutricional'
          }
        ]
      };
      
      setAnalytics(mockAnalytics);
      setLoading(false);
    };

    setTimeout(generateAnalytics, 1000);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const performanceColor = analytics.performance.score >= 90 ? 'emerald' : 
                          analytics.performance.score >= 75 ? 'yellow' : 'red';

  const chartData = {
    productivity: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [{
        label: 'Productividad (%)',
        data: [88.2, 91.5, 89.8, 93.1, 94.5, 96.2],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      }]
    },
    distribution: {
      labels: ['Leche', 'Carne', 'Doble Propósito'],
      datasets: [{
        data: [65, 25, 10],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(147, 51, 234, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)',
          'rgb(147, 51, 234)'
        ],
        borderWidth: 2
      }]
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className={`bg-gradient-to-r from-${performanceColor}-500 to-${performanceColor}-600 p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Puntuación General</h2>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-bold">{analytics.performance.score}</span>
                  <span className="text-xl opacity-90">/100</span>
                  <div className="flex items-center space-x-1 ml-4">
                    {analytics.performance.trend > 0 ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    <span className="text-sm">+{analytics.performance.trend}%</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Award className="h-16 w-16 opacity-80" />
                <p className="text-sm opacity-90 mt-2">
                  {analytics.benchmarks.position}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analytics.kpis.map((kpi) => {
          const IconComponent = kpi.icon;
          const isAboveTarget = kpi.value >= kpi.target;
          
          return (
            <Card key={kpi.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-${kpi.color}-100 rounded-lg`}>
                    <IconComponent className={`h-6 w-6 text-${kpi.color}-600`} />
                  </div>
                  <div className="flex items-center space-x-1">
                    {kpi.trend > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${kpi.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">{kpi.name}</h3>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {kpi.value}{kpi.unit}
                    </span>
                    <span className="text-sm text-gray-500">
                      Meta: {kpi.target}{kpi.unit}
                    </span>
                  </div>
                  
                  <Progress 
                    value={(kpi.value / kpi.target) * 100} 
                    className="h-2"
                  />
                  
                  <div className="flex justify-between items-center">
                    <Badge 
                      variant={isAboveTarget ? 'default' : 'secondary'}
                      className={isAboveTarget ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                    >
                      {isAboveTarget ? 'Meta Alcanzada' : 'Por Debajo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="predictions">Predicciones</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
        </TabsList>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Insights Inteligentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.insights.map((insight, index) => {
                  const bgColor = insight.type === 'positive' ? 'bg-green-50 border-green-200' :
                                  insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                  'bg-blue-50 border-blue-200';
                  
                  const iconColor = insight.type === 'positive' ? 'text-green-500' :
                                   insight.type === 'warning' ? 'text-yellow-500' :
                                   'text-blue-500';

                  return (
                    <div key={index} className={`p-4 rounded-lg border ${bgColor}`}>
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {insight.type === 'positive' && <CheckCircle className={`h-5 w-5 ${iconColor}`} />}
                          {insight.type === 'warning' && <AlertTriangle className={`h-5 w-5 ${iconColor}`} />}
                          {insight.type === 'opportunity' && <Star className={`h-5 w-5 ${iconColor}`} />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                          <p className="text-gray-600 text-sm mb-2">{insight.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              Impacto {insight.impact}
                            </Badge>
                            <span className="text-xs text-gray-500">{insight.action}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                  Estado de Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-red-900">Críticas</span>
                    </div>
                    <Badge variant="destructive">{analytics.alerts.critical}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium text-yellow-900">Advertencias</span>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {analytics.alerts.warning}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-blue-900">Informativas</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {analytics.alerts.info}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictions */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(analytics.predictions.nextMonth).map(([key, prediction]) => (
              <Card key={key}>
                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    <div>
                      {key === 'milkProduction' && <Milk className="h-12 w-12 text-blue-500 mx-auto" />}
                      {key === 'cattleGrowth' && <TrendingUp className="h-12 w-12 text-green-500 mx-auto" />}
                      {key === 'healthIssues' && <Shield className="h-12 w-12 text-red-500 mx-auto" />}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {key === 'milkProduction' && 'Producción de Leche'}
                        {key === 'cattleGrowth' && 'Crecimiento del Rebaño'}
                        {key === 'healthIssues' && 'Problemas de Salud'}
                      </h3>
                      
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {prediction.value}
                        {key === 'milkProduction' && ' L'}
                        {key === 'cattleGrowth' && ' bovinos'}
                        {key === 'healthIssues' && ' casos'}
                      </div>
                      
                      <div className="flex items-center justify-center space-x-2">
                        <Badge 
                          variant={prediction.trend === 'up' ? 'default' : 
                                  prediction.trend === 'down' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {prediction.trend === 'up' && '↗ Aumentando'}
                          {prediction.trend === 'down' && '↘ Disminuyendo'} 
                          {prediction.trend === 'stable' && '→ Estable'}
                        </Badge>
                      </div>
                      
                      <div className="mt-2">
                        <div className="text-xs text-gray-500">
                          Confianza: {prediction.confidence}%
                        </div>
                        <Progress value={prediction.confidence} className="h-2 mt-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Benchmarks */}
        <TabsContent value="benchmarks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparación con la Industria</CardTitle>
              <CardDescription>
                Tu posición: <Badge className="ml-2">{analytics.benchmarks.position}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analytics.kpis.map((kpi) => {
                  const industryValue = analytics.benchmarks.industry[kpi.id];
                  const difference = kpi.value - industryValue;
                  const isAbove = difference > 0;
                  
                  return (
                    <div key={kpi.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{kpi.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            Industria: {industryValue}%
                          </span>
                          <Badge variant={isAbove ? 'default' : 'secondary'}>
                            {isAbove ? '+' : ''}{difference.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <Progress value={(kpi.value / 100) * 100} className="h-3" />
                        <div 
                          className="absolute top-0 h-3 w-1 bg-red-400 rounded"
                          style={{ left: `${industryValue}%` }}
                          title="Promedio de la industria"
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Tu valor: {kpi.value}%</span>
                        <span>↑ {difference > 0 ? 'Por encima' : 'Por debajo'} del promedio</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charts */}
        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Productividad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Line 
                    data={chartData.productivity}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        y: { beginAtZero: false, min: 80 }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución del Rebaño</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Doughnut 
                    data={chartData.distribution}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics;