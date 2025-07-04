// HEAVILY coupled to the component

import { loadFragmentShader, loadShader, loadVertexShader } from "../scripts/3d/shader";

import defaultVertSource from "../scripts/shaders/defaultVert";
import defaultFragSource from "../scripts/shaders/defaultFrag";

export class GlCanvas extends HTMLCanvasElement {
    static readonly GLSL_ATTR_KEY: string = "data-glsl";
    static get observedAttributes(): string[] {
        return [this.GLSL_ATTR_KEY];
    }

    private gl: WebGLRenderingContext | null = null;

    private currentShaderCode: string = "";
    private shaderProgram: WebGLProgram | null = null;

    constructor() {
        super();
    }

    connectedCallback() {
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
        this.gl = this.getContext("webgl");
        if (!this.gl) {
            console.error("WebGL not supported");
            this.classList.add("unsupported-gl");
            this.innerHTML =
                "This site will not function as your system or browser does not support WebGL.";
            return;
        }

        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.updateShader(this.gl, this.currentShaderCode);
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        if (oldValue?.trim() === newValue?.trim()) return;
        switch (name) {
            case GlCanvas.GLSL_ATTR_KEY:
                this.currentShaderCode = (newValue || "").trim();
                if (this.isConnected && this.gl) {
                    this.updateShader(this.gl, this.currentShaderCode);
                }
                break;
            default:
                console.debug(`Unhandled attribute change: ${name}`);
                break;
        }
    }

    updateShader(glCtx: WebGLRenderingContext, fragmentCode: string): void {
        if (!fragmentCode || fragmentCode.trim() === "") {
            console.warn("No GLSL code provided.");
            this.shaderProgram = null;
            return;
        }
        console.log("Loading GLSL code:", fragmentCode);

        const vertexShader = loadVertexShader(glCtx, defaultVertSource);
        const fragmentShader = loadFragmentShader(glCtx, fragmentCode);

        const shaderProgram = glCtx.createProgram();
        glCtx.attachShader(shaderProgram, vertexShader);
        glCtx.attachShader(shaderProgram, fragmentShader);
        glCtx.linkProgram(shaderProgram);
        if (!glCtx.getProgramParameter(shaderProgram, glCtx.LINK_STATUS)) {
            alert(
                "Unable to initialize the shader program: " +
                    glCtx.getProgramInfoLog(shaderProgram),
            );
        }

        glCtx.useProgram(shaderProgram);
        if (this.shaderProgram) glCtx.deleteProgram(this.shaderProgram);
        this.shaderProgram = shaderProgram;

        console.log("Shader program loaded successfully.");
        this.dispatchEvent(new CustomEvent("shader-loaded", { detail: { shaderProgram } }));
    }

    render(): void {
        if (!this.gl || !this.shaderProgram) {
            console.warn("WebGL context or shader program not initialized.");
            return;
        }

        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.shaderProgram);

        // TODO: Set up the vertex data

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
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
