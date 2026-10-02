from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/crm"
    cors_origins: str = "http://localhost:5173"
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-8b-instant"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
