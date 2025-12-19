<script lang="ts">
	import { createShaderProgram } from "$lib/resources/shader/load.js";
	import type { Texture, TextureInstance } from "$lib/resources/texture/datatypes.js";
	import { loadTexture2D } from "$lib/resources/texture/load.js";
	import { onMount } from "svelte";

	let {
		texture,
		class: className = "",
		...rest
	}: {
		texture: Texture;
		class?: string | string[];
		[key: string]: any;
	} = $props();

	let canvas: HTMLCanvasElement;
	let glCtx = $state<WebGL2RenderingContext | null>(null);
	let shader = $state<WebGLProgram | null>(null);

	onMount(() => {
		if (!canvas) return;
		glCtx = canvas.getContext("webgl2");
		if (!glCtx) throw new Error("Failed to get WebGL2 context for TextureRenderer");

		shader = createShaderProgram(glCtx, {
			vertex: `#version 300 es
                in vec2 a_position;
                out vec2 v_texCoord;
                void main() {
                    gl_Position = vec4(a_position, 0.0, 1.0);
                    v_texCoord = step(0.0, a_position);
                }
            `,
			fragment: `#version 300 es
                precision mediump float;
                in vec2 v_texCoord;
                uniform sampler2D u_texture;
                out vec4 f_color;
                void main() {
                    f_color = texture(u_texture, v_texCoord);
                }
            `,
		});
	});

	let lastUpdateTimestamp: DOMHighResTimeStamp = 0;
	$effect(() => {
		if (!glCtx || !shader) return;
		const currentTimestamp = (lastUpdateTimestamp = performance.now());
		loadTexture2D(glCtx, texture).then((instance: TextureInstance) => {
			if (currentTimestamp < lastUpdateTimestamp) return; // Outdated
			draw(instance);
		});
	});

	const rectCoords = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
	let elementWidth = $state<number>(100);
	let elementHeight = $state<number>(100);
	async function draw(instance: TextureInstance) {
		if (!glCtx || !shader) return;
		// Setup
		canvas.width = instance.width;
		canvas.height = instance.height;
		glCtx.viewport(0, 0, instance.width, instance.height);
		const scale = 100 / Math.max(instance.width, instance.height);
		elementWidth = instance.width * scale;
		elementHeight = instance.height * scale;

		glCtx.clearColor(0, 0, 0, 0);
		glCtx.clear(glCtx.COLOR_BUFFER_BIT);
		glCtx.useProgram(shader);

		const positionLocation = glCtx.getAttribLocation(shader, "a_position");
		const textureLocation = glCtx.getUniformLocation(shader, "u_texture");
		// Load rectangle coordinates
		const positionBuffer = glCtx.createBuffer();
		glCtx.bindBuffer(glCtx.ARRAY_BUFFER, positionBuffer);
		glCtx.bufferData(glCtx.ARRAY_BUFFER, rectCoords, glCtx.STATIC_DRAW);
		glCtx.enableVertexAttribArray(positionLocation);
		glCtx.vertexAttribPointer(positionLocation, 2, glCtx.FLOAT, false, 0, 0);
		// Bind texture
		glCtx.activeTexture(glCtx.TEXTURE0);
		glCtx.bindTexture(glCtx.TEXTURE_2D, instance.glTexture);
		glCtx.uniform1i(textureLocation, 0);
		// Draw
		glCtx.drawArrays(glCtx.TRIANGLE_FAN, 0, 4);
	}
</script>

<canvas
	bind:this={canvas}
	style:width={`${elementWidth}cqmax`}
	style:height={`${elementHeight}cqmax`}
	class={["checkerboard border border-foreground-muted/25 pixelated", className]}
	{...rest}
></canvas>
