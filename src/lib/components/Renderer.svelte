<script lang="ts">
	import {
		Mesh,
		VERTEX_SCHEMA,
		VERTEX_VALUE_COUNT,
		type MeshBuffers,
	} from "$lib/resources/model/datatypes.js";
	import { meshToBuffers } from "$lib/resources/model/load.js";
	import { textureArrayName, type CoyShader } from "$lib/resources/shader/datatypes.js";
	import type { TextureInstance } from "$lib/resources/texture/datatypes.js";
	import { appState } from "$lib/state.svelte.js";
	import { mat4 } from "gl-matrix";
	import { onMount } from "svelte";

	let {
		shader,
		meshes,
		textures,
		viewMatrix = mat4.create(),
		projectionMatrix: projection = mat4.create(),

		renderCallback,
		paused = false,
		dimensions = [null, null],

		canvas = $bindable<HTMLCanvasElement>(),
		glContext = $bindable<WebGL2RenderingContext | null>(null),
		frameDeltas = $bindable(null),
		maxFrameDeltas = 120,
	}: {
		shader: CoyShader | null;
		meshes: Mesh[];
		textures: TextureInstance[];
		viewMatrix?: mat4;
		projectionMatrix?: mat4 | ((aspectRatio: number) => mat4);

		renderCallback?: (gl: WebGL2RenderingContext, deltaTime: number) => void;
		paused?: boolean;
		dimensions?: [number | null, number | null];

		canvas?: HTMLCanvasElement;
		glContext?: WebGL2RenderingContext | null;
		frameDeltas?: number[] | null;
		maxFrameDeltas?: number;
	} = $props();

	let meshBuffers: MeshBuffers[] = $derived.by(() => {
		if (glContext === null) return [];
		return meshes.map((mesh) => meshToBuffers(mesh, glContext!));
	});

	// Context initialization
	onMount(() => {
		console.log("Initializing WebGL2 context...");
		glContext = canvas.getContext("webgl2");
		if (!glContext) {
			throw new Error("Failed to get WebGL2 context");
		} else {
			console.log("WebGL2 context initialized");
		}

		glContext.clearColor(0.0, 0.0, 0.0, 0.0);

		glContext.enable(glContext.DEPTH_TEST);
		glContext.depthFunc(glContext.LEQUAL);

		glContext.enable(glContext.BLEND);
		glContext.blendEquationSeparate(glContext.FUNC_ADD, glContext.FUNC_ADD);
		glContext.blendFuncSeparate(
			glContext.SRC_ALPHA,
			glContext.ONE_MINUS_SRC_ALPHA,
			glContext.ONE,
			glContext.ONE_MINUS_SRC_ALPHA,
		);

		glContext.frontFace(glContext.CCW);
		glContext.enable(glContext.CULL_FACE);
		glContext.cullFace(glContext.BACK);
	});

	// Frame scheduling
	$effect(() => {
		let lastTimestamp: DOMHighResTimeStamp | null = null;
		let frame = requestAnimationFrame(async function loop(timestamp) {
			frame = requestAnimationFrame(loop);

			let deltaTime = 0;
			if (lastTimestamp !== null) {
				deltaTime = (timestamp - lastTimestamp) / 1000;
				deltaTime = Math.max(deltaTime, 0);
				deltaTime = Math.min(deltaTime, 1 / 10);
			}
			lastTimestamp = timestamp;
			if (frameDeltas !== null) {
				if (frameDeltas.length >= maxFrameDeltas!) {
					frameDeltas.shift();
				}
				frameDeltas.push(deltaTime);
			}

			paint(deltaTime);
		});
		return () => {
			cancelAnimationFrame(frame);
		};
	});

	let needsResize = true;
	onMount(() => {
		const resizeObserver = new ResizeObserver(() => {
			if (dimensions[0] === null || dimensions[1] === null) {
				needsResize = true;
			}
		});
		resizeObserver.observe(canvas);
		return () => {
			resizeObserver.disconnect();
		};
	});
	$effect(() => {
		needsResize = true;
		// Force reactivity
		[dimensions[0], dimensions[1]];
	});

	function doResize() {
		// FIXME: I think that I want specified dimensions to constrain
		// the aspect ratio of our canvas, but right now it just forces a size.
		// Is this something I want to change?
		const width = dimensions[0] ?? canvas.clientWidth * devicePixelRatio;
		const height = dimensions[1] ?? canvas.clientHeight * devicePixelRatio;
		console.log("Resizing canvas to", width, height);
		canvas.width = width;
		canvas.height = height;
		glContext?.viewport(0, 0, width, height);

		if (typeof projection === "function") {
			projectionMatrix = projection(canvas.clientWidth / canvas.clientHeight);
		}
	}

	let modelMatrix = mat4.create();
	let projectionMatrix = mat4.create();
	$effect(() => {
		if (typeof projection !== "function") {
			projectionMatrix = projection;
			return;
		}
		const aspectRatio = canvas.clientWidth / canvas.clientHeight;
		projectionMatrix = projection(aspectRatio);
		console.debug("Updated projection matrix with aspect ratio", aspectRatio);
	});

	let previousTextureCount: number = 0;
	let texturesChanged: boolean = false;
	$effect(() => {
		[glContext, textures]; // React when either changes
		texturesChanged = true;
	});

	let frameNumber: GLuint = 0;
	let time: number = 0;
	let mouseData = { x: 0, y: 0, left: false, right: false };

	function paint(deltaTime: number) {
		if (!glContext) return;
		if (paused) return;

		glContext.enable(glContext.CULL_FACE);
		glContext.cullFace(glContext.BACK);

		if (needsResize) {
			doResize();
			needsResize = false;
		}

		glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);

		if (!shader) return;
		glContext.useProgram(shader.program);
		if (renderCallback) {
			renderCallback(glContext, deltaTime);
		}

		glContext.uniformMatrix4fv(shader.uniforms["modelMatrix"], false, modelMatrix);
		glContext.uniformMatrix4fv(shader.uniforms["viewMatrix"], false, viewMatrix);
		glContext.uniformMatrix4fv(shader.uniforms["projectionMatrix"], false, projectionMatrix);

		// Set all the other uniforms
		frameNumber++;
		time += deltaTime;
		glContext.uniform1ui(shader.uniforms["frameNumber"], frameNumber);
		glContext.uniform1f(shader.uniforms["time"], time);
		glContext.uniform1f(shader.uniforms["deltaTime"], deltaTime);
		glContext.uniform2f(shader.uniforms["resolution"], canvas.width, canvas.height);
		glContext.uniform4f(
			shader.uniforms["mouse"],
			mouseData.x,
			mouseData.y,
			mouseData.left ? 1 : 0,
			mouseData.right ? 1 : 0,
		);

		if (texturesChanged) {
			texturesChanged = false;
			for (let i = 0; i < Math.max(textures.length, previousTextureCount); i++) {
				glContext.activeTexture(glContext.TEXTURE0 + i);
				const texture = textures[i];
				if (texture) {
					glContext.bindTexture(glContext.TEXTURE_2D, texture.glTexture);
				} else {
					glContext.bindTexture(glContext.TEXTURE_2D, null);
				}
				console.debug(
					"Bound to texture unit",
					i,
					"texture",
					texture ? (appState.save.textures[i]?.fileName ?? "unknown") : "null",
				);
				const samplerLocation = glContext.getUniformLocation(shader.program, textureArrayName(i));
				glContext.uniform1i(samplerLocation, i);
			}
			previousTextureCount = textures.length;
		}

		for (const mesh of meshBuffers) {
			glContext.bindBuffer(glContext.ARRAY_BUFFER, mesh.vertexBuffer);
			bindAttributes(glContext, shader); // TODO: Dont run every frame
			glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
			glContext.drawElements(glContext.TRIANGLES, mesh.indexCount, glContext.UNSIGNED_SHORT, 0);
		}
	}

	function bindAttributes(glCtx: WebGL2RenderingContext, shader: CoyShader): void {
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

	let layoutWidth: number = $state(1);
	let layoutHeight: number = $state(1);
	let elementDimensions: [string, string] = $derived.by(() => {
		if (dimensions[0] === null || dimensions[1] === null) {
			return ["100%", "100%"];
		}
		const actualAspect = layoutWidth / layoutHeight;
		const desiredAspect = dimensions[0] / dimensions[1];
		if (actualAspect < desiredAspect) {
			return ["100%", `${(layoutWidth / desiredAspect).toFixed(2)}px`];
		} else {
			return [`${(layoutHeight * desiredAspect).toFixed(2)}px`, "100%"];
		}
	});
	const updateButtons = (buttonBitField: number) => {
		mouseData.left = (buttonBitField & 1) !== 0;
		mouseData.right = (buttonBitField & 2) !== 0;
	};
</script>

<div
	bind:clientWidth={layoutWidth}
	bind:clientHeight={layoutHeight}
	class="invisible absolute-center h-full w-full"
></div>
<canvas
	bind:this={canvas}
	class="checkerboard absolute-center h-full w-full border border-background-primary pixelated"
	style:width={elementDimensions[0]}
	style:height={elementDimensions[1]}
	onpointermove={(event) => {
		const canvasRect = canvas.getBoundingClientRect();
		mouseData.x = (event.clientX - canvasRect.left) / canvasRect.width;
		mouseData.y = 1 - (event.clientY - canvasRect.top) / canvasRect.height;
	}}
	onpointerdown={(event) => updateButtons(event.buttons)}
	onpointerup={(event) => updateButtons(event.buttons)}
></canvas>
