import { oneHighlightStyle } from "./highlighting";
import { oneDarkTheme, oneLightTheme } from "./theme";
import { syntaxHighlighting } from "@codemirror/language";

export const oneDark = [oneDarkTheme, syntaxHighlighting(oneHighlightStyle)];
export const oneLight = [oneLightTheme, syntaxHighlighting(oneHighlightStyle)];
