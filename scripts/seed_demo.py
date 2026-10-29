"""Explicitly seed the non-production demo vehicle after migrations are applied."""

from app.database import SessionLocal
from app.main import seed_demo_data


def main() -> None:
    with SessionLocal() as db:
        seed_demo_data(db)


if __name__ == "__main__":
    main()
