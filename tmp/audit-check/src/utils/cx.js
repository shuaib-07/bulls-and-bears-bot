"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cx = void 0;
exports.sortCx = sortCx;
const tailwind_merge_1 = require("tailwind-merge");
/**
 * Text-style classes from styles/typography.css.
 *
 * IMPORTANT: every text-* utility we define via @theme (e.g. `text-body-medium`,
 * `text-title-1-semibold`) must be listed here. Otherwise tailwind-merge — which
 * has no view of our Tailwind theme — treats them as text-color utilities and
 * silently drops them when they appear in the same className as a real color
 * (`text-foreground-full`, `text-text-primary`, etc).
 *
 * If you add or rename a text style in typography.css, mirror the change here.
 */
const TEXT_FAMILIES = [
    "large-title",
    "display-1",
    "display-2",
    "display-3",
    "display-4",
    "title-1",
    "title-2",
    "title-3",
    "headline",
    "body",
    "body-2",
    "caption-1",
    "caption-2",
];
const TEXT_WEIGHTS = ["regular", "medium", "semibold", "bold"];
const TEXT_STYLE_SUFFIXES = TEXT_FAMILIES.flatMap((family) => TEXT_WEIGHTS.map((weight) => `${family}-${weight}`));
const twMerge = (0, tailwind_merge_1.extendTailwindMerge)({
    extend: {
        classGroups: {
            "font-size": [{ text: TEXT_STYLE_SUFFIXES }],
        },
    },
});
/**
 * Merge Tailwind classes safely. Last-write-wins on conflicting utilities.
 */
exports.cx = twMerge;
/**
 * Identity helper that gives the Tailwind IntelliSense extension a hook for
 * sorting classes inside style objects (the extension doesn't sort inside
 * plain object literals otherwise).
 */
function sortCx(classes) {
    return classes;
}
