// | Core domain types for tournament data
// | Pure business logic types, no persistence concerns
import * as Data_Argonaut_Decode_Class from "../Data.Argonaut.Decode.Class/index.js";
import * as Data_Argonaut_Encode_Class from "../Data.Argonaut.Encode.Class/index.js";
import * as Data_Eq from "../Data.Eq/index.js";
import * as Data_Ord from "../Data.Ord/index.js";
import * as Data_Show from "../Data.Show/index.js";
var XTId = function (x) {
    return x;
};

// | Newtypes for type safety
var TournamentId = function (x) {
    return x;
};
var PlayerId = function (x) {
    return x;
};
var PairingId = function (x) {
    return x;
};
var GameId = function (x) {
    return x;
};
var DivisionId = function (x) {
    return x;
};
var showXTId = Data_Show.showInt;
var showTournamentId = Data_Show.showInt;
var showPlayerId = Data_Show.showInt;
var showPairingId = Data_Show.showInt;
var showGameId = Data_Show.showInt;
var showDivisionId = Data_Show.showInt;
var ordXTId = Data_Ord.ordInt;
var ordTournamentId = Data_Ord.ordInt;
var ordPlayerId = Data_Ord.ordInt;
var ordPairingId = Data_Ord.ordInt;
var ordGameId = Data_Ord.ordInt;
var ordDivisionId = Data_Ord.ordInt;
var newtypeXTId = {
    Coercible0: function () {
        return undefined;
    }
};
var newtypeTournamentId = {
    Coercible0: function () {
        return undefined;
    }
};
var newtypePlayerId = {
    Coercible0: function () {
        return undefined;
    }
};
var newtypePairingId = {
    Coercible0: function () {
        return undefined;
    }
};
var newtypeGameId = {
    Coercible0: function () {
        return undefined;
    }
};
var newtypeDivisionId = {
    Coercible0: function () {
        return undefined;
    }
};
var eqXTId = Data_Eq.eqInt;
var eqTournamentId = Data_Eq.eqInt;
var eqPlayerId = Data_Eq.eqInt;
var eqPairingId = Data_Eq.eqInt;
var eqGameId = Data_Eq.eqInt;
var eqDivisionId = Data_Eq.eqInt;
var encodeJsonXTId = Data_Argonaut_Encode_Class.encodeJsonInt;
var encodeJsonTournamentId = Data_Argonaut_Encode_Class.encodeJsonInt;
var encodeJsonPlayerId = Data_Argonaut_Encode_Class.encodeJsonInt;
var encodeJsonPairingId = Data_Argonaut_Encode_Class.encodeJsonInt;
var encodeJsonGameId = Data_Argonaut_Encode_Class.encodeJsonInt;
var encodeJsonDivisionId = Data_Argonaut_Encode_Class.encodeJsonInt;
var decodeJsonXTId = Data_Argonaut_Decode_Class.decodeJsonInt;
var decodeJsonTournamentId = Data_Argonaut_Decode_Class.decodeJsonInt;
var decodeJsonPlayerId = Data_Argonaut_Decode_Class.decodeJsonInt;
var decodeJsonPairingId = Data_Argonaut_Decode_Class.decodeJsonInt;
var decodeJsonGameId = Data_Argonaut_Decode_Class.decodeJsonInt;
var decodeJsonDivisionId = Data_Argonaut_Decode_Class.decodeJsonInt;
export {
    TournamentId,
    DivisionId,
    PlayerId,
    GameId,
    PairingId,
    XTId,
    newtypeTournamentId,
    newtypeDivisionId,
    newtypePlayerId,
    newtypeGameId,
    newtypePairingId,
    newtypeXTId,
    eqTournamentId,
    eqDivisionId,
    eqPlayerId,
    eqGameId,
    eqPairingId,
    eqXTId,
    ordTournamentId,
    ordDivisionId,
    ordPlayerId,
    ordGameId,
    ordPairingId,
    ordXTId,
    encodeJsonTournamentId,
    decodeJsonTournamentId,
    encodeJsonDivisionId,
    decodeJsonDivisionId,
    encodeJsonPlayerId,
    decodeJsonPlayerId,
    encodeJsonGameId,
    decodeJsonGameId,
    encodeJsonPairingId,
    decodeJsonPairingId,
    encodeJsonXTId,
    decodeJsonXTId,
    showTournamentId,
    showDivisionId,
    showPlayerId,
    showGameId,
    showPairingId,
    showXTId
};
