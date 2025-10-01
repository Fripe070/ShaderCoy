import * as themeColours from "./colours";
import type { ThemeColours } from "./colours";
import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

function genHighlightStyle(pallete: ThemeColours): HighlightStyle {
    return HighlightStyle.define([
        {
            tag: tags.keyword,
            color: pallete.fgPurple,
        },
        {
            tag: [tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName],
            color: pallete.fgRed,
        },
        {
            tag: [tags.function(tags.variableName), tags.labelName],
            color: pallete.fgBlue,
        },
        {
            tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)],
            color: pallete.fgOrangeDark,
        },
        {
            tag: [tags.definition(tags.name), tags.separator],
            color: pallete.fgNormal,
        },
        {
            tag: [
                tags.typeName,
                tags.className,
                tags.number,
                tags.changed,
                tags.annotation,
                tags.modifier,
                tags.self,
                tags.namespace,
            ],
            color: pallete.fgOrange,
        },
        {
            tag: [
                tags.operator,
                tags.operatorKeyword,
                tags.url,
                tags.escape,
                tags.regexp,
                tags.link,
                tags.special(tags.string),
            ],
            color: pallete.fgCyan,
        },
        {
            tag: [tags.meta, tags.comment],
            color: pallete.fgMuted,
        },
        {
            tag: tags.strong,
            fontWeight: "bold",
        },
        {
            tag: tags.emphasis,
            fontStyle: "italic",
        },
        {
            tag: tags.strikethrough,
            textDecoration: "line-through",
        },
        {
            tag: tags.link,
            color: pallete.fgMuted,
            textDecoration: "underline",
        },
        {
            tag: tags.heading,
            fontWeight: "bold",
            color: pallete.fgRed,
        },
        {
            tag: [tags.atom, tags.bool, tags.special(tags.variableName)],
            color: pallete.fgOrangeDark,
        },
        {
            tag: [tags.processingInstruction, tags.string, tags.inserted],
            color: pallete.fgGreen,
        },
        {
            tag: tags.invalid,
            color: pallete.fgContrast,
        },
    ]);
}

export const oneHighlightStyle = genHighlightStyle(themeColours.darkTheme);
export default oneHighlightStyle;
