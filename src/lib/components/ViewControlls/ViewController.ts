import type { mat4 } from "gl-matrix";

/* eslint-disable @typescript-eslint/no-unused-vars */
export abstract class InputHandler {
	keyDown(event: KeyboardEvent): void {}
	keyUp(event: KeyboardEvent): void {}
	mouseDown(event: MouseEvent): void {}
	mouseUp(event: MouseEvent): void {}
	mouseMove(event: MouseEvent): void {}
	mouseWheel(event: WheelEvent): void {}
}
export abstract class ViewController extends InputHandler {
	abstract getMatrix(): mat4;
	attach(element: HTMLElement, updateCallback: (matrix: mat4) => void): void {}
	detach(element: HTMLElement): void {}
}
