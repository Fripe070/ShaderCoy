import type { mat4 } from "gl-matrix";

export interface CameraController {
	readonly viewMatrix: mat4;
	readonly cursor?: string;
	projectionMatrix(aspectRatio: number): mat4;

	handleContextMenu?(event: MouseEvent): void;
	handleKeyDown?(event: KeyboardEvent): void;
	handleKeyUp?(event: KeyboardEvent): void;
	handlePointerDown?(event: PointerEvent): void;
	handlePointerUp?(event: PointerEvent): void;
	handlePointerMove?(event: PointerEvent): void;
	handleDoubleClick?(event: MouseEvent): void;
	handleWheel?(event: WheelEvent): void;
}
