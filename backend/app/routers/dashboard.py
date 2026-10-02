from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import automation, models, schemas
from ..database import get_db

router = APIRouter(prefix="/api", tags=["dashboard"])

STAGE_ORDER = ["new", "qualified", "proposal", "won", "lost"]


@router.get("/dashboard", response_model=schemas.DashboardOut)
def dashboard(db: Session = Depends(get_db)):
    customers = db.scalar(select(func.count(models.Customer.id))) or 0

    rows = db.execute(
        select(models.Deal.stage, func.count(models.Deal.id), func.coalesce(func.sum(models.Deal.value), 0))
        .group_by(models.Deal.stage)
    ).all()
    by_stage = {stage: (count, float(value)) for stage, count, value in rows}
    stages = [
        {"stage": s, "count": by_stage.get(s, (0, 0.0))[0], "value": by_stage.get(s, (0, 0.0))[1]}
        for s in STAGE_ORDER
    ]
    open_deals = sum(by_stage.get(s, (0, 0))[0] for s in automation.OPEN_STAGES)
    pipeline = sum(by_stage.get(s, (0, 0.0))[1] for s in automation.OPEN_STAGES)
    won = by_stage.get("won", (0, 0.0))[1]

    total_tasks = db.scalar(select(func.count(models.Task.id))) or 0
    open_tasks = db.scalar(select(func.count(models.Task.id)).where(models.Task.done.is_(False))) or 0
    automated = db.scalar(
        select(func.count(models.Task.id)).where(models.Task.auto_generated.is_(True))
    ) or 0

    return {
        "customers": customers,
        "open_deals": open_deals,
        "pipeline_value": pipeline,
        "won_value": won,
        "open_tasks": open_tasks,
        "total_tasks": total_tasks,
        "automated_tasks": automated,
        "automation_share": round(automated / total_tasks * 100, 1) if total_tasks else 0.0,
        "stages": stages,
    }


@router.post("/automation/run", response_model=schemas.SweepOut)
def run_automation(db: Session = Depends(get_db)):
    return {"created": automation.run_sweep(db)}
