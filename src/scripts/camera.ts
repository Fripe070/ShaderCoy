import { mat4, vec2, vec3 } from "gl-matrix";

const cursors = {
    default: "grab",
    grabbing: "all-scroll",
} as const;

const PointerButton = {
    Primary: 1,
    Middle: 4,
    Secondary: 2,
} as const;

function distBetween(a: vec2, b: vec2): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
function averagePos(a: vec2, b: vec2): vec2 {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

class CameraState {
    constructor(
        public orbitPoint: vec3 = vec3.create(),
        public distance = 8,
        // Isometric angle
        public yaw = Math.PI / 4,
        public pitch = Math.atan(1 / Math.sqrt(2)),

        public pointers = new Map<number, vec2>(),
        public lastTapTime = 0,

        public up: vec3 = vec3.fromValues(0, 1, 0),
        public nearPlane = 0.1,
        public farPlane = 100,
        public fovRadians = 34 * (Math.PI / 180),

        public lookSensitivity = 0.005,
        public doubleTapTimeout = 200,

        public panSpeed = 0.01,
        public scrollZoomSpeed = 1,

        public pinchZoomSpeed = 1.5,
        public pinchPanSpeed = 0.005,
    ) {}
}

// TODO: Render rotation gizmo overlay
// TODO: Pause on preview pause
export class OrbitCamera {
    public state: CameraState;
    public defaultState: CameraState;

    constructor(params?: Partial<CameraState>) {
        this.state = new CameraState();
        Object.assign(this.state, params);
        this.defaultState = structuredClone(this.state);
    }

    public attach(element: HTMLCanvasElement): void {
        for (const [event, handler] of Object.entries(this.eventHandlers) as [
            string,
            EventListener,
        ][]) {
            element.addEventListener(event, handler, { passive: false });
        }
        element.style.cursor = cursors.default;
    }

    public detach(element: HTMLCanvasElement): void {
        for (const [event, handler] of Object.entries(this.eventHandlers) as [
            string,
            EventListener,
        ][]) {
            element.removeEventListener(event, handler);
        }
    }

    public getPosition(): vec3 {
        const result = vec3.fromValues(
            Math.sin(this.state.yaw) * Math.cos(this.state.pitch),
            Math.sin(this.state.pitch),
            Math.cos(this.state.yaw) * Math.cos(this.state.pitch),
        );
        vec3.scale(result, result, this.state.distance);
        vec3.add(result, result, this.state.orbitPoint);
        return result;
    }

    public getViewMatrix(): mat4 {
        return mat4.lookAt(mat4.create(), this.getPosition(), this.state.orbitPoint, this.state.up);
    }

    public getProjectionMatrix(aspectRatio: number): mat4 {
        return mat4.perspective(
            mat4.create(),
            this.state.fovRadians,
            aspectRatio,
            this.state.nearPlane,
            this.state.farPlane,
        );
    }

    private onDown = (event: PointerEvent): void => {
        this.state.pointers.set(event.pointerId, [event.clientX, event.clientY]);
        const targetCanvas = event.currentTarget as HTMLCanvasElement;
        targetCanvas.setPointerCapture(event.pointerId);

        const now = performance.now();
        if (
            now - this.state.lastTapTime < this.state.doubleTapTimeout &&
            this.state.pointers.size === 1
        ) {
            this.doReset();
        }
        this.state.lastTapTime = now;
    };
    private onUp = (event: PointerEvent): void => {
        this.state.pointers.delete(event.pointerId);
        const targetCanvas = event.currentTarget as HTMLCanvasElement;
        targetCanvas.releasePointerCapture(event.pointerId);
        if (this.state.pointers.size === 0) {
            targetCanvas.style.cursor = cursors.default;
        }
    };
    private onMove = (event: PointerEvent): void => {
        // Can be undefined when the mouse isn't pressed down
        if (!this.state.pointers.has(event.pointerId)) return;

        const prevPos = this.state.pointers.get(event.pointerId)!;
        const newPos = [event.clientX, event.clientY] as vec2;
        this.state.pointers.set(event.pointerId, newPos);

        const targetCanvas = event.currentTarget as HTMLCanvasElement;
        const canvasRect = targetCanvas.getBoundingClientRect();

        if (this.state.pointers.size === 1) {
            // Convert pointer movement from screen coordinates to canvas coordinates
            const pointerDelta: vec2 = [
                (targetCanvas.width / canvasRect.width) * (newPos[0] - prevPos[0]),
                (targetCanvas.height / canvasRect.height) * (newPos[1] - prevPos[1]),
            ];
            if (event.buttons === PointerButton.Primary && !event.shiftKey) {
                this.doOrbit(pointerDelta);
                targetCanvas.style.cursor = "grabbing";
            } else {
                this.doPan(vec2.scale(vec2.create(), pointerDelta, this.state.panSpeed));
                targetCanvas.style.cursor = "all-scroll";
            }
        } else if (this.state.pointers.size === 2) {
            const otherPointerPos = Array.from(this.state.pointers.values()).find(
                (pos) => pos !== newPos,
            )!;

            // Pinch zoom
            const prevDist = distBetween(prevPos, otherPointerPos);
            const newDist = distBetween(newPos, otherPointerPos);
            const distDelta = newDist - prevDist;
            this.doDolly(-distDelta * this.state.pinchZoomSpeed);
            // Pinch pan
            const prevMid = averagePos(prevPos, otherPointerPos);
            const newMid = averagePos(newPos, otherPointerPos);
            const midDelta: vec2 = [
                (targetCanvas.width / canvasRect.width) * (newMid[0] - prevMid[0]),
                (targetCanvas.height / canvasRect.height) * (newMid[1] - prevMid[1]),
            ];
            this.doPan(vec2.scale(vec2.create(), midDelta, this.state.pinchPanSpeed));
        } else {
            targetCanvas.style.cursor = "default";
        }
    };
    private onWheel = (event: WheelEvent): void => {
        event.preventDefault();
        this.doDolly(event.deltaY * this.state.scrollZoomSpeed);
        const targetCanvas = event.currentTarget as HTMLCanvasElement;
        targetCanvas.focus();
    };

    private readonly eventHandlers = {
        contextmenu: (event: Event) => event.preventDefault(),
        dragstart: (event: Event) => event.preventDefault(),
        pointerdown: this.onDown,
        pointerup: this.onUp,
        pointercancel: this.onUp,
        pointermove: this.onMove,
        wheel: this.onWheel,
    };

    public doReset(): void {
        this.state = structuredClone(this.defaultState);
    }
    public doOrbit(delta: vec2): void {
        this.state.yaw -= delta[0] * this.state.lookSensitivity;
        this.state.pitch += delta[1] * this.state.lookSensitivity;

        const epsilon = 1e-4;
        if (Math.abs(Math.abs(this.state.pitch) - Math.PI / 2) < epsilon) {
            // Slight offset to avoid gimbal lock
            this.state.pitch = (this.state.pitch > 0 ? 1 : -1) * (Math.PI / 2 - epsilon);
        }
        // Flip up vector if pitch crosses vertical
        if (Math.cos(this.state.pitch) < 0) {
            this.state.up = vec3.fromValues(0, -1, 0);
        } else {
            this.state.up = vec3.fromValues(0, 1, 0);
        }
    }
    public doPan(delta: vec2): void {
        const viewSpacePoint = vec3.transformMat4(
            vec3.create(),
            this.state.orbitPoint,
            this.getViewMatrix(),
        );
        viewSpacePoint[0] -= delta[0];
        viewSpacePoint[1] += delta[1];
        this.state.orbitPoint = vec3.transformMat4(
            vec3.create(),
            viewSpacePoint,
            mat4.invert(mat4.create(), this.getViewMatrix())!,
        );
    }
    public doDolly(delta: number): void {
        this.state.distance += delta * 0.01;
        this.state.distance = Math.max(this.state.nearPlane, this.state.distance);
        this.state.distance = Math.min(this.state.farPlane, this.state.distance);
    }
}
