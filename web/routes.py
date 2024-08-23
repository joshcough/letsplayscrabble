from flask import Blueprint, render_template, g, request, redirect, url_for

app = Blueprint('home', __name__)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if request.method == 'POST':
        # Get the selected player IDs from the form
        player1_id = request.form['player1']
        player2_id = request.form['player2']

        # Update the current_game table
        g.db_api.current_game.set_current_game(player1_id, player2_id)
        return redirect(url_for('home.admin'))
    # Fetch all players from the Player table in the database
    players = g.db_api.players.get_all()
    # Fetch the current players in the current_game table
    current_game = g.db_api.current_game.get()
    # Get player objects for current_game if they exist
    current_player1 = g.db_api.players.get_by_id(current_game.player1_id) if current_game and current_game.player1_id else None
    current_player2 = g.db_api.players.get_by_id(current_game.player2_id) if current_game and current_game.player2_id else None

    return render_template('admin.html', players=players, current_player1=current_player1, current_player2=current_player2)