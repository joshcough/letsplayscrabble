// | Theme configurations matching TypeScript themes
import * as Data_Foldable from "../Data.Foldable/index.js";
import * as Data_Map_Internal from "../Data.Map.Internal/index.js";
import * as Data_Maybe from "../Data.Maybe/index.js";
import * as Data_Ord from "../Data.Ord/index.js";
import * as Data_Tuple from "../Data.Tuple/index.js";
var lookup = /* #__PURE__ */ Data_Map_Internal.lookup(Data_Ord.ordString);

// | Scrabble theme (warm amber/brown)
var scrabbleTheme = {
    id: "scrabble",
    name: "Scrabble",
    colors: {
        pageBackground: "bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100",
        cardBackground: "bg-gradient-to-br from-amber-50/90 to-orange-50/80 backdrop-blur-xl",
        primaryBorder: "border-amber-900/80",
        secondaryBorder: "border-amber-800/40",
        titleGradient: "bg-gradient-to-r from-amber-900 via-amber-700 to-yellow-700",
        textPrimary: "text-amber-900",
        textSecondary: "text-amber-700",
        textAccent: "text-amber-800",
        positiveColor: "text-red-600",
        negativeColor: "text-blue-600",
        neutralColor: "text-amber-700",
        hoverBackground: "hover:bg-amber-900/10",
        shadowColor: "shadow-amber-900/20"
    }
};

// | Original theme (simple black and white)
var originalTheme = {
    id: "original",
    name: "Original",
    colors: {
        pageBackground: "bg-white",
        cardBackground: "bg-white",
        primaryBorder: "border-black",
        secondaryBorder: "border-gray-300",
        titleGradient: "text-black",
        textPrimary: "text-black",
        textSecondary: "text-gray-600",
        textAccent: "text-black",
        positiveColor: "text-red-600",
        negativeColor: "text-blue-600",
        neutralColor: "text-gray-600",
        hoverBackground: "hover:bg-gray-50",
        shadowColor: "shadow-gray-200"
    }
};

// | Modern theme (dark with blue accents)
var modernTheme = {
    id: "modern",
    name: "Modern",
    colors: {
        pageBackground: "bg-gradient-to-br from-gray-950 via-gray-900 to-black",
        cardBackground: "bg-gradient-to-br from-blue-900/50 to-gray-900/60 backdrop-blur-xl",
        primaryBorder: "border-blue-400/50",
        secondaryBorder: "border-blue-600/20",
        titleGradient: "bg-gradient-to-r from-blue-400 to-purple-600",
        textPrimary: "text-white",
        textSecondary: "text-gray-300",
        textAccent: "text-blue-400",
        positiveColor: "text-green-400",
        negativeColor: "text-red-400",
        neutralColor: "text-gray-400",
        hoverBackground: "hover:bg-blue-800/20",
        shadowColor: "shadow-blue-400/10"
    }
};

// | July 4th theme (patriotic red/white/blue)
var july4Theme = {
    id: "july4",
    name: "July 4th",
    colors: {
        pageBackground: "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800",
        cardBackground: "bg-gradient-to-br from-white/95 to-blue-50/90 backdrop-blur-xl",
        primaryBorder: "border-blue-800/80",
        secondaryBorder: "border-slate-600/70",
        titleGradient: "bg-gradient-to-r from-blue-600 via-red-600 to-blue-600",
        textPrimary: "text-slate-900",
        textSecondary: "text-slate-600",
        textAccent: "text-blue-800",
        positiveColor: "text-blue-700",
        negativeColor: "text-red-700",
        neutralColor: "text-slate-800",
        hoverBackground: "hover:bg-blue-100/30",
        shadowColor: "shadow-blue-900/20"
    }
};

// | All themes mapped by ID
var themes = /* #__PURE__ */ (function () {
    return Data_Map_Internal.fromFoldable(Data_Ord.ordString)(Data_Foldable.foldableArray)([ new Data_Tuple.Tuple("modern", modernTheme), new Data_Tuple.Tuple("scrabble", scrabbleTheme), new Data_Tuple.Tuple("july4", july4Theme), new Data_Tuple.Tuple("original", originalTheme) ]);
})();

// | Get theme by name, defaulting to scrabble theme
var getTheme = function (themeName) {
    return Data_Maybe.fromMaybe(scrabbleTheme)(lookup(themeName)(themes));
};

// | Default theme
var defaultTheme = scrabbleTheme;
export {
    modernTheme,
    scrabbleTheme,
    july4Theme,
    originalTheme,
    themes,
    getTheme,
    defaultTheme
};
