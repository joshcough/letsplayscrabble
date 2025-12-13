// | Standings Overlay Component
// | Displays tournament standings sorted by wins/losses/spread
import * as Component_BaseOverlay from "../Component.BaseOverlay/index.js";
import * as Data_Array from "../Data.Array/index.js";
import * as Data_Boolean from "../Data.Boolean/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Data_Show from "../Data.Show/index.js";
import * as Halogen_Component from "../Halogen.Component/index.js";
import * as Halogen_HTML_Core from "../Halogen.HTML.Core/index.js";
import * as Halogen_HTML_Elements from "../Halogen.HTML.Elements/index.js";
import * as Halogen_HTML_Properties from "../Halogen.HTML.Properties/index.js";
import * as Stats_PlayerStats from "../Stats.PlayerStats/index.js";
import * as Utils_FormatUtils from "../Utils.FormatUtils/index.js";
var show = /* #__PURE__ */ Data_Show.show(Data_Show.showInt);
var getSpreadColor = function (theme) {
    return function (spread) {
        if (spread > 0) {
            return "text-red-600";
        };
        if (spread < 0) {
            return "text-blue-600";
        };
        if (Data_Boolean.otherwise) {
            return theme.colors.textPrimary;
        };
        throw new Error("Failed pattern match at Component.Standings (line 117, column 1 - line 117, column 37): " + [ theme.constructor.name, spread.constructor.name ]);
    };
};
var renderPlayerRow = function (theme) {
    return function (index) {
        return function (player) {
            return Halogen_HTML_Elements.tr([ Halogen_HTML_Properties.class_(theme.colors.cardBackground) ])([ Halogen_HTML_Elements.td([ Halogen_HTML_Properties.class_("py-5 px-8 " + (theme.colors.textPrimary + " text-3xl font-black")) ])([ Halogen_HTML_Core.text("#" + show(player.rank)) ]), Halogen_HTML_Elements.td([ Halogen_HTML_Properties.class_("py-5 px-8 " + (theme.colors.textPrimary + " text-3xl font-bold")) ])([ Halogen_HTML_Core.text(player.name) ]), Halogen_HTML_Elements.td([ Halogen_HTML_Properties.class_("py-5 px-8 text-center " + (theme.colors.textPrimary + " text-3xl font-bold")) ])([ Halogen_HTML_Core.text(show(player.wins) + ("-" + (show(player.losses) + (function () {
                var $10 = player.ties > 0;
                if ($10) {
                    return "-" + show(player.ties);
                };
                return "";
            })()))) ]), Halogen_HTML_Elements.td([ Halogen_HTML_Properties.class_("py-5 px-8 text-center text-3xl font-bold " + getSpreadColor(theme)(player.spread)) ])([ Halogen_HTML_Core.text(Utils_FormatUtils.formatNumberWithSign(player.spread)) ]) ]);
        };
    };
};
var renderStandings = function (state) {
    if (state.tournament instanceof Data_Maybe.Nothing) {
        return Component_BaseOverlay.renderError("No tournament data");
    };
    if (state.tournament instanceof Data_Maybe.Just) {
        var topPlayers = Data_Array.take(10)(state.players);
        return Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_(state.theme.colors.pageBackground + " min-h-screen p-8") ])([ Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_("max-w-7xl mx-auto") ])([ Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_("text-center mb-12") ])([ Halogen_HTML_Elements.h1([ Halogen_HTML_Properties.class_("text-7xl font-black leading-tight mb-6 " + (function () {
            var $12 = state.theme.name === "original";
            if ($12) {
                return state.theme.colors.titleGradient;
            };
            return "text-transparent bg-clip-text " + state.theme.colors.titleGradient;
        })()) ])([ Halogen_HTML_Core.text("Standings") ]), Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_("text-4xl font-bold " + state.theme.colors.textSecondary) ])([ Halogen_HTML_Core.text(state.tournament.value0.tournament.name + (" " + (state.tournament.value0.tournament.lexicon + (" \u2022 Division " + state.divisionName)))) ]) ]), Halogen_HTML_Elements.div([ Halogen_HTML_Properties.class_(state.theme.colors.cardBackground + (" rounded-2xl shadow-2xl border-2 " + (state.theme.colors.primaryBorder + " overflow-hidden"))) ])([ Halogen_HTML_Elements.table([ Halogen_HTML_Properties.class_("w-full") ])([ Halogen_HTML_Elements.thead_([ Halogen_HTML_Elements.tr([ Halogen_HTML_Properties.class_(state.theme.colors.cardBackground) ])([ Halogen_HTML_Elements.th([ Halogen_HTML_Properties.class_("py-6 px-8 text-left " + (state.theme.colors.textPrimary + " text-2xl font-black")) ])([ Halogen_HTML_Core.text("Rank") ]), Halogen_HTML_Elements.th([ Halogen_HTML_Properties.class_("py-6 px-8 text-left " + (state.theme.colors.textPrimary + " text-2xl font-black")) ])([ Halogen_HTML_Core.text("Player") ]), Halogen_HTML_Elements.th([ Halogen_HTML_Properties.class_("py-6 px-8 text-center " + (state.theme.colors.textPrimary + " text-2xl font-black")) ])([ Halogen_HTML_Core.text("Record") ]), Halogen_HTML_Elements.th([ Halogen_HTML_Properties.class_("py-6 px-8 text-center " + (state.theme.colors.textPrimary + " text-2xl font-black")) ])([ Halogen_HTML_Core.text("Spread") ]) ]) ]), Halogen_HTML_Elements.tbody_(Data_Array.mapWithIndex(renderPlayerRow(state.theme))(topPlayers)) ]) ]) ]) ]);
    };
    throw new Error("Failed pattern match at Component.Standings (line 50, column 3 - line 95, column 12): " + [ state.tournament.constructor.name ]);
};
var render = function (state) {
    if (state.loading) {
        return Component_BaseOverlay.renderLoading;
    };
    if (state.error instanceof Data_Maybe.Just) {
        return Component_BaseOverlay.renderError(state.error.value0);
    };
    if (state.error instanceof Data_Maybe.Nothing) {
        if (state.tournament instanceof Data_Maybe.Just) {
            return renderStandings(state);
        };
        if (state.tournament instanceof Data_Maybe.Nothing) {
            return Component_BaseOverlay.renderError("No tournament data");
        };
        throw new Error("Failed pattern match at Component.Standings (line 44, column 16 - line 46, column 62): " + [ state.tournament.constructor.name ]);
    };
    throw new Error("Failed pattern match at Component.Standings (line 42, column 8 - line 46, column 62): " + [ state.error.constructor.name ]);
};

// | Standings component
var component = function (dictMonadAff) {
    return Halogen_Component.mkComponent({
        initialState: Component_BaseOverlay.initialState(Stats_PlayerStats.Standings.value),
        render: render,
        "eval": Halogen_Component.mkEval({
            handleQuery: Halogen_Component.defaultEval.handleQuery,
            receive: Halogen_Component.defaultEval.receive,
            handleAction: Component_BaseOverlay.handleAction(dictMonadAff),
            initialize: new Data_Maybe.Just(Component_BaseOverlay.Initialize.value),
            finalize: new Data_Maybe.Just(Component_BaseOverlay.Finalize.value)
        })
    });
};
export {
    component,
    render,
    renderStandings,
    renderPlayerRow,
    getSpreadColor
};
