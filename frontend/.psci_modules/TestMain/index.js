import * as Component_Standings from "../Component.Standings/index.js";
import * as Control_Bind from "../Control.Bind/index.js";
import * as Data_Functor from "../Data.Functor/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Domain_Types from "../Domain.Types/index.js";
import * as Effect_Aff from "../Effect.Aff/index.js";
import * as Effect_Aff_Class from "../Effect.Aff.Class/index.js";
import * as Effect_Class from "../Effect.Class/index.js";
import * as Effect_Console from "../Effect.Console/index.js";
import * as Halogen_Aff_Util from "../Halogen.Aff.Util/index.js";
import * as Halogen_VDom_Driver from "../Halogen.VDom.Driver/index.js";
import * as Utils_UrlParams from "../Utils.UrlParams/index.js";
var discard = /* #__PURE__ */ Control_Bind.discard(Control_Bind.discardUnit)(Effect_Aff.bindAff);
var liftEffect = /* #__PURE__ */ Effect_Class.liftEffect(Effect_Aff.monadEffectAff);
var bind = /* #__PURE__ */ Control_Bind.bind(Effect_Aff.bindAff);
var map = /* #__PURE__ */ Data_Functor.map(Data_Maybe.functorMaybe);
var component = /* #__PURE__ */ Component_Standings.component(Effect_Aff_Class.monadAffAff);
var main = /* #__PURE__ */ Halogen_Aff_Util.runHalogenAff(/* #__PURE__ */ discard(/* #__PURE__ */ liftEffect(/* #__PURE__ */ Effect_Console.log("[TestMain] Starting with Standings component")))(function () {
    return bind(Halogen_Aff_Util.awaitBody)(function (body) {
        return discard(liftEffect(Effect_Console.log("[TestMain] Got body")))(function () {
            return bind(liftEffect(Utils_UrlParams.parseUrlParams))(function (urlParams) {
                return discard(liftEffect(Effect_Console.log("[TestMain] Parsed URL params")))(function () {
                    var input = {
                        userId: Data_Maybe.fromMaybe(1)(urlParams.userId),
                        tournamentId: map(Domain_Types.TournamentId)(urlParams.tournamentId),
                        divisionName: urlParams.divisionName
                    };
                    return discard(liftEffect(Effect_Console.log("[TestMain] Running Standings component")))(function () {
                        return bind(Halogen_VDom_Driver.runUI(component)(input)(body))(function () {
                            return liftEffect(Effect_Console.log("[TestMain] Standings component mounted"));
                        });
                    });
                });
            });
        });
    });
}));
export {
    main
};
