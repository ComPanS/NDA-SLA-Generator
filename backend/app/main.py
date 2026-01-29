from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, contracts, templates
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title="NDA/SLA Generator API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(templates.router, prefix="/templates", tags=["templates"])
    app.include_router(contracts.router, prefix="/contracts", tags=["contracts"])

    return app


app = create_app()
