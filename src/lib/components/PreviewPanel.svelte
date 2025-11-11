<script lang="ts">
	import Renderer from "$lib/components/Renderer.svelte";
	import PlaybackControls from "$lib/components/PlaybackControls.svelte";
	import { appState } from "$lib/state.svelte.js";
	import type { CoyShader } from "$lib/resources/shader/datatypes.js";
	import { loadCoyShader } from "$lib/resources/shader/load.js";
	import ErrorReporter from "./ErrorReporter.svelte";
	import { CoyErrorReport, CoyReportedError, hasErrors } from "$lib/errors.js";
	import ViewModePicker from "./ViewModePicker.svelte";
	import DimensionsSelector from "./DimensionsSelector.svelte";
	import ModelSelector from "./ModelSelector.svelte";
	import type { Snippet } from "svelte";
	import ViewController from "./ViewControlls/ViewController.svelte";
	import { mat4 } from "gl-matrix";

	let {
		toolbarChildren = undefined,
	}: {
		toolbarChildren?: Snippet | undefined;
	} = $props();

	let shader: CoyShader | CoyErrorReport[] | null = $derived.by(() => {
		console.log("Compiling shader...");
		if (!appState.glCtx) return null;
		try {
			const compiled = loadCoyShader(appState.glCtx, {
				vertex: appState.project.vertexSource,
				fragment: appState.project.fragmentSource,
			});
			console.log("Shader compiled successfully.");
			return compiled;
		} catch (error) {
			if (error instanceof CoyReportedError) {
				return error.reports;
			} else {
				console.error("Error loading shader:", error);
			}
			return null;
		}
	});
	$effect(() => {
		if (shader instanceof Array) {
			appState.frontend.errorLogs.shaderErrors = shader;
		} else {
			appState.frontend.errorLogs.shaderErrors = [];
		}
	});

	// We keep the last compiling shader around so that we can see it during errors
	let cachedShader: CoyShader | null = $state(null);
	$effect(() => {
		if (shader instanceof Array) return;
		cachedShader = shader ?? cachedShader;
	});

	let fullscreenHandle: HTMLElement;
	let frameDeltas: number[] = $state([]);
	let viewportDimensions: [number | null, number | null] = $state([null, null]);

	let viewMatrix: mat4 = $state(mat4.create());
	let projectionMatrix = $derived.by(() => {
		// FIXME: THis all needs to be somehow integrated into our view controller,
		// so that we can take scroll inputs to zoom, for example.
		// Maybe turn the view controller into a more general perspective/input handler?
		if (appState.project.viewMode === "2d") {
			return mat4.identity(mat4.create());
		}
		const near = 0.1;
		const far = 1000;

		if (appState.project.viewMode.startsWith("orthographic")) {
			return (aspectRatio: number) => {
				const orthoHeight = 2;
				const orthoWidth = orthoHeight * aspectRatio;
				return mat4.ortho(
					mat4.create(),
					-orthoWidth / 2,
					orthoWidth / 2,
					-orthoHeight / 2,
					orthoHeight / 2,
					near,
					far
				);
			};
		}

		return (aspectRatio: number) => {
			const fov = (60 * Math.PI) / 180;
			return mat4.perspective(mat4.create(), fov, aspectRatio, near, far);
		};
	});
</script>

<div class="flex h-full w-full flex-col">
	<div class="z-10 flex w-full flex-row items-center bg-background-secondary">
		<PlaybackControls {frameDeltas} />
		<span class="grow"></span>
		<DimensionsSelector bind:dimensions={viewportDimensions} />
		<ViewModePicker />
		<ModelSelector bind:meshes={appState.project.meshes} />
		<button
			class={[
				"flex h-6 w-6 flex-row items-center justify-center",
				"bg-background-primary hover:bg-background-selected",
			]}
			onclick={() => {
				fullscreenHandle?.requestFullscreen();
			}}
			title="Toggle Fullscreen"
		>
			<iconify-icon icon="material-symbols:fullscreen"></iconify-icon>
		</button>
		{#if toolbarChildren}
			{@render toolbarChildren()}
		{/if}
	</div>
	<div class="checkerboard relative grow bg-background-tertiary" bind:this={fullscreenHandle}>
		<ViewController bind:viewMatrix mode={appState.project.viewMode}>
			<Renderer
				shader={cachedShader}
				meshes={appState.project.meshes}
				textures={[]}
				{viewMatrix}
				{projectionMatrix}
				paused={!appState.frontend.playing}
				dimensions={viewportDimensions}
				bind:glContext={appState.glCtx}
				bind:frameDeltas
			/>
		</ViewController>
		{#if hasErrors(appState.frontend.errorLogs)}
			<div class="absolute inset-0 h-fit max-h-full overflow-y-auto md:p-2">
				<ErrorReporter errorLogs={appState.frontend.errorLogs} />
			</div>
		{/if}
	</div>
</div>
