from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Asset
from scanner import scan_network


router = APIRouter(
    prefix="/api/assets",
    tags=["Assets"],
)


@router.get("/")
def get_assets(
    db: Session = Depends(get_db),
):
    return db.query(Asset).all()


@router.post("/scan")
def scan_assets(
    target: str,
    db: Session = Depends(get_db),
):
    try:
        discovered_hosts = scan_network(target)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

    saved_assets = []

    for host in discovered_hosts:
        ip = host.get("ip")

        if not ip:
            continue

        asset = (
            db.query(Asset)
            .filter(Asset.ip == ip)
            .first()
        )

        if asset:
            asset.mac = host.get("mac")
            asset.hostname = host.get("hostname")
            asset.vendor = host.get("vendor")
            asset.status = "online"

            from datetime import datetime

            asset.last_seen = datetime.utcnow()

        else:
            asset = Asset(
                ip=ip,
                mac=host.get("mac"),
                hostname=host.get("hostname"),
                vendor=host.get("vendor"),
                status="online",
            )

            db.add(asset)

        saved_assets.append(ip)

    db.commit()

    return {
        "status": "success",
        "discovered": len(saved_assets),
        "assets": saved_assets,
    }