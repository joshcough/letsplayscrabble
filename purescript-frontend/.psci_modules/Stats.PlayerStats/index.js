// | Player statistics calculation
// | Pure functions to calculate player stats from games
import * as Data_Array from "../Data.Array/index.js";
import * as Data_Eq from "../Data.Eq/index.js";
import * as Data_Functor from "../Data.Functor/index.js";
import * as Data_Int from "../Data.Int/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Data_Ord from "../Data.Ord/index.js";
import * as Data_Ordering from "../Data.Ordering/index.js";
import * as Domain_Types from "../Domain.Types/index.js";
var compare = /* #__PURE__ */ Data_Ord.compare(Data_Ord.ordInt);
var compare1 = /* #__PURE__ */ Data_Ord.compare(Data_Ord.ordNumber);
var eq = /* #__PURE__ */ Data_Eq.eq(Domain_Types.eqPlayerId);
var max = /* #__PURE__ */ Data_Ord.max(Data_Ord.ordInt);
var map = /* #__PURE__ */ Data_Functor.map(Data_Functor.functorArray);

// | Sort type for different overlay types
var Standings = /* #__PURE__ */ (function () {
    function Standings() {

    };
    Standings.value = new Standings();
    return Standings;
})();

// | Sort type for different overlay types
var HighScore = /* #__PURE__ */ (function () {
    function HighScore() {

    };
    HighScore.value = new HighScore();
    return HighScore;
})();

// | Sort type for different overlay types
var AverageScore = /* #__PURE__ */ (function () {
    function AverageScore() {

    };
    AverageScore.value = new AverageScore();
    return AverageScore;
})();

// | Sort type for different overlay types
var RatingGain = /* #__PURE__ */ (function () {
    function RatingGain() {

    };
    RatingGain.value = new RatingGain();
    return RatingGain;
})();

// | Sort players by standings (wins desc, losses asc, spread desc)
var sortByStandings = function (players) {
    var compareStandings = function (a) {
        return function (b) {
            var v = compare(b.wins)(a.wins);
            if (v instanceof Data_Ordering.EQ) {
                var v1 = compare(a.losses)(b.losses);
                if (v1 instanceof Data_Ordering.EQ) {
                    return compare(b.spread)(a.spread);
                };
                return v1;
            };
            return v;
        };
    };
    return Data_Array.sortBy(compareStandings)(players);
};

// | Sort players by rating gain
var sortByRatingGain = function (players) {
    return Data_Array.sortBy(function (a) {
        return function (b) {
            return compare(b.ratingDiff)(a.ratingDiff);
        };
    })(players);
};

// | Sort players by high score
var sortByHighScore = function (players) {
    return Data_Array.sortBy(function (a) {
        return function (b) {
            return compare(b.highScore)(a.highScore);
        };
    })(players);
};

// | Sort players by average score
var sortByAverageScore = function (players) {
    return Data_Array.sortBy(function (a) {
        return function (b) {
            return compare1(b.averageScore)(a.averageScore);
        };
    })(players);
};

// | Sort players by the given sort type
var sortPlayers = function (v) {
    if (v instanceof Standings) {
        return sortByStandings;
    };
    if (v instanceof HighScore) {
        return sortByHighScore;
    };
    if (v instanceof AverageScore) {
        return sortByAverageScore;
    };
    if (v instanceof RatingGain) {
        return sortByRatingGain;
    };
    throw new Error("Failed pattern match at Stats.PlayerStats (line 207, column 1 - line 207, column 66): " + [ v.constructor.name ]);
};
var eqSortType = {
    eq: function (x) {
        return function (y) {
            if (x instanceof Standings && y instanceof Standings) {
                return true;
            };
            if (x instanceof HighScore && y instanceof HighScore) {
                return true;
            };
            if (x instanceof AverageScore && y instanceof AverageScore) {
                return true;
            };
            if (x instanceof RatingGain && y instanceof RatingGain) {
                return true;
            };
            return false;
        };
    }
};

// | Calculate stats for a single player from their games
var calculatePlayerStats = function (player) {
    return function (games) {
        var isPlayerGame = function (game) {
            return eq(game.player1Id)(player.id) || eq(game.player2Id)(player.id);
        };
        var initialStats = {
            totalSpread: 0,
            totalScore: 0,
            totalOpponentScore: 0,
            highScore: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            gamesPlayed: 0
        };
        var accumulateRegularGame = function (stats) {
            return function (game) {
                if (game.player1Score instanceof Data_Maybe.Just && game.player2Score instanceof Data_Maybe.Just) {
                    var v = (function () {
                        var $26 = eq(game.player1Id)(player.id);
                        if ($26) {
                            return {
                                playerScore: game.player1Score.value0,
                                opponentScore: game.player2Score.value0
                            };
                        };
                        return {
                            playerScore: game.player2Score.value0,
                            opponentScore: game.player1Score.value0
                        };
                    })();
                    var spread = v.playerScore - v.opponentScore | 0;
                    var newWins = (function () {
                        var $28 = v.playerScore > v.opponentScore;
                        if ($28) {
                            return stats.wins + 1 | 0;
                        };
                        return stats.wins;
                    })();
                    var newTies = (function () {
                        var $29 = v.playerScore === v.opponentScore;
                        if ($29) {
                            return stats.ties + 1 | 0;
                        };
                        return stats.ties;
                    })();
                    var newLosses = (function () {
                        var $30 = v.playerScore < v.opponentScore;
                        if ($30) {
                            return stats.losses + 1 | 0;
                        };
                        return stats.losses;
                    })();
                    return {
                        totalSpread: stats.totalSpread + spread | 0,
                        totalScore: stats.totalScore + v.playerScore | 0,
                        totalOpponentScore: stats.totalOpponentScore + v.opponentScore | 0,
                        highScore: max(stats.highScore)(v.playerScore),
                        wins: newWins,
                        losses: newLosses,
                        ties: newTies,
                        gamesPlayed: stats.gamesPlayed + 1 | 0
                    };
                };
                return stats;
            };
        };
        var accumulateBye = function (stats) {
            return function (game) {
                var byeScore = (function () {
                    var $35 = eq(game.player1Id)(player.id);
                    if ($35) {
                        return game.player1Score;
                    };
                    return game.player2Score;
                })();
                if (byeScore instanceof Data_Maybe.Nothing) {
                    return stats;
                };
                if (byeScore instanceof Data_Maybe.Just) {
                    return {
                        totalSpread: stats.totalSpread + byeScore.value0 | 0,
                        totalScore: stats.totalScore,
                        totalOpponentScore: stats.totalOpponentScore,
                        highScore: stats.highScore,
                        wins: (function () {
                            var $37 = byeScore.value0 > 0;
                            if ($37) {
                                return stats.wins + 1 | 0;
                            };
                            return stats.wins;
                        })(),
                        losses: (function () {
                            var $38 = byeScore.value0 <= 0;
                            if ($38) {
                                return stats.losses + 1 | 0;
                            };
                            return stats.losses;
                        })(),
                        ties: stats.ties,
                        gamesPlayed: stats.gamesPlayed
                    };
                };
                throw new Error("Failed pattern match at Stats.PlayerStats (line 135, column 9 - line 146, column 14): " + [ byeScore.constructor.name ]);
            };
        };
        var accumGame = function (stats) {
            return function (game) {
                if (game.isBye) {
                    return accumulateBye(stats)(game);
                };
                return accumulateRegularGame(stats)(game);
            };
        };
        
        // Extract XT photo URL from xtData if available
var xtPhotoUrl = (function () {
            if (player.xtData instanceof Data_Maybe.Just) {
                return player.xtData.value0.photourl;
            };
            if (player.xtData instanceof Data_Maybe.Nothing) {
                return Data_Maybe.Nothing.value;
            };
            throw new Error("Failed pattern match at Stats.PlayerStats (line 88, column 18 - line 90, column 25): " + [ player.xtData.constructor.name ]);
        })();
        var playerGames = Data_Array.filter(isPlayerGame)(games);
        var stats = Data_Array.foldl(accumGame)(initialStats)(playerGames);
        var currentRating = (function () {
            if (player.ratingsHistory.length === 0) {
                return player.initialRating;
            };
            return Data_Maybe.fromMaybe(player.initialRating)(Data_Array.index(player.ratingsHistory)(Data_Array.length(player.ratingsHistory) - 1 | 0));
        })();
        var ratingDiff = currentRating - player.initialRating | 0;
        var avgScore = (function () {
            var $44 = stats.gamesPlayed > 0;
            if ($44) {
                return Data_Int.toNumber(stats.totalScore) / Data_Int.toNumber(stats.gamesPlayed);
            };
            return 0.0;
        })();
        var avgOppScore = (function () {
            var $45 = stats.gamesPlayed > 0;
            if ($45) {
                return Data_Int.toNumber(stats.totalOpponentScore) / Data_Int.toNumber(stats.gamesPlayed);
            };
            return 0.0;
        })();
        return {
            playerId: player.id,
            name: player.name,
            initialRating: player.initialRating,
            currentRating: currentRating,
            ratingDiff: ratingDiff,
            seed: player.seed,
            wins: stats.wins,
            losses: stats.losses,
            ties: stats.ties,
            spread: stats.totalSpread,
            averageScore: avgScore,
            averageOpponentScore: avgOppScore,
            highScore: stats.highScore,
            photo: player.photo,
            xtPhotoUrl: xtPhotoUrl
        };
    };
};

// | Calculate stats for all players
var calculateAllPlayerStats = function (players) {
    return function (games) {
        return map(function (p) {
            return calculatePlayerStats(p)(games);
        })(players);
    };
};

// | Add ranks to sorted players
var addRanks = function (players) {
    return Data_Array.mapWithIndex(function (idx) {
        return function (player) {
            return {
                playerId: player.playerId,
                name: player.name,
                initialRating: player.initialRating,
                currentRating: player.currentRating,
                ratingDiff: player.ratingDiff,
                seed: player.seed,
                wins: player.wins,
                losses: player.losses,
                ties: player.ties,
                spread: player.spread,
                averageScore: player.averageScore,
                averageOpponentScore: player.averageOpponentScore,
                highScore: player.highScore,
                photo: player.photo,
                xtPhotoUrl: player.xtPhotoUrl,
                rank: idx + 1 | 0
            };
        };
    })(players);
};

// | Calculate ranked player stats with given sort type
var calculateRankedStats = function (sortType) {
    return function (players) {
        return function (games) {
            return addRanks(sortPlayers(sortType)(calculateAllPlayerStats(players)(games)));
        };
    };
};
export {
    Standings,
    HighScore,
    AverageScore,
    RatingGain,
    calculatePlayerStats,
    calculateAllPlayerStats,
    sortByStandings,
    sortByHighScore,
    sortByAverageScore,
    sortByRatingGain,
    sortPlayers,
    addRanks,
    calculateRankedStats,
    eqSortType
};
