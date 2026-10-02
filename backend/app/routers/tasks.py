from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _get_or_404(db: Session, task_id: int) -> models.Task:
    task = db.get(models.Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return task


@router.get("", response_model=list[schemas.TaskOut])
def list_tasks(done: bool | None = None, db: Session = Depends(get_db)):
    q = (
        select(models.Task)
        .options(joinedload(models.Task.customer))
        .order_by(models.Task.done, models.Task.due_date.asc().nulls_last(), models.Task.id.desc())
    )
    if done is not None:
        q = q.where(models.Task.done.is_(done))
    return db.scalars(q).all()


@router.post("", response_model=schemas.TaskOut, status_code=201)
def create_task(payload: schemas.TaskCreate, db: Session = Depends(get_db)):
    if not db.get(models.Customer, payload.customer_id):
        raise HTTPException(404, "Customer not found")
    task = models.Task(**payload.model_dump(), auto_generated=False)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=schemas.TaskOut)
def update_task(task_id: int, payload: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = _get_or_404(db, task_id)
    task.done = payload.done
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, task_id))
    db.commit()
