from fastapi import APIRouter, HTTPSException,status
from pydantic import BaseModel

router =APIRouter()
class UseerCreate(BaseModel):
    email:str