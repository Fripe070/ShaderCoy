import { mat4, vec2, vec3 } from "gl-matrix";
import { computed, map } from "nanostores";

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
    public $state = map<CameraState>(new CameraState());
    public defaultState: CameraState;

    public $position = computed(this.$state, (state) => {
        const result = vec3.fromValues(
            Math.sin(state.yaw) * Math.cos(state.pitch),
            Math.sin(state.pitch),
            Math.cos(state.yaw) * Math.cos(state.pitch),
        );
        vec3.scale(result, result, state.distance);
        vec3.add(result, result, state.orbitPoint);
        return result;
    });
    public $viewMatrix = computed(this.$state, (state) => {
        return mat4.lookAt(mat4.create(), this.$position.get(), state.orbitPoint, state.up);
    });

    constructor(params?: Partial<CameraState>) {
        this.defaultState = new CameraState();
        Object.assign(this.defaultState, params);
        this.$state.set(structuredClone(this.defaultState));
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

    public getProjectionMatrix(aspectRatio: number): mat4 {
        const { fovRadians, nearPlane, farPlane } = this.$state.get();
        return mat4.perspective(mat4.create(), fovRadians, aspectRatio, nearPlane, farPlane);
    }

    private onDown = (event: PointerEvent): void => {
        event.preventDefault();
        const pointers = this.$state.get().pointers;
        pointers.set(event.pointerId, [event.clientX, event.clientY]);
        this.$state.setKey("pointers", pointers);

        const targetCanvas = event.currentTarget as HTMLCanvasElement;
        targetCanvas.setPointerCapture(event.pointerId);

        const { lastTapTime, doubleTapTimeout } = this.$state.get();

        const now = performance.now();
        if (now - lastTapTime < doubleTapTimeout && pointers.size === 1) {
            this.doReset();
        }
        this.$state.setKey("lastTapTime", now);
    };
    private onUp = (event: PointerEvent): void => {
        const { pointers } = this.$state.get();
        pointers.delete(event.pointerId);
        this.$state.setKey("pointers", pointers);

        const targetCanvas = event.currentTarget as HTMLCanvasElement;
        targetCanvas.releasePointerCapture(event.pointerId);
        if (pointers.size === 0) {
            targetCanvas.style.cursor = cursors.default;
        }
    };
    private onMove = (event: PointerEvent): void => {
        const { pointers } = this.$state.get();

        if (event.pointerType !== "mouse" && event.pointerType !== "touch") return;
        // Can be undefined when the mouse isn't pressed down
        if (!pointers.has(event.pointerId)) return;

        const prevPos = pointers.get(event.pointerId)!;
        const newPos = [event.clientX, event.clientY] as vec2;
        pointers.set(event.pointerId, newPos);
        this.$state.setKey("pointers", pointers);

        const targetCanvas = event.currentTarget as HTMLCanvasElement;
        const canvasRect = targetCanvas.getBoundingClientRect();

        if (pointers.size === 1) {
            const { panSpeed } = this.$state.get();

            // Convert pointer movement from screen coordinates to canvas coordinates
            const pointerDelta: vec2 = [
                (targetCanvas.width / canvasRect.width) * (newPos[0] - prevPos[0]),
                (targetCanvas.height / canvasRect.height) * (newPos[1] - prevPos[1]),
            ];
            if (event.buttons === PointerButton.Primary && !event.shiftKey) {
                this.doOrbit(pointerDelta);
                targetCanvas.style.cursor = "grabbing";
            } else {
                this.doPan(vec2.scale(vec2.create(), pointerDelta, panSpeed));
                targetCanvas.style.cursor = "all-scroll";
            }
        } else if (pointers.size === 2) {
            const { pinchZoomSpeed, pinchPanSpeed } = this.$state.get();

            const otherPointerPos = Array.from(pointers.values()).find((pos) => pos !== newPos)!;

            // Pinch zoom
            const prevDist = distBetween(prevPos, otherPointerPos);
            const newDist = distBetween(newPos, otherPointerPos);
            const distDelta = newDist - prevDist;
            this.doDolly(-distDelta * pinchZoomSpeed);
            // Pinch pan
            const prevMid = averagePos(prevPos, otherPointerPos);
            const newMid = averagePos(newPos, otherPointerPos);
            const midDelta: vec2 = [
                (targetCanvas.width / canvasRect.width) * (newMid[0] - prevMid[0]),
                (targetCanvas.height / canvasRect.height) * (newMid[1] - prevMid[1]),
            ];
            this.doPan(vec2.scale(vec2.create(), midDelta, pinchPanSpeed));
        } else {
            targetCanvas.style.cursor = "default";
        }
    };
    private onWheel = (event: WheelEvent): void => {
        const { scrollZoomSpeed } = this.$state.get();
        event.preventDefault();
        this.doDolly(event.deltaY * scrollZoomSpeed);
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
        this.$state.set(structuredClone(this.defaultState));
    }
    public doOrbit(delta: vec2): void {
        const { pitch, yaw, lookSensitivity } = this.$state.get();
        this.updateRotation(yaw - delta[0] * lookSensitivity, pitch + delta[1] * lookSensitivity);
    }
    public doPan(delta: vec2): void {
        const { orbitPoint } = this.$state.get();
        const viewMatrix = this.$viewMatrix.get();
        const viewSpacePoint = vec3.transformMat4(vec3.create(), orbitPoint, viewMatrix);
        viewSpacePoint[0] -= delta[0];
        viewSpacePoint[1] += delta[1];
        this.$state.setKey(
            "orbitPoint",
            vec3.transformMat4(
                vec3.create(),
                viewSpacePoint,
                mat4.invert(mat4.create(), viewMatrix)!,
            ),
        );
    }
    public doDolly(delta: number): void {
        const { nearPlane, farPlane } = this.$state.get();
        let { distance } = this.$state.get();
        distance += delta * 0.01;
        distance = Math.max(nearPlane, distance);
        distance = Math.min(farPlane, distance);
        this.$state.setKey("distance", distance);
    }

    public updateRotation(yaw: number, pitch: number): void {
        const epsilon = 1e-4;
        if (Math.abs(Math.abs(pitch) - Math.PI / 2) < epsilon) {
            // Slight offset to avoid gimbal lock
            pitch = (pitch > 0 ? 1 : -1) * (Math.PI / 2 - epsilon);
        }
        // Flip up vector if pitch crosses vertical
        if (Math.cos(pitch) < 0) {
            this.$state.setKey("up", vec3.fromValues(0, -1, 0));
        } else {
            this.$state.setKey("up", vec3.fromValues(0, 1, 0));
        }
        this.$state.setKey("pitch", pitch);
        this.$state.setKey("yaw", yaw);
    }
}
