import { ShaderError } from "../errors";

export type ShaderStage =
    | WebGLRenderingContext["VERTEX_SHADER"]
    | WebGLRenderingContext["FRAGMENT_SHADER"];

export function loadVertexShader(glCtx: WebGLRenderingContext, shaderCode: string): WebGLShader {
    return loadShader(glCtx, shaderCode, WebGLRenderingContext.VERTEX_SHADER);
}
export function loadFragmentShader(glCtx: WebGLRenderingContext, shaderCode: string): WebGLShader {
    return loadShader(glCtx, shaderCode, WebGLRenderingContext.FRAGMENT_SHADER);
}

export function loadShader(
    glCtx: WebGLRenderingContext,
    shaderCode: string,
    shaderType: ShaderStage,
): WebGLShader {
    const shader = glCtx.createShader(shaderType);
    if (!shader) throw new ShaderError(shaderType, "Failed to create shader");

    glCtx.shaderSource(shader, shaderCode);
    glCtx.compileShader(shader);
    if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        const error = glCtx.getShaderInfoLog(shader);
        glCtx.deleteShader(shader);
        throw new ShaderError(shaderType, `Shader compilation failed: ${error}`);
    }
    return shader;
}

export const attributeNames = {
    position: "a_position",
    normal: "a_normal",
    texCoord: "a_texCoord",
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

export function getShaderInfo(
    glCtx: WebGLRenderingContext,
    shaderProgram: WebGLProgram,
): ShaderInfo {
    return {
        program: shaderProgram,
        attributes: {
            position: glCtx.getAttribLocation(shaderProgram, attributeNames.position),
            normal: glCtx.getAttribLocation(shaderProgram, attributeNames.normal),
            texCoord: glCtx.getAttribLocation(shaderProgram, attributeNames.texCoord),
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
