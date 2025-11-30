// | Player image utilities
import * as Data_Maybe from "../Data.Maybe/index.js";

// | Placeholder SVG for when no image is available
var placeholderImageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='150' height='150' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%236b7280'%3ENo Photo%3C/text%3E%3C/svg%3E";

// | Get player image URL with proper fallback logic
// | Priority: file photo → CrossTables photo → placeholder
var getPlayerImageUrl = function (tournamentDataUrl) {
    return function (filePhoto) {
        return function (xtPhoto) {
            if (filePhoto instanceof Data_Maybe.Just) {
                return tournamentDataUrl + ("/" + filePhoto.value0);
            };
            if (filePhoto instanceof Data_Maybe.Nothing) {
                if (xtPhoto instanceof Data_Maybe.Just) {
                    return xtPhoto.value0;
                };
                if (xtPhoto instanceof Data_Maybe.Nothing) {
                    return placeholderImageUrl;
                };
                throw new Error("Failed pattern match at Utils.PlayerImage (line 14, column 16 - line 16, column 37): " + [ xtPhoto.constructor.name ]);
            };
            throw new Error("Failed pattern match at Utils.PlayerImage (line 12, column 3 - line 16, column 37): " + [ filePhoto.constructor.name ]);
        };
    };
};
export {
    getPlayerImageUrl,
    placeholderImageUrl
};
