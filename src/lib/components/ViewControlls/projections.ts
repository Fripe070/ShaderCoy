import { mat4 } from "gl-matrix";

const NEAR = 0.1;
const FAR = 100.0;

export function perspectiveProjMatrix(aspectRatio: number): mat4 {
	const fov = (60 * Math.PI) / 180;
	return mat4.perspective(mat4.create(), fov, aspectRatio, NEAR, FAR);
}

export function orthoProjMatrix(aspectRatio: number): mat4 {
	const orthoHeight = 4;
	const orthoWidth = orthoHeight * aspectRatio;
	return mat4.ortho(
		mat4.create(),
		-orthoWidth / 2,
		orthoWidth / 2,
		-orthoHeight / 2,
		orthoHeight / 2,
		NEAR,
		FAR
	);
}
