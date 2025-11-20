import { mat4 } from "gl-matrix";
import type { CameraController } from "./ViewController.js";

export default function staticCameraController(): CameraController {
	const identityMatrix: mat4 = mat4.create();
	return {
		get viewMatrix(): mat4 {
			return identityMatrix;
		},
		projectionMatrix(): mat4 {
			return identityMatrix;
		},
	};
}
