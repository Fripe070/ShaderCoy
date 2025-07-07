import { ShaderCompileError, ShaderLinkError } from "../errors";

export type ShaderStage =
    | WebGLRenderingContext["VERTEX_SHADER"]
    | WebGLRenderingContext["FRAGMENT_SHADER"];

export type ShaderCode = {
    vertex: string;
    fragment: string;
};

export const attributeNames = {
    position: "a_position",
} as const;
export const uniformNames = {
    projectionMatrix: "u_projectionMatrix",
    viewMatrix: "u_viewMatrix",
    modelMatrix: "u_modelMatrix",
} as const;

export type AttributeName = keyof typeof attributeNames;
export type UniformName = keyof typeof uniformNames;

export type ShaderInfo = {
    program: WebGLProgram;
    attributes: Record<AttributeName, number>;
    uniforms: Record<UniformName, WebGLUniformLocation | null>;
};

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
    // Mark shaders for deletion after linking
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

export function getShaderInfo(
    glCtx: WebGLRenderingContext,
    shaderProgram: WebGLProgram,
): ShaderInfo {
    return {
        program: shaderProgram,
        attributes: {
            position: glCtx.getAttribLocation(shaderProgram, attributeNames.position),
        },
        uniforms: {
            projectionMatrix: glCtx.getUniformLocation(
                shaderProgram,
                uniformNames.projectionMatrix,
            ),
            viewMatrix: glCtx.getUniformLocation(shaderProgram, uniformNames.viewMatrix),
            modelMatrix: glCtx.getUniformLocation(shaderProgram, uniformNames.modelMatrix),
        },
    };
}
