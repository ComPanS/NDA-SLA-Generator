from fastapi import APIRouter

from app.api.routes import auth, contracts, templates

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(templates.router, prefix="/templates", tags=["templates"])
router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
