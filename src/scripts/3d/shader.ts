import { ShaderConstructionError as ShaderConstructError } from "../errors";

export function loadVertexShader(glCtx: WebGLRenderingContext, shaderCode: string): WebGLShader {
    return loadShader(glCtx, shaderCode, glCtx.VERTEX_SHADER);
}
export function loadFragmentShader(glCtx: WebGLRenderingContext, shaderCode: string): WebGLShader {
    return loadShader(glCtx, shaderCode, glCtx.FRAGMENT_SHADER);
}

export function loadShader(
    glCtx: WebGLRenderingContext,
    shaderCode: string,
    shaderType: number,
): WebGLShader {
    const shader = glCtx.createShader(shaderType);
    if (!shader) throw new ShaderConstructError("Failed to create shader");

    glCtx.shaderSource(shader, shaderCode);
    glCtx.compileShader(shader);
    if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        const error = glCtx.getShaderInfoLog(shader);
        glCtx.deleteShader(shader);
        throw new ShaderConstructError(`Error compiling shader: ${error}`);
    }
    return shader;
}
