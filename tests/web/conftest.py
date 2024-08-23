import pytest

from web import create_app

@pytest.fixture
def web_client(db_container):
    conn_str = db_container.get_connection_url()
    app = create_app(conn_str, {'TESTING': True})
    with app.test_client() as client:
        yield client
