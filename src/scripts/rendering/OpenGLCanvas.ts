import { cubeMesh, initMeshBuffers, type Mesh, type MeshBuffers } from "../3d/models";
import {
    createShaderProgram,
    getShaderInfo,
    type ShaderCode,
    type ShaderInfo,
    type ShaderStage,
} from "../3d/shader";
import { ShaderCompileError, UserError } from "../errors";
import defaultFragSource from "../shaders/defaultFrag";
import defaultVertSource from "../shaders/defaultVert";

export const VERT_ATTR_KEY: string = "data-vertex";
export const FRAG_ATTR_KEY: string = "data-fragment";

export type WebGLCtx = WebGLRenderingContext | WebGL2RenderingContext;

function resizeCanvasTo(target: HTMLElement, canvas: HTMLCanvasElement): ResizeObserver {
    const resizeObserver = new ResizeObserver(() => {
        const dpr = window.devicePixelRatio || 1;
        const rect = target.getBoundingClientRect();

        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
    });
    resizeObserver.observe(target);
    return resizeObserver;
}

export class OpenGLCanvas {
    public readonly gl: WebGLCtx;

    public loadedShader: ShaderInfo | null = null;
    public loadedMesh: MeshBuffers | null = null;

    private loadedVertexShader: string = defaultVertSource;
    private loadedFragmentShader: string = defaultFragSource;

    private runTime: number = 0;
    private frameCount: bigint = 0n;

    constructor(
        public readonly canvas: HTMLCanvasElement,
        public readonly errorReporter: ErrorReporter,
    ) {
        // Ensure the canvas resolution is updated whenever the parent (container) element is resized.
        const parentElement = this.canvas.parentElement;
        if (!parentElement) throw new Error("Canvas must have a parent element");
        resizeCanvasTo(parentElement, this.canvas);

        // Initialize the WebGL context
        const context = this.canvas.getContext("webgl2"); // TODO: Support WebGL1 as well
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
        this.updateMesh(cubeMesh); // TODO: Load from the model selector

        const observer = new MutationObserver((mutationList) => {
            mutationList.forEach((mutation) => this.onMutation(mutation));
        });
        observer.observe(this.canvas, {
            attributes: true,
            attributeFilter: [VERT_ATTR_KEY, FRAG_ATTR_KEY],
        });
    }

    onMutation(mutation: MutationRecord) {
        console.log("Mutation observed:", mutation);
        if (mutation.type !== "attributes") return;
        if (!mutation.attributeName) return;
        if (![VERT_ATTR_KEY, FRAG_ATTR_KEY].includes(mutation.attributeName)) return;

        const newValue: string = (this.canvas.getAttribute(mutation.attributeName) || "").trim();

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
                throw new Error(`Unexpected attribute mutation: ${mutation.attributeName}`);
        }
        this.updateShader({
            vertex: this.loadedVertexShader,
            fragment: this.loadedFragmentShader,
        });
    }

    render(deltaTime: number): void {
        if (this.isPaused) return;
        if (!this.loadedShader) return;
        if (!this.loadedMesh) {
            this.errorReporter.report(new UserError("No mesh loaded to render."));
            return;
        }

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.useProgram(this.loadedShader.program);
        // TODO: Draw the scene

        this.runTime += deltaTime;
        this.frameCount++;
    }

    setupGL(): void {
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
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
        // TODO: Populate shaderdata
        this.gl.useProgram(this.loadedShader.program);

        console.log("Shader program loaded successfully.");
    }

    updateMesh(mesh: Mesh): void {
        this.loadedMesh = initMeshBuffers(this.gl, mesh);
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

        throw error; // Re-throw the error to propagate it up
    }
}
