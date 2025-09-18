import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
import { toast } from "sonner";
import { 
  Users, 
  MapPin, 
  Beef, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Menu,
  LogOut,
  Home,
  Building,
  Stethoscope
} from "lucide-react";
import 'leaflet/dist/leaflet.css';
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
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

// Login Component
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    correo: '',
    clave: '',
    nombre_completo: '',
    rol: 'ganadero'
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
      toast.success(isLogin ? 'Inicio de sesión exitoso' : 'Registro exitoso');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-emerald-800">
            🐄 Manea
          </CardTitle>
          <CardDescription>
            Sistema de Gestión Ganadera
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  type="text"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="correo">Correo Electrónico</Label>
              <Input
                id="correo"
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData({...formData, correo: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="clave">Contraseña</Label>
              <Input
                id="clave"
                type="password"
                value={formData.clave}
                onChange={(e) => setFormData({...formData, clave: e.target.value})}
                required
              />
            </div>
            {!isLogin && (
              <div>
                <Label htmlFor="rol">Rol</Label>
                <Select value={formData.rol} onValueChange={(value) => setFormData({...formData, rol: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ganadero">Ganadero</SelectItem>
                    <SelectItem value="veterinario">Veterinario</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button 
              variant="link" 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Layout Component
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/fincas', icon: Building, label: 'Fincas' },
    { path: '/bovinos', icon: Beef, label: 'Bovinos' },
    { path: '/registros-medicos', icon: Stethoscope, label: 'Registros Médicos' },
    { path: '/alertas', icon: AlertTriangle, label: 'Alertas' },
    { path: '/usuarios', icon: Users, label: 'Usuarios' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-emerald-800 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0`}>
          <div className="flex items-center justify-center h-16 bg-emerald-900">
            <h1 className="text-xl font-bold">🐄 Manea</h1>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {menuItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-emerald-700 hover:text-white"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </a>
            ))}
          </nav>
          <div className="p-4 border-t border-emerald-700">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.nombre_completo}</p>
                <p className="text-xs text-emerald-300">{user?.rol}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="mt-2 w-full text-emerald-100 hover:text-white hover:bg-emerald-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 md:ml-0">
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <h2 className="text-lg font-semibold text-gray-900">Sistema de Gestión Ganadera</h2>
              </div>
            </div>
          </div>
          <main className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen general de tu operación ganadera</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Beef className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Bovinos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.total_bovinos || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Fincas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.total_fincas || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Alertas Activas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.alertas_activas || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tipos de Ganado
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.bovinos_por_tipo?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Tipo de Ganado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.bovinos_por_tipo?.map((tipo, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="capitalize">{tipo._id}</span>
                  <Badge variant="secondary">{tipo.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <a href="/bovinos">
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Nuevo Bovino
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/registros-medicos">
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Agregar Registro Médico
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/alertas">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Ver Alertas Pendientes
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Bovinos Component  
const Bovinos = () => {
  const [bovinos, setBovinos] = useState([]);
  const [fincas, setFincas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBovino, setEditingBovino] = useState(null);
  const [formData, setFormData] = useState({
    finca_id: '',
    caravana: '',
    nombre: '',
    sexo: 'H',
    raza: '',
    fecha_nacimiento: '',
    peso_kg: '',
    tipo_ganado: 'leche',
    estado_ganado: 'activo',
    precio: '',
    contacto_nombre: '',
    contacto_telefono: ''
  });

  useEffect(() => {
    fetchBovinos();
    fetchFincas();
  }, []);

  const fetchBovinos = async () => {
    try {
      const response = await axios.get(`${API}/bovinos`);
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
    try {
      const dataToSend = { ...formData };
      if (dataToSend.peso_kg) dataToSend.peso_kg = parseFloat(dataToSend.peso_kg);
      if (dataToSend.precio) dataToSend.precio = parseFloat(dataToSend.precio);

      if (editingBovino) {
        await axios.put(`${API}/bovinos/${editingBovino.id}`, dataToSend);
        toast.success('Bovino actualizado exitosamente');
      } else {
        await axios.post(`${API}/bovinos`, dataToSend);
        toast.success('Bovino registrado exitosamente');
      }
      
      setDialogOpen(false);
      setEditingBovino(null);
      resetForm();
      fetchBovinos();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al guardar bovino');
    }
  };

  const handleEdit = (bovino) => {
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
      precio: bovino.precio || '',
      contacto_nombre: bovino.contacto_nombre || '',
      contacto_telefono: bovino.contacto_telefono || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (bovinoId) => {
    if (window.confirm('¿Estás seguro de eliminar este bovino?')) {
      try {
        await axios.delete(`${API}/bovinos/${bovinoId}`);
        toast.success('Bovino eliminado exitosamente');
        fetchBovinos();
      } catch (error) {
        toast.error('Error al eliminar bovino');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      finca_id: '',
      caravana: '',
      nombre: '',
      sexo: 'H',
      raza: '',
      fecha_nacimiento: '',
      peso_kg: '',
      tipo_ganado: 'leche',
      estado_ganado: 'activo',
      precio: '',
      contacto_nombre: '',
      contacto_telefono: ''
    });
  };

  const openNewDialog = () => {
    resetForm();
    setEditingBovino(null);
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Bovinos</h1>
          <p className="text-gray-600">Administra tu ganado</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Bovino
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBovino ? 'Editar Bovino' : 'Nuevo Bovino'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="finca_id">Finca</Label>
                  <Select value={formData.finca_id} onValueChange={(value) => setFormData({...formData, finca_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar finca" />
                    </SelectTrigger>
                    <SelectContent>
                      {fincas.map((finca) => (
                        <SelectItem key={finca.id} value={finca.id}>
                          {finca.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="caravana">Caravana</Label>
                  <Input
                    id="caravana"
                    value={formData.caravana}
                    onChange={(e) => setFormData({...formData, caravana: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="sexo">Sexo</Label>
                  <Select value={formData.sexo} onValueChange={(value) => setFormData({...formData, sexo: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="H">Hembra</SelectItem>
                      <SelectItem value="M">Macho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="raza">Raza</Label>
                  <Input
                    id="raza"
                    value={formData.raza}
                    onChange={(e) => setFormData({...formData, raza: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                  <Input
                    id="fecha_nacimiento"
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="peso_kg">Peso (kg)</Label>
                  <Input
                    id="peso_kg"
                    type="number"
                    step="0.1"
                    value={formData.peso_kg}
                    onChange={(e) => setFormData({...formData, peso_kg: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="tipo_ganado">Tipo de Ganado</Label>
                  <Select value={formData.tipo_ganado} onValueChange={(value) => setFormData({...formData, tipo_ganado: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leche">Leche</SelectItem>
                      <SelectItem value="carne">Carne</SelectItem>
                      <SelectItem value="dual">Doble Propósito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingBovino ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bovinos.map((bovino) => (
          <Card key={bovino.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{bovino.nombre || `Bovino ${bovino.caravana}`}</CardTitle>
                  <CardDescription>Caravana: {bovino.caravana}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(bovino)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(bovino.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Sexo:</span>
                  <Badge variant="secondary">{bovino.sexo === 'H' ? 'Hembra' : 'Macho'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Raza:</span>
                  <span className="text-sm">{bovino.raza || 'No especificada'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tipo:</span>
                  <Badge className="capitalize">{bovino.tipo_ganado}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <Badge variant={bovino.estado_ganado === 'activo' ? 'default' : 'secondary'} className="capitalize">
                    {bovino.estado_ganado}
                  </Badge>
                </div>
                {bovino.peso_kg && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Peso:</span>
                    <span className="text-sm">{bovino.peso_kg} kg</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {bovinos.length === 0 && (
        <div className="text-center py-12">
          <Beef className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay bovinos registrados</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza registrando tu primer bovino.</p>
          <div className="mt-6">
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Bovino
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bovinos" element={<Bovinos />} />
          <Route path="/fincas" element={<div>Fincas - En desarrollo</div>} />
          <Route path="/registros-medicos" element={<div>Registros Médicos - En desarrollo</div>} />
          <Route path="/alertas" element={<div>Alertas - En desarrollo</div>} />
          <Route path="/usuarios" element={<div>Usuarios - En desarrollo</div>} />
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