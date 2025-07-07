import { mat4, vec3 } from "gl-matrix";

export class OrbitCamera {
    public orbitPoint: vec3;
    public distance: number;
    public yaw: number;
    public pitch: number;

    public nearPlane: number;
    public farPlane: number;
    public fov: number;

    constructor({
        orbitPoint = vec3.fromValues(0, 0, 0),
        distance = 10,
        yaw = 0,
        pitch = 0,
        nearPlane = 0.1,
        farPlane = 100,
        fov = 45 * (Math.PI / 180),
    }: Partial<OrbitCamera> = {}) {
        this.orbitPoint = vec3.clone(orbitPoint);
        this.distance = distance;
        this.yaw = yaw;
        this.pitch = pitch;
        this.nearPlane = nearPlane;
        this.farPlane = farPlane;
        this.fov = fov;
    }

    getViewMatrix(): mat4 {
        const viewMatrix = mat4.create();
        const cameraPosition = vec3.fromValues(
            this.orbitPoint[0] + this.distance * Math.sin(this.yaw) * Math.cos(this.pitch),
            this.orbitPoint[1] + this.distance * Math.sin(this.pitch),
            this.orbitPoint[2] + this.distance * Math.cos(this.yaw) * Math.cos(this.pitch),
        );

        mat4.lookAt(viewMatrix, cameraPosition, this.orbitPoint, vec3.fromValues(0, 1, 0));
        return viewMatrix;
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
            mat4.invert(mat4.create(), this.getViewMatrix()),
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

    // Listen for all the relevant events (both mouse and touch)
    attachTo(canvas: HTMLCanvasElement): void {
        canvas.addEventListener("contextmenu", (event) => event.preventDefault());
        canvas.addEventListener("dragstart", (event) => event.preventDefault());

        canvas.addEventListener("mousemove", (event: MouseEvent) => {
            if (event.buttons & 1) {
                // Left button for orbit
                this.orbit([event.movementX, event.movementY]);
            } else if (event.buttons & 2) {
                // Right button for pan
                this.pan([event.movementX, event.movementY]);
            }
        });
        canvas.addEventListener("wheel", (event: WheelEvent) => {
            // this.zoom(event.deltaY);
            // If holding Ctrl, adjust FOV instead of zooming
            if (event.shiftKey) {
                this.adjustFov(event.deltaY);
            } else {
                this.zoom(event.deltaY);
            }
            event.preventDefault();
        });
    }
}
