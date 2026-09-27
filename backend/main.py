from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routes.assets import router as assets_router
from routes.alerts import router as alerts_router
from routes.events import router as events_router
from routes.rules import router as rules_router
from routes.statistics import router as statistics_router

import collector
import models
import alerts
import events
import rules


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="NetMonitor",
    description="Network Security Monitoring & Threat Detection Platform",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(assets_router)
app.include_router(alerts_router)
app.include_router(events_router)
app.include_router(rules_router)
app.include_router(statistics_router)


@app.get("/")
def root():
    return {
        "name": "NetMonitor",
        "status": "running",
        "message": (
            "Network Security Monitoring "
            "& Threat Detection Platform"
        ),
    }


@app.get("/api/health")
def health():
    return {"status": "healthy"}


@app.get("/api/collector/status")
def collector_status():
    return {
        "running": collector.COLLECTOR_RUNNING,
    }


@app.post("/api/collector/start")
def start_collector():
    if collector.COLLECTOR_RUNNING:
        return {
            "status": "already_running",
            "message": "Network collector is already running.",
        }

    collector.start_collector_background()

    return {
        "status": "started",
        "message": "Network packet collector started.",
    }


@app.post("/api/collector/stop")
def stop_collector():
    if not collector.COLLECTOR_RUNNING:
        return {
            "status": "already_stopped",
            "message": "Network collector is already stopped.",
        }

    stopped = collector.stop_collector()

    if stopped:
        return {
            "status": "stopping",
            "message": "Network packet collector stop requested.",
        }

    return {
        "status": "already_stopped",
        "message": "Network collector is already stopped.",
    }
