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
	import type { CameraController } from "./ViewControlls/ViewController.js";

	let {
		toolbarChildren = undefined,
	}: {
		toolbarChildren?: Snippet | undefined;
	} = $props();

	let shader: CoyShader | CoyErrorReport[] | null = $derived.by(() => {
		if (!appState.glCtx) return null;
		console.log("Compiling shader...");
		try {
			const compiled = loadCoyShader(appState.glCtx, {
				vertex: appState.saveData.vertexSource,
				fragment: appState.saveData.fragmentSource,
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
		if (!shader || shader instanceof Array) return;
		cachedShader = shader ?? cachedShader;
	});

	let fullscreenHandle: HTMLElement;
	let frameDeltas: number[] = $state([]);
	let forcedViewportDimensions: [number | null, number | null] = $state([null, null]);

	let cameraController = $state<CameraController | undefined>(undefined);
</script>

<div class="flex h-full w-full flex-col">
	<div class="z-10 flex w-full flex-row flex-wrap items-center justify-end bg-background-secondary">
		<PlaybackControls {frameDeltas} />
		<span class="grow"></span>
		<DimensionsSelector bind:dimensions={forcedViewportDimensions} />
		<div class="flex flex-row">
			<ViewModePicker />
			<ModelSelector bind:meshes={appState.saveData.meshes} />
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
		</div>
		{#if toolbarChildren}
			{@render toolbarChildren()}
		{/if}
	</div>
	<div class="checkerboard relative grow bg-background-tertiary" bind:this={fullscreenHandle}>
		<ViewController mode={appState.saveData.viewMode} bind:controller={cameraController}>
			<Renderer
				shader={cachedShader}
				meshes={appState.saveData.meshes}
				textures={[]}
				viewMatrix={cameraController?.viewMatrix ?? mat4.create()}
				projectionMatrix={cameraController?.projectionMatrix ?? mat4.create()}
				paused={!appState.frontend.playing}
				dimensions={forcedViewportDimensions}
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
