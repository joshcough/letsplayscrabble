import secrets

from flask import Flask, g
from flask_sqlalchemy import SQLAlchemy

from app.letsplayscrabble.database import DB_API
from web import routes

db = SQLAlchemy()

def create_app(conn_str, test_config=None):
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = conn_str
    if test_config:
        app.config.update(test_config)

    db.init_app(app)
    db_api = DB_API(db.session)

    @app.before_request
    def before_request():
        # Make db_api accessible in the global context of a request
        g.db_api = db_api

    app.register_blueprint(routes.app)

    app.secret_key = secrets.token_hex(16)
    print(f"Secret Key: {app.secret_key}")

    return app

def create_app_no_db(test_config=None):
    app = Flask(__name__)
    if test_config:
        app.config.update(test_config)

    app.register_blueprint(routes.app)

    app.secret_key = secrets.token_hex(16)
    print(f"Secret Key: {app.secret_key}")

    return app
