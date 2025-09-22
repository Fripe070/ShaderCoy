import { mat4, vec3 } from "gl-matrix";

enum PointerMode {
    Idle = "idle",
    Orbit = "orbit",
    Pan = "pan",
    Zoom = "zoom",
}
const PointerButton = {
    Left: 0,
    Middle: 1,
    Right: 2,
    Back: 3,
    Forward: 4,

    Primary: 0,
    Wheel: 1,
    Secondary: 2,
} as const;

function distBetween(a: [number, number], b: [number, number]): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
function averagePos(a: [number, number], b: [number, number]): [number, number] {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export class OrbitCamera {
    public orbitPoint: vec3;
    public distance: number;
    public yaw: number;
    public pitch: number;

    public nearPlane: number;
    public farPlane: number;
    public fov: number;

    // Controls
    private trackedPointers = new Map<number, [number, number]>();
    private navMode: PointerMode = PointerMode.Idle;
    private lastTapTime = 0;
    private prevPinchDist: number | undefined;
    private prevPinchMid: [number, number] | undefined;

    constructor(
        params: {
            orbitPoint?: vec3;
            distance?: number;
            yaw?: number;
            pitch?: number;
            nearPlane?: number;
            farPlane?: number;
            fov?: number;
            // Controls
            doubleTapTimeout?: number;
        } = {},
    ) {
        this.orbitPoint = vec3.clone(params.orbitPoint ?? vec3.fromValues(0, 0, 0));
        this.distance = params.distance ?? 10;
        this.yaw = params.yaw ?? 0;
        this.pitch = params.pitch ?? 0;
        this.nearPlane = params.nearPlane ?? 0.1;
        this.farPlane = params.farPlane ?? 100;
        this.fov = params.fov ?? 45 * (Math.PI / 180);

        this.lastTapTime = -(params.doubleTapTimeout ?? 300); // Ensure no immediate double-tap
    }

    getViewMatrix(): mat4 {
        const cameraPosition = vec3.fromValues(
            this.orbitPoint[0] + this.distance * Math.sin(this.yaw) * Math.cos(this.pitch),
            this.orbitPoint[1] + this.distance * Math.sin(this.pitch),
            this.orbitPoint[2] + this.distance * Math.cos(this.yaw) * Math.cos(this.pitch),
        );
        return mat4.lookAt(
            mat4.create(),
            cameraPosition,
            this.orbitPoint,
            vec3.fromValues(0, 1, 0),
        );
    }

    getProjectionMatrix(aspectRatio: number): mat4 {
        return mat4.perspective(
            mat4.create(),
            this.fov,
            aspectRatio,
            this.nearPlane,
            this.farPlane,
        );
    }

    attachTo(canvas: HTMLCanvasElement): void {
        canvas.addEventListener("contextmenu", (event) => event.preventDefault());
        canvas.addEventListener("dragstart", (event) => event.preventDefault());

        // Helper to update cursor based on mode
        const updateCursor = () => {
            switch (this.navMode) {
                case PointerMode.Orbit:
                    canvas.style.cursor = "grab";
                    break;
                case PointerMode.Pan:
                    canvas.style.cursor = "move";
                    break;
                case PointerMode.Zoom:
                    canvas.style.cursor = "zoom-in";
                    break;
                default:
                    canvas.style.cursor = "default";
            }
        };

        canvas.addEventListener("pointerdown", (event: PointerEvent) => {
            // Double-tap to reset orbit point
            const now = Date.now();
            if (now - this.lastTapTime < 300 && this.navMode === PointerMode.Idle) {
                this.orbitPoint = vec3.fromValues(0, 0, 0);
            }
            this.lastTapTime = now;

            canvas.setPointerCapture(event.pointerId);
            this.trackedPointers.set(event.pointerId, [event.clientX, event.clientY]);

            if (this.trackedPointers.size === 1) {
                if (event.button === PointerButton.Right) {
                    this.navMode = PointerMode.Pan;
                } else if (event.button === PointerButton.Middle) {
                    // Blender familiarity
                    if (event.shiftKey) {
                        this.navMode = PointerMode.Pan;
                    } else {
                        this.navMode = PointerMode.Orbit;
                    }
                } else {
                    this.navMode = PointerMode.Orbit; // Default to orbit
                }
            }
            if (this.trackedPointers.size === 2) {
                // If two pointers are down, we prepare for pinch zoom
                this.navMode = PointerMode.Zoom;
                const [pos1, pos2] = this.trackedPointers.values();
                this.prevPinchDist = distBetween(pos1, pos2);
            }
            updateCursor();
        });

        canvas.addEventListener("pointermove", (event: PointerEvent) => {
            if (!this.trackedPointers.has(event.pointerId)) return;

            const lastPos = this.trackedPointers.get(event.pointerId)!;
            const positionDelta: [number, number] = [
                event.clientX - lastPos[0],
                event.clientY - lastPos[1],
            ];
            this.trackedPointers.set(event.pointerId, [event.clientX, event.clientY]);

            if (this.trackedPointers.size === 1) {
                if (this.navMode === PointerMode.Pan) {
                    this.pan(positionDelta);
                } else if (this.navMode === PointerMode.Orbit) {
                    this.orbit(positionDelta);
                } else if (this.navMode === PointerMode.Zoom) {
                    this.zoom(positionDelta[1]); // Zoom in/out based on vertical movement
                }
            }
            if (this.trackedPointers.size === 2) {
                // Pinch zoom and associated panning
                const [pos1, pos2] = this.trackedPointers.values();
                const newDist = distBetween(pos1, pos2);
                const newMid = averagePos(pos1, pos2);
                if (this.prevPinchDist && this.prevPinchMid) {
                    this.zoom(this.prevPinchDist - newDist);
                    this.pan([newMid[0] - this.prevPinchMid[0], newMid[1] - this.prevPinchMid[1]]);
                }
                this.prevPinchDist = newDist;
                this.prevPinchMid = newMid;
            }
            updateCursor();
        });

        const handlePointerExit = (event: PointerEvent) => {
            this.trackedPointers.delete(event.pointerId);
            if (this.trackedPointers.size < 2) {
                this.prevPinchDist = undefined;
                this.prevPinchMid = undefined;
            }
            if (this.trackedPointers.size === 0) {
                this.navMode = PointerMode.Idle;
            } else if (this.trackedPointers.size === 1) {
                this.navMode = PointerMode.Orbit;
            }
            updateCursor();
        };
        canvas.addEventListener("pointerup", (event: PointerEvent) => {
            canvas.releasePointerCapture(event.pointerId);
            handlePointerExit(event);
        });
        canvas.addEventListener("pointercancel", handlePointerExit);

        canvas.addEventListener("wheel", (event: WheelEvent) => {
            if (event.ctrlKey) return; // Ignore ctrl to let the browser handle page zoom

            if (event.shiftKey) {
                this.adjustFov(event.deltaY);
            } else {
                this.zoom(event.deltaY);
            }
            canvas.focus();
            event.preventDefault();
        });
    }

    pan([deltaX, deltaY]: [number, number]): void {
        const viewSpaceOrbit = vec3.transformMat4(
            vec3.create(),
            this.orbitPoint,
            this.getViewMatrix(),
        );

        viewSpaceOrbit[0] -= deltaX * 0.01;
        viewSpaceOrbit[1] += deltaY * 0.01;

        // Convert back to world space
        this.orbitPoint = vec3.transformMat4(
            vec3.create(),
            viewSpaceOrbit,
            mat4.invert(mat4.create(), this.getViewMatrix())!,
        );
    }
    orbit([deltaX, deltaY]: [number, number]): void {
        this.yaw -= deltaX * 0.01;
        this.pitch += deltaY * 0.01;
        // Clamp pitch to avoid going upside down
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
    }
    zoom(scrollDelta: number): void {
        this.distance = Math.max(this.nearPlane, this.distance + scrollDelta * 0.01);
    }
    adjustFov(fovDelta: number): void {
        this.fov += fovDelta / 1000;
        this.fov = Math.max(0.1, Math.min(Math.PI / 2, this.fov));
    }
}
