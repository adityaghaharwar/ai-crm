"""Load demo data:  python -m app.seed"""
from sqlalchemy import func, select

from . import automation, models
from .database import Base, SessionLocal, engine

CUSTOMERS = [
    ("Asha Verma", "asha@northwind.example", "+91 98300 11111", "Northwind Pharma",
     [("Field team CRM rollout", 85000, "proposal")]),
    ("Rahul Sen", "rahul@medicore.example", "+91 98300 22222", "MediCore Labs",
     [("Annual analytics licence", 42000, "qualified")]),
    ("Priya Nair", "priya@lumina.example", None, "Lumina Health",
     [("Pilot programme", 15000, "won")]),
    ("Dev Malhotra", "dev@zenbio.example", "+91 98300 44444", "ZenBio", []),
]


def run():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if db.scalar(select(func.count(models.Customer.id))):
            print("Database already has data; skipping seed.")
            return
        for name, email, phone, company, deals in CUSTOMERS:
            c = models.Customer(name=name, email=email, phone=phone, company=company)
            db.add(c)
            automation.on_customer_created(db, c)
            for title, value, stage in deals:
                d = models.Deal(title=title, value=value, stage=stage, customer_id=c.id)
                db.add(d)
                d.customer = c
                automation.on_deal_stage_change(db, d)
        first = db.scalars(select(models.Customer).limit(1)).first()
        db.add(models.Task(title="Prepare quarterly review deck", customer_id=first.id))
        db.commit()
        print("Seeded demo data.")


if __name__ == "__main__":
    run()
