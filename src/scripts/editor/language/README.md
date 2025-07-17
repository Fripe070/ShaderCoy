# GLSL Language Support

This directory contains the GLSL ES 3.0 language support implementation using Lezer parser.

## Files

- `glsl.grammar` - Lezer grammar definition for GLSL ES 3.0
- `glsl.parser.ts` - Generated parser from the grammar (auto-generated)
- `glsl.ts` - Language support implementation using Lezer
- `build-parser.js` - Script to regenerate the parser from grammar

## Building the Parser

To regenerate the parser from the grammar file:

```bash
npm run build:parser
```

## Features

The Lezer-based parser provides:

- **Tree-based parsing**: More accurate than token-based parsing
- **Better error recovery**: Graceful handling of syntax errors
- **Incremental parsing**: Efficient re-parsing of changed content
- **Rich language support**: Foundation for advanced editor features
- **Precise highlighting**: Context-aware syntax highlighting

## GLSL ES 3.0 Support

The grammar supports:

- Variable declarations with storage and precision qualifiers
- Function declarations and definitions
- Control flow statements (if, for, while, etc.)
- Expression parsing with correct precedence
- Basic types (scalars, vectors, matrices, samplers)
- Comments (line and block)
- Basic error recovery

## Future Enhancements

The Lezer parser foundation enables:

- Code completion and IntelliSense
- Semantic error highlighting
- Code folding and structural navigation
- Automatic indentation
- Refactoring support
- Symbol navigation and goto definition

This provides a significant improvement over the previous StreamLanguage-based approach by offering a proper syntax tree that can be used for advanced language features.
