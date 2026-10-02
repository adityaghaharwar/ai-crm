from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .. import ai, automation, models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/customers", tags=["customers"])


def _get_or_404(db: Session, customer_id: int) -> models.Customer:
    customer = db.get(models.Customer, customer_id)
    if not customer:
        raise HTTPException(404, "Customer not found")
    return customer


def _email_taken(db: Session, email: str, exclude_id: int | None = None) -> bool:
    q = select(models.Customer.id).where(models.Customer.email == email)
    if exclude_id:
        q = q.where(models.Customer.id != exclude_id)
    return db.scalar(q) is not None


@router.get("", response_model=list[schemas.CustomerOut])
def list_customers(
    search: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    q = select(models.Customer).order_by(models.Customer.id.desc())
    if status:
        q = q.where(models.Customer.status == status)
    if search:
        like = f"%{search}%"
        q = q.where(
            or_(
                models.Customer.name.ilike(like),
                models.Customer.email.ilike(like),
                models.Customer.company.ilike(like),
            )
        )
    return db.scalars(q.offset(skip).limit(limit)).all()


@router.post("", response_model=schemas.CustomerOut, status_code=201)
def create_customer(payload: schemas.CustomerCreate, db: Session = Depends(get_db)):
    if _email_taken(db, payload.email):
        raise HTTPException(409, "A customer with this email already exists")
    customer = models.Customer(**payload.model_dump())
    db.add(customer)
    automation.on_customer_created(db, customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=schemas.CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, customer_id)


@router.put("/{customer_id}", response_model=schemas.CustomerOut)
def update_customer(customer_id: int, payload: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    customer = _get_or_404(db, customer_id)
    if _email_taken(db, payload.email, exclude_id=customer_id):
        raise HTTPException(409, "A customer with this email already exists")
    for key, value in payload.model_dump().items():
        setattr(customer, key, value)
    customer.score = automation.score_customer(db, customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=204)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, customer_id))
    db.commit()


@router.post("/{customer_id}/insight", response_model=schemas.InsightOut)
def customer_insight(customer_id: int, db: Session = Depends(get_db)):
    customer = _get_or_404(db, customer_id)
    deals = db.scalars(select(models.Deal).where(models.Deal.customer_id == customer_id)).all()
    open_tasks = db.scalar(
        select(func.count(models.Task.id)).where(
            models.Task.customer_id == customer_id, models.Task.done.is_(False)
        )
    )
    text, source = ai.get_insight(customer, list(deals), open_tasks or 0)
    return {"insight": text, "source": source}
