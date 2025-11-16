import { mat4, quat, vec2, vec3 } from "gl-matrix";
import type { CameraController } from "./ViewController.js";
import { SvelteMap } from "svelte/reactivity";
import { noUnhandledCase } from "$lib/utils.svelte.js";

const BASIS = {
	forward: [0, 0, -1],
	up: [0, 1, 0],
	right: [1, 0, 0],
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
const DOUBLE_CLICK_DELTA = 300; // ms

const SPEEDS: Record<string, number> = {
	ROTATION: 4,
	PAN_MOUSE: 1,
	PAN_PINCH: 3e-3,
	ZOOM_SCROLL: 4e-3,
	ZOOM_PINCH: 1e-2,
	ORTHO_ZOOM_SCROLL: 1e-3,
	ORTHO_ZOOM_PINCH: 1e-2,
	FOV_ZOOM: 1e-3,
	SHIFT_MODIFIER: 0.25,
} as const;

function isometricQuaternion(): quat {
	const yaw = Math.PI / 4;
	const pitch = -Math.atan(1 / Math.sqrt(2));
	const qYaw = quat.setAxisAngle(quat.create(), BASIS.up, yaw);
	const qPitch = quat.setAxisAngle(quat.create(), BASIS.right, pitch);
	return quat.multiply(quat.create(), qYaw, qPitch);
}

function averageVec2(a: vec2, b: vec2): vec2 {
	return vec2.scale(vec2.create(), vec2.add(vec2.create(), a, b), 0.5);
}

interface CameraOrbitState {
	orbitPoint: vec3;
	distance: number;
	rotation: quat;
	fov: number;
	orthoHeight: number;
}
const DEFAULT_ORBIT_STATE: CameraOrbitState = {
	orbitPoint: [0, 0, 0],
	distance: 4,
	rotation: isometricQuaternion(),
	fov: (60 * Math.PI) / 180,
	orthoHeight: 4,
} as const;

function getPosition(state: CameraOrbitState): vec3 {
	const offset = vec3.fromValues(0, 0, state.distance);
	vec3.transformQuat(offset, offset, state.rotation);
	return vec3.add(vec3.create(), state.orbitPoint, offset);
}

function getPanVector(rotation: quat, delta: vec2, speed: number): vec3 {
	const right = vec3.transformQuat(vec3.create(), BASIS.right, rotation);
	const up = vec3.transformQuat(vec3.create(), BASIS.up, rotation);
	const panRight = vec3.scale(vec3.create(), right, -delta[0] * speed);
	const panUp = vec3.scale(vec3.create(), up, delta[1] * speed);
	return vec3.add(vec3.create(), panRight, panUp);
}

const NEAR = 0.1;
const FAR = 100.0;

let orbitState: CameraOrbitState = $state({ ...DEFAULT_ORBIT_STATE });
let cursorState: string = $state(cursors.default);
let lastClickTime: DOMHighResTimeStamp = -Infinity;
const trackedPointers = new SvelteMap<number, vec2>();

export default function orbitCameraController(
	projectionMode: "perspective" | "orthographic",
): CameraController {
	function doZoom(event: WheelEvent | PointerEvent, delta: number) {
		const shiftMod = event.shiftKey ? SPEEDS.SHIFT_MODIFIER : 1;

		if (projectionMode === "orthographic") {
			orbitState.orthoHeight *= 1 + delta * shiftMod;
			orbitState.orthoHeight = Math.max(1e-3, orbitState.orthoHeight);
			return;
		}

		if (event.ctrlKey || event.metaKey) {
			orbitState.fov += delta * shiftMod;
			orbitState.fov = Math.max(1e-3, Math.min(Math.PI - 1e-3, orbitState.fov));
		} else {
			orbitState.distance += delta * shiftMod;
			orbitState.distance = Math.max(NEAR, Math.min(FAR, orbitState.distance));
		}
	}

	return {
		handlePointerDown(event: PointerEvent) {
			trackedPointers.set(event.pointerId, [event.clientX, event.clientY]);
			(event.target as HTMLElement).setPointerCapture(event.pointerId);
			cursorState = cursors.grabbing;

			if (
				trackedPointers.size == 1 &&
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

			if (trackedPointers.size === 2) {
				// Pinch zoom and pan
				const otherPos = trackedPointers.get(
					Array.from(trackedPointers.keys()).find((id) => id !== event.pointerId) ?? -1,
				);
				if (!otherPos) return;

				const previousAverage = averageVec2(previousPos, otherPos);
				const currentAverage = averageVec2(currentPos, otherPos);
				const panDelta = vec2.subtract(vec2.create(), currentAverage, previousAverage);
				vec2.scale(
					panDelta,
					panDelta,
					projectionMode === "perspective" ? orbitState.distance : DEFAULT_ORBIT_STATE.distance,
				);

				const previousDist = vec2.distance(previousPos, otherPos);
				const currentDist = vec2.distance(currentPos, otherPos);
				const zoomDelta = currentDist - previousDist;

				orbitState.orbitPoint = vec3.add(
					vec3.create(),
					orbitState.orbitPoint,
					getPanVector(orbitState.rotation, panDelta, SPEEDS.PAN_PINCH),
				);
				doZoom(event, -zoomDelta * SPEEDS.ZOOM_PINCH);
			} else if (
				(event.buttons !== 0 && event.buttons !== PointerButton.Primary) ||
				(event.buttons == PointerButton.Primary && event.shiftKey)
			) {
				cursorState = cursors.grabbing;
				// Pan
				const panDelta = getPanVector(orbitState.rotation, elementDelta, SPEEDS.PAN_MOUSE);
				vec2.scale(
					panDelta,
					panDelta,
					projectionMode === "perspective" ? orbitState.distance : DEFAULT_ORBIT_STATE.distance,
				);

				if (event.shiftKey) {
					vec3.scale(panDelta, panDelta, SPEEDS.SHIFT_MODIFIER);
				}
				orbitState.orbitPoint = vec3.add(vec3.create(), orbitState.orbitPoint, panDelta);
			} else if (event.buttons & PointerButton.Primary) {
				cursorState = cursors.grabbing;
				// Orbit (rotate)
				const yawDelta = -elementDelta[0] * SPEEDS.ROTATION;
				const pitchDelta = -elementDelta[1] * SPEEDS.ROTATION;
				const qYaw = quat.setAxisAngle(quat.create(), BASIS.up, yawDelta);
				const qPitch = quat.setAxisAngle(quat.create(), BASIS.right, pitchDelta);
				const newRotation = quat.clone(orbitState.rotation);
				quat.multiply(newRotation, qYaw, newRotation);
				quat.multiply(newRotation, newRotation, qPitch);
				orbitState.rotation = newRotation;
			}
		},
		handleWheel(event) {
			event.preventDefault();
			let speed = SPEEDS.ZOOM_SCROLL;
			if (projectionMode === "orthographic") {
				speed = SPEEDS.ORTHO_ZOOM_SCROLL;
			}
			doZoom(event, event.deltaY * (event.ctrlKey || event.metaKey ? SPEEDS.FOV_ZOOM : speed));
		},

		get cursor() {
			return cursorState;
		},
		get viewMatrix() {
			const up = vec3.transformQuat(vec3.create(), BASIS.up, orbitState.rotation);
			return mat4.lookAt(mat4.create(), getPosition(orbitState), orbitState.orbitPoint, up);
		},
		projectionMatrix: (aspectRatio: number): mat4 => {
			switch (projectionMode) {
				case "perspective":
					return mat4.perspective(mat4.create(), orbitState.fov, aspectRatio, NEAR, FAR);
				case "orthographic": {
					const orthoHeight = orbitState.orthoHeight;
					const orthoWidth = orthoHeight * aspectRatio;
					return mat4.ortho(
						mat4.create(),
						-orthoWidth / 2,
						orthoWidth / 2,
						-orthoHeight / 2,
						orthoHeight / 2,
						NEAR,
						FAR,
					);
				}
				default:
					noUnhandledCase(projectionMode);
			}
		},
	};
}
