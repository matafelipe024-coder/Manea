from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone, date
from passlib.context import CryptContext
from jose import JWTError, jwt
import pymongo
from enum import Enum
import qrcode
from io import BytesIO
import base64
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client["manea_db"]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

app = FastAPI(title="Manea - Sistema Integral de Gestión Ganadera")
api_router = APIRouter(prefix="/api")

# Enums
class TipoGanado(str, Enum):
    LECHE = "leche"
    CARNE = "carne"
    DUAL = "dual"

class EstadoGanado(str, Enum):
    ACTIVO = "activo"
    VENDIDO = "vendido"
    RESERVADO = "reservado"
    MUERTO = "muerto"
    RETIRADO = "retirado"

class EstadoVenta(str, Enum):
    DISPONIBLE = "disponible"
    RESERVADO = "reservado"
    VENDIDO = "vendido"

class Sexo(str, Enum):
    HEMBRA = "H"
    MACHO = "M"

class TipoRegistroMedico(str, Enum):
    VACUNA = "vacuna"
    DESPARASITACION = "desparasitacion"
    TRATAMIENTO = "tratamiento"
    EXAMEN = "examen"

class TipoAlerta(str, Enum):
    VENCIMIENTO_MEDICO = "vencimiento_medico"
    CHEQUEO_GESTACION = "chequeo_gestacion"
    CONTROL_PESO = "control_peso"
    FALTA_LECHE = "falta_leche"
    PRODUCCION_BAJA = "produccion_baja"

class TipoUsuario(str, Enum):
    GANADERO = "ganadero"
    VETERINARIO = "veterinario"
    ADMINISTRADOR = "administrador"

# Models
class Usuario(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre_completo: str
    correo: str
    rol: TipoUsuario = TipoUsuario.GANADERO
    activo: bool = True
    telefono: Optional[str] = None
    especialidad: Optional[str] = None  # Para veterinarios
    creado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UsuarioCreate(BaseModel):
    nombre_completo: str
    correo: str
    clave: str
    rol: TipoUsuario = TipoUsuario.GANADERO
    telefono: Optional[str] = None
    especialidad: Optional[str] = None

class UsuarioLogin(BaseModel):
    correo: str
    clave: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Finca(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    codigo_pais: str = "CR"
    ubicacion: Optional[Dict] = None  # {"lat": float, "lng": float}
    perimetro: Optional[List[Dict]] = None  # [{"lat": float, "lng": float}]
    area_ha: Optional[float] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    creado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FincaCreate(BaseModel):
    nombre: str
    codigo_pais: str = "CR"
    ubicacion: Optional[Dict] = None
    perimetro: Optional[List[Dict]] = None
    area_ha: Optional[float] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None

class Bovino(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    finca_id: str
    caravana: str
    arete_oficial: Optional[str] = None
    nombre: Optional[str] = None
    sexo: Sexo = Sexo.HEMBRA
    raza: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    peso_kg: Optional[float] = None
    tipo_ganado: TipoGanado
    estado_ganado: EstadoGanado = EstadoGanado.ACTIVO
    estado_venta: EstadoVenta = EstadoVenta.DISPONIBLE
    precio: Optional[float] = None
    ultima_posicion: Optional[Dict] = None  # {"lat": float, "lng": float}
    ultima_posicion_capturada_en: Optional[datetime] = None
    foto_url: Optional[str] = None
    qr_clave: Optional[str] = None
    qr_url: Optional[str] = None
    contacto_nombre: Optional[str] = None
    contacto_telefono: Optional[str] = None
    padre_id: Optional[str] = None
    madre_id: Optional[str] = None
    observaciones: Optional[str] = None
    creado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BovinoCreate(BaseModel):
    finca_id: str
    caravana: str
    arete_oficial: Optional[str] = None
    nombre: Optional[str] = None
    sexo: Sexo = Sexo.HEMBRA
    raza: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    peso_kg: Optional[float] = None
    tipo_ganado: TipoGanado
    estado_ganado: EstadoGanado = EstadoGanado.ACTIVO
    estado_venta: EstadoVenta = EstadoVenta.DISPONIBLE
    precio: Optional[float] = None
    foto_url: Optional[str] = None
    contacto_nombre: Optional[str] = None
    contacto_telefono: Optional[str] = None
    padre_id: Optional[str] = None
    madre_id: Optional[str] = None
    observaciones: Optional[str] = None

class RegistroMedico(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bovino_id: str
    tipo_registro: TipoRegistroMedico
    descripcion: Optional[str] = None
    medicamento: Optional[str] = None
    dosis: Optional[str] = None
    veterinario_id: Optional[str] = None
    veterinario_nombre: Optional[str] = None
    fecha_evento: str
    fecha_proxima: Optional[str] = None
    costo: Optional[float] = None
    observaciones: Optional[str] = None
    creado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RegistroMedicoCreate(BaseModel):
    bovino_id: str
    tipo_registro: TipoRegistroMedico
    descripcion: Optional[str] = None
    medicamento: Optional[str] = None
    dosis: Optional[str] = None
    veterinario_id: Optional[str] = None
    veterinario_nombre: Optional[str] = None
    fecha_evento: str
    fecha_proxima: Optional[str] = None
    costo: Optional[float] = None
    observaciones: Optional[str] = None

class ProduccionLeche(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bovino_id: str
    fecha_registro: str
    leche_litros: float
    grasa_pct: Optional[float] = None
    proteina_pct: Optional[float] = None
    calidad: Optional[str] = None
    observaciones: Optional[str] = None
    creado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProduccionLecheCreate(BaseModel):
    bovino_id: str
    fecha_registro: str
    leche_litros: float
    grasa_pct: Optional[float] = None
    proteina_pct: Optional[float] = None
    calidad: Optional[str] = None
    observaciones: Optional[str] = None

class ProduccionEngorde(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bovino_id: str
    fecha_registro: str
    peso_kg: float
    ganancia_kg: Optional[float] = None
    alimentacion: Optional[str] = None
    observaciones: Optional[str] = None
    creado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProduccionEngordeCreate(BaseModel):
    bovino_id: str
    fecha_registro: str
    peso_kg: float
    ganancia_kg: Optional[float] = None
    alimentacion: Optional[str] = None
    observaciones: Optional[str] = None

class Alerta(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bovino_id: str
    tipo_alerta: TipoAlerta
    severidad: int = 2  # 1=baja, 2=media, 3=alta
    titulo: str
    mensaje: Optional[str] = None
    fecha_vencimiento: Optional[str] = None
    activa: bool = True
    creado_por: Optional[str] = None
    creado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resuelto_en: Optional[datetime] = None
    resuelto_por: Optional[str] = None

class AlertaCreate(BaseModel):
    bovino_id: str
    tipo_alerta: TipoAlerta
    severidad: int = 2
    titulo: str
    mensaje: Optional[str] = None
    fecha_vencimiento: Optional[str] = None

class Potrero(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    finca_id: str
    nombre: str
    area_ha: Optional[float] = None
    poligono: List[Dict]  # [{"lat": float, "lng": float}]
    capacidad_bovinos: Optional[int] = None
    tipo_pasto: Optional[str] = None
    observaciones: Optional[str] = None
    creado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PotreroCreate(BaseModel):
    finca_id: str
    nombre: str
    area_ha: Optional[float] = None
    poligono: List[Dict]
    capacidad_bovinos: Optional[int] = None
    tipo_pasto: Optional[str] = None
    observaciones: Optional[str] = None

# Auth functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        correo: str = payload.get("sub")
        if correo is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.usuarios.find_one({"correo": correo})
    if user is None:
        raise credentials_exception
    return Usuario(**user)

def generate_qr_code(data: str):
    """Generate QR code and return base64 encoded image"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return base64.b64encode(buffer.getvalue()).decode()

# QR Code route (public, no auth required)
@app.get("/qr/{bovino_id}")
async def get_bovino_qr_info(bovino_id: str):
    """Public endpoint for QR code scanning"""
    bovino = await db.bovinos.find_one({"id": bovino_id})
    if not bovino:
        raise HTTPException(status_code=404, detail="Bovino no encontrado")
    
    # Get farm info
    finca = await db.fincas.find_one({"id": bovino["finca_id"]})
    
    # Get latest medical records
    registros_medicos = await db.registros_medicos.find(
        {"bovino_id": bovino_id}
    ).sort("fecha_evento", -1).limit(5).to_list(5)
    
    # Get production data
    produccion_leche = []
    produccion_engorde = []
    
    if bovino["tipo_ganado"] in ["leche", "dual"]:
        produccion_leche = await db.produccion_leche.find(
            {"bovino_id": bovino_id}
        ).sort("fecha_registro", -1).limit(10).to_list(10)
    
    if bovino["tipo_ganado"] in ["carne", "dual"]:
        produccion_engorde = await db.produccion_engorde.find(
            {"bovino_id": bovino_id}
        ).sort("fecha_registro", -1).limit(10).to_list(10)
    
    return {
        "bovino": Bovino(**bovino).dict(),
        "finca": Finca(**finca).dict() if finca else None,
        "registros_medicos": [RegistroMedico(**reg) for reg in registros_medicos],
        "produccion_leche": [ProduccionLeche(**prod) for prod in produccion_leche],
        "produccion_engorde": [ProduccionEngorde(**prod) for prod in produccion_engorde],
        "timestamp": datetime.now(timezone.utc)
    }

# Auth routes
@api_router.post("/auth/register", response_model=Usuario)
async def register(user_data: UsuarioCreate):
    # Check if user exists
    existing_user = await db.usuarios.find_one({"correo": user_data.correo})
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    # Create user
    hashed_password = get_password_hash(user_data.clave)
    user = Usuario(
        nombre_completo=user_data.nombre_completo,
        correo=user_data.correo,
        rol=user_data.rol,
        telefono=user_data.telefono,
        especialidad=user_data.especialidad
    )
    user_dict = user.dict()
    user_dict["clave_hash"] = hashed_password
    
    await db.usuarios.insert_one(user_dict)
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UsuarioLogin):
    user = await db.usuarios.find_one({"correo": user_credentials.correo})
    if not user or not verify_password(user_credentials.clave, user["clave_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["correo"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me", response_model=Usuario)
async def read_users_me(current_user: Usuario = Depends(get_current_user)):
    return current_user

# Usuarios routes
@api_router.get("/usuarios", response_model=List[Usuario])
async def get_usuarios(current_user: Usuario = Depends(get_current_user)):
    usuarios = await db.usuarios.find().to_list(1000)
    return [Usuario(**usuario) for usuario in usuarios]

@api_router.get("/veterinarios", response_model=List[Usuario])
async def get_veterinarios(current_user: Usuario = Depends(get_current_user)):
    veterinarios = await db.usuarios.find({"rol": "veterinario"}).to_list(1000)
    return [Usuario(**vet) for vet in veterinarios]

# Fincas routes
@api_router.post("/fincas", response_model=Finca)
async def create_finca(finca_data: FincaCreate, current_user: Usuario = Depends(get_current_user)):
    finca = Finca(**finca_data.dict())
    await db.fincas.insert_one(finca.dict())
    return finca

@api_router.get("/fincas", response_model=List[Finca])
async def get_fincas(current_user: Usuario = Depends(get_current_user)):
    fincas = await db.fincas.find().to_list(1000)
    return [Finca(**finca) for finca in fincas]

@api_router.get("/fincas/{finca_id}", response_model=Finca)
async def get_finca(finca_id: str, current_user: Usuario = Depends(get_current_user)):
    finca = await db.fincas.find_one({"id": finca_id})
    if not finca:
        raise HTTPException(status_code=404, detail="Finca no encontrada")
    return Finca(**finca)

@api_router.put("/fincas/{finca_id}", response_model=Finca)
async def update_finca(finca_id: str, finca_data: FincaCreate, current_user: Usuario = Depends(get_current_user)):
    result = await db.fincas.update_one(
        {"id": finca_id},
        {"$set": finca_data.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Finca no encontrada")
    
    updated_finca = await db.fincas.find_one({"id": finca_id})
    return Finca(**updated_finca)

@api_router.delete("/fincas/{finca_id}")
async def delete_finca(finca_id: str, current_user: Usuario = Depends(get_current_user)):
    result = await db.fincas.delete_one({"id": finca_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Finca no encontrada")
    return {"message": "Finca eliminada"}

# Bovinos routes
@api_router.post("/bovinos", response_model=Bovino)
async def create_bovino(bovino_data: BovinoCreate, current_user: Usuario = Depends(get_current_user)):
    # Check if caravana exists in the farm
    existing = await db.bovinos.find_one({"finca_id": bovino_data.finca_id, "caravana": bovino_data.caravana})
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un bovino con esa caravana en la finca")
    
    bovino = Bovino(**bovino_data.dict())
    
    # Generate QR code data
    qr_data = f"https://maneadb.preview.emergentagent.com/qr/{bovino.id}"
    bovino.qr_clave = generate_qr_code(qr_data)
    bovino.qr_url = qr_data
    
    await db.bovinos.insert_one(bovino.dict())
    
    # Create automatic alerts based on cattle type
    await create_automatic_alerts(bovino.id, bovino.tipo_ganado, current_user.id)
    
    return bovino

async def create_automatic_alerts(bovino_id: str, tipo_ganado: str, user_id: str):
    """Create automatic alerts for new cattle"""
    alerts = []
    
    if tipo_ganado in ["leche", "dual"]:
        alerts.append({
            "bovino_id": bovino_id,
            "tipo_alerta": "control_peso",
            "severidad": 2,
            "titulo": "Control de peso mensual",
            "mensaje": "Realizar control de peso mensual para ganado lechero",
            "fecha_vencimiento": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "creado_por": user_id
        })
    
    if tipo_ganado in ["carne", "dual"]:
        alerts.append({
            "bovino_id": bovino_id,
            "tipo_alerta": "control_peso",
            "severidad": 2,
            "titulo": "Control de engorde",
            "mensaje": "Verificar ganancia de peso y alimentación",
            "fecha_vencimiento": (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"),
            "creado_por": user_id
        })
    
    # Medical alert
    alerts.append({
        "bovino_id": bovino_id,
        "tipo_alerta": "vencimiento_medico",
        "severidad": 3,
        "titulo": "Vacunación inicial",
        "mensaje": "Programa de vacunación inicial requerido",
        "fecha_vencimiento": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
        "creado_por": user_id
    })
    
    for alert_data in alerts:
        alert = Alerta(**alert_data)
        await db.alertas.insert_one(alert.dict())

@api_router.get("/bovinos", response_model=List[Bovino])
async def get_bovinos(
    finca_id: Optional[str] = None, 
    tipo_ganado: Optional[str] = None,
    estado_venta: Optional[str] = None,
    current_user: Usuario = Depends(get_current_user)
):
    query = {}
    if finca_id:
        query["finca_id"] = finca_id
    if tipo_ganado:
        query["tipo_ganado"] = tipo_ganado
    if estado_venta:
        query["estado_venta"] = estado_venta
    
    bovinos = await db.bovinos.find(query).to_list(1000)
    return [Bovino(**bovino) for bovino in bovinos]

@api_router.get("/bovinos/{bovino_id}", response_model=Bovino)
async def get_bovino(bovino_id: str, current_user: Usuario = Depends(get_current_user)):
    bovino = await db.bovinos.find_one({"id": bovino_id})
    if not bovino:
        raise HTTPException(status_code=404, detail="Bovino no encontrado")
    return Bovino(**bovino)

@api_router.put("/bovinos/{bovino_id}", response_model=Bovino)
async def update_bovino(bovino_id: str, bovino_data: BovinoCreate, current_user: Usuario = Depends(get_current_user)):
    # Regenerate QR if needed
    existing_bovino = await db.bovinos.find_one({"id": bovino_id})
    if not existing_bovino:
        raise HTTPException(status_code=404, detail="Bovino no encontrado")
    
    update_data = bovino_data.dict()
    
    # Keep existing QR data if not changing
    if not update_data.get("qr_clave"):
        qr_data = f"https://maneadb.preview.emergentagent.com/qr/{bovino_id}"
        update_data["qr_clave"] = generate_qr_code(qr_data)
        update_data["qr_url"] = qr_data
    
    result = await db.bovinos.update_one(
        {"id": bovino_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bovino no encontrado")
    
    updated_bovino = await db.bovinos.find_one({"id": bovino_id})
    return Bovino(**updated_bovino)

@api_router.delete("/bovinos/{bovino_id}")
async def delete_bovino(bovino_id: str, current_user: Usuario = Depends(get_current_user)):
    result = await db.bovinos.delete_one({"id": bovino_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bovino no encontrado")
    
    # Delete related records
    await db.registros_medicos.delete_many({"bovino_id": bovino_id})
    await db.produccion_leche.delete_many({"bovino_id": bovino_id})
    await db.produccion_engorde.delete_many({"bovino_id": bovino_id})
    await db.alertas.delete_many({"bovino_id": bovino_id})
    
    return {"message": "Bovino eliminado"}

@api_router.put("/bovinos/{bovino_id}/estado-venta")
async def update_estado_venta(
    bovino_id: str, 
    estado: EstadoVenta, 
    current_user: Usuario = Depends(get_current_user)
):
    result = await db.bovinos.update_one(
        {"id": bovino_id},
        {"$set": {"estado_venta": estado}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bovino no encontrado")
    return {"message": f"Estado de venta actualizado a {estado}"}

# Registros médicos routes
@api_router.post("/registros-medicos", response_model=RegistroMedico)
async def create_registro_medico(registro_data: RegistroMedicoCreate, current_user: Usuario = Depends(get_current_user)):
    # If veterinario_id is provided, get veterinarian name
    if registro_data.veterinario_id:
        veterinario = await db.usuarios.find_one({"id": registro_data.veterinario_id})
        if veterinario:
            registro_data.veterinario_nombre = veterinario["nombre_completo"]
    
    registro = RegistroMedico(**registro_data.dict())
    await db.registros_medicos.insert_one(registro.dict())
    
    # Create follow-up alert if fecha_proxima is provided
    if registro.fecha_proxima:
        await create_followup_alert(registro.bovino_id, registro.tipo_registro, registro.fecha_proxima, current_user.id)
    
    return registro

async def create_followup_alert(bovino_id: str, tipo_registro: str, fecha_proxima: str, user_id: str):
    """Create follow-up alert for medical records"""
    bovino = await db.bovinos.find_one({"id": bovino_id})
    if not bovino:
        return
    
    alert_data = {
        "bovino_id": bovino_id,
        "tipo_alerta": "vencimiento_medico",
        "severidad": 2,
        "titulo": f"Próximo {tipo_registro}",
        "mensaje": f"Próximo {tipo_registro} programado para {bovino['nombre'] or bovino['caravana']}",
        "fecha_vencimiento": fecha_proxima,
        "creado_por": user_id
    }
    
    alert = Alerta(**alert_data)
    await db.alertas.insert_one(alert.dict())

@api_router.get("/registros-medicos", response_model=List[RegistroMedico])
async def get_registros_medicos(bovino_id: Optional[str] = None, current_user: Usuario = Depends(get_current_user)):
    query = {}
    if bovino_id:
        query["bovino_id"] = bovino_id
    
    registros = await db.registros_medicos.find(query).sort("fecha_evento", -1).to_list(1000)
    return [RegistroMedico(**registro) for registro in registros]

# Producción routes
@api_router.post("/produccion-leche", response_model=ProduccionLeche)
async def create_produccion_leche(produccion_data: ProduccionLecheCreate, current_user: Usuario = Depends(get_current_user)):
    # Check if record exists for this date
    existing = await db.produccion_leche.find_one({
        "bovino_id": produccion_data.bovino_id,
        "fecha_registro": produccion_data.fecha_registro
    })
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un registro de producción para esta fecha")
    
    produccion = ProduccionLeche(**produccion_data.dict())
    await db.produccion_leche.insert_one(produccion.dict())
    
    # Check for low production alert
    await check_low_production_alert(produccion.bovino_id, produccion.leche_litros, current_user.id)
    
    return produccion

async def check_low_production_alert(bovino_id: str, litros_actuales: float, user_id: str):
    """Check if milk production is significantly lower than average"""
    # Get last 10 records
    records = await db.produccion_leche.find(
        {"bovino_id": bovino_id}
    ).sort("fecha_registro", -1).limit(10).to_list(10)
    
    if len(records) < 5:  # Need at least 5 records for comparison
        return
    
    # Calculate average excluding current record
    total = sum(r["leche_litros"] for r in records[1:])
    average = total / (len(records) - 1)
    
    # If current production is 20% below average, create alert
    if litros_actuales < (average * 0.8):
        bovino = await db.bovinos.find_one({"id": bovino_id})
        alert_data = {
            "bovino_id": bovino_id,
            "tipo_alerta": "produccion_baja",
            "severidad": 2,
            "titulo": "Producción láctea baja",
            "mensaje": f"Producción de {bovino['nombre'] or bovino['caravana']} está 20% por debajo del promedio",
            "creado_por": user_id
        }
        
        alert = Alerta(**alert_data)
        await db.alertas.insert_one(alert.dict())

@api_router.get("/produccion-leche", response_model=List[ProduccionLeche])
async def get_produccion_leche(bovino_id: Optional[str] = None, current_user: Usuario = Depends(get_current_user)):
    query = {}
    if bovino_id:
        query["bovino_id"] = bovino_id
    
    produccion = await db.produccion_leche.find(query).sort("fecha_registro", -1).to_list(1000)
    return [ProduccionLeche(**prod) for prod in produccion]

@api_router.post("/produccion-engorde", response_model=ProduccionEngorde)
async def create_produccion_engorde(produccion_data: ProduccionEngordeCreate, current_user: Usuario = Depends(get_current_user)):
    # Calculate weight gain if there's a previous record
    last_record = await db.produccion_engorde.find_one(
        {"bovino_id": produccion_data.bovino_id},
        sort=[("fecha_registro", -1)]
    )
    
    if last_record and not produccion_data.ganancia_kg:
        produccion_data.ganancia_kg = produccion_data.peso_kg - last_record["peso_kg"]
    
    produccion = ProduccionEngorde(**produccion_data.dict())
    await db.produccion_engorde.insert_one(produccion.dict())
    
    # Update bovino weight
    await db.bovinos.update_one(
        {"id": produccion.bovino_id},
        {"$set": {"peso_kg": produccion.peso_kg}}
    )
    
    return produccion

@api_router.get("/produccion-engorde", response_model=List[ProduccionEngorde])
async def get_produccion_engorde(bovino_id: Optional[str] = None, current_user: Usuario = Depends(get_current_user)):
    query = {}
    if bovino_id:
        query["bovino_id"] = bovino_id
    
    produccion = await db.produccion_engorde.find(query).sort("fecha_registro", -1).to_list(1000)
    return [ProduccionEngorde(**prod) for prod in produccion]

# Alertas routes
@api_router.post("/alertas", response_model=Alerta)
async def create_alerta(alerta_data: AlertaCreate, current_user: Usuario = Depends(get_current_user)):
    alerta = Alerta(**alerta_data.dict(), creado_por=current_user.id)
    await db.alertas.insert_one(alerta.dict())
    return alerta

@api_router.get("/alertas", response_model=List[Alerta])
async def get_alertas(activa: Optional[bool] = True, current_user: Usuario = Depends(get_current_user)):
    query = {}
    if activa is not None:
        query["activa"] = activa
    
    alertas = await db.alertas.find(query).sort("severidad", -1).to_list(1000)
    return [Alerta(**alerta) for alerta in alertas]

@api_router.put("/alertas/{alerta_id}/resolver")
async def resolver_alerta(alerta_id: str, current_user: Usuario = Depends(get_current_user)):
    result = await db.alertas.update_one(
        {"id": alerta_id},
        {"$set": {"activa": False, "resuelto_en": datetime.now(timezone.utc), "resuelto_por": current_user.id}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    return {"message": "Alerta resuelta"}

# Potreros routes
@api_router.post("/potreros", response_model=Potrero)
async def create_potrero(potrero_data: PotreroCreate, current_user: Usuario = Depends(get_current_user)):
    potrero = Potrero(**potrero_data.dict())
    await db.potreros.insert_one(potrero.dict())
    return potrero

@api_router.get("/potreros", response_model=List[Potrero])
async def get_potreros(finca_id: Optional[str] = None, current_user: Usuario = Depends(get_current_user)):
    query = {}
    if finca_id:
        query["finca_id"] = finca_id
    
    potreros = await db.potreros.find(query).to_list(1000)
    return [Potrero(**potrero) for potrero in potreros]

# Dashboard and reports
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: Usuario = Depends(get_current_user)):
    total_bovinos = await db.bovinos.count_documents({"estado_ganado": "activo"})
    total_fincas = await db.fincas.count_documents({})
    alertas_activas = await db.alertas.count_documents({"activa": True})
    
    # Bovinos por tipo
    pipeline = [
        {"$match": {"estado_ganado": "activo"}},
        {"$group": {"_id": "$tipo_ganado", "count": {"$sum": 1}}}
    ]
    bovinos_por_tipo = await db.bovinos.aggregate(pipeline).to_list(10)
    
    # Bovinos por estado de venta
    pipeline_venta = [
        {"$match": {"estado_ganado": "activo"}},
        {"$group": {"_id": "$estado_venta", "count": {"$sum": 1}}}
    ]
    bovinos_por_venta = await db.bovinos.aggregate(pipeline_venta).to_list(10)
    
    # Production stats (last 30 days)
    fecha_inicio = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    
    produccion_leche_mes = await db.produccion_leche.aggregate([
        {"$match": {"fecha_registro": {"$gte": fecha_inicio}}},
        {"$group": {"_id": None, "total_litros": {"$sum": "$leche_litros"}}}
    ]).to_list(1)
    
    total_litros_mes = produccion_leche_mes[0]["total_litros"] if produccion_leche_mes else 0
    
    return {
        "total_bovinos": total_bovinos,
        "total_fincas": total_fincas,
        "alertas_activas": alertas_activas,
        "bovinos_por_tipo": bovinos_por_tipo,
        "bovinos_por_venta": bovinos_por_venta,
        "total_litros_mes": total_litros_mes
    }

@api_router.get("/reportes/produccion-leche/{bovino_id}")
async def get_reporte_produccion_leche(bovino_id: str, current_user: Usuario = Depends(get_current_user)):
    # Get bovino info
    bovino = await db.bovinos.find_one({"id": bovino_id})
    if not bovino:
        raise HTTPException(status_code=404, detail="Bovino no encontrado")
    
    # Get production data (last 90 days)
    fecha_inicio = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
    produccion = await db.produccion_leche.find({
        "bovino_id": bovino_id,
        "fecha_registro": {"$gte": fecha_inicio}
    }).sort("fecha_registro", 1).to_list(100)
    
    if not produccion:
        return {"message": "No hay datos de producción"}
    
    # Generate chart
    dates = [p["fecha_registro"] for p in produccion]
    litros = [p["leche_litros"] for p in produccion]
    
    plt.figure(figsize=(12, 6))
    plt.plot(dates, litros, marker='o', linewidth=2, markersize=4)
    plt.title(f'Producción Láctea - {bovino["nombre"] or bovino["caravana"]}', fontsize=16)
    plt.xlabel('Fecha', fontsize=12)
    plt.ylabel('Litros', fontsize=12)
    plt.grid(True, alpha=0.3)
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    # Save to buffer
    buffer = BytesIO()
    plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
    buffer.seek(0)
    plt.close()
    
    return StreamingResponse(buffer, media_type="image/png")

# Initialize sample data
@api_router.post("/init-data")
async def init_sample_data():
    # Check if data already exists
    existing_fincas = await db.fincas.count_documents({})
    if existing_fincas > 0:
        return {"message": "Los datos de prueba ya existen"}
    
    # Sample farm
    finca_sample = Finca(
        nombre="Finca La Esperanza",
        codigo_pais="CR",
        ubicacion={"lat": 9.7489, "lng": -83.7534},
        area_ha=150.0,
        direccion="San José, Costa Rica",
        telefono="+506 2222-3333"
    )
    await db.fincas.insert_one(finca_sample.dict())
    
    # Sample cattle with QR codes
    bovinos_sample = []
    for i, data in enumerate([
        {"caravana": "001", "nombre": "Esperanza", "sexo": Sexo.HEMBRA, "raza": "Holstein", 
         "tipo_ganado": TipoGanado.LECHE, "peso_kg": 450.5, "fecha_nacimiento": "2020-03-15", 
         "precio": 800000.0, "contacto_nombre": "María González", "contacto_telefono": "+506 8888-1111"},
        {"caravana": "002", "nombre": "Fuerte", "sexo": Sexo.MACHO, "raza": "Brahman", 
         "tipo_ganado": TipoGanado.CARNE, "peso_kg": 520.0, "fecha_nacimiento": "2019-08-22", 
         "precio": 1200000.0, "contacto_nombre": "José Rodríguez", "contacto_telefono": "+506 8888-2222"},
        {"caravana": "003", "nombre": "Luna", "sexo": Sexo.HEMBRA, "raza": "Jersey", 
         "tipo_ganado": TipoGanado.DUAL, "peso_kg": 380.0, "fecha_nacimiento": "2021-01-10", 
         "precio": 950000.0, "contacto_nombre": "Ana Jiménez", "contacto_telefono": "+506 8888-3333"}
    ]):
        bovino = Bovino(finca_id=finca_sample.id, **data)
        
        # Generate QR code
        qr_data = f"https://maneadb.preview.emergentagent.com/qr/{bovino.id}"
        bovino.qr_clave = generate_qr_code(qr_data)
        bovino.qr_url = qr_data
        
        bovinos_sample.append(bovino)
        await db.bovinos.insert_one(bovino.dict())
    
    # Sample medical records
    registros_sample = [
        RegistroMedico(
            bovino_id=bovinos_sample[0].id,
            tipo_registro=TipoRegistroMedico.VACUNA,
            descripcion="Vacuna antiaftosa",
            medicamento="Aftosa FMD",
            dosis="2ml",
            fecha_evento="2024-08-15",
            fecha_proxima="2025-02-15",
            costo=15000.0
        ),
        RegistroMedico(
            bovino_id=bovinos_sample[1].id,
            tipo_registro=TipoRegistroMedico.DESPARASITACION,
            descripcion="Desparasitación interna",
            medicamento="Ivermectina",
            dosis="1ml/50kg",
            fecha_evento="2024-09-01",
            fecha_proxima="2024-12-01",
            costo=8000.0
        )
    ]
    
    for registro in registros_sample:
        await db.registros_medicos.insert_one(registro.dict())
    
    # Sample production data
    base_date = datetime.now() - timedelta(days=30)
    for i in range(30):
        fecha = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        
        # Milk production for Holstein
        produccion_leche = ProduccionLeche(
            bovino_id=bovinos_sample[0].id,
            fecha_registro=fecha,
            leche_litros=18.5 + (i % 5) - 2,  # Variation between 16.5-21.5
            grasa_pct=3.8,
            proteina_pct=3.2
        )
        await db.produccion_leche.insert_one(produccion_leche.dict())
        
        # Weight records for Brahman (every 5 days)
        if i % 5 == 0:
            produccion_engorde = ProduccionEngorde(
                bovino_id=bovinos_sample[1].id,
                fecha_registro=fecha,
                peso_kg=520.0 + (i * 0.5),  # Progressive weight gain
                ganancia_kg=2.5 if i > 0 else 0,
                alimentacion="Pasto mejorado + concentrado"
            )
            await db.produccion_engorde.insert_one(produccion_engorde.dict())
    
    # Sample alerts
    alertas_sample = [
        Alerta(
            bovino_id=bovinos_sample[0].id,
            tipo_alerta=TipoAlerta.VENCIMIENTO_MEDICO,
            severidad=3,
            titulo="Vacuna antiaftosa próxima",
            mensaje="Vacuna antiaftosa vence en 15 días",
            fecha_vencimiento="2024-10-15"
        ),
        Alerta(
            bovino_id=bovinos_sample[1].id,
            tipo_alerta=TipoAlerta.CONTROL_PESO,
            severidad=2,
            titulo="Control de peso mensual",
            mensaje="Realizar control de peso y verificar ganancia",
            fecha_vencimiento="2024-10-05"
        ),
        Alerta(
            bovino_id=bovinos_sample[2].id,
            tipo_alerta=TipoAlerta.CHEQUEO_GESTACION,
            severidad=2,
            titulo="Chequeo de gestación",
            mensaje="Verificar estado reproductivo",
            fecha_vencimiento="2024-10-20"
        )
    ]
    
    for alerta in alertas_sample:
        await db.alertas.insert_one(alerta.dict())
    
    # Sample potrero
    potrero_sample = Potrero(
        finca_id=finca_sample.id,
        nombre="Potrero Norte",
        area_ha=25.0,
        poligono=[
            {"lat": 9.7489, "lng": -83.7534},
            {"lat": 9.7495, "lng": -83.7530},
            {"lat": 9.7492, "lng": -83.7525},
            {"lat": 9.7486, "lng": -83.7529}
        ],
        capacidad_bovinos=15,
        tipo_pasto="Pasto estrella",
        observaciones="Potrero con sombra natural y acceso al río"
    )
    await db.potreros.insert_one(potrero_sample.dict())
    
    return {"message": "Datos de prueba creados exitosamente con funcionalidades completas"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()