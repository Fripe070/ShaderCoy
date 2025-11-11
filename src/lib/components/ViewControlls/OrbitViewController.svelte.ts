import { mat4 } from "gl-matrix";
import { ViewController } from "./ViewController.js";

interface CameraOrbitState {
	orbitPoint: [number, number, number];
	distance: number;
	yaw: number;
	pitch: number;
}

const UP: [number, number, number] = [0, 1, 0];
const cursors = {
	default: "grab",
	grabbing: "all-scroll",
} as const;
const PointerButton = {
	Primary: 1,
	Middle: 4,
	Secondary: 2,
} as const;

export default class OrbitViewController extends ViewController {
	private previousClasses: string = "";
	attach(element: HTMLElement): void {
		this.previousClasses = element.className;
	}
	detach(element: HTMLElement): void {
		element.className = this.previousClasses;
	}

	protected orbitState: CameraOrbitState = {
		orbitPoint: [0, 0, 0],
		distance: 8,
		// Isometric angle
		yaw: Math.PI / 4,
		pitch: Math.atan(1 / Math.sqrt(2)),
	};

	getPosition(): [number, number, number] {
		const { orbitPoint, distance, yaw, pitch } = this.orbitState;
		const x = orbitPoint[0] + distance * Math.sin(yaw) * Math.cos(pitch);
		const y = orbitPoint[1] + distance * Math.sin(pitch);
		const z = orbitPoint[2] + distance * Math.cos(yaw) * Math.cos(pitch);
		return [x, y, z];
	}

	getMatrix(): mat4 {
		this.orbitState.yaw += Math.PI * 2 * 0.001; // FIXME: Remove auto-rotation and actually implement orbit controls
		return mat4.lookAt(mat4.create(), this.getPosition(), this.orbitState.orbitPoint, UP);
	}
}
