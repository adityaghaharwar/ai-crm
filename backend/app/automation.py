"""Automation layer: creates follow-up work and keeps lead scores current,
so reps don't have to do it by hand."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models

OPEN_STAGES = ("new", "qualified", "proposal")

# stage -> (task title, due in days)
STAGE_TASKS = {
    "new": ("Qualify lead with a discovery call", 1),
    "qualified": ("Prepare and send proposal", 3),
    "proposal": ("Follow up on proposal", 5),
    "won": ("Send onboarding kit", 1),
    "lost": ("Record loss reason", 1),
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _auto_task(db: Session, customer: models.Customer, title: str, days: int, deal_id: int | None = None):
    db.add(
        models.Task(
            title=f"{title} - {customer.name}",
            due_date=_now() + timedelta(days=days),
            auto_generated=True,
            customer_id=customer.id,
            deal_id=deal_id,
        )
    )
    db.add(models.ActivityLog(customer_id=customer.id, kind="automation", message=f"Created task: {title}"))


def score_customer(db: Session, customer: models.Customer) -> int:
    score = 10
    if customer.company:
        score += 10
    if customer.phone:
        score += 5
    deals = db.scalars(select(models.Deal).where(models.Deal.customer_id == customer.id)).all()
    for d in deals:
        if d.stage == "won":
            score += 30
        elif d.stage in ("qualified", "proposal"):
            score += 15
        elif d.stage == "new":
            score += 5
        if d.stage != "lost":
            score += min(int(d.value // 10000), 10)
    return min(score, 100)


def on_customer_created(db: Session, customer: models.Customer) -> None:
    db.flush()
    customer.score = score_customer(db, customer)
    _auto_task(db, customer, "Send welcome email", 1)


def on_deal_stage_change(db: Session, deal: models.Deal) -> None:
    """Call after deal.stage has been set."""
    db.flush()
    customer = deal.customer
    title, days = STAGE_TASKS[deal.stage]
    _auto_task(db, customer, title, days, deal.id)
    if deal.stage == "won":
        customer.status = "active"
    customer.score = score_customer(db, customer)


def run_sweep(db: Session) -> int:
    """Create a re-engagement task for open deals idle for 7+ days with no open task."""
    cutoff = _now() - timedelta(days=7)
    deals_with_open_task = select(models.Task.deal_id).where(
        models.Task.done.is_(False), models.Task.deal_id.is_not(None)
    )
    stale = db.scalars(
        select(models.Deal).where(
            models.Deal.stage.in_(OPEN_STAGES),
            models.Deal.updated_at < cutoff,
            models.Deal.id.not_in(deals_with_open_task),
        )
    ).all()
    for deal in stale:
        _auto_task(db, deal.customer, "Re-engage idle deal", 1, deal.id)
    db.commit()
    return len(stale)
