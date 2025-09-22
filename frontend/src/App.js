import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import QRCode from 'qrcode';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { format, parseISO, addDays, isBefore } from 'date-fns';
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Textarea } from "./components/ui/textarea";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Toaster } from "./components/ui/sonner";
import { Calendar } from "./components/ui/calendar";
import { toast } from "sonner";
import { 
  Users, MapPin, Beef, AlertTriangle, Plus, Edit, Trash2, Eye, Menu, LogOut, Home, Building, Stethoscope,
  QrCode, TrendingUp, Calendar as CalendarIcon, DollarSign, Activity, FileText, Download, Search, Filter,
  BarChart3, PieChart, Map, Bell, Settings, UserCheck, Milk, Weight, Syringe, Heart, ClipboardList,
  Target, Zap, CheckCircle, Phone, Mail, MapIcon, Thermometer, Droplets, Scale, Clock, Star,
  TrendingDown, AlertCircle, Info, Check, X, Upload, Camera, Share2, ExternalLink, RefreshCw, 
  Shield, Award, Crown, Sparkles, Layers
} from "lucide-react";
import 'leaflet/dist/leaflet.css';
import "./App.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Professional Images for the application
const IMAGES = {
  heroBanner: "https://images.unsplash.com/photo-1624370095729-79bd8d8b5196",
  cattleManagement: "https://images.unsplash.com/photo-1668693310855-fe719fbebecf",
  modernFarm: "https://images.unsplash.com/photo-1683248892987-7b6181dfd718",
  professionalRanch: "https://images.unsplash.com/photo-1647079926511-a547a24b0e98",
  technology: "https://images.pexels.com/photos/348689/pexels-photo-348689.jpeg",
  dashboard: "https://images.unsplash.com/photo-1683248894461-713f196e485c",
  livestock: "https://images.unsplash.com/photo-1688590950899-3ae54571eb8e",
  agriTech: "https://images.unsplash.com/photo-1683248896145-0064393f4a82"
};

// Auth Context
const AuthContext = React.createContext();
const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (correo, clave) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { correo, clave });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      await fetchUser();
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Error de autenticación');
    }
  };

  const register = async (userData) => {
    try {
      await axios.post(`${API}/auth/register`, userData);
      return await login(userData.correo, userData.clave);
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Error de registro');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Professional Logo Component
const ManeaLogo = ({ size = "lg", className = "" }) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-10 w-10",
    xl: "h-12 w-12"
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center shadow-lg`}>
          <Crown className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : size === 'lg' ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />
        </div>
        <div className="absolute -top-1 -right-1">
          <Sparkles className="h-3 w-3 text-yellow-400" />
        </div>
      </div>
      <div className="flex flex-col">
        <span className={`font-bold bg-gradient-to-r from-emerald-700 to-emerald-900 bg-clip-text text-transparent ${
          size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-2xl' : 'text-3xl'
        }`}>
          MANEA
        </span>
        {size !== 'sm' && (
          <span className="text-xs text-emerald-600 font-medium -mt-1">
            PROFESSIONAL LIVESTOCK
          </span>
        )}
      </div>
    </div>
  );
};

// Enhanced Login Component with Professional Design
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    correo: '', clave: '', nombre_completo: '', rol: 'ganadero', telefono: '', especialidad: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.correo, formData.clave);
      } else {
        await register(formData);
      }
      toast.success(isLogin ? 'Bienvenido a MANEA' : 'Registro exitoso - Bienvenido');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMAGES.heroBanner})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 to-emerald-700/60"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center text-center text-white p-12">
          <ManeaLogo size="xl" className="mb-8" />
          <h1 className="text-4xl font-bold mb-4">
            El Futuro de la
            <br />
            <span className="text-emerald-300">Gestión Ganadera</span>
          </h1>
          <p className="text-xl text-emerald-100 mb-8 max-w-md">
            Sistema integral profesional con tecnología QR, geolocalización y análisis en tiempo real
          </p>
          <div className="flex items-center space-x-6 text-emerald-200">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm">Seguro</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span className="text-sm">Certificado</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span className="text-sm">Eficiente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <ManeaLogo size="lg" className="justify-center mb-4" />
          </div>
          
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {isLogin ? 'Accede a tu cuenta MANEA' : 'Únete a la revolución ganadera'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div>
                      <Label htmlFor="nombre" className="text-gray-700 font-medium">Nombre Completo</Label>
                      <Input 
                        id="nombre" 
                        type="text" 
                        value={formData.nombre_completo} 
                        onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} 
                        required 
                        className="mt-1"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefono" className="text-gray-700 font-medium">Teléfono</Label>
                      <Input 
                        id="telefono" 
                        type="tel" 
                        value={formData.telefono}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
                        className="mt-1"
                        placeholder="+506 8888-8888"
                      />
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="correo" className="text-gray-700 font-medium">Correo Electrónico</Label>
                  <Input 
                    id="correo" 
                    type="email" 
                    value={formData.correo}
                    onChange={(e) => setFormData({...formData, correo: e.target.value})} 
                    required 
                    className="mt-1"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="clave" className="text-gray-700 font-medium">Contraseña</Label>
                  <Input 
                    id="clave" 
                    type="password" 
                    value={formData.clave}
                    onChange={(e) => setFormData({...formData, clave: e.target.value})} 
                    required 
                    className="mt-1"
                    placeholder="••••••••"
                  />
                </div>
                {!isLogin && (
                  <>
                    <div>
                      <Label htmlFor="rol" className="text-gray-700 font-medium">Tipo de Usuario</Label>
                      <Select value={formData.rol} onValueChange={(value) => setFormData({...formData, rol: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ganadero">🐄 Ganadero</SelectItem>
                          <SelectItem value="veterinario">🏥 Veterinario</SelectItem>
                          <SelectItem value="administrador">👑 Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.rol === 'veterinario' && (
                      <div>
                        <Label htmlFor="especialidad" className="text-gray-700 font-medium">Especialidad</Label>
                        <Input 
                          id="especialidad" 
                          type="text" 
                          placeholder="Ej: Medicina Bovina, Reproducción" 
                          value={formData.especialidad} 
                          onChange={(e) => setFormData({...formData, especialidad: e.target.value})} 
                          className="mt-1"
                        />
                      </div>
                    )}
                  </>
                )}
                <Button 
                  type="submit" 
                  className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium py-3 shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
                  )}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <Button 
                  variant="link" 
                  onClick={() => setIsLogin(!isLogin)} 
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Features Preview */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <QrCode className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">Códigos QR</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">Análisis</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">GPS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Layout Component
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', color: 'text-blue-500' },
    { path: '/fincas', icon: Building, label: 'Fincas', color: 'text-green-500' },
    { path: '/bovinos', icon: Beef, label: 'Bovinos', color: 'text-emerald-500' },
    { path: '/produccion', icon: TrendingUp, label: 'Producción', color: 'text-purple-500' },
    { path: '/registros-medicos', icon: Stethoscope, label: 'Registros Médicos', color: 'text-red-500' },
    { path: '/alertas', icon: AlertTriangle, label: 'Alertas', color: 'text-orange-500' },
    { path: '/reportes', icon: FileText, label: 'Reportes', color: 'text-indigo-500' },
    { path: '/usuarios', icon: Users, label: 'Usuarios', color: 'text-gray-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex">
        {/* Enhanced Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 border-r border-gray-200`}>
          <div className="flex items-center justify-center h-16 bg-gradient-to-r from-emerald-600 to-emerald-700 border-b border-emerald-800">
            <ManeaLogo size="md" className="text-white" />
          </div>
          <nav className="mt-8 flex-1 px-4 space-y-2">
            {menuItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 hover:text-emerald-700 transition-all duration-200 border border-transparent hover:border-emerald-200"
              >
                <item.icon className={`mr-3 h-5 w-5 ${item.color} group-hover:text-emerald-600`} />
                {item.label}
              </a>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.nombre_completo?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.nombre_completo}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.rol}</p>
                {user?.especialidad && (
                  <p className="text-xs text-emerald-600 truncate">{user.especialidad}</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-gray-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 md:ml-0">
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">MANEA Professional</h2>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  Sistema Integral
                </Badge>
              </div>
              <div className="flex items-center space-x-4">
                <Bell className="h-5 w-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
                <Settings className="h-5 w-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
              </div>
            </div>
          </div>
          <main className="py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// Enhanced Dashboard with Professional Design
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData(); 
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, alertasRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/alertas?activa=true`)
      ]);
      setStats(statsRes.data);
      setAlertas(alertasRes.data.slice(0, 5));
    } catch (error) {
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="relative mb-8 rounded-2xl overflow-hidden">
        <div 
          className="h-64 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMAGES.dashboard})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 to-emerald-700/70"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-center text-white">
          <div>
            <h1 className="text-4xl font-bold mb-4">
              Bienvenido a <span className="text-emerald-300">MANEA</span>
            </h1>
            <p className="text-xl text-emerald-100 max-w-2xl">
              Panel de control profesional para la gestión integral de tu operación ganadera
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Bovinos</p>
                <p className="text-3xl font-bold mt-2">{stats?.total_bovinos || 0}</p>
                <p className="text-blue-200 text-xs mt-1">+12% este mes</p>
              </div>
              <div className="w-12 h-12 bg-blue-400/30 rounded-lg flex items-center justify-center">
                <Beef className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Fincas Activas</p>
                <p className="text-3xl font-bold mt-2">{stats?.total_fincas || 0}</p>
                <p className="text-emerald-200 text-xs mt-1">100% operativas</p>
              </div>
              <div className="w-12 h-12 bg-emerald-400/30 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Alertas Activas</p>
                <p className="text-3xl font-bold mt-2">{stats?.alertas_activas || 0}</p>
                <p className="text-orange-200 text-xs mt-1">Requieren atención</p>
              </div>
              <div className="w-12 h-12 bg-orange-400/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Producción Mensual</p>
                <p className="text-3xl font-bold mt-2">{stats?.total_litros_mes?.toFixed(0) || '0'}</p>
                <p className="text-purple-200 text-xs mt-1">Litros de leche</p>
              </div>
              <div className="w-12 h-12 bg-purple-400/30 rounded-lg flex items-center justify-center">
                <Milk className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <PieChart className="h-5 w-5 text-emerald-600" />
                Distribución por Tipo de Ganado
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {stats?.bovinos_por_tipo?.map((tipo, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {tipo._id === 'leche' && <Milk className="h-5 w-5 text-blue-500" />}
                      {tipo._id === 'carne' && <Beef className="h-5 w-5 text-red-500" />}
                      {tipo._id === 'dual' && <Target className="h-5 w-5 text-purple-500" />}
                      <span className="font-medium capitalize text-gray-700">{tipo._id}</span>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`
                        ${tipo._id === 'leche' ? 'bg-blue-100 text-blue-800' : ''}
                        ${tipo._id === 'carne' ? 'bg-red-100 text-red-800' : ''}
                        ${tipo._id === 'dual' ? 'bg-purple-100 text-purple-800' : ''}
                        font-bold
                      `}
                    >
                      {tipo.count} bovinos
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Zap className="h-5 w-5 text-emerald-600" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  className="h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg" 
                  asChild
                >
                  <a href="/bovinos" className="flex flex-col items-center space-y-2">
                    <Plus className="h-6 w-6" />
                    <span className="font-medium">Nuevo Bovino</span>
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 border-2 border-blue-200 hover:bg-blue-50 text-blue-700" 
                  asChild
                >
                  <a href="/registros-medicos" className="flex flex-col items-center space-y-2">
                    <Stethoscope className="h-6 w-6" />
                    <span className="font-medium">Registro Médico</span>
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 border-2 border-purple-200 hover:bg-purple-50 text-purple-700" 
                  asChild
                >
                  <a href="/produccion" className="flex flex-col items-center space-y-2">
                    <TrendingUp className="h-6 w-6" />
                    <span className="font-medium">Producción</span>
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 border-2 border-orange-200 hover:bg-orange-50 text-orange-700" 
                  asChild
                >
                  <a href="/alertas" className="flex flex-col items-center space-y-2">
                    <AlertTriangle className="h-6 w-6" />
                    <span className="font-medium">Ver Alertas</span>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Alerts Section */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Bell className="h-5 w-5 text-orange-600" />
                Alertas Recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {alertas.map((alerta, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border-l-4 ${
                      alerta.severidad === 3 ? 'bg-red-50 border-red-500' : 
                      alerta.severidad === 2 ? 'bg-yellow-50 border-yellow-500' : 
                      'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                        alerta.severidad === 3 ? 'text-red-500' : 
                        alerta.severidad === 2 ? 'text-yellow-500' : 
                        'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{alerta.titulo}</p>
                        <p className="text-xs text-gray-600 mt-1">{alerta.mensaje}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {alertas.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-green-600 font-medium">¡Todo en orden!</p>
                    <p className="text-gray-500 text-sm">No hay alertas activas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <Shield className="h-5 w-5" />
                Estado del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700">Base de Datos</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 font-medium">Activa</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700">Códigos QR</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 font-medium">Funcionando</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700">Geolocalización</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 font-medium">Disponible</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Enhanced Bovinos Component with Fixed Registration
const Bovinos = () => {
  const [bovinos, setBovinos] = useState([]);
  const [fincas, setFincas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBovino, setEditingBovino] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ finca_id: '', tipo_ganado: '', estado_venta: '' });
  const [formData, setFormData] = useState({
    finca_id: '', caravana: '', nombre: '', sexo: 'H', raza: '', fecha_nacimiento: '',
    peso_kg: '', tipo_ganado: 'leche', estado_ganado: 'activo', estado_venta: 'disponible',
    precio: '', contacto_nombre: '', contacto_telefono: '', observaciones: ''
  });

  useEffect(() => {
    fetchBovinos();
    fetchFincas();
  }, [filters]);

  const fetchBovinos = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.finca_id) params.append('finca_id', filters.finca_id);
      if (filters.tipo_ganado) params.append('tipo_ganado', filters.tipo_ganado);
      if (filters.estado_venta) params.append('estado_venta', filters.estado_venta);
      
      const response = await axios.get(`${API}/bovinos?${params.toString()}`);
      setBovinos(response.data);
    } catch (error) {
      toast.error('Error al cargar bovinos');
    } finally {
      setLoading(false);
    }
  };

  const fetchFincas = async () => {
    try {
      const response = await axios.get(`${API}/fincas`);
      setFincas(response.data);
    } catch (error) {
      toast.error('Error al cargar fincas');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.finca_id) {
      toast.error('Debe seleccionar una finca');
      return;
    }
    if (!formData.caravana.trim()) {
      toast.error('La caravana es obligatoria');
      return;
    }

    setSubmitting(true);
    try {
      const dataToSend = { ...formData };
      
      // Limpiar y convertir datos
      if (dataToSend.peso_kg && dataToSend.peso_kg !== '') {
        dataToSend.peso_kg = parseFloat(dataToSend.peso_kg);
      } else {
        delete dataToSend.peso_kg;
      }
      
      if (dataToSend.precio && dataToSend.precio !== '') {
        dataToSend.precio = parseFloat(dataToSend.precio);
      } else {
        delete dataToSend.precio;
      }

      // Limpiar campos vacíos
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
          delete dataToSend[key];
        }
      });

      console.log('Enviando datos:', dataToSend);

      if (editingBovino) {
        await axios.put(`${API}/bovinos/${editingBovino.id}`, dataToSend);
        toast.success('Bovino actualizado exitosamente');
      } else {
        const response = await axios.post(`${API}/bovinos`, dataToSend);
        toast.success('Bovino registrado exitosamente con código QR');
        console.log('Bovino creado:', response.data);
      }
      
      setDialogOpen(false);
      setEditingBovino(null);
      resetForm();
      await fetchBovinos();
    } catch (error) {
      console.error('Error completo:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error al guardar bovino';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const generateQRCode = async (bovino) => {
    try {
      const qrData = `${BACKEND_URL}/qr/${bovino.id}`;
      const qrImage = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
      
      const link = document.createElement('a');
      link.href = qrImage;
      link.download = `QR_${bovino.caravana}.png`;
      link.click();
      
      toast.success('Código QR descargado');
    } catch (error) {
      toast.error('Error al generar código QR');
    }
  };

  const resetForm = () => {
    setFormData({
      finca_id: '', caravana: '', nombre: '', sexo: 'H', raza: '', fecha_nacimiento: '',
      peso_kg: '', tipo_ganado: 'leche', estado_ganado: 'activo', estado_venta: 'disponible',
      precio: '', contacto_nombre: '', contacto_telefono: '', observaciones: ''
    });
  };

  const openNewDialog = () => {
    resetForm();
    setEditingBovino(null);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando bovinos...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión Integral de Bovinos</h1>
            <p className="text-gray-600 mt-2">Sistema profesional con códigos QR y trazabilidad completa</p>
          </div>
          <Button 
            onClick={openNewDialog}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Bovino
          </Button>
        </div>

        {/* Professional Image Banner */}
        <div className="relative h-48 rounded-xl overflow-hidden mb-6">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${IMAGES.cattleManagement})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/70 to-emerald-700/50"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-center text-white">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ganado Profesional</h2>
              <p className="text-emerald-100">Cada animal con su identidad digital y trazabilidad completa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            <Select value={filters.finca_id} onValueChange={(value) => setFilters({...filters, finca_id: value})}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas las fincas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las fincas</SelectItem>
                {fincas.map((finca) => (
                  <SelectItem key={finca.id} value={finca.id}>{finca.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.tipo_ganado} onValueChange={(value) => setFilters({...filters, tipo_ganado: value})}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los tipos</SelectItem>
                <SelectItem value="leche">🥛 Leche</SelectItem>
                <SelectItem value="carne">🍖 Carne</SelectItem>
                <SelectItem value="dual">🥛+🍖 Doble Propósito</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => setFilters({finca_id: '', tipo_ganado: '', estado_venta: ''})}
              className="border-gray-300"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bovinos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bovinos.map((bovino) => (
          <Card key={bovino.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {bovino.tipo_ganado === 'leche' && <Milk className="h-5 w-5 text-blue-500" />}
                    {bovino.tipo_ganado === 'carne' && <Beef className="h-5 w-5 text-red-500" />}
                    {bovino.tipo_ganado === 'dual' && <Target className="h-5 w-5 text-purple-500" />}
                    {bovino.nombre || `Bovino ${bovino.caravana}`}
                  </CardTitle>
                  <CardDescription className="font-medium">
                    Caravana: <span className="text-emerald-600">{bovino.caravana}</span>
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" onClick={() => generateQRCode(bovino)} title="Descargar QR">
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setEditingBovino(bovino);
                      setFormData({
                        finca_id: bovino.finca_id,
                        caravana: bovino.caravana,
                        nombre: bovino.nombre || '',
                        sexo: bovino.sexo,
                        raza: bovino.raza || '',
                        fecha_nacimiento: bovino.fecha_nacimiento || '',
                        peso_kg: bovino.peso_kg || '',
                        tipo_ganado: bovino.tipo_ganado,
                        estado_ganado: bovino.estado_ganado,
                        estado_venta: bovino.estado_venta,
                        precio: bovino.precio || '',
                        contacto_nombre: bovino.contacto_nombre || '',
                        contacto_telefono: bovino.contacto_telefono || '',
                        observaciones: bovino.observaciones || ''
                      });
                      setDialogOpen(true);
                    }} 
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <Badge 
                    variant={bovino.estado_venta === 'disponible' ? 'default' : 'secondary'}
                    className={
                      bovino.estado_venta === 'disponible' ? 'bg-green-100 text-green-800' :
                      bovino.estado_venta === 'reservado' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }
                  >
                    {bovino.estado_venta}
                  </Badge>
                </div>
                {bovino.raza && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Raza:</span>
                    <span className="text-sm font-medium">{bovino.raza}</span>
                  </div>
                )}
                {bovino.precio && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Precio:</span>
                    <span className="text-sm font-bold text-green-600">₡{bovino.precio.toLocaleString()}</span>
                  </div>
                )}
                {bovino.peso_kg && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Peso:</span>
                    <span className="text-sm">{bovino.peso_kg} kg</span>
                  </div>
                )}
                {bovino.contacto_nombre && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Contacto:</span>
                    <span className="text-sm">{bovino.contacto_nombre}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {bovinos.length === 0 && (
        <div className="text-center py-16">
          <div 
            className="w-32 h-32 mx-auto mb-6 rounded-full bg-cover bg-center"
            style={{ backgroundImage: `url(${IMAGES.livestock})` }}
          >
            <div className="w-full h-full bg-emerald-600/80 rounded-full flex items-center justify-center">
              <Beef className="h-12 w-12 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay bovinos registrados</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Comienza registrando tu primer bovino con código QR y trazabilidad completa
          </p>
          <Button 
            onClick={openNewDialog}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Registrar Primer Bovino
          </Button>
        </div>
      )}

      {/* Enhanced Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {editingBovino ? (
                <><Edit className="h-6 w-6 text-emerald-600" /> Editar Bovino</>
              ) : (
                <><Plus className="h-6 w-6 text-emerald-600" /> Nuevo Bovino</>
              )}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="finca_id" className="text-gray-700 font-medium">Finca *</Label>
                <Select 
                  value={formData.finca_id} 
                  onValueChange={(value) => setFormData({...formData, finca_id: value})}
                  required
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar finca" />
                  </SelectTrigger>
                  <SelectContent>
                    {fincas.map((finca) => (
                      <SelectItem key={finca.id} value={finca.id}>{finca.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="caravana" className="text-gray-700 font-medium">Caravana *</Label>
                <Input 
                  id="caravana" 
                  value={formData.caravana} 
                  onChange={(e) => setFormData({...formData, caravana: e.target.value})} 
                  required 
                  placeholder="Ej: 001"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="nombre" className="text-gray-700 font-medium">Nombre</Label>
                <Input 
                  id="nombre" 
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Ej: Esperanza"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sexo" className="text-gray-700 font-medium">Sexo</Label>
                <Select value={formData.sexo} onValueChange={(value) => setFormData({...formData, sexo: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="H">🐄 Hembra</SelectItem>
                    <SelectItem value="M">🐂 Macho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="raza" className="text-gray-700 font-medium">Raza</Label>
                <Input 
                  id="raza" 
                  value={formData.raza || ''} 
                  onChange={(e) => setFormData({...formData, raza: e.target.value})} 
                  placeholder="Ej: Holstein, Brahman"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="fecha_nacimiento" className="text-gray-700 font-medium">Fecha de Nacimiento</Label>
                <Input 
                  id="fecha_nacimiento" 
                  type="date" 
                  value={formData.fecha_nacimiento || ''}
                  onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})} 
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="peso_kg" className="text-gray-700 font-medium">Peso (kg)</Label>
                <Input 
                  id="peso_kg" 
                  type="number" 
                  step="0.1" 
                  value={formData.peso_kg || ''}
                  onChange={(e) => setFormData({...formData, peso_kg: e.target.value})} 
                  placeholder="Ej: 450.5"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tipo_ganado" className="text-gray-700 font-medium">Tipo de Ganado *</Label>
                <Select value={formData.tipo_ganado} onValueChange={(value) => setFormData({...formData, tipo_ganado: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leche">🥛 Leche</SelectItem>
                    <SelectItem value="carne">🍖 Carne</SelectItem>
                    <SelectItem value="dual">🥛+🍖 Doble Propósito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estado_venta" className="text-gray-700 font-medium">Estado de Venta</Label>
                <Select value={formData.estado_venta} onValueChange={(value) => setFormData({...formData, estado_venta: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">✅ Disponible</SelectItem>
                    <SelectItem value="reservado">⏳ Reservado</SelectItem>
                    <SelectItem value="vendido">💰 Vendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="precio" className="text-gray-700 font-medium">Precio (₡)</Label>
                <Input 
                  id="precio" 
                  type="number" 
                  step="0.01" 
                  value={formData.precio || ''}
                  onChange={(e) => setFormData({...formData, precio: e.target.value})} 
                  placeholder="Ej: 800000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contacto_nombre" className="text-gray-700 font-medium">Contacto - Nombre</Label>
                <Input 
                  id="contacto_nombre" 
                  value={formData.contacto_nombre || ''}
                  onChange={(e) => setFormData({...formData, contacto_nombre: e.target.value})} 
                  placeholder="Ej: María González"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contacto_telefono" className="text-gray-700 font-medium">Contacto - Teléfono</Label>
                <Input 
                  id="contacto_telefono" 
                  type="tel" 
                  value={formData.contacto_telefono || ''}
                  onChange={(e) => setFormData({...formData, contacto_telefono: e.target.value})} 
                  placeholder="Ej: +506 8888-1111"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="observaciones" className="text-gray-700 font-medium">Observaciones</Label>
              <Textarea 
                id="observaciones" 
                value={formData.observaciones || ''}
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})} 
                rows={3}
                placeholder="Notas adicionales sobre el bovino..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </div>
                ) : (
                  editingBovino ? 'Actualizar Bovino' : 'Registrar Bovino'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Simple placeholders for other components (will be enhanced later)
const Fincas = () => (
  <div className="text-center py-16">
    <Building className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
    <h1 className="text-2xl font-bold mb-4">Gestión de Fincas</h1>
    <p className="text-gray-600">Módulo completo con mapas interactivos - Próximo en desarrollo</p>
  </div>
);

const Produccion = () => (
  <div className="text-center py-16">
    <TrendingUp className="h-16 w-16 text-purple-500 mx-auto mb-4" />
    <h1 className="text-2xl font-bold mb-4">Control de Producción</h1>
    <p className="text-gray-600">Sistema especializado para leche, carne y doble propósito</p>
  </div>
);

const RegistrosMedicos = () => (
  <div className="text-center py-16">
    <Stethoscope className="h-16 w-16 text-red-500 mx-auto mb-4" />
    <h1 className="text-2xl font-bold mb-4">Registros Médicos</h1>
    <p className="text-gray-600">Historial médico completo con alertas inteligentes</p>
  </div>
);

const Alertas = () => (
  <div className="text-center py-16">
    <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
    <h1 className="text-2xl font-bold mb-4">Sistema de Alertas</h1>
    <p className="text-gray-600">Notificaciones automáticas y alertas inteligentes</p>
  </div>
);

const Reportes = () => (
  <div className="text-center py-16">
    <FileText className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
    <h1 className="text-2xl font-bold mb-4">Reportes y Estadísticas</h1>
    <p className="text-gray-600">Análisis avanzados con exportación PDF/Excel</p>
  </div>
);

const Usuarios = () => (
  <div className="text-center py-16">
    <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
    <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>
    <p className="text-gray-600">Portal para veterinarios y administración de usuarios</p>
  </div>
);

// Main App Component
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <ManeaLogo size="xl" className="justify-center mb-8" />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Cargando MANEA Professional...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bovinos" element={<Bovinos />} />
          <Route path="/fincas" element={<Fincas />} />
          <Route path="/produccion" element={<Produccion />} />
          <Route path="/registros-medicos" element={<RegistrosMedicos />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/usuarios" element={<Usuarios />} />
        </Routes>
      </Layout>
      <Toaster />
    </BrowserRouter>
  );
}

const AppWithAuth = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWithAuth;