import type { VERTEX_SCHEMA } from "../model/datatypes.js";

export type ShaderStage = "vertex" | "fragment";
export type ShaderCode = Record<ShaderStage, string>;

// TODO: Figure out some way of being more lenient in what inputs a shader needs to define
export const UNIFORM_NAMES = {
	projectionMatrix: "u_projectionMatrix",
	viewMatrix: "u_viewMatrix",
	modelMatrix: "u_modelMatrix",

	resolution: "u_resolution",
	mouse: "u_mouse",
	time: "u_time",
	deltaTime: "u_deltaTime",
	frameNumber: "u_frameNumber",
} as const;
export function samplerArray(index: number): string {
	return `u_textures[${index}]`;
}

export class CoyShader {
	constructor(
		public program: WebGLProgram,
		public attributes: Record<keyof typeof VERTEX_SCHEMA, number | null>,
		public uniforms: Record<keyof typeof UNIFORM_NAMES, WebGLUniformLocation | null>
	) {}
}
