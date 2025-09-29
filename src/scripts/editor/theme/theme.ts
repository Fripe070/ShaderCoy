import * as themeColours from "./colours";
import type { ThemeColours } from "./colours";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

function genTheme(pallete: ThemeColours, dark: boolean): Extension {
    return EditorView.theme(
        // TODO: Replace hardcoded values with pallete
        {
            "&": {
                color: pallete.fgNormal,
                backgroundColor: pallete.bgNormal,
            },
            ".cm-content": {
                caretColor: pallete.fgAccent,
            },
            ".cm-cursor, .cm-dropCursor": {
                borderLeftColor: pallete.fgAccent,
            },
            "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection, .cm-selectionMatch":
                {
                    backgroundColor: pallete.bgSelection,
                },
            ".cm-panels": {
                backgroundColor: pallete.bgDark,
                color: pallete.fgNormal,
            },
            ".cm-searchMatch": {
                backgroundColor: pallete.bgMatch,
            },
            ".cm-button": {
                background: pallete.bgVeryDark,
                color: pallete.fgNormal,
                border: "none",
                outline: "none",
            },
            ".cm-textfield": {
                backgroundColor: pallete.bgVeryDark,
                color: pallete.fgNormal,
                border: "none",
                outline: "none",
            },
            ".cm-activeLine": {
                backgroundColor: pallete.bgCurrentLine,
            },
            "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
                backgroundColor: pallete.bgMatch,
            },
            ".cm-gutters": {
                backgroundColor: pallete.bgNormal,
                color: pallete.fgMuted,
                border: "none",
            },
            ".cm-activeLineGutter": {
                backgroundColor: pallete.bgHighlight,
            },
            ".cm-foldPlaceholder": {
                backgroundColor: "transparent",
                border: "none",
                color: pallete.fgNormal,
            },
            ".cm-tooltip": {
                border: "none",
                backgroundColor: pallete.bgTooltip,
            },
            ".cm-tooltip .cm-tooltip-arrow:before": {
                borderTopColor: "transparent",
                borderBottomColor: "transparent",
            },
            ".cm-tooltip .cm-tooltip-arrow:after": {
                borderTopColor: pallete.bgTooltip,
                borderBottomColor: pallete.bgTooltip,
            },
            ".cm-tooltip-autocomplete": {
                "& > ul > li[aria-selected]": {
                    backgroundColor: pallete.bgHighlight,
                    color: pallete.fgNormal,
                },
            },
        },
        { dark: dark },
    );
}

export const oneDarkTheme = genTheme(themeColours.darkTheme, true);
export const oneLightTheme = genTheme(themeColours.lightTheme, false);
