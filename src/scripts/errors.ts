import type { ShaderStage } from "./3d/shader";

export class UserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UserError";
    }
}

export class ShaderCompileError extends UserError {
    constructor(
        public readonly shaderType: ShaderStage,
        message: string,
    ) {
        super(message);
        this.name = "ShaderError";
    }
}

export class ShaderLinkError extends UserError {
    constructor(message: string) {
        super(message);
        this.name = "ShaderLinkError";
    }
}
