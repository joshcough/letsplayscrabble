from flask import Blueprint, render_template, request, redirect, url_for, session

from app.letsplayscrabble.tourneys.js import get_all_division_stats_from_js

app = Blueprint('home', __name__)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/admin_js_only')
def admin_js_only():
    return render_template('admin_js_only.html')

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if request.method == 'POST':
        # Handle the URL submission
        js_url = request.form.get('js_url')
        if js_url:
            session['js_url'] = js_url
            divisions_data = get_all_division_stats_from_js(js_url)

            # Convert divisions list to a dictionary keyed by division name
            divisions_dict = {division_stats.division.name: division_stats for division_stats in divisions_data}

            session['divisions'] = list(divisions_dict.keys())
            session['divisions_data'] = divisions_dict

        return redirect(url_for('home.admin'))  # Redirect to avoid form resubmission on refresh

    # Handle the GET request
    divisions = session.get('divisions', [])
    js_url = session.get('js_url', '')
    selected_division = request.args.get('division')

    return render_template('admin.html', divisions=divisions, js_url=js_url, selected_division=selected_division)

@app.route('/player_stats', methods=['GET'])
def player_stats():
    selected_division = request.args.get('division')
    player1 = request.args.get('player1')
    player2 = request.args.get('player2')

    divisions_data = session.get('divisions_data', {})
    players = []

    if selected_division and selected_division in divisions_data:
        division = divisions_data[selected_division]
        players = division.players  # Assuming division has a players attribute

    return render_template('player_stats.html', players=players, player1=player1, player2=player2)
