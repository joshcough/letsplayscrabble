<script>
  import { loadTournamentFile, processDivisionData } from './dataProcessing.js';
  let jsUrl = "http://localhost:8080/tourney.js"; // Default value for the input
  let divisions = [];
  let selectedDivision = null;
  let playersInDivision = [];
  let player1 = null;
  let player2 = null;
  let player1Stats = null;
  let player2Stats = null;

  async function handleSubmit() {
    const tourneyData = await loadTournamentFile(jsUrl);

    if (tourneyData && tourneyData.divisions) {
      divisions = tourneyData.divisions;
      selectedDivision = null; // Clear selection when new file is loaded
      player1 = null;
      player2 = null;
      player1Stats = null;
      player2Stats = null;
    }
  }

  function handleDivisionChange() {
    if (selectedDivision) {
      const divisionData = divisions.find(division => division.name === selectedDivision);
      if (divisionData) {
        playersInDivision = processDivisionData(divisionData);
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
          {#each playersInDivision as player}
            <option value={player.name}>{player.name}</option>
          {/each}
        </select>
        {#if player1Stats}
          <div>
            <h4>Player 1 Stats</h4>
            <p>Wins: {player1Stats.wins}</p>
            <p>Losses: {player1Stats.losses}</p>
            <p>Ties: {player1Stats.ties}</p>
            <p>Spread: {player1Stats.spread}</p>
            <p>Average Score: {player1Stats.averageScore}</p>
            <p>High Score: {player1Stats.highScore}</p>
          </div>
        {/if}
      </div>

      <div class="dropdown-right">
        <h3>Player 2</h3>
        <select bind:value={player2} on:change={handlePlayer2Change}>
          <option value="" disabled selected>Select Player 2</option>
          {#each playersInDivision as player}
            <option value={player.name}>{player.name}</option>
          {/each}
        </select>
        {#if player2Stats}
          <div>
            <h4>Player 2 Stats</h4>
            <p>Wins: {player2Stats.wins}</p>
            <p>Losses: {player2Stats.losses}</p>
            <p>Ties: {player2Stats.ties}</p>
            <p>Spread: {player2Stats.spread}</p>
            <p>Average Score: {player2Stats.averageScore}</p>
            <p>High Score: {player2Stats.highScore}</p>
          </div>
        {/if}
      </div>
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
</style>
