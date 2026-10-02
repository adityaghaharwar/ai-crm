from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .. import automation, models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/deals", tags=["deals"])


def _get_or_404(db: Session, deal_id: int) -> models.Deal:
    deal = db.get(models.Deal, deal_id)
    if not deal:
        raise HTTPException(404, "Deal not found")
    return deal


@router.get("", response_model=list[schemas.DealOut])
def list_deals(stage: str | None = None, db: Session = Depends(get_db)):
    q = select(models.Deal).options(joinedload(models.Deal.customer)).order_by(models.Deal.id.desc())
    if stage:
        q = q.where(models.Deal.stage == stage)
    return db.scalars(q).all()


@router.post("", response_model=schemas.DealOut, status_code=201)
def create_deal(payload: schemas.DealCreate, db: Session = Depends(get_db)):
    if not db.get(models.Customer, payload.customer_id):
        raise HTTPException(404, "Customer not found")
    deal = models.Deal(**payload.model_dump())
    db.add(deal)
    automation.on_deal_stage_change(db, deal)
    db.commit()
    db.refresh(deal)
    return deal


@router.patch("/{deal_id}/stage", response_model=schemas.DealOut)
def move_deal(deal_id: int, payload: schemas.DealStageUpdate, db: Session = Depends(get_db)):
    deal = _get_or_404(db, deal_id)
    if deal.stage != payload.stage:
        deal.stage = payload.stage
        automation.on_deal_stage_change(db, deal)
        db.commit()
        db.refresh(deal)
    return deal


@router.delete("/{deal_id}", status_code=204)
def delete_deal(deal_id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, deal_id))
    db.commit()
