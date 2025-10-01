import { VERTEX_SCHEMA } from "../model/datatypes";
import { UNIFORM_NAMES, type PrimaryShader } from "./datatypes";

export enum ShaderStage {
    Vertex = WebGLRenderingContext.VERTEX_SHADER,
    Fragment = WebGLRenderingContext.FRAGMENT_SHADER,
}

function compileShader(
    glCtx: WebGLRenderingContext,
    shaderCode: string,
    shaderType: ShaderStage,
): WebGLShader {
    const shader = glCtx.createShader(shaderType);
    if (!shader) throw new Error("Failed to create shader");

    glCtx.shaderSource(shader, shaderCode);
    glCtx.compileShader(shader);
    if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        const error = glCtx.getShaderInfoLog(shader);
        glCtx.deleteShader(shader);
        throw new Error(`Shader compilation failed: ${error}`);
    }
    return shader;
}

export function createShaderProgram(
    glCtx: WebGLRenderingContext,
    shaders: { vertex: string; fragment: string },
): WebGLProgram {
    const vertexShader = compileShader(glCtx, shaders.vertex, glCtx.VERTEX_SHADER);
    const fragmentShader = compileShader(glCtx, shaders.fragment, glCtx.FRAGMENT_SHADER);

    const program = glCtx.createProgram();
    if (!program) throw new Error("Failed to create shader program");
    glCtx.attachShader(program, vertexShader);
    glCtx.attachShader(program, fragmentShader);
    glCtx.linkProgram(program);
    // Mark shaders for deletion after linking.
    // Will not actually be deleted until the program is deleted
    glCtx.deleteShader(vertexShader);
    glCtx.deleteShader(fragmentShader);
    // Check if the program linked successfully
    if (!glCtx.getProgramParameter(program, glCtx.LINK_STATUS)) {
        glCtx.deleteProgram(program);
        const error = glCtx.getProgramInfoLog(program);
        throw new Error(`Shader program linking failed: ${error}`);
    }
    return program;
}

export function loadPrimaryShader(
    glCtx: WebGLRenderingContext,
    shaders: { vertex: string; fragment: string },
): PrimaryShader {
    const program = createShaderProgram(glCtx, shaders);

    const attributes = {} as PrimaryShader["attributes"];
    for (const key in VERTEX_SCHEMA) {
        const attr = key as keyof typeof VERTEX_SCHEMA;
        const loc = glCtx.getAttribLocation(program, VERTEX_SCHEMA[attr].attribute);
        attributes[attr] = loc === -1 ? null : loc;
        if (loc === -1)
            console.warn(`Attribute ${VERTEX_SCHEMA[attr].attribute} not found in shader program.`);
    }
    const uniforms = {} as PrimaryShader["uniforms"];
    for (const key in UNIFORM_NAMES) {
        const uni = key as keyof typeof UNIFORM_NAMES;
        const loc = glCtx.getUniformLocation(program, UNIFORM_NAMES[uni]);
        uniforms[uni] = loc;
        if (loc === null)
            console.warn(`Uniform ${UNIFORM_NAMES[uni]} not found in shader program.`);
    }

    return { program, attributes, uniforms };
}
