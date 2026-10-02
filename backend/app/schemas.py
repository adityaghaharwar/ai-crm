from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

CustomerStatus = Literal["lead", "active", "churned"]
DealStage = Literal["new", "qualified", "proposal", "won", "lost"]


class CustomerBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=160)
    phone: str | None = None
    company: str | None = None
    status: CustomerStatus = "lead"
    notes: str | None = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(CustomerBase):
    pass


class CustomerOut(CustomerBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    score: int
    created_at: datetime


class InsightOut(BaseModel):
    insight: str
    source: Literal["groq", "rules"]


class DealCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    value: float = Field(ge=0, default=0)
    stage: DealStage = "new"
    customer_id: int


class DealStageUpdate(BaseModel):
    stage: DealStage


class DealOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    value: float
    stage: DealStage
    customer_id: int
    customer_name: str | None = None
    created_at: datetime
    updated_at: datetime


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    due_date: datetime | None = None
    customer_id: int


class TaskUpdate(BaseModel):
    done: bool


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None
    due_date: datetime | None
    done: bool
    auto_generated: bool
    customer_id: int
    customer_name: str | None = None
    created_at: datetime


class StageStat(BaseModel):
    stage: DealStage
    count: int
    value: float


class DashboardOut(BaseModel):
    customers: int
    open_deals: int
    pipeline_value: float
    won_value: float
    open_tasks: int
    total_tasks: int
    automated_tasks: int
    automation_share: float
    stages: list[StageStat]


class SweepOut(BaseModel):
    created: int
