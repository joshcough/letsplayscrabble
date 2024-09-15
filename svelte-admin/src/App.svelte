<script>
  import { loadTournamentFile, processDivisionData } from './dataProcessing.js';
  let jsUrl = "http://localhost:8080/tourney.js"; // Default value for the input
  let divisions = [];
  let selectedDivision = null;
  let playersInDivision = [];
  let playersInDropdown = []; // For the alphabetically sorted dropdowns
  let player1 = null;
  let player2 = null;
  let player1Stats = null;
  let player2Stats = null;
  let standings = [];

  async function handleSubmit() {
    const tourneyData = await loadTournamentFile(jsUrl);

    if (tourneyData && tourneyData.divisions) {
      divisions = tourneyData.divisions;
      selectedDivision = null; // Clear selection when a new file is loaded
      player1 = null;
      player2 = null;
      player1Stats = null;
      player2Stats = null;
      divisionStandings = []; // Clear standings when a new file is loaded
    }
  }

  function handleDivisionChange() {
    if (selectedDivision) {
      const divisionData = divisions.find(division => division.name === selectedDivision);
      if (divisionData) {
        playersInDivision = processDivisionData(divisionData);
        playersInDropdown = [...playersInDivision].sort((a, b) => a.name.localeCompare(b.name));
        standings = playersInDivision.sort((a, b) => {
          if (a.wins === b.wins) {
            return b.spread - a.spread; // Use spread as tiebreaker
          }
          return b.wins - a.wins; // Sort by wins
        });

        // Clear the previously selected players and their stats
        player1 = null;
        player2 = null;
        player1Stats = null;
        player2Stats = null;

        // Clear the standings for the previous division
        divisionStandings = [];
      }
    }
  }

  function handlePlayer1Change() {
    if (player1) {
      player1Stats = playersInDivision.find(player => player.name === player1);
    }
  }

  function handlePlayer2Change() {
    if (player2) {
      player2Stats = playersInDivision.find(player => player.name === player2);
    }
  }
</script>

<!-- HTML Structure -->
<div>
  <h1>Load Tournament Data</h1>
  <input type="text" bind:value={jsUrl} placeholder="Enter tournament JS file URL" />
  <button on:click={handleSubmit}>Load Tournament</button>

  {#if divisions.length > 0}
    <h2>Select Division</h2>
    <select bind:value={selectedDivision} on:change={handleDivisionChange}>
      <option value="" disabled selected>Select a division</option>
      {#each divisions as division}
        <option value={division.name}>{division.name}</option>
      {/each}
    </select>
  {/if}

  {#if playersInDivision.length > 0}
    <div class="dropdown-container">
      <div class="dropdown-left">
        <h3>Player 1</h3>
        <select bind:value={player1} on:change={handlePlayer1Change}>
          <option value="" disabled selected>Select Player 1</option>
          {#each playersInDropdown as player}
            <option value={player.name}>{player.name}</option>
          {/each}
        </select>
        {#if player1Stats}
          <div>
            <h4>Player 1 Stats</h4>
            <table>
              <tr>
                <td>Wins:</td>
                <td>{player1Stats.wins}</td>
              </tr>
              <tr>
                <td>Losses:</td>
                <td>{player1Stats.losses}</td>
              </tr>
              <tr>
                <td>Ties:</td>
                <td>{player1Stats.ties}</td>
              </tr>
              <tr>
                <td>Spread:</td>
                <td>{player1Stats.spread}</td>
              </tr>
              <tr>
                <td>Average Score:</td>
                <td>{player1Stats.averageScore}</td>
              </tr>
              <tr>
                <td>High Score:</td>
                <td>{player1Stats.highScore}</td>
              </tr>
            </table>
          </div>
        {/if}
      </div>

      <div class="dropdown-right">
        <h3>Player 2</h3>
        <select bind:value={player2} on:change={handlePlayer2Change}>
          <option value="" disabled selected>Select Player 2</option>
          {#each playersInDropdown as player}
            <option value={player.name}>{player.name}</option>
          {/each}
        </select>
        {#if player2Stats}
          <div>
            <h4>Player 2 Stats</h4>
            <table>
              <tr>
                <td>Wins:</td>
                <td>{player2Stats.wins}</td>
              </tr>
              <tr>
                <td>Losses:</td>
                <td>{player2Stats.losses}</td>
              </tr>
              <tr>
                <td>Ties:</td>
                <td>{player2Stats.ties}</td>
              </tr>
              <tr>
                <td>Spread:</td>
                <td>{player2Stats.spread}</td>
              </tr>
              <tr>
                <td>Average Score:</td>
                <td>{player2Stats.averageScore}</td>
              </tr>
              <tr>
                <td>High Score:</td>
                <td>{player2Stats.highScore}</td>
              </tr>
            </table>
          </div>
        {/if}
      </div>
    </div>

    <!-- Division Standings as a Table -->
    <div class="standings-container">
      <h2>Division Standings</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Ties</th>
            <th>Spread</th>
            <th>Average Score</th>
            <th>High Score</th>
          </tr>
        </thead>
        <tbody>
          {#each standings as player, index}
            <tr>
              <td>{index + 1}</td>
              <td>{player.name}</td>
              <td>{player.wins}</td>
              <td>{player.losses}</td>
              <td>{player.ties}</td>
              <td>{player.spread}</td>
              <td>{player.averageScore}</td>
              <td>{player.highScore}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .dropdown-container {
    display: flex;
    justify-content: space-between;
  }
  .dropdown-left, .dropdown-right {
    width: 45%;
  }

  /* Style the table */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 18px;
    text-align: left;
  }

  /* Style the table headers */
  th {
    background-color: #f2f2f2;
    color: #333;
    padding: 10px;
  }

  /* Style the table cells */
  td {
    padding: 10px;
    border: 1px solid #ddd;
  }

  /* Add alternating background colors for rows */
  tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  /* Hover effect for rows */
  tr:hover {
    background-color: #f1f1f1;
  }

  /* Style for table captions (optional) */
  caption {
    caption-side: top;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
  }
</style>