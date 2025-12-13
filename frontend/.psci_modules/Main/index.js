// | Main entry point for PureScript frontend
import * as Component_Router from "../Component.Router/index.js";
import * as Control_Bind from "../Control.Bind/index.js";
import * as Data_Unit from "../Data.Unit/index.js";
import * as Effect_Aff from "../Effect.Aff/index.js";
import * as Effect_Aff_Class from "../Effect.Aff.Class/index.js";
import * as Effect_Class from "../Effect.Class/index.js";
import * as Effect_Class_Console from "../Effect.Class.Console/index.js";
import * as Halogen_Aff_Util from "../Halogen.Aff.Util/index.js";
import * as Halogen_VDom_Driver from "../Halogen.VDom.Driver/index.js";
var discard = /* #__PURE__ */ Control_Bind.discard(Control_Bind.discardUnit)(Effect_Aff.bindAff);
var liftEffect = /* #__PURE__ */ Effect_Class.liftEffect(Effect_Aff.monadEffectAff);
var log = /* #__PURE__ */ Effect_Class_Console.log(Effect_Class.monadEffectEffect);
var bind = /* #__PURE__ */ Control_Bind.bind(Effect_Aff.bindAff);
var component = /* #__PURE__ */ Component_Router.component(Effect_Aff_Class.monadAffAff);

// | Main entry point
// | Renders the Router component
var main = /* #__PURE__ */ Halogen_Aff_Util.runHalogenAff(/* #__PURE__ */ discard(/* #__PURE__ */ liftEffect(/* #__PURE__ */ log("[Main] Starting router...")))(function () {
    return bind(Halogen_Aff_Util.awaitBody)(function (body) {
        return discard(liftEffect(log("[Main] Got body, mounting router")))(function () {
            return bind(Halogen_VDom_Driver.runUI(component)(Data_Unit.unit)(body))(function () {
                return liftEffect(log("[Main] Router mounted"));
            });
        });
    });
}));
export {
    main
};
