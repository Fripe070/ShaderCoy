import { EditorView } from "@codemirror/view";

function cssVar<T extends string>(variable: T): `var(--${T})` {
	return `var(--${variable})`;
}
function themeVar<T extends string>(variable: T): `var(--theme-${T})` {
	return `var(--theme-${variable})`;
}
function mix(color1: string, weight: number, color2: string): string {
	return `color-mix(in oklab, ${color1} ${weight}%, ${color2} ${100 - weight}%)`;
}

const hcSelectionColor = mix(
	mix(themeVar("accent"), 80, themeVar("background-tertiary")),
	50,
	"transparent"
);

const panelsThemeStyles = {
	"*": {
		fontFamily: cssVar("font-mono"),
		fontSize: "0.7rem",
		color: themeVar("foreground-primary"),
	},
	"&": {
		backgroundColor: themeVar("background-primary"),
		height: "100%",
		maxHeight: "100%",
		width: "100%",
	},
	".cm-scroller": {
		overflow: "auto",
	},
	".cm-gutters": {
		backgroundColor: themeVar("background-secondary"),
		color: themeVar("foreground-muted"),
		border: "none",
		userSelect: "none",
	},
	".cm-content": {
		caretColor: "red",
		paddingBottom: "3lh",
	},

	".cm-cursor, .cm-dropCursor": {
		borderLeftColor: themeVar("accent"),
	},
	".cm-selectionMatch": {
		backgroundColor: mix(hcSelectionColor, 60, "transparent"),
	},
	".cm-selectionBackground, .cm-content ::selection": {
		backgroundColor: `${hcSelectionColor} !important`,
	},
	".cm-activeLineGutter": {
		backgroundColor: mix(hcSelectionColor, 80, themeVar("background-secondary")),
	},
	".cm-activeLine": {
		backgroundColor: mix(hcSelectionColor, 15, "transparent"),
	},

	".cm-panels": {
		backgroundColor: themeVar("background-secondary"),
	},
	".cm-button, .cm-textfield": {
		height: `calc(${cssVar("spacing")} * 6)`,
		background: themeVar("background-primary"),
		color: themeVar("foreground-primary"),
		border: "none",
	},
	".cm-button:active": {
		background: themeVar("background-selected"),
	},
	"input[type=checkbox]": {
		width: `calc(${cssVar("spacing")} * 6)`,
		height: `calc(${cssVar("spacing")} * 6)`,
		backgroundColor: themeVar("background-primary"),
		border: "none !important",
	},
	"input[type=checkbox]:checked": {
		backgroundColor: themeVar("accent"),
	},
};

const theme = EditorView.theme(
	{
		...panelsThemeStyles,
	},
	{ dark: true }
);
export default theme;
