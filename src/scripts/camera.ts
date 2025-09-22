import { mat4, type vec2, vec3 } from "gl-matrix";

const cursors = {
    default: "grab",
    grabbing: "all-scroll",
} as const;

const PointerButton = {
    Primary: 1,
    Middle: 4,
    Secondary: 2,
} as const;

class CameraState {
    constructor(
        // TODO: Switch from position to distance, yaw, pitch
        public position: vec3 = vec3.fromValues(0, 0, 10),
        public orbitPoint: vec3 = vec3.create(),
        public up: vec3 = vec3.fromValues(0, 1, 0),
        public pointers = new Map<number, vec2>(),

        public nearPlane = 0.1,
        public farPlane = 100,
        public fov = 45 * (Math.PI / 180),

        public sensitivity = 0.005,
        public zoomSpeed = 0.1,
        public pinchSensitivity = 1.0,
    ) {}
}

// TODO: Pause on preview pause
export class OrbitCamera {
    public state: CameraState;

    constructor(params?: Partial<CameraState>) {
        this.state = new CameraState() as CameraState;
        Object.assign(this.state, params);
    }

    getViewMatrix(): mat4 {
        return mat4.lookAt(
            mat4.create(),
            this.state.position,
            this.state.orbitPoint,
            this.state.up,
        );
    }

    getProjectionMatrix(aspectRatio: number): mat4 {
        return mat4.perspective(
            mat4.create(),
            this.state.fov,
            aspectRatio,
            this.state.nearPlane,
            this.state.farPlane,
        );
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

    private onDown = (event: PointerEvent): void => {
        this.state.pointers.set(event.pointerId, [event.clientX, event.clientY]);
        const targetCanvas = event.currentTarget as HTMLCanvasElement;
        targetCanvas.setPointerCapture(event.pointerId);
        targetCanvas.style.cursor = cursors.grabbing;
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
        const targetCanvas = event.currentTarget as HTMLCanvasElement;
        // Might be undefined when the mouse isn't pressed
        if (!this.state.pointers.has(event.pointerId)) return;

        // Relative to viewport
        const prevPos = this.state.pointers.get(event.pointerId)!;
        this.state.pointers.set(event.pointerId, [event.clientX, event.clientY]);

        const { right, up } = this.getAxes();
        const rect = targetCanvas.getBoundingClientRect();
        const viewDelta: vec2 = [
            (targetCanvas.width / rect.width) * (event.clientX - prevPos[0]),
            (targetCanvas.height / rect.height) * (event.clientY - prevPos[1]),
        ];

        if (this.state.pointers.size === 1) {
            if (event.buttons === PointerButton.Primary && !event.shiftKey) {
                // Orbit
                const angleHorizontal = -viewDelta[0] * this.state.sensitivity;
                const angleVertical = -viewDelta[1] * this.state.sensitivity;
                const rotationMatrix = mat4.create();
                mat4.fromRotation(rotationMatrix, angleHorizontal, this.state.up);
                mat4.rotate(rotationMatrix, rotationMatrix, angleVertical, right);
                const focusToCamVec = vec3.subtract(
                    vec3.create(),
                    this.state.position,
                    this.state.orbitPoint,
                );
                vec3.transformMat4(focusToCamVec, focusToCamVec, rotationMatrix);
                vec3.add(this.state.position, this.state.orbitPoint, focusToCamVec);
                targetCanvas.style.cursor = "grabbing";
            } else {
                // Pan
                const focusDist = vec3.distance(this.state.position, this.state.orbitPoint);
                const worldPerPixel = (2 * focusDist * Math.tan(this.state.fov / 2)) / rect.height;
                [this.state.position, this.state.orbitPoint].forEach((vector) => {
                    vec3.scaleAndAdd(vector, vector, right, -viewDelta[0] * worldPerPixel);
                    vec3.scaleAndAdd(vector, vector, up, viewDelta[1] * worldPerPixel);
                });
                targetCanvas.style.cursor = "all-scroll";
            }
        } else if (this.state.pointers.size === 2) {
            // Pinch zoom
            // TODO: Fix
            const [pos1, pos2] = Array.from(this.state.pointers.values()) as [vec2, vec2];
            const newDist = Math.hypot(pos2[0] - pos1[0], pos2[1] - pos1[1]);
            const prevDist = Math.hypot(prevPos[0] - pos1[0], prevPos[1] - pos1[1]);
            vec3.scale(
                this.state.position,
                this.state.position,
                1 - (newDist - prevDist) * this.state.pinchSensitivity,
            );
        } else {
            targetCanvas.style.cursor = "default";
        }
    };

    private onWheel = (event: WheelEvent): void => {
        event.preventDefault();
        this.state.fov *= 1 + (event.deltaY > 0 ? 1 : -1) * this.state.zoomSpeed;
    };

    private getAxes(): { forward: vec3; right: vec3; up: vec3 } {
        const forward = vec3.normalize(
            vec3.create(),
            vec3.subtract(vec3.create(), this.state.orbitPoint, this.state.position),
        );
        const right = vec3.normalize(
            vec3.create(),
            vec3.cross(vec3.create(), forward, this.state.up),
        );
        const up = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), right, forward));
        return { forward, right, up };
    }

    private readonly eventHandlers = {
        contextmenu: (event: Event) => event.preventDefault(),
        dragstart: (event: Event) => event.preventDefault(),
        pointerdown: this.onDown,
        pointerup: this.onUp,
        pointercancel: this.onUp,
        pointermove: this.onMove,
        wheel: this.onWheel,
    };
}
