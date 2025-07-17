/**
 * GLSL ES 3.0 language support using Lezer parser
 *
 * This module provides advanced GLSL ES 3.0 syntax highlighting and language support
 * using Lezer's tree-based parser for richer language features.
 */

import { LanguageSupport, LRLanguage } from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";
import { parser } from "./glsl.parser";

/**
 * GLSL ES 3.0 language definition using Lezer
 */
export const glslLanguage = LRLanguage.define({
    parser: parser.configure({
        props: [
            styleTags({
                TypeName: t.typeName,
                StorageQualifier: t.modifier,
                Identifier: t.variableName,
                Number: t.number,
                Boolean: t.bool,
                "LineComment BlockComment": t.lineComment,
                "( )": t.paren,
                "[ ]": t.squareBracket,
                "{ }": t.brace,
                ". , ;": t.separator,
                "= += -= *= /= %= <<= >>= &= ^= |=": t.definitionOperator,
                "+ - * % / < > <= >= == != && || ? : ! ~ & | ^ << >>": t.operator,
                "if else for while do break continue return discard": t.controlKeyword,
                "const in out inout uniform varying attribute": t.definitionKeyword,
                "precision lowp mediump highp": t.modifier,
                struct: t.definitionKeyword,
                "void bool int uint float vec2 vec3 vec4 ivec2 ivec3 ivec4 uvec2 uvec3 uvec4 bvec2 bvec3 bvec4 mat2 mat3 mat4 sampler2D sampler3D samplerCube":
                    t.typeName,
            }),
        ],
    }),
    languageData: {
        commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
        indentOnInput: /^\s*[{}]$/,
        closeBrackets: { brackets: ["(", "[", "{", "'", '"'] },
        wordChars: "_",
    },
});

/**
 * Language support for GLSL ES 3.0 with Lezer parser.
 *
 * This provides richer language support than StreamLanguage including:
 * - Tree-based syntax analysis
 * - Better error recovery
 * - More precise semantic highlighting
 * - Support for advanced editor features
 */
export function glsl(): LanguageSupport {
    return new LanguageSupport(glslLanguage);
}
