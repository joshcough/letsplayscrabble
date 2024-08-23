import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.letsplayscrabble.database import DB_API
from app.letsplayscrabble.database.base import Base
from app.letsplayscrabble.loggo import get_logger
from testcontainers.postgres import PostgresContainer

from web.app import run_webapp

logger = get_logger(__name__)

def run_with_pg_connection_string(conn_str, on_engine_create) -> None:
    if conn_str.startswith("postgres://"):
        conn_str = conn_str.replace("postgres://", "postgresql://", 1)
    engine = create_engine(conn_str, isolation_level="REPEATABLE READ")
    on_engine_create(engine)
    db_session = sessionmaker(autocommit=False, autoflush=False, bind=engine)()
    db_api = DB_API(db_session)
    db_api.players.insert_player("Nigel", "Richards")
    db_api.players.insert_player("Will", "Anderson")
    run_webapp(conn_str)

def run_via_test_container() -> None:
    with PostgresContainer("postgres:latest") as postgres:
        run_with_pg_connection_string(postgres.get_connection_url(),
                                      lambda engine: Base.metadata.create_all(engine))

def run_via_external_db() -> None:
    run_with_pg_connection_string(os.getenv('DATABASE_URL'), lambda engine: None)

def main():
    if os.getenv("ENV") == "prod":
        logger.warn("Running against the prod database!")
        run_via_external_db()
    else:
        logger.debug("Running letsplayscrabble with a test container")
        run_via_test_container()

if __name__ == '__main__':
    logger.info("Welcome to letsplayscrabble 2.0")
    main()
