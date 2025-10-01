import { modelPrimitives } from "../ModelSelector/ModelSelector";
import { OrbitCamera } from "@/scripts/camera";
import { VERTEX_SCHEMA, VERTEX_VALUE_COUNT } from "@/scripts/resources//model/datatypes";
import type { MeshBuffers } from "@/scripts/resources/model/datatypes";
import { meshToBuffers } from "@/scripts/resources/model/load";
import { textureArrayName, type PrimaryShader } from "@/scripts/resources/shader/datatypes";
import { loadPrimaryShader } from "@/scripts/resources/shader/load";
import type { TextureData } from "@/scripts/resources/texture/datatypes";
import appState from "@/scripts/state";
import type { WebGLCtx } from "@/scripts/utils";
import { mat4 } from "gl-matrix";
import { atom, subscribeKeys, computed, type ReadableAtom } from "nanostores";

export class RenderState {
    isPaused = false;
    deltaTime = 0;
    frameNumber = 0;
    secondsSinceStart = 0;

    // TODO: Make sure to document the structure of this
    // and that x and y are relative to the canvas
    mouseData = { x: 0, y: 0, left: false, right: false };

    camera: OrbitCamera = new OrbitCamera();

    $loadedShader: ReadableAtom<PrimaryShader | null>;
    loadedMeshes: MeshBuffers[] | null = null; // Null represent a fullscreen quad
    $loadedTextures = atom<TextureData[]>([]);

    // All models are at 0,0,0 rn, so we set the model matrix here
    modelMatrix = mat4.create();
    projectionMatrix = mat4.create();
    viewMatrix = mat4.create();

    $backFaceCulling = atom(true);

    canvasNeedResize = true;
    $canvasSize = atom({ width: 0, height: 0 });

    constructor(canvas: Canvas3D) {
        this.$loadedShader = computed(appState.$shaderCode, (code) => {
            try {
                const oldShader = this.$loadedShader.get();
                if (oldShader) canvas.glCtx.deleteProgram(oldShader.program);
                while (canvas.glCtx.getError() !== canvas.glCtx.NO_ERROR) {
                    // Flush existing errors
                }
                return loadPrimaryShader(canvas.glCtx, code);
            } catch (error) {
                console.error("Failed to load shader:", error);
                return null;
            }
        });
    }
}

export class Canvas3D {
    public canvasElement: HTMLCanvasElement;

    public state: RenderState;
    public glCtx: WebGLCtx;

    private renderLoopId: number | null = null;
    private lastFrameTimestamp: DOMHighResTimeStamp = 0;
    private readonly MAX_DELTA_TIME_S = 1 / 10;

    constructor(canvasElement: HTMLCanvasElement) {
        this.canvasElement = canvasElement;

        // Initialize WebGL context
        const webglContext: WebGLCtx | null = this.canvasElement.getContext("webgl2");
        if (!webglContext) {
            const error = new Error(
                "This site will not function as your system or browser does not support WebGL 2.0. " +
                    "\nWhile support for WebGL 1.0 is planned, it is not yet implemented. " +
                    "\nIn the meantime, please upgrade or switch to a modern browser. ",
            );
            throw error;
        }
        this.glCtx = webglContext;
        setupGl(this.glCtx);

        // Initialize state
        this.state = new RenderState(this);

        if (modelPrimitives) {
            this.state.loadedMeshes = modelPrimitives.suzanne.meshes.map((mesh) =>
                meshToBuffers(mesh, this.glCtx),
            );
        }

        // Set camera
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
            this.state.canvasNeedResize = true;
        }).observe(this.canvasElement);

        this.state.camera.$viewMatrix.subscribe((newView) => {
            this.state.viewMatrix = newView;
        });
        subscribeKeys(this.state.camera.$state, ["fovRadians", "nearPlane", "farPlane"], () => {
            this.state.projectionMatrix = this.state.camera.getProjectionMatrix(
                this.state.$canvasSize.get().width / this.state.$canvasSize.get().height,
            );
        });
        this.state.$canvasSize.subscribe((newSize) => {
            this.state.projectionMatrix = this.state.camera.getProjectionMatrix(
                newSize.width / newSize.height,
            );
        });

        this.state.$backFaceCulling.subscribe((enabled) => {
            if (enabled) this.glCtx.enable(this.glCtx.CULL_FACE);
            else this.glCtx.disable(this.glCtx.CULL_FACE);
        });
    }

    public flushState(): RenderState {
        const oldState = { ...this.state };
        this.state = new RenderState(this);
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

            const cantRender = this.state.isPaused || this.state.$loadedShader.get() === null;
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
        this.state.$canvasSize.set({
            width: this.canvasElement.width,
            height: this.canvasElement.height,
        });
    }

    public render(): void {
        if (this.state.canvasNeedResize) {
            // We do this in render instead of in the event to prevent flickering
            this.refreshSize();
            this.state.canvasNeedResize = false;
        }

        const loadedMainShader = this.state.$loadedShader.get();

        if (loadedMainShader === null) throw new Error("No shader loaded for rendering.");
        if (this.state.camera === null) throw new Error("No camera set for rendering.");

        this.glCtx.clear(this.glCtx.COLOR_BUFFER_BIT | this.glCtx.DEPTH_BUFFER_BIT);
        this.glCtx.useProgram(loadedMainShader.program);

        this.glCtx.uniformMatrix4fv(
            loadedMainShader.uniforms.modelMatrix,
            false,
            this.state.modelMatrix,
        );
        // Camera matrices
        this.glCtx.uniformMatrix4fv(
            loadedMainShader.uniforms.projectionMatrix,
            false,
            this.state.projectionMatrix,
        );
        this.glCtx.uniformMatrix4fv(
            loadedMainShader.uniforms.viewMatrix,
            false,
            this.state.viewMatrix,
        );

        this.state.$loadedTextures.get().forEach((textureData, index) => {
            this.glCtx.activeTexture(this.glCtx.TEXTURE0 + index);
            this.glCtx.bindTexture(this.glCtx.TEXTURE_2D, textureData.glTexture);
            const uniformLocation = this.glCtx.getUniformLocation(
                loadedMainShader.program,
                textureArrayName(index),
            );
            this.glCtx.uniform1i(uniformLocation, index);
        });

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
        const loadedMainShader = this.state.$loadedShader.get();
        if (loadedMainShader === null) return;
        if (this.state.camera === null) return;

        // Time
        this.glCtx.uniform1f(loadedMainShader.uniforms.deltaTime, this.state.deltaTime);
        this.glCtx.uniform1i(loadedMainShader.uniforms.frameNumber, this.state.frameNumber);
        this.glCtx.uniform1f(loadedMainShader.uniforms.time, this.state.secondsSinceStart);

        // Resolution
        this.glCtx.uniform2f(
            loadedMainShader.uniforms.resolution,
            this.canvasElement.width,
            this.canvasElement.height,
        );

        // Mouse
        this.glCtx.uniform4f(
            loadedMainShader.uniforms.mouse,
            this.state.mouseData.x,
            this.state.mouseData.y,
            this.state.mouseData.left ? 1 : 0,
            this.state.mouseData.right ? 1 : 0,
        );
    }

    private renderMesh(mesh: MeshBuffers): void {
        const loadedMainShader = this.state.$loadedShader.get();
        if (loadedMainShader === null) return;

        this.glCtx.bindBuffer(this.glCtx.ARRAY_BUFFER, mesh.vertexBuffer);
        bindAttributes(this.glCtx, loadedMainShader);

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
