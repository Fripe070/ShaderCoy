import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export const highlightStyle = HighlightStyle.define([
	{
		tag: tags.keyword,
		color: "red",
	},
]);

const highlighting = syntaxHighlighting(highlightStyle);
export default highlighting;
