const cron = require("node-cron");
const axios = require("axios");
const { loadTournamentFile } = require("./dataProcessing");

class TournamentPollingService {
  constructor(tournamentRepo) {
    this.tournamentRepo = tournamentRepo;
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) return;
    // Run every 10 seconds
    this.job = cron.schedule("*/10 * * * * *", async () => {
      try {
        await this.pollActiveTournaments();
      } catch (error) {
        console.error("Error in tournament polling:", error);
      }
    });
    this.isRunning = true;
    console.log("Tournament polling service started");
  }

  stop() {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      console.log("Tournament polling service stopped");
    }
  }

  async pollActiveTournaments() {
    console.log("Tournament polling service is polling...")
    await this.clearExpiredPolls();
    const activeTournaments = await this.tournamentRepo.findActivePollable();
    for (const tournament of activeTournaments) {
      try {
        const newData = await loadTournamentFile(tournament.data_url);
        if (JSON.stringify(newData) !== JSON.stringify(tournament.data)) {
          await this.tournamentRepo.updateData(tournament.id, newData);
          console.log(`Updated tournament ${tournament.id} with new data`);
        }
      } catch (error) {
        console.error(`Error polling tournament ${tournament.id}:`, error);
      }
    }
  }

  async clearExpiredPolls() {
    await this.tournamentRepo.endInactivePollable();
  }
}

module.exports = TournamentPollingService;
