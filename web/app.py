import os

from flask import Flask

from app.letsplayscrabble.loggo import get_logger
from web import create_app, create_app_no_db

logger = get_logger(__name__)

def run_webapp(conn_str):
    app: Flask = create_app(conn_str)
    port: int = int(os.environ.get('PORT', 5001))
    debug_mode: bool = os.getenv("ENV") != "prod"
    logger.info("RUNNING WEBAPP")
    app.run(debug=debug_mode, host='0.0.0.0', port=port)


def run_webapp_no_db():
    app: Flask = create_app_no_db()
    port: int = int(os.environ.get('PORT', 5001))
    debug_mode: bool = os.getenv("ENV") != "prod"
    logger.info("RUNNING WEBAPP")
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
