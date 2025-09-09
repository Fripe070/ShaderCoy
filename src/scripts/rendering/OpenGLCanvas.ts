import { mat4 } from "gl-matrix";

import { ShaderCompileError, UserError } from "../errors";
import defaultFragSource from "@/assets/shaders/defaultFrag.glsl?raw";
import defaultVertSource from "@/assets/shaders/defaultVert.glsl?raw";
import { OrbitCamera } from "../3d/camera";
import initAssimp, { type MainModule as AssimpTSModule } from "assimpts";
import cubeObj from "@/assets/models/cube.obj?raw";
import { createShaderProgram, getShaderInfo, textureArrayName, type ShaderCode, type ShaderInfo, type ShaderStage } from "@/scripts/gl/shader";
import { loadMeshBuffers, VERTEX_FLOAT_COUNT, VERTEX_SCHEMA, type MeshBuffers } from "@/scripts/model/mesh";
import { loadMeshes, stringToAssimpFile } from "@/scripts/model/load";


export const VERT_ATTR_KEY = "data-vertex";
export const FRAG_ATTR_KEY = "data-fragment";

/**
 * Type representing a WebGL context, which can be either WebGLRenderingContext or WebGL2RenderingContext.
 * This allows for flexibility in using either version of WebGL.
 */
export type WebGLCtx = WebGLRenderingContext | WebGL2RenderingContext;

function resizeCanvasTo(target: HTMLElement, glCanvas: OpenGLCanvas): ResizeObserver {
    const resizeObserver = new ResizeObserver(() => {
        const dpr = window.devicePixelRatio || 1;
        const rect = target.getBoundingClientRect();

        glCanvas.canvas.width = Math.floor(rect.width * dpr);
        glCanvas.canvas.height = Math.floor(rect.height * dpr);
        glCanvas.gl.viewport(0, 0, glCanvas.canvas.width, glCanvas.canvas.height);
    });
    resizeObserver.observe(target);
    return resizeObserver;
}

export class OpenGLCanvas {
    public readonly gl: WebGLCtx;

    public camera: OrbitCamera = new OrbitCamera({
        distance: 6,
        yaw: 45 * (Math.PI / 180),
        pitch: 20 * (Math.PI / 180),
    });

    public loadedShader: ShaderInfo | null = null;
    public loadedMeshBuffers: MeshBuffers | null = null;
    private loadedTextures: WebGLTexture[] = [];

    private loadedVertexShader: string = defaultVertSource;
    private loadedFragmentShader: string = defaultFragSource;

    private runTime = 0;
    private frameCount = 0;
    private lastMouseData: { x: number; y: number; left: boolean; right: boolean } = {
        x: 0,
        y: 0,
        left: false,
        right: false,
    };

    private assimp: AssimpTSModule | null = null;

    constructor(
        public readonly canvas: HTMLCanvasElement,
        public readonly errorReporter: ErrorReporter,
    ) {
        // Ensure the canvas resolution is updated whenever the parent (container) element is resized.
        const parentElement = this.canvas.parentElement;
        if (!parentElement) throw new Error("Canvas must have a parent element");
        resizeCanvasTo(parentElement, this);

        // Initialize the WebGL context
        const context: WebGLCtx | null = this.canvas.getContext("webgl2"); // TODO: Support WebGL1 as well
        if (!context) {
            const error = new UserError(
                "This site will not function as your system or browser does not support WebGL 2.0. " +
                    "\nWhile support for WebGL 1.0 is planned, it is not yet implemented. " +
                    "\nIn the meantime, please upgrade or switch to a modern browser. ",
            );
            this.errorReporter.report(error);
            throw error;
        }
        this.gl = context;

        // Set up the WebGL context and load the default shaders
        this.setupGL();
        this.updateShader({
            vertex: this.loadedVertexShader,
            fragment: this.loadedFragmentShader,
        });
        // this.loadedMesh = initMeshBuffers(this.gl, cubeMesh); // TODO: Load from the model selector

        // Initialize Assimp, should be relatively fast but we can't guarantee it
        initAssimp().then((module) => {
            this.assimp = module;
            console.debug("Assimp initialized.");

            const mesh = loadMeshes(
                this.assimp,
                [stringToAssimpFile("cube_simple.obj", cubeObj)], 
            )[0]
            console.log("Loaded mesh:", mesh);
            this.loadedMeshBuffers = loadMeshBuffers(this.gl, mesh);
            console.log("Initialized mesh buffers:", this.loadedMeshBuffers);
        });

        const observer = new MutationObserver((mutationList) => {
            mutationList.forEach((mutation) => this.onMutation(mutation));
        });
        observer.observe(this.canvas, {
            attributes: true,
            attributeFilter: [VERT_ATTR_KEY, FRAG_ATTR_KEY],
        });
        
        // Mouse movement for camera controls
        this.camera.attachTo(this.canvas);

        // Mouse position and click tracking
        this.canvas.addEventListener("mousemove", (event) => {
            this.lastMouseData.x = event.clientX;
            this.lastMouseData.y = event.clientY;
        });
        this.canvas.addEventListener("mousedown", (event) => {
            if (event.button === 0) this.lastMouseData.left = true;
            if (event.button === 2) this.lastMouseData.right = true;
        });
        this.canvas.addEventListener("mouseup", (event) => {
            if (event.button === 0) this.lastMouseData.left = false;
            if (event.button === 2) this.lastMouseData.right = false;
        });
    }

    onMutation(mutation: MutationRecord) {
        if (mutation.type !== "attributes") return;
        if (!mutation.attributeName) return;
        if (![VERT_ATTR_KEY, FRAG_ATTR_KEY].includes(mutation.attributeName)) return;

        const newValue: string = (this.canvas.getAttribute(mutation.attributeName) ?? "").trim();

        switch (mutation.attributeName) {
            case VERT_ATTR_KEY:
                if (newValue === this.loadedVertexShader) return;
                this.loadedVertexShader = newValue;
                break;
            case FRAG_ATTR_KEY:
                if (newValue === this.loadedFragmentShader) return;
                this.loadedFragmentShader = newValue;
                break;
            default:
                console.warn(`Unexpected attribute mutation: ${mutation.attributeName}`);
                return;
        }
        this.updateShader({
            vertex: this.loadedVertexShader,
            fragment: this.loadedFragmentShader,
        });
    }

    render(deltaTime: number): void {
        if (this.isPaused) return;
        if (!this.loadedShader) return;
        if (!this.loadedMeshBuffers) {
            this.errorReporter.report(new UserError("No mesh loaded to render."));
            return;
        }

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.useProgram(this.loadedShader.program);

        this.updateFrameUniforms({ deltaTime: deltaTime });

        // Procedurally generate the vertex attributes
        const floatBytes = Float32Array.BYTES_PER_ELEMENT;
        const totalBytes = floatBytes * VERTEX_FLOAT_COUNT;
        let offset = 0;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.loadedMeshBuffers!.vertexBuffer);
        for (const [key, { size: attrSize }] of Object.entries(VERTEX_SCHEMA) as [
            keyof typeof VERTEX_SCHEMA,
            (typeof VERTEX_SCHEMA)[keyof typeof VERTEX_SCHEMA]
        ][]) {
            // TODO: Is skipping null (-1) here problematic?
            const attrLoc = this.loadedShader.attributes[key];
            if (attrLoc !== null) {
                this.gl.enableVertexAttribArray(attrLoc);
                this.gl.vertexAttribPointer(
                    attrLoc,
                    attrSize,
                    this.gl.FLOAT,
                    false,
                    totalBytes,
                    offset,
                );
            }
            offset += attrSize * floatBytes;
        }

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.loadedMeshBuffers!.indexBuffer);
        this.gl.drawElements(
            this.gl.TRIANGLES,
            this.loadedMeshBuffers.indexCount,
            this.gl.UNSIGNED_SHORT,
            0,
        );

        this.runTime += deltaTime;
        this.frameCount++;
    }

    setupGL(): void {
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendEquationSeparate(this.gl.FUNC_ADD, this.gl.FUNC_ADD);
        this.gl.blendFuncSeparate(
            this.gl.SRC_ALPHA,
            this.gl.ONE_MINUS_SRC_ALPHA,
            this.gl.ONE,
            this.gl.ONE_MINUS_SRC_ALPHA,
        );

        this.gl.frontFace(this.gl.CCW);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
    }

    updateShader(newShaders: ShaderCode): void {
        this.errorReporter.report(null); // TODO: Remove once I've upgraded the error reporter to be good

        if (!newShaders.vertex || !newShaders.fragment) {
            this.errorReporter.report(
                new UserError("No shader code provided for either vertex or fragment shader."),
            );
            return;
        }

        let shaderProgram: WebGLProgram | null = null;
        try {
            shaderProgram = createShaderProgram(this.gl, newShaders);
        } catch (error) {
            if (!(error instanceof Error)) throw error;
            this.errorReporter.report(error);
            return;
        }

        if (this.loadedShader) {
            this.gl.deleteProgram(this.loadedShader.program);
            this.loadedShader = null;
        }
        this.loadedShader = getShaderInfo(this.gl, shaderProgram);
        this.gl.useProgram(shaderProgram);
        this.populateShaderData();

        console.debug("Shader updated.");
    }

    populateShaderData(): void {
        if (!this.loadedShader) return;
        // TODO: Do we even need this? Will we ever allow moving the model?
        const modelMatrix = mat4.create();
        this.gl.uniformMatrix4fv(this.loadedShader.uniforms.modelMatrix, false, modelMatrix);

        this.updateFrameUniforms({ deltaTime: 0 });
        this.rebindTextures(this.loadedTextures);
    }

    updateFrameUniforms(data: { deltaTime: number }): void {
        if (!this.loadedShader) return;
        // Camera matrices
        this.gl.uniformMatrix4fv(
            this.loadedShader.uniforms.projectionMatrix,
            false,
            this.camera.getProjectionMatrix(this.canvas.width / this.canvas.height),
        );
        this.gl.uniformMatrix4fv(
            this.loadedShader.uniforms.viewMatrix,
            false,
            this.camera.getViewMatrix(),
        );
        // Time uniforms
        this.gl.uniform1f(this.loadedShader.uniforms.time, this.runTime);
        this.gl.uniform1i(this.loadedShader.uniforms.frameNumber, this.frameCount);
        this.gl.uniform1f(this.loadedShader.uniforms.timeDelta, data.deltaTime);
        // Mouse position
        this.gl.uniform4f(
            this.loadedShader.uniforms.mouse,
            this.lastMouseData.x / this.canvas.width,
            this.lastMouseData.y / this.canvas.height,
            this.lastMouseData.left ? 1 : 0,
            this.lastMouseData.right ? 1 : 0,
        );
        // Resolution
        this.gl.uniform2f(
            this.loadedShader.uniforms.resolution,
            this.canvas.width,
            this.canvas.height,
        );
    }

    rebindTextures(textures: WebGLTexture[]): void {
        const maxTextures = (this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS) as GLint) ?? 0;
        if (textures.length > maxTextures) throw new Error("Too many textures to bind");

        for (let i = 0; i < maxTextures; i++) {
            this.gl.activeTexture(this.gl.TEXTURE0 + i);
            this.gl.bindTexture(this.gl.TEXTURE_2D, textures[i] || null);
            if (!this.loadedShader) continue;
            this.gl.uniform1i(
                this.gl.getUniformLocation(this.loadedShader.program, `${textureArrayName}[${i}]`),
                i,
            );
        }
        console.debug(`Bound ${textures.length} textures.`);
    }

    setTextures(textures: WebGLTexture[]): void {
        this.loadedTextures = textures;
        this.rebindTextures(textures);
    }

    get isPaused(): boolean {
        return this.canvas.dataset.paused === "true";
    }
    set isPaused(value: boolean) {
        this.canvas.dataset.paused = value ? "true" : "false";
    }
}

export class ErrorReporter {
    constructor(private readonly errorContainer: HTMLElement) {
        this.errorContainer.style.display = "none";
        this.errorContainer.innerHTML = "";
    }

    report(error: Error | null): void {
        this.errorContainer.innerHTML = "";
        this.errorContainer.style.display = "none";
        if (!error) return;
        this.errorContainer.style.display = "block";

        if (!(error instanceof UserError)) {
            this.errorContainer.innerHTML = /* html */ `
                <h3>Error!</h3>
                <p>An unexpected error occurred. Please check the console for details.</p>
            `;
            throw error; // Re-throw the error to propagate it up
        }

        const shaderStageMapping: Record<ShaderStage, string> = {
            [WebGLRenderingContext.VERTEX_SHADER]: "Vertex",
            [WebGLRenderingContext.FRAGMENT_SHADER]: "Fragment",
        };

        const header = document.createElement("h3");
        if (error instanceof ShaderCompileError) {
            header.textContent = `${shaderStageMapping[error.shaderType]} Shader Error`;
        } else {
            header.textContent = "Error";
        }
        this.errorContainer.appendChild(header);
        const message = document.createElement("pre");
        message.textContent = error.message;
        this.errorContainer.appendChild(message);
    }
}
