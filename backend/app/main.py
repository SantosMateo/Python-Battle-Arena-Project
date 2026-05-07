from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import db
from .auth import router as auth_router
from .game import router as game_router

app = FastAPI(title="Battle Arena Python API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db.connect()

@app.get("/")
async def root():
    return {"message": "Battle Arena API is running on Python!"}

app.include_router(auth_router)
app.include_router(game_router)