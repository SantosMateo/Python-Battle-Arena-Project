import os
import jwt
import datetime
from fastapi import APIRouter, HTTPException, status
from passlib.context import CryptContext
from pydantic import BaseModel
from .database import db

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_battle_key")

class AuthSchema(BaseModel):
    username: str
    password: str

@router.post("/register")
async def register(data: AuthSchema):
    user_exists = await db.fetchrow("SELECT id FROM users WHERE username = $1", data.username)
    if user_exists:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed = pwd_context.hash(data.password)
    await db.execute("INSERT INTO users (username, password_hash) VALUES ($1, $2)", data.username, hashed)
    return {"message": "User registered successfully!"}

@router.post("/login")
async def login(data: AuthSchema):
    user = await db.fetchrow("SELECT * FROM users WHERE username = $1", data.username)
    if not user or not pwd_context.verify(data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = jwt.encode({
        "userId": user['id'],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, JWT_SECRET, algorithm="HS256")
    
    return {"message": "Login successful", "token": token, "userId": user['id']}