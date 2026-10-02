"""Next-best-action insights. Uses Groq if GROQ_API_KEY is set, else simple rules."""
import httpx

from .config import settings
from .models import Customer, Deal

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def _rules(customer: Customer, deals: list[Deal], open_tasks: int) -> str:
    open_deals = [d for d in deals if d.stage in ("new", "qualified", "proposal")]
    if not deals:
        return f"{customer.name} has no deals yet. Book a discovery call and create a deal."
    if open_deals and open_tasks == 0:
        return "There is an open deal but no follow-up scheduled. Add a task so it keeps moving."
    if any(d.stage == "proposal" for d in open_deals):
        return "A proposal is out. Follow up within a few days and ask about timeline and budget."
    if any(d.stage == "won" for d in deals):
        return "Deal won. Check in on onboarding and look for an upsell."
    return "Keep the relationship warm with a short check-in this week."


def get_insight(customer: Customer, deals: list[Deal], open_tasks: int) -> tuple[str, str]:
    if settings.groq_api_key:
        summary = "; ".join(f"{d.title} ({d.stage}, ${d.value:,.0f})" for d in deals) or "no deals"
        prompt = (
            "You are a CRM assistant. In two short sentences, suggest the next best action.\n"
            f"Customer: {customer.name}, company: {customer.company or 'n/a'}, "
            f"status: {customer.status}, lead score: {customer.score}/100.\n"
            f"Deals: {summary}. Open tasks: {open_tasks}."
        )
        try:
            r = httpx.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                json={
                    "model": settings.groq_model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 120,
                    "temperature": 0.3,
                },
                timeout=10,
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"].strip(), "groq"
        except Exception:
            pass  # fall back to rules
    return _rules(customer, deals, open_tasks), "rules"
