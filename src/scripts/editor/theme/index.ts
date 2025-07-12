import { syntaxHighlighting } from "@codemirror/language";
import { oneDarkTheme, oneLightTheme } from "./theme";
import { oneHighlightStyle } from "./highlighting";

export const oneDark = [oneDarkTheme, syntaxHighlighting(oneHighlightStyle)];
export const oneLight = [oneLightTheme, syntaxHighlighting(oneHighlightStyle)];
