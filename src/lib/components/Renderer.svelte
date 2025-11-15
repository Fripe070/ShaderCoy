<script lang="ts">
	import {
		Mesh,
		VERTEX_SCHEMA,
		VERTEX_VALUE_COUNT,
		type MeshBuffers,
	} from "$lib/resources/model/datatypes.js";
	import { meshToBuffers } from "$lib/resources/model/load.js";
	import { samplerArray, type CoyShader } from "$lib/resources/shader/datatypes.js";
	import type { CoyTexture } from "$lib/resources/texture/datatypes.js";
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
		textures: CoyTexture[];
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

	$effect(() => {
		$inspect(shader, "Used shader");
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
		dimensions[0];
		dimensions[1];
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

		for (const [index, texture] of textures.entries()) {
			glContext.activeTexture(glContext.TEXTURE0 + index);
			glContext.bindTexture(glContext.TEXTURE_2D, texture.glTexture);
			const samplerLocation = glContext.getUniformLocation(shader.program, samplerArray(index));
			glContext.uniform1i(samplerLocation, index);
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
</script>

<canvas class="absolute-center h-full w-full pixelated" bind:this={canvas}></canvas>
