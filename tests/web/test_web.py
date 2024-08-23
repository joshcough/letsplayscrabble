def test_home_page(web_client, db_api):
    """Test the home page route."""
    response = web_client.get('/')
    assert response.status_code == 200
    assert b"Welcome" in response.data

def test_admin_page(web_client, db_api):
    """Test the admin page route."""
    db_api.players.insert_player("Nigel", "Richards")
    response = web_client.get(f'/admin')
    assert response.status_code == 200
    # assert b"joe 69 - 42 jim" in response.data
