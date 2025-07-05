import type { ShaderStage } from "./3d/shader";

export class UserError extends Error {}

export class ShaderError extends UserError {
    constructor(
        public readonly shaderType: ShaderStage,
        message: string,
    ) {
        super(message);
    }
}
