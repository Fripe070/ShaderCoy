/**
 * Custom GLSL ES 3.0 language support for CodeMirror
 * 
 * This module provides GLSL ES 3.0 syntax highlighting and language support
 * following the GLSL ES 3.0 specification.
 */

import { 
    LanguageSupport,
    StreamLanguage,
    indentUnit
} from '@codemirror/language';

// GLSL ES 3.0 Keywords
const keywords = new Set([
    // Control flow
    "if", "else", "for", "while", "do", "break", "continue", "return", "discard",
    
    // Storage qualifiers
    "const", "in", "out", "inout", "uniform", "varying", "attribute", "centroid", "flat", "smooth", "noperspective",
    
    // Precision qualifiers
    "precision", "lowp", "mediump", "highp",
    
    // Invariant qualifiers
    "invariant",
    
    // Layout qualifiers
    "layout",
    
    // Struct
    "struct",
    
    // Version directive
    "version"
]);

// GLSL ES 3.0 Built-in types
const types = new Set([
    // Scalar types
    "void", "bool", "int", "uint", "float",
    
    // Vector types
    "vec2", "vec3", "vec4",
    "ivec2", "ivec3", "ivec4",
    "uvec2", "uvec3", "uvec4",
    "bvec2", "bvec3", "bvec4",
    
    // Matrix types
    "mat2", "mat3", "mat4",
    "mat2x2", "mat2x3", "mat2x4",
    "mat3x2", "mat3x3", "mat3x4", 
    "mat4x2", "mat4x3", "mat4x4",
    
    // Sampler types
    "sampler2D", "sampler3D", "samplerCube", "samplerCubeShadow",
    "sampler2DShadow", "sampler2DArray", "sampler2DArrayShadow",
    "isampler2D", "isampler3D", "isamplerCube", "isampler2DArray",
    "usampler2D", "usampler3D", "usamplerCube", "usampler2DArray"
]);

// GLSL ES 3.0 Built-in constants
const builtinConstants = new Set([
    "gl_MaxVertexAttribs", "gl_MaxVertexUniformVectors", "gl_MaxVaryingVectors",
    "gl_MaxVertexTextureImageUnits", "gl_MaxCombinedTextureImageUnits",
    "gl_MaxTextureImageUnits", "gl_MaxFragmentUniformVectors", "gl_MaxDrawBuffers"
]);

// GLSL ES 3.0 Built-in variables
const builtinVariables = new Set([
    "gl_Position", "gl_PointSize", "gl_FragCoord", "gl_FrontFacing", 
    "gl_FragColor", "gl_FragData", "gl_PointCoord", "gl_VertexID", "gl_InstanceID"
]);

// Boolean literals
const booleans = new Set(["true", "false"]);

interface StreamParserState {
    tokenize: ((stream: StreamParserStream, state: StreamParserState) => string | null) | null;
    indent: number;
}

interface StreamParserStream {
    eatSpace(): boolean;
    sol(): boolean;
    eat(char: string): boolean;
    match(pattern: string | RegExp): boolean;
    skipToEnd(): void;
    current(): string;
    next(): string;
}

/**
 * Simple GLSL ES 3.0 stream parser
 */
const glslStreamParser = {
    name: "glsl",
    
    token(stream: StreamParserStream, state: StreamParserState): string | null {
        // Skip whitespace
        if (stream.eatSpace()) return null;
        
        // Handle preprocessor directives
        if (stream.sol() && stream.eat("#")) {
            stream.skipToEnd();
            return "meta";
        }
        
        // Handle line comments
        if (stream.match("//")) {
            stream.skipToEnd();
            return "comment";
        }
        
        // Handle block comments
        if (stream.match("/*")) {
            state.tokenize = tokenComment;
            return state.tokenize(stream, state);
        }
        
        // Handle numbers (including scientific notation)
        if (stream.match(/^[+-]?(?:\d*\.)?\d+(?:[eE][+-]?\d+)?[fF]?/)) {
            return "number";
        }
        
        // Handle strings
        if (stream.eat('"')) {
            state.tokenize = tokenString('"');
            return state.tokenize(stream, state);
        }
        
        // Handle identifiers and keywords
        if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
            const word = stream.current();
            
            if (keywords.has(word)) return "keyword";
            if (types.has(word)) return "type";
            if (builtinConstants.has(word)) return "builtin";
            if (builtinVariables.has(word)) return "builtin";
            if (booleans.has(word)) return "atom";
            
            return "variable";
        }
        
        // Handle operators and punctuation
        if (stream.match(/^[+\-*/%=!<>&|^~?:;,.()[\]{}]/)) {
            return "operator";
        }
        
        // Skip unknown characters
        stream.next();
        return null;
    },
    
    startState(): StreamParserState {
        return {
            tokenize: null,
            indent: 0
        };
    },
    
    indent(state: StreamParserState, textAfter: string): number | null {
        if (state.tokenize) return null;
        if (textAfter.match(/^[\]}]/)) return state.indent - indentUnit.of("    ");
        return state.indent;
    },
    
    languageData: {
        commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
        closeBrackets: { brackets: ["(", "[", "{", "'", '"'] },
        indentOnInput: /^\s*[{}]$/
    }
};

function tokenComment(stream: StreamParserStream, state: StreamParserState): string {
    let maybeEnd = false;
    while (stream.next()) {
        if (maybeEnd && stream.current().endsWith("/")) {
            state.tokenize = null;
            break;
        }
        maybeEnd = stream.current().endsWith("*");
    }
    return "comment";
}

function tokenString(quote: string) {
    return function(stream: StreamParserStream, state: StreamParserState): string {
        let escaped = false;
        while (stream.next()) {
            if (!escaped && stream.current().endsWith(quote)) {
                state.tokenize = null;
                break;
            }
            escaped = !escaped && stream.current().endsWith("\\");
        }
        return "string";
    };
}

/**
 * GLSL ES 3.0 language definition
 */
export const glslLanguage = StreamLanguage.define(glslStreamParser);

/**
 * Language support for GLSL ES 3.0.
 */
export function glsl(): LanguageSupport {
    return new LanguageSupport(glslLanguage);
}