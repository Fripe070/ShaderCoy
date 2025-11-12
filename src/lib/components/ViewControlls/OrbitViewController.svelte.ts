import { mat4, vec2 } from "gl-matrix";
import type { CameraController } from "./ViewController.js";
import { SvelteMap } from "svelte/reactivity";

interface CameraOrbitState {
	orbitPoint: [number, number, number];
	distance: number;
	yaw: number;
	pitch: number;
}
const DEFAULT_ORBIT_STATE: CameraOrbitState = {
	orbitPoint: [0, 0, 0],
	distance: 8,
	// Isometric angle
	yaw: Math.PI / 4,
	pitch: Math.atan(1 / Math.sqrt(2)),
} as const;

const cursors = {
	default: "grab",
	grabbing: "all-scroll",
} as const;
const PointerButton = {
	Primary: 1,
	Middle: 4,
	Secondary: 2,
} as const;
const UP: [number, number, number] = [0, 1, 0] as const;
const DOUBLE_CLICK_DELTA = 300; // ms

function getPosition(state: CameraOrbitState): [number, number, number] {
	const { orbitPoint, distance, yaw, pitch } = state;
	const x = orbitPoint[0] + distance * Math.sin(yaw) * Math.cos(pitch);
	const y = orbitPoint[1] + distance * Math.sin(pitch);
	const z = orbitPoint[2] + distance * Math.cos(yaw) * Math.cos(pitch);
	return [x, y, z];
}

export default function orbitCameraController(
	projectionProvider: (aspectRatio: number) => mat4,
): CameraController {
	let orbitState: CameraOrbitState = $state({ ...DEFAULT_ORBIT_STATE });
	let cursorState: string = $state(cursors.default);
	let lastClickTime: DOMHighResTimeStamp = -Infinity;
	const trackedPointers = new SvelteMap<number, vec2>();

	return {
		handlePointerDown(event: PointerEvent) {
			trackedPointers.set(event.pointerId, [event.clientX, event.clientY]);
			(event.target as HTMLElement).setPointerCapture(event.pointerId);
			cursorState = cursors.grabbing;

			if (
				event.buttons & PointerButton.Primary &&
				performance.now() - lastClickTime < DOUBLE_CLICK_DELTA
			) {
				// Reset on double click
				orbitState = { ...DEFAULT_ORBIT_STATE };
			}
			lastClickTime = performance.now();
		},
		handlePointerUp(event: PointerEvent) {
			trackedPointers.delete(event.pointerId);
			(event.target as HTMLElement).releasePointerCapture(event.pointerId);
			if (trackedPointers.size === 0) {
				cursorState = cursors.default;
			}
		},
		handlePointerMove(event: PointerEvent) {
			// Can be untracked when the mouse isn't pressed down
			if (!trackedPointers.has(event.pointerId)) return;

			const previousPos = trackedPointers.get(event.pointerId)!;
			const currentPos = vec2.fromValues(event.clientX, event.clientY);
			trackedPointers.set(event.pointerId, currentPos);

			const windowDelta = vec2.subtract(vec2.create(), currentPos, previousPos);
			vec2.multiply(windowDelta, windowDelta, [1, -1]); // Invert Y-axis to have down be negative

			// If the pointer moved a significant (non-noise) amount, we did not mean to double-click
			const doubleTapThreshold = 5; // css pixels
			if (vec2.length(windowDelta) < doubleTapThreshold) {
				lastClickTime = -Infinity;
			}

			const elementBounds = (event.target as HTMLElement).getBoundingClientRect();
			const maxSide = Math.max(elementBounds.width, elementBounds.height);
			const elementDelta: vec2 = vec2.fromValues(
				windowDelta[0] / maxSide,
				windowDelta[1] / maxSide,
			);

			const ROTATION_SPEED = 2 * Math.PI; // radians per full drag //FIXME: Not the units I want
			const ZOOM_SPEED = 20; // units per full drag
			const PAN_SPEED = 10; // units per full drag

			console.log("Norm:", elementDelta[1]);
			console.log("Abs:", windowDelta[1]);
			console.log("Bounds:", elementBounds);
			if (
				trackedPointers.size === 2 ||
				(event.buttons !== 0 && event.buttons !== PointerButton.Primary) ||
				(event.buttons == PointerButton.Primary && event.shiftKey)
			) {
				// Pan
				cursorState = cursors.grabbing;
			} else if (event.buttons & PointerButton.Primary) {
				// Orbit (rotate)
				orbitState.yaw -= elementDelta[0] * ROTATION_SPEED;
				orbitState.pitch -= elementDelta[1] * ROTATION_SPEED;
				// Clamp pitch to avoid gimbal lock
				const PITCH_LIMIT = Math.PI / 2 - 0.01;
				orbitState.pitch = Math.min(Math.max(orbitState.pitch, -PITCH_LIMIT), PITCH_LIMIT);
				cursorState = cursors.grabbing;
			} else {
				console.log("No camera move");
			}
		},

		get cursor() {
			return cursorState;
		},
		get viewMatrix() {
			return mat4.lookAt(mat4.create(), getPosition(orbitState), orbitState.orbitPoint, UP);
		},
		projectionMatrix: (aspectRatio: number): mat4 => {
			return projectionProvider(aspectRatio);
		},
	};
}
