// TODO:
// * when new tournament data is loaded, clear everything.
// * when a division is selected, clear out any current players stats
//   we do clear the dropdowns, but not the stats for the previously selected players
// * right now we are showing the standings for all the divisions,
//   but maybe we should only show them for the selected division
// * get the players on the left and right properly
// * all sorts of styling
// * ask chatgpt about js frameworks
// * look into obs to see if it can use a specific element on a page
//   if so, we can probably put put _everything_ on one page, and have scenes in obs just reference divs
// * change the standings to a table. its currently just a pile of html
// * sort players in the dropdowns alphabetically by last name

function loadJsFile() {
    const jsUrl = document.getElementById('jsUrl').value;
    const script = document.createElement('script');
    script.src = jsUrl;
    script.onload = function () { processNewtData(); };
    document.body.appendChild(script);
}

let divisionsStats = [];

// Assuming `newt` is the variable in the loaded JS file
function processNewtData() {
    if (typeof newt === 'undefined') {
        console.error('newt object is not available.');
        return;
    }
    divisionsStats = getAllDivisionStatsFromNewt();
    displayStandings(divisionsStats);

    // Populate the division dropdown
    const divisionSelectDiv = document.getElementById('divisionSection');
    divisionSelectDiv.style.display = 'block';

    const divisionSelect = document.getElementById('divisionSelect');
    divisionSelect.innerHTML = '<option value="">Select a division</option>'; // Reset
    divisionsStats.forEach((divisionStat, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = divisionStat.division;
        divisionSelect.appendChild(option);
    });
}

function populatePlayerDropdowns() {
    const divisionIndex = document.getElementById('divisionSelect').value;
    if (divisionIndex === '') return;

    const selectedDivision = divisionsStats[divisionIndex];
    const player1Select = document.getElementById('player1Select');
    const player2Select = document.getElementById('player2Select');

    // Reset and populate player dropdowns
    player1Select.innerHTML = '<option value="">Select Player 1</option>';
    player2Select.innerHTML = '<option value="">Select Player 2</option>';
    // ZZZ todo: sort by player name
    selectedDivision.stats.forEach((stat, index) => {
        const option1 = document.createElement('option');
        option1.value = index;
        option1.textContent = stat.player;
        player1Select.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = index;
        option2.textContent = stat.player;
        player2Select.appendChild(option2);
    });

    // Show the player dropdowns
    document.getElementById('playerSection').style.display = 'block';
}

function displayPlayerStats(playerSelectId, statsContainerId) {
    const playerIndex = document.getElementById(playerSelectId).value;
    if (playerIndex === '') return;

    const divisionIndex = document.getElementById('divisionSelect').value;
    const stat = divisionsStats[divisionIndex].stats[playerIndex];

    const statsContainer = document.getElementById(statsContainerId);
    statsContainer.innerHTML = `
        <h3>${stat.player}</h3>
        <p>Wins: ${stat.wins}, Losses: ${stat.losses}, Ties: ${stat.ties}</p>
        <p>Spread: ${stat.spread}, Avg Score: ${stat.averageScore}, High Score: ${stat.highScore}</p>
    `;
}

// Functions to calculate and display division standings
function getAllDivisionStatsFromNewt() {
    const allDivisionsStats = [];

    function divisionStatsFromDivisionJson(divisionJson) {
        const allPlayers = [{ name: "Bye", pairings: [], scores: [] }];
        const allStats = [];

        divisionJson.players.forEach(playerData => {
            if (playerData !== null && typeof playerData !== 'undefined') {
                allPlayers.push({
                    name: playerData.name,
                    pairings: playerData.pairings,
                    scores: playerData.scores
                });
            }
        });

        allPlayers.forEach(player => {
            const playerStats = calculatePlayerStats(player, allPlayers);
            allStats.push(playerStats);
        });

        return { division: divisionJson.name, stats: allStats };
    }

    if (Array.isArray(newt.divisions)) {
        newt.divisions.forEach(divisionJson => {
            const divisionStats = divisionStatsFromDivisionJson(divisionJson);
            allDivisionsStats.push(divisionStats);
        });
    }

    return allDivisionsStats;
}

// Calculate player stats (similar to the Python version)
function calculatePlayerStats(rawPlayer, allPlayers) {
    let totalSpread = 0;
    let totalScore = 0;
    let highScore = 0;
    let wins = 0;
    let losses = 0;
    let ties = 0;
    let gamesPlayed = 0;

    rawPlayer.pairings.forEach((opponentIdx, gameIdx) => {
        const playerScore = rawPlayer.scores[gameIdx];
        if (opponentIdx === 0) {
            totalSpread += playerScore;
            wins += (playerScore > 0) ? 1 : 0;
        } else {
            const opponent = allPlayers[opponentIdx];
            const opponentScore = opponent.scores[gameIdx];
            const spread = playerScore - opponentScore;
            totalSpread += spread;
            if (playerScore > opponentScore) {
                wins++;
            } else if (playerScore < opponentScore) {
                losses++;
            } else {
                ties++;
            }
            totalScore += playerScore;
            highScore = Math.max(highScore, playerScore);
            gamesPlayed++;
        }
    });

    const averageScore = (gamesPlayed > 0) ? (totalScore / gamesPlayed).toFixed(2) : 0;
    return {
        player: rawPlayer.name,
        wins: wins,
        losses: losses,
        ties: ties,
        averageScore: averageScore,
        spread: totalSpread,
        highScore: highScore
    };
}

// Function to display the standings
function displayStandings(divisionsStats) {
    const standingsDiv = document.getElementById('standings');
    standingsDiv.innerHTML = '';  // Clear previous standings

    divisionsStats.forEach(divisionStats => {
        const divisionHeader = document.createElement('h2');
        divisionHeader.textContent = `Division: ${divisionStats.division}`;
        standingsDiv.appendChild(divisionHeader);

        divisionStats.stats.sort((a, b) => {
            // Sort by wins, ties, losses, spread
            if (a.wins !== b.wins) return b.wins - a.wins;
            if (a.ties !== b.ties) return b.ties - a.ties;
            if (a.losses !== b.losses) return a.losses - b.losses;
            return b.spread - a.spread;
        });

        const list = document.createElement('ul');
        divisionStats.stats.forEach((playerStats, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${index + 1}. ${playerStats.player} - Wins: ${playerStats.wins}, Losses: ${playerStats.losses}, Ties: ${playerStats.ties}, Spread: ${playerStats.spread}, Avg. Score: ${playerStats.averageScore}, High Score: ${playerStats.highScore}`;
            list.appendChild(listItem);
        });

        standingsDiv.appendChild(list);
    });
}