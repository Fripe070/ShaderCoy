import type { ShaderStage } from "./3d/shader";

export class UserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UserError";
    }
}

export class ShaderError extends UserError {
    constructor(
        public readonly shaderType: ShaderStage,
        message: string,
    ) {
        super(message);
        this.name = "ShaderError";
    }
}
