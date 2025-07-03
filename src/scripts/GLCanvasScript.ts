// HEAVILY coupled to the component


export class GlCanvas extends HTMLCanvasElement {
    static readonly GLSL_ATTR_KEY: string = "data-glsl";
    static readonly PAUSED_ATTR_KEY: string = "data-paused";
    static readonly USE_MODEL_ATTR_KEY: string = "data-use-model";
    static get observedAttributes(): string[] {
        return [this.GLSL_ATTR_KEY, this.PAUSED_ATTR_KEY, this.USE_MODEL_ATTR_KEY];
    }

    gl: WebGLRenderingContext | null = null;
    isPaused: boolean = false;
    useModel: boolean = false;

    static readonly vertexShaderSource: string = `
        attribute vec4 aVertexPosition;
        void main() {
            gl_Position = aVertexPosition;
        }
    `;
    static readonly fragmentShaderSource: string = `
        void main() {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
    `;

    constructor() {
        super();
        this.isPaused = this.getAttribute(GlCanvas.PAUSED_ATTR_KEY) === "true";
    }

    getPaused(): boolean {
        return this.getAttribute("data-paused") === "true";
    }

    connectedCallback() {
        // Initialize WebGL context or any other setup
        this.gl = this.getContext("webgl");
        if (!this.gl) {
            console.error("WebGL not supported");
            this.classList.add("unsupported-gl");
            this.innerHTML = "This site will not function as your system or browser does not support WebGL.";
            return;
        }

        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.loadGLSL(this.getAttribute(GlCanvas.GLSL_ATTR_KEY) || "");
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        if (name === GlCanvas.GLSL_ATTR_KEY && oldValue !== newValue) 
            return this.loadGLSL(newValue);

        if (name === GlCanvas.PAUSED_ATTR_KEY && oldValue !== newValue) {
            this.isPaused = newValue === "true";
            return;
        }
    }

    loadGLSL(code: string | null): void {
        console.log("GLSL shader changed:", code);
        // TODO: Init shader
    }

    // TODO: Oh god I am going to have to support orbiting or some sort of model navigation
}
