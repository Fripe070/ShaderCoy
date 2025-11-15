import { CoyErrorReport, CoyReportedError } from "$lib/errors.js";
import { VERTEX_SCHEMA } from "../model/datatypes.js";
import { UNIFORM_NAMES, CoyShader } from "./datatypes.js";

export type ShaderStage =
	| WebGLRenderingContext["VERTEX_SHADER"]
	| WebGLRenderingContext["FRAGMENT_SHADER"];

function compileShader(
	glCtx: WebGLRenderingContext,
	shaderCode: string,
	shaderType: ShaderStage,
): WebGLShader {
	const shader = glCtx.createShader(shaderType);
	if (!shader) throw new Error("Failed to create shader object");

	glCtx.shaderSource(shader, shaderCode);
	glCtx.compileShader(shader);
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
	glCtx.validateProgram(program);
	// Mark shaders for deletion after linking.
	// Will not actually be deleted until the program is deleted
	glCtx.deleteShader(vertexShader);
	glCtx.deleteShader(fragmentShader);

	// Check if the program linked successfully
	if (!glCtx.getProgramParameter(program, glCtx.LINK_STATUS)) {
		const linkingError = glCtx.getProgramInfoLog(program);
		const vertexLog = glCtx.getShaderInfoLog(vertexShader);
		const fragmentLog = glCtx.getShaderInfoLog(fragmentShader);
		glCtx.deleteProgram(program);

		const reports: CoyErrorReport[] = [];
		if (vertexLog) reports.push(new CoyErrorReport("Vertex Shader", vertexLog));
		if (fragmentLog) reports.push(new CoyErrorReport("Fragment Shader", fragmentLog));
		if (linkingError && !(vertexLog || fragmentLog)) {
			reports.push(new CoyErrorReport("Shader Linking", linkingError));
		}
		throw new CoyReportedError("Shader program linking failed", reports);
	}
	return program;
}

export function loadCoyShader(
	glCtx: WebGLRenderingContext,
	shaders: { vertex: string; fragment: string },
): CoyShader {
	const program = createShaderProgram(glCtx, shaders);
	const attributes = {} as CoyShader["attributes"];
	for (const key in VERTEX_SCHEMA) {
		const attr = key as keyof typeof VERTEX_SCHEMA;
		const location = glCtx.getAttribLocation(program, VERTEX_SCHEMA[attr].attribute);
		if (location === -1) {
			console.warn(`Attribute ${VERTEX_SCHEMA[attr].attribute} not found in shader program.`);
		}
		attributes[attr] = location === -1 ? null : location;
	}
	const uniforms = {} as CoyShader["uniforms"];
	for (const key in UNIFORM_NAMES) {
		const uni = key as keyof typeof UNIFORM_NAMES;
		const loc = glCtx.getUniformLocation(program, UNIFORM_NAMES[uni]);
		uniforms[uni] = loc;
		if (loc === null) console.warn(`Uniform ${UNIFORM_NAMES[uni]} not found in shader program.`);
	}
	return new CoyShader(program, attributes, uniforms);
}
