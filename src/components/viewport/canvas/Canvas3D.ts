import type { PrimaryShader } from "@/scripts/resources/shader/datatypes";
import { loadPrimaryShader } from "@/scripts/resources/shader/load";
import type { WebGLCtx } from "@/scripts/utils";
import initAssimp, { type MainModule as AssimpTSModule } from "assimpts";
import defaultFragSource from "@/assets/shaders/defaultFrag.glsl?raw";
import defaultVertSource from "@/assets/shaders/defaultVert.glsl?raw";
import { loadMeshes, stringToAssimpFile } from "@/scripts/resources/model/load";
import defaultCubeObj from "@/assets/models/cube.obj?raw";
import type { MeshBuffers } from "@/scripts/resources/model/datatypes";
import { OrbitCamera } from "@/scripts/camera";
import { VERTEX_SCHEMA, VERTEX_VALUE_COUNT } from "@/scripts/resources//model/datatypes";
import { mat4 } from "gl-matrix";

export class RenderState {
    isPaused = false;
    deltaTime = 0;
    frameNumber = 0;
    secondsSinceStart = 0;

    // TODO: Make sure to document the structure of this
    // and that x and y are relative to the canvas
    mouseData = { x: 0, y: 0, left: false, right: false };

    camera: OrbitCamera | null = null;

    loadedShader: PrimaryShader | null = null;
    loadedMeshes: MeshBuffers[] | null = null; // Null represent a fullscreen quad
    loadedTextures: TextureWrapper[] = [];
}

export class Canvas3D {
    public canvasElement: HTMLCanvasElement;
    private canvasNeedResize = true;

    public state: RenderState;
    private glCtx: WebGLCtx;
    private assimp: AssimpTSModule | null = null;

    private renderLoopId: number | null = null;
    private lastFrameTimestamp: DOMHighResTimeStamp = 0;
    private readonly MAX_DELTA_TIME_S = 1 / 10;

    constructor(canvasElement: HTMLCanvasElement) {
        this.canvasElement = canvasElement;
        this.state = new RenderState();

        // Initialize WebGL context
        const context: WebGLCtx | null = this.canvasElement.getContext("webgl2");
        if (!context) {
            const error = new Error(
                "This site will not function as your system or browser does not support WebGL 2.0. " +
                    "\nWhile support for WebGL 1.0 is planned, it is not yet implemented. " +
                    "\nIn the meantime, please upgrade or switch to a modern browser. ",
            );
            throw error;
        }
        this.glCtx = context;
        setupGl(this.glCtx);

        // Load default shader
        this.state.loadedShader = loadPrimaryShader(this.glCtx, {
            vertex: defaultVertSource,
            fragment: defaultFragSource,
        });

        initAssimp().then((assimpModule) => {
            this.assimp = assimpModule;
            console.debug("Assimp initialized.");
            // TODO: Load from build-time dumped json to reduce initial load time
            // (especially bad on mobile)
            // TODO: Add loading indicator whenever I implement model loading
            this.state.loadedMeshes = loadMeshes(this.assimp, [
                stringToAssimpFile("model.obj", defaultCubeObj),
            ]).map((mesh) => {
                console.log("Loaded mesh:", mesh);
                const buffers = mesh.toBuffers(this.glCtx);
                return buffers;
            });
            console.debug("Default model loaded.");
        });

        // Set camera
        this.state.camera = new OrbitCamera();
        this.state.camera.attach(this.canvasElement);

        // Mouse position and click tracking
        this.canvasElement.addEventListener("mousemove", (event) => {
            this.state.mouseData.x = event.clientX;
            this.state.mouseData.y = event.clientY;
        });
        this.canvasElement.addEventListener("mousedown", (event) => {
            if (event.button === 0) this.state.mouseData.left = true;
            if (event.button === 2) this.state.mouseData.right = true;
        });
        this.canvasElement.addEventListener("mouseup", (event) => {
            if (event.button === 0) this.state.mouseData.left = false;
            if (event.button === 2) this.state.mouseData.right = false;
        });

        new ResizeObserver(() => {
            this.canvasNeedResize = true;
        }).observe(this.canvasElement);
    }

    public flushState(): RenderState {
        const oldState = { ...this.state };
        this.state = new RenderState();
        return oldState;
    }

    public startRenderLoop(): void {
        // prevent double-start
        if (this.renderLoopId !== null) {
            console.warn("Tried to start render loop, but it's already running.");
            return;
        }

        const renderLoop = (currentTime: DOMHighResTimeStamp) => {
            this.renderLoopId = requestAnimationFrame(renderLoop);

            this.state.deltaTime = 0;
            if (this.lastFrameTimestamp !== 0) {
                this.state.deltaTime = (currentTime - this.lastFrameTimestamp) / 1000;
                this.state.deltaTime = Math.max(this.state.deltaTime, 0);
                this.state.deltaTime = Math.min(this.state.deltaTime, this.MAX_DELTA_TIME_S);
            }
            this.lastFrameTimestamp = currentTime;

            const cantRender = this.state.isPaused || this.state.loadedShader === null;
            if (!cantRender) {
                this.render();
                this.state.frameNumber++;
                this.state.secondsSinceStart += this.state.deltaTime;
            }
        };
        this.renderLoopId = requestAnimationFrame(renderLoop);
    }

    public stopRenderLoop(): void {
        if (this.renderLoopId === null) return;
        cancelAnimationFrame(this.renderLoopId);
        this.renderLoopId = null;
        this.lastFrameTimestamp = 0;
    }

    private refreshSize(): void {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvasElement.getBoundingClientRect();
        this.canvasElement.width = Math.floor(rect.width * dpr);
        this.canvasElement.height = Math.floor(rect.height * dpr);
        this.glCtx.viewport(0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    public render(): void {
        if (this.canvasNeedResize) {
            // We do this in render instead of in the event to prevent flickering
            this.refreshSize();
            this.canvasNeedResize = false;
        }

        if (this.state.loadedShader === null) throw new Error("No shader loaded for rendering.");
        if (this.state.camera === null) throw new Error("No camera set for rendering.");

        this.glCtx.clear(this.glCtx.COLOR_BUFFER_BIT | this.glCtx.DEPTH_BUFFER_BIT);
        this.glCtx.useProgram(this.state.loadedShader.program);

        // TODO: Improve this to not run every frame
        // All models are at 0,0,0 rn, so we set the model matrix here
        const modelMatrix = mat4.create();
        this.glCtx.uniformMatrix4fv(
            this.state.loadedShader.uniforms.modelMatrix,
            false,
            modelMatrix,
        );

        this.updateGlobalUniforms();

        // Render scene
        if (this.state.loadedMeshes !== null) {
            this.state.loadedMeshes.forEach((mesh) => this.renderMesh(mesh));
        } else {
            // TODO: Render fullscreen quad
            console.warn("No meshes to render.");
        }
    }

    private updateGlobalUniforms(): void {
        if (this.state.loadedShader === null) return;
        if (this.state.camera === null) return;

        // Camera matrices
        this.glCtx.uniformMatrix4fv(
            this.state.loadedShader.uniforms.projectionMatrix,
            false,
            this.state.camera.getProjectionMatrix(
                this.canvasElement.width / this.canvasElement.height,
            ),
        );
        this.glCtx.uniformMatrix4fv(
            this.state.loadedShader.uniforms.viewMatrix,
            false,
            this.state.camera.getViewMatrix(),
        );

        // Time
        this.glCtx.uniform1f(this.state.loadedShader.uniforms.deltaTime, this.state.deltaTime);
        this.glCtx.uniform1i(this.state.loadedShader.uniforms.frameNumber, this.state.frameNumber);
        this.glCtx.uniform1f(this.state.loadedShader.uniforms.time, this.state.secondsSinceStart);

        // Resolution
        this.glCtx.uniform2f(
            this.state.loadedShader.uniforms.resolution,
            this.canvasElement.width,
            this.canvasElement.height,
        );

        // Mouse
        this.glCtx.uniform4f(
            this.state.loadedShader.uniforms.mouse,
            this.state.mouseData.x,
            this.state.mouseData.y,
            this.state.mouseData.left ? 1 : 0,
            this.state.mouseData.right ? 1 : 0,
        );
    }

    private renderMesh(mesh: MeshBuffers): void {
        if (this.state.loadedShader === null) return;

        this.glCtx.bindBuffer(this.glCtx.ARRAY_BUFFER, mesh.vertexBuffer);
        bindAttributes(this.glCtx, this.state.loadedShader);

        this.glCtx.bindBuffer(this.glCtx.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        this.glCtx.drawElements(
            this.glCtx.TRIANGLES,
            mesh.indexCount,
            this.glCtx.UNSIGNED_SHORT,
            0,
        );
    }
}

function bindAttributes(glCtx: WebGLCtx, shader: PrimaryShader): void {
    const floatBytes = Float32Array.BYTES_PER_ELEMENT;
    const vertexBytes = floatBytes * VERTEX_VALUE_COUNT;
    // Procedurally generate the vertex attributes
    let offset = 0;
    for (const [key, { size: attrSize }] of Object.entries(VERTEX_SCHEMA) as [
        keyof typeof VERTEX_SCHEMA,
        (typeof VERTEX_SCHEMA)[keyof typeof VERTEX_SCHEMA],
    ][]) {
        // TODO: Is skipping null (-1) here problematic?
        const attrLoc = shader.attributes[key];
        if (attrLoc !== null) {
            glCtx.enableVertexAttribArray(attrLoc);
            glCtx.vertexAttribPointer(attrLoc, attrSize, glCtx.FLOAT, false, vertexBytes, offset);
        } else {
            console.warn(`Shader is missing attribute ${key}, skipping.`);
        }
        offset += attrSize * floatBytes;
    }
}

function setupGl(glCtx: WebGLCtx): void {
    glCtx.clearColor(0.0, 0.0, 0.0, 0.0);
    glCtx.clear(glCtx.COLOR_BUFFER_BIT | glCtx.DEPTH_BUFFER_BIT);

    glCtx.enable(glCtx.DEPTH_TEST);
    glCtx.depthFunc(glCtx.LEQUAL);

    glCtx.enable(glCtx.BLEND);
    glCtx.blendEquationSeparate(glCtx.FUNC_ADD, glCtx.FUNC_ADD);
    glCtx.blendFuncSeparate(
        glCtx.SRC_ALPHA,
        glCtx.ONE_MINUS_SRC_ALPHA,
        glCtx.ONE,
        glCtx.ONE_MINUS_SRC_ALPHA,
    );

    glCtx.frontFace(glCtx.CCW);
    glCtx.enable(glCtx.CULL_FACE);
    // glCtx.cullFace(glCtx.BACK);
}
