from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
import pymongo
from enum import Enum

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

app = FastAPI(title="Manea - Sistema de Gestión Ganadera")
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

# Models
class Usuario(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre_completo: str
    correo: str
    rol: str = "ganadero"
    activo: bool = True
    creado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UsuarioCreate(BaseModel):
    nombre_completo: str
    correo: str
    clave: str
    rol: str = "ganadero"

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
    creado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FincaCreate(BaseModel):
    nombre: str
    codigo_pais: str = "CR"
    ubicacion: Optional[Dict] = None
    perimetro: Optional[List[Dict]] = None

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
    ultima_posicion: Optional[Dict] = None  # {"lat": float, "lng": float}
    ultima_posicion_capturada_en: Optional[datetime] = None
    foto_url: Optional[str] = None
    precio: Optional[float] = None
    contacto_nombre: Optional[str] = None
    contacto_telefono: Optional[str] = None
    padre_id: Optional[str] = None
    madre_id: Optional[str] = None
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
    foto_url: Optional[str] = None
    precio: Optional[float] = None
    contacto_nombre: Optional[str] = None
    contacto_telefono: Optional[str] = None
    padre_id: Optional[str] = None
    madre_id: Optional[str] = None

class RegistroMedico(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bovino_id: str
    tipo_registro: TipoRegistroMedico
    descripcion: Optional[str] = None
    medicamento: Optional[str] = None
    dosis: Optional[str] = None
    veterinario_id: Optional[str] = None
    fecha_evento: str
    fecha_proxima: Optional[str] = None
    creado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RegistroMedicoCreate(BaseModel):
    bovino_id: str
    tipo_registro: TipoRegistroMedico
    descripcion: Optional[str] = None
    medicamento: Optional[str] = None
    dosis: Optional[str] = None
    veterinario_id: Optional[str] = None
    fecha_evento: str
    fecha_proxima: Optional[str] = None

class Alerta(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bovino_id: str
    tipo_alerta: TipoAlerta
    severidad: int = 2  # 1=baja, 2=media, 3=alta
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
    mensaje: Optional[str] = None
    fecha_vencimiento: Optional[str] = None

class Potrero(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    finca_id: str
    nombre: str
    area_ha: Optional[float] = None
    poligono: List[Dict]  # [{"lat": float, "lng": float}]
    creado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PotreroCreate(BaseModel):
    finca_id: str
    nombre: str
    area_ha: Optional[float] = None
    poligono: List[Dict]

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
        rol=user_data.rol
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
    await db.bovinos.insert_one(bovino.dict())
    return bovino

@api_router.get("/bovinos", response_model=List[Bovino])
async def get_bovinos(finca_id: Optional[str] = None, current_user: Usuario = Depends(get_current_user)):
    query = {}
    if finca_id:
        query["finca_id"] = finca_id
    
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
    result = await db.bovinos.update_one(
        {"id": bovino_id},
        {"$set": bovino_data.dict()}
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
    return {"message": "Bovino eliminado"}

# Registros médicos routes
@api_router.post("/registros-medicos", response_model=RegistroMedico)
async def create_registro_medico(registro_data: RegistroMedicoCreate, current_user: Usuario = Depends(get_current_user)):
    registro = RegistroMedico(**registro_data.dict())
    await db.registros_medicos.insert_one(registro.dict())
    return registro

@api_router.get("/registros-medicos", response_model=List[RegistroMedico])
async def get_registros_medicos(bovino_id: Optional[str] = None, current_user: Usuario = Depends(get_current_user)):
    query = {}
    if bovino_id:
        query["bovino_id"] = bovino_id
    
    registros = await db.registros_medicos.find(query).sort("fecha_evento", -1).to_list(1000)
    return [RegistroMedico(**registro) for registro in registros]

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

# Dashboard stats
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
    
    return {
        "total_bovinos": total_bovinos,
        "total_fincas": total_fincas,
        "alertas_activas": alertas_activas,
        "bovinos_por_tipo": bovinos_por_tipo
    }

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
        ubicacion={"lat": 9.7489, "lng": -83.7534}
    )
    await db.fincas.insert_one(finca_sample.dict())
    
    # Sample cattle
    bovinos_sample = [
        Bovino(
            finca_id=finca_sample.id,
            caravana="001",
            nombre="Esperanza",
            sexo=Sexo.HEMBRA,
            raza="Holstein",
            tipo_ganado=TipoGanado.LECHE,
            peso_kg=450.5,
            fecha_nacimiento="2020-03-15"
        ),
        Bovino(
            finca_id=finca_sample.id,
            caravana="002",
            nombre="Fuerte",
            sexo=Sexo.MACHO,
            raza="Brahman",
            tipo_ganado=TipoGanado.CARNE,
            peso_kg=520.0,
            fecha_nacimiento="2019-08-22"
        ),
        Bovino(
            finca_id=finca_sample.id,
            caravana="003",
            nombre="Luna",
            sexo=Sexo.HEMBRA,
            raza="Jersey",
            tipo_ganado=TipoGanado.DUAL,
            peso_kg=380.0,
            fecha_nacimiento="2021-01-10"
        )
    ]
    
    for bovino in bovinos_sample:
        await db.bovinos.insert_one(bovino.dict())
    
    # Sample alerts
    alertas_sample = [
        Alerta(
            bovino_id=bovinos_sample[0].id,
            tipo_alerta=TipoAlerta.VENCIMIENTO_MEDICO,
            severidad=3,
            mensaje="Vacuna antiaftosa vencida",
            fecha_vencimiento="2024-10-15"
        ),
        Alerta(
            bovino_id=bovinos_sample[1].id,
            tipo_alerta=TipoAlerta.CONTROL_PESO,
            severidad=2,
            mensaje="Control de peso mensual pendiente",
            fecha_vencimiento="2024-10-20"
        )
    ]
    
    for alerta in alertas_sample:
        await db.alertas.insert_one(alerta.dict())
    
    return {"message": "Datos de prueba creados exitosamente"}

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