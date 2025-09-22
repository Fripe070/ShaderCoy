import { ShaderCompileError, ShaderLinkError } from "../errors";
import { VERTEX_SCHEMA } from "@/scripts/model/mesh";

export type ShaderStage =
    | WebGLRenderingContext["VERTEX_SHADER"]
    | WebGLRenderingContext["FRAGMENT_SHADER"];

export interface ShaderCode {
    vertex: string;
    fragment: string;
}

export interface ShaderInfo {
    program: WebGLProgram;
    attributes: Record<keyof typeof VERTEX_SCHEMA, number | null>;
    uniforms: Record<keyof typeof UNIFORM_NAMES, WebGLUniformLocation | null>;
}

// TODO: Figure out some way of being more lenient in what inputs a shader needs to define
export const UNIFORM_NAMES = {
    projectionMatrix: "u_projectionMatrix",
    viewMatrix: "u_viewMatrix",
    modelMatrix: "u_modelMatrix",

    resolution: "u_resolution",
    mouse: "u_mouse",
    time: "u_time",
    timeDelta: "u_timeDelta",
    frameNumber: "u_frameNumber",
} as const;

export const textureArrayName = "u_textures" as const;

export function getShaderInfo(
    glCtx: WebGLRenderingContext,
    shaderProgram: WebGLProgram,
): ShaderInfo {
    const attributeLocationMap = Object.fromEntries(
        Object.entries(VERTEX_SCHEMA).map(([key, value]) => {
            const location = glCtx.getAttribLocation(shaderProgram, value.attribute);
            return [key, location === -1 ? null : location];
        }),
    ) as Record<keyof typeof VERTEX_SCHEMA, number | null>;
    const uniformLocationMap = Object.fromEntries(
        Object.entries(UNIFORM_NAMES).map(([key, value]) => {
            const location = glCtx.getUniformLocation(shaderProgram, value);
            if (location === null) {
                console.warn(`Uniform ${value} not found in shader program.`);
            }
            return [key, location];
        }),
    ) as Record<keyof typeof UNIFORM_NAMES, WebGLUniformLocation | null>;

    return {
        program: shaderProgram,
        attributes: attributeLocationMap,
        uniforms: uniformLocationMap,
    };
}

export function compileShader(
    glCtx: WebGLRenderingContext,
    shaderCode: string,
    shaderType: ShaderStage,
): WebGLShader {
    const shader = glCtx.createShader(shaderType);
    if (!shader) throw new ShaderCompileError(shaderType, "Failed to create shader");

    glCtx.shaderSource(shader, shaderCode);
    glCtx.compileShader(shader);
    if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        const error = glCtx.getShaderInfoLog(shader);
        glCtx.deleteShader(shader);
        throw new ShaderCompileError(shaderType, `Shader compilation failed: ${error}`);
    }
    return shader;
}

export function createShaderProgram(
    glCtx: WebGLRenderingContext,
    shaders: ShaderCode,
): WebGLProgram {
    const vertexShader = compileShader(glCtx, shaders.vertex, glCtx.VERTEX_SHADER);
    const fragmentShader = compileShader(glCtx, shaders.fragment, glCtx.FRAGMENT_SHADER);

    const program = glCtx.createProgram();
    if (!program) throw new ShaderLinkError("Failed to create shader program");
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
        throw new ShaderLinkError(`Shader program linking failed: ${error}`);
    }
    return program;
}
