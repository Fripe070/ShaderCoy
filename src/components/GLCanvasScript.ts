// HEAVILY coupled to the component

import {
    getShaderInfo,
    loadFragmentShader,
    loadVertexShader,
    type ShaderInfo,
    type ShaderStage,
} from "../scripts/3d/shader";

import defaultVertSource from "../scripts/shaders/defaultVert";
import defaultFragSource from "../scripts/shaders/defaultFrag";
import { ShaderError, UserError } from "../scripts/errors";

type ShaderPair = {
    vert: string;
    frag: string;
};

export class GlCanvas extends HTMLCanvasElement {
    static readonly VERT_ATTR_KEY: string = "data-vertex";
    static readonly FRAG_ATTR_KEY: string = "data-fragment";
    static get observedAttributes(): string[] {
        return [this.VERT_ATTR_KEY, this.FRAG_ATTR_KEY];
    }

    private gl: WebGLRenderingContext | null = null;
    private shaderProgram: WebGLProgram | null = null;
    private shaderInfo: ShaderInfo | null = null;

    private currentVert: string = defaultVertSource;
    private currentFrag: string = defaultFragSource;

    private errorReporter: HTMLElement | null = null;

    constructor() {
        super();
    }

    connectedCallback() {
        this.errorReporter = document.getElementById(`${this.id}-error-reporter`);
        if (!this.errorReporter) {
            console.error("Error reporter element not found");
        }

        // This is insane but I was going mad trying to make the stupid element not push on its parents
        const anchorElement = this.parentElement!;
        const resizeObserver = new ResizeObserver(() => {
            const dpr = window.devicePixelRatio || 1;
            const rect = anchorElement.getBoundingClientRect();

            this.width = Math.floor(rect.width * dpr);
            this.height = Math.floor(rect.height * dpr);
        });
        resizeObserver.observe(anchorElement);

        // Initialize WebGL context or any other setup
        this.gl = this.getContext("webgl2");
        // TODO: Add some mode to toggle between WebGL1 and WebGL2 and fallback with a warning.
        // TODO: (req for above) Implement a more robust error reporting system that supports temporary errors/warnings
        if (!this.gl) {
            this.reportError(
                new UserError(
                    "This site will not function as your system or browser does not support WebGL 2.0. " +
                        "\nWhile support for WebGL 1.0 is planned, it is not yet implemented. " +
                        "\nIn the meantime, please upgrade or switch to a modern browser. ",
                ),
            );
            return;
        }

        this.setupGL(this.gl);
        this.updateShader({
            vert: this.currentVert,
            frag: this.currentFrag,
        });
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        if (oldValue?.trim() === newValue?.trim()) return;
        switch (name) {
            case GlCanvas.VERT_ATTR_KEY:
                this.currentVert = (newValue || "").trim();
                if (this.isConnected && this.gl) {
                    this.updateShader({
                        vert: this.currentVert,
                        frag: this.currentFrag,
                    });
                }
                break;
            case GlCanvas.FRAG_ATTR_KEY:
                this.currentFrag = (newValue || "").trim();
                if (this.isConnected && this.gl) {
                    this.updateShader({
                        vert: this.currentVert,
                        frag: this.currentFrag,
                    });
                }
                break;
            default:
                console.debug(`Unhandled attribute change: ${name}`);
                break;
        }
    }

    setupGL(glCtx: WebGLRenderingContext): void {
        glCtx.clearColor(0.0, 0.0, 0.0, 1.0);
        glCtx.clear(glCtx.COLOR_BUFFER_BIT | glCtx.DEPTH_BUFFER_BIT);

        glCtx.enable(glCtx.DEPTH_TEST);
        glCtx.depthFunc(glCtx.LEQUAL);

        glCtx.viewport(0, 0, this.width, this.height);
    }

    updateShader(shaderPair: ShaderPair): void {
        this.reportError(null);

        if (!this.gl) {
            console.warn("WebGL context not initialized.");
            return;
        }
        if (!shaderPair || !shaderPair.frag || !shaderPair.vert) {
            console.warn("No shader code provided.");
            this.shaderProgram = null;
            this.shaderInfo = null;
            return;
        }
        let vertexShader: WebGLShader | null = null;
        let fragmentShader: WebGLShader | null = null;

        console.log(shaderPair);

        try {
            vertexShader = loadVertexShader(this.gl, shaderPair.vert);
            fragmentShader = loadFragmentShader(this.gl, shaderPair.frag);
        } catch (error) {
            this.reportError(error);
            return;
        }

        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);
        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            alert(
                "Unable to initialize the shader program: " +
                    this.gl.getProgramInfoLog(shaderProgram),
            );
        }

        this.gl.useProgram(shaderProgram);
        if (this.shaderProgram) {
            this.gl.deleteProgram(this.shaderProgram);
            this.shaderProgram = null;
        }
        this.shaderProgram = shaderProgram;
        this.shaderInfo = getShaderInfo(this.gl, shaderProgram);
        // TODO: Populate shaderdata

        console.log("Shader program loaded successfully.");
    }

    render(): void {
        if (!this.gl || !this.shaderProgram) {
            console.warn("WebGL context or shader program not initialized.");
            return;
        }

        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.shaderProgram);


        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }

    reportError(error: unknown | null): void {
        if (!this.errorReporter) {
            console.error("Error reporter element not found");
            return;
        }
        this.errorReporter.innerHTML = "";
        this.errorReporter.style.display = "none";
        if (!error) return;
        this.errorReporter.style.display = "block";

        if (!(error instanceof UserError)) {
            console.error(error);
            this.errorReporter.innerHTML = /* html */ `
                <h3>Error!</h3>
                <p>An unexpected error occurred. Please check the console for details.</p>
            `;
            return;
        }

        const shaderStageMapping: Record<ShaderStage, string> = {
            [WebGLRenderingContext.VERTEX_SHADER]: "Vertex",
            [WebGLRenderingContext.FRAGMENT_SHADER]: "Fragment",
        };

        const header = document.createElement("h3");
        if (error instanceof ShaderError) {
            header.textContent = `${shaderStageMapping[error.shaderType]} Shader Error`;
        } else {
            header.textContent = "Error";
        }
        this.errorReporter.appendChild(header);
        const message = document.createElement("pre");
        message.textContent = error.message;
        this.errorReporter.appendChild(message);

        throw error; // Re-throw the error to propagate it up
    }

    // TODO: Oh god I am going to have to support orbiting or some sort of model navigation

    get isPaused(): boolean {
        return this.dataset.paused === "true";
    }
    set isPaused(value: boolean) {
        this.dataset.paused = value ? "true" : "false";
    }
    get isModel(): boolean {
        return this.dataset.useModel === "true";
    }
    set isModel(value: boolean) {
        this.dataset.useModel = value ? "true" : "false";
    }
}
