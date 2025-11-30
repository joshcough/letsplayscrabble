// | Base overlay component
// | Handles broadcast channel subscription and tournament data fetching
// | All overlay components should use this as their base
import * as BroadcastChannel_Manager from "../BroadcastChannel.Manager/index.js";
import * as Config_Themes from "../Config.Themes/index.js";
import * as Control_Applicative from "../Control.Applicative/index.js";
import * as Control_Bind from "../Control.Bind/index.js";
import * as Control_Monad_State_Class from "../Control.Monad.State.Class/index.js";
import * as Data_Array from "../Data.Array/index.js";
import * as Data_Functor from "../Data.Functor/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Data_Show from "../Data.Show/index.js";
import * as Data_Unit from "../Data.Unit/index.js";
import * as Domain_Types from "../Domain.Types/index.js";
import * as Effect_Class from "../Effect.Class/index.js";
import * as Effect_Console from "../Effect.Console/index.js";
import * as Halogen_HTML_Core from "../Halogen.HTML.Core/index.js";
import * as Halogen_HTML_Elements from "../Halogen.HTML.Elements/index.js";
import * as Halogen_HTML_Properties from "../Halogen.HTML.Properties/index.js";
import * as Halogen_Query_HalogenM from "../Halogen.Query.HalogenM/index.js";
import * as Halogen_Subscription from "../Halogen.Subscription/index.js";
import * as Stats_PlayerStats from "../Stats.PlayerStats/index.js";
var discard = /* #__PURE__ */ Control_Bind.discard(Control_Bind.discardUnit)(Halogen_Query_HalogenM.bindHalogenM);
var bind = /* #__PURE__ */ Control_Bind.bind(Halogen_Query_HalogenM.bindHalogenM);
var get = /* #__PURE__ */ Control_Monad_State_Class.get(Halogen_Query_HalogenM.monadStateHalogenM);
var modify_ = /* #__PURE__ */ Control_Monad_State_Class.modify_(Halogen_Query_HalogenM.monadStateHalogenM);
var show = /* #__PURE__ */ Data_Show.show(Data_Show.showInt);
var show1 = /* #__PURE__ */ Data_Show.show(/* #__PURE__ */ Data_Maybe.showMaybe(Domain_Types.showTournamentId));
var show2 = /* #__PURE__ */ Data_Show.show(/* #__PURE__ */ Data_Maybe.showMaybe(Data_Show.showString));
var $$void = /* #__PURE__ */ Data_Functor["void"](Halogen_Query_HalogenM.functorHalogenM);
var mapFlipped = /* #__PURE__ */ Data_Functor.mapFlipped(Halogen_Subscription.functorEmitter);
var show3 = /* #__PURE__ */ Data_Show.show(Domain_Types.showTournamentId);
var postSubscribe = /* #__PURE__ */ BroadcastChannel_Manager.postSubscribe(Effect_Class.monadEffectEffect);
var show4 = /* #__PURE__ */ Data_Show.show(Data_Show.showBoolean);
var pure = /* #__PURE__ */ Control_Applicative.pure(Halogen_Query_HalogenM.applicativeHalogenM);

// | Component actions
var Initialize = /* #__PURE__ */ (function () {
    function Initialize() {

    };
    Initialize.value = new Initialize();
    return Initialize;
})();

// | Component actions
var HandleTournamentData = /* #__PURE__ */ (function () {
    function HandleTournamentData(value0) {
        this.value0 = value0;
    };
    HandleTournamentData.create = function (value0) {
        return new HandleTournamentData(value0);
    };
    return HandleTournamentData;
})();

// | Component actions
var Finalize = /* #__PURE__ */ (function () {
    function Finalize() {

    };
    Finalize.value = new Finalize();
    return Finalize;
})();

// | Render loading state
var renderLoading = /* #__PURE__ */ Halogen_HTML_Elements.div([ /* #__PURE__ */ Halogen_HTML_Properties.class_("flex items-center justify-center h-screen") ])([ /* #__PURE__ */ Halogen_HTML_Core.text("Loading...") ]);

// | Render error state
var renderError = function (err) {
    return Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_("flex items-center justify-center h-screen text-red-600") ])([ Halogen_HTML_Core.text("Error: " + err) ]);
};

// | Initialize the base overlay state
var initialState = function (sortType) {
    return function (input) {
        return {
            manager: Data_Maybe.Nothing.value,
            tournament: Data_Maybe.Nothing.value,
            players: [  ],
            divisionName: "",
            loading: true,
            error: Data_Maybe.Nothing.value,
            theme: Config_Themes.getTheme("scrabble"),
            input: new Data_Maybe.Just(input),
            sortType: sortType,
            subscribedToCurrentMatch: (function () {
                if (input.tournamentId instanceof Data_Maybe.Nothing) {
                    return true;
                };
                if (input.tournamentId instanceof Data_Maybe.Just) {
                    return false;
                };
                throw new Error("Failed pattern match at Component.BaseOverlay (line 62, column 31 - line 64, column 22): " + [ input.tournamentId.constructor.name ]);
            })()
        };
    };
};

// | Handle base overlay actions
var handleAction = function (dictMonadAff) {
    var monadEffectHalogenM = Halogen_Query_HalogenM.monadEffectHalogenM(dictMonadAff.MonadEffect0());
    var liftEffect = Effect_Class.liftEffect(monadEffectHalogenM);
    var close = BroadcastChannel_Manager.close(monadEffectHalogenM);
    return function (v) {
        if (v instanceof Initialize) {
            return discard(liftEffect(Effect_Console.log("[BaseOverlay] Initialize called")))(function () {
                return bind(get)(function (state) {
                    if (state.input instanceof Data_Maybe.Nothing) {
                        return discard(liftEffect(Effect_Console.log("[BaseOverlay] ERROR: No input found in state")))(function () {
                            return modify_(function (v1) {
                                var $32 = {};
                                for (var $33 in v1) {
                                    if ({}.hasOwnProperty.call(v1, $33)) {
                                        $32[$33] = v1[$33];
                                    };
                                };
                                $32.error = new Data_Maybe.Just("No tournament parameters provided");
                                $32.loading = false;
                                return $32;
                            });
                        });
                    };
                    if (state.input instanceof Data_Maybe.Just) {
                        return discard(liftEffect(Effect_Console.log("[BaseOverlay] Input: userId=" + (show(state.input.value0.userId) + (", tournamentId=" + (show1(state.input.value0.tournamentId) + (", divisionName=" + show2(state.input.value0.divisionName))))))))(function () {
                            return discard(liftEffect(Effect_Console.log("[BaseOverlay] Creating broadcast manager")))(function () {
                                return bind(liftEffect(BroadcastChannel_Manager.create))(function (manager) {
                                    return discard(liftEffect(Effect_Console.log("[BaseOverlay] Subscribing to tournament data responses")))(function () {
                                        return discard($$void(Halogen_Query_HalogenM.subscribe(mapFlipped(manager.tournamentDataResponseEmitter)(HandleTournamentData.create))))(function () {
                                            return discard(modify_(function (v1) {
                                                var $35 = {};
                                                for (var $36 in v1) {
                                                    if ({}.hasOwnProperty.call(v1, $36)) {
                                                        $35[$36] = v1[$36];
                                                    };
                                                };
                                                $35.manager = new Data_Maybe.Just(manager);
                                                return $35;
                                            }))(function () {
                                                var tournament = (function () {
                                                    if (state.input.value0.tournamentId instanceof Data_Maybe.Nothing) {
                                                        return Data_Maybe.Nothing.value;
                                                    };
                                                    if (state.input.value0.tournamentId instanceof Data_Maybe.Just) {
                                                        return new Data_Maybe.Just({
                                                            tournamentId: state.input.value0.tournamentId.value0,
                                                            division: (function () {
                                                                if (state.input.value0.divisionName instanceof Data_Maybe.Nothing) {
                                                                    return Data_Maybe.Nothing.value;
                                                                };
                                                                if (state.input.value0.divisionName instanceof Data_Maybe.Just) {
                                                                    return new Data_Maybe.Just({
                                                                        divisionName: state.input.value0.divisionName.value0
                                                                    });
                                                                };
                                                                throw new Error("Failed pattern match at Component.BaseOverlay (line 102, column 27 - line 104, column 59): " + [ state.input.value0.divisionName.constructor.name ]);
                                                            })()
                                                        });
                                                    };
                                                    throw new Error("Failed pattern match at Component.BaseOverlay (line 98, column 24 - line 105, column 16): " + [ state.input.value0.tournamentId.constructor.name ]);
                                                })();
                                                var subscribeMsg = {
                                                    userId: state.input.value0.userId,
                                                    tournament: tournament
                                                };
                                                var logMsg = (function () {
                                                    if (tournament instanceof Data_Maybe.Nothing) {
                                                        return "[BaseOverlay] Sending subscribe message for current match";
                                                    };
                                                    if (tournament instanceof Data_Maybe.Just) {
                                                        return "[BaseOverlay] Sending subscribe message for tournament " + show3(tournament.value0.tournamentId);
                                                    };
                                                    throw new Error("Failed pattern match at Component.BaseOverlay (line 113, column 20 - line 115, column 103): " + [ tournament.constructor.name ]);
                                                })();
                                                return discard(liftEffect(Effect_Console.log(logMsg)))(function () {
                                                    return discard(liftEffect(postSubscribe(manager)(subscribeMsg)))(function () {
                                                        return liftEffect(Effect_Console.log("[BaseOverlay] Subscribe message sent"));
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    };
                    throw new Error("Failed pattern match at Component.BaseOverlay (line 74, column 5 - line 119, column 72): " + [ state.input.constructor.name ]);
                });
            });
        };
        if (v instanceof HandleTournamentData) {
            return bind(get)(function (state) {
                var shouldAccept = (function () {
                    if (state.subscribedToCurrentMatch) {
                        return v.value0.isCurrentMatch;
                    };
                    if (state.input instanceof Data_Maybe.Nothing) {
                        return false;
                    };
                    if (state.input instanceof Data_Maybe.Just) {
                        if (state.input.value0.tournamentId instanceof Data_Maybe.Nothing) {
                            return false;
                        };
                        if (state.input.value0.tournamentId instanceof Data_Maybe.Just) {
                            return state.input.value0.tournamentId.value0 === v.value0.tournamentId;
                        };
                        throw new Error("Failed pattern match at Component.BaseOverlay (line 129, column 27 - line 133, column 38): " + [ state.input.value0.tournamentId.constructor.name ]);
                    };
                    throw new Error("Failed pattern match at Component.BaseOverlay (line 127, column 16 - line 133, column 38): " + [ state.input.constructor.name ]);
                })();
                var $51 = !shouldAccept;
                if ($51) {
                    return liftEffect(Effect_Console.log("[BaseOverlay] Ignoring tournament data response (isCurrentMatch=" + (show4(v.value0.isCurrentMatch) + (", subscribedToCurrentMatch=" + (show4(state.subscribedToCurrentMatch) + ")")))));
                };
                return discard(liftEffect(Effect_Console.log("[BaseOverlay] Received tournament data response")))(function () {
                    return discard(liftEffect(Effect_Console.log("[BaseOverlay] Division: " + v.value0.data.division.name)))(function () {
                        return discard(liftEffect(Effect_Console.log("[BaseOverlay] Players count: " + show(Data_Array.length(v.value0.data.division.players)))))(function () {
                            return discard(liftEffect(Effect_Console.log("[BaseOverlay] Games count: " + show(Data_Array.length(v.value0.data.division.games)))))(function () {
                                var theme = Config_Themes.getTheme(v.value0.data.tournament.theme);
                                return discard(liftEffect(Effect_Console.log("[BaseOverlay] Using theme: " + v.value0.data.tournament.theme)))(function () {
                                    var players = Stats_PlayerStats.calculateRankedStats(state.sortType)(v.value0.data.division.players)(v.value0.data.division.games);
                                    return discard(liftEffect(Effect_Console.log("[BaseOverlay] Calculated " + (show(Data_Array.length(players)) + " ranked players"))))(function () {
                                        return discard(modify_(function (v1) {
                                            var $52 = {};
                                            for (var $53 in v1) {
                                                if ({}.hasOwnProperty.call(v1, $53)) {
                                                    $52[$53] = v1[$53];
                                                };
                                            };
                                            $52.tournament = new Data_Maybe.Just(v.value0.data);
                                            $52.players = players;
                                            $52.divisionName = v.value0.data.division.name;
                                            $52.theme = theme;
                                            $52.loading = false;
                                            $52.error = Data_Maybe.Nothing.value;
                                            return $52;
                                        }))(function () {
                                            return liftEffect(Effect_Console.log("[BaseOverlay] State updated with tournament data"));
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        };
        if (v instanceof Finalize) {
            return bind(get)(function (state) {
                if (state.manager instanceof Data_Maybe.Just) {
                    return close(state.manager.value0);
                };
                if (state.manager instanceof Data_Maybe.Nothing) {
                    return pure(Data_Unit.unit);
                };
                throw new Error("Failed pattern match at Component.BaseOverlay (line 171, column 5 - line 173, column 27): " + [ state.manager.constructor.name ]);
            });
        };
        throw new Error("Failed pattern match at Component.BaseOverlay (line 69, column 16 - line 173, column 27): " + [ v.constructor.name ]);
    };
};
export {
    Initialize,
    HandleTournamentData,
    Finalize,
    initialState,
    handleAction,
    renderLoading,
    renderError
};
