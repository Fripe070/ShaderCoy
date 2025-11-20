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
	import ViewController from "./view_controls/ViewController.svelte";
	import { mat4 } from "gl-matrix";
	import type { CameraController } from "./view_controls/ViewController.js";
	import ThemePicker from "./ThemePicker.svelte";

	// TODO: Decouple preview from appState
	let {
		standalone = false,
	}: {
		standalone?: boolean;
	} = $props();

	let shader: CoyShader | CoyErrorReport[] | null = $derived.by(() => {
		if (!appState.ephemeral.glCtx) return null;
		console.log("Compiling shader...");
		try {
			const compiled = loadCoyShader(appState.ephemeral.glCtx, {
				vertex: appState.save.vertexSource,
				fragment: appState.save.fragmentSource,
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
			appState.ephemeral.errorLogs.shaderErrors = shader;
		} else {
			appState.ephemeral.errorLogs.shaderErrors = [];
		}
	});

	// We keep the last compiling shader around so that we can see it during errors
	let cachedShader: CoyShader | null = $state(null);
	$effect(() => {
		if (!shader || shader instanceof Array) return;
		cachedShader = shader ?? cachedShader;
	});

	let fullscreenHandle: HTMLElement;
	let canFullscreen: boolean = $derived.by(() => {
		return fullscreenHandle?.requestFullscreen !== undefined && document.fullscreenEnabled;
	});

	let isPlaying: boolean = $state(true);
	let frameDeltas: number[] = $state([]);
	let forcedViewportDimensions: [number | null, number | null] = $state([null, null]);

	let cameraController = $state<CameraController | undefined>(undefined);
</script>

<div class="flex h-full w-full flex-col">
	<div class="z-10 flex w-full flex-row flex-wrap items-center justify-end bg-background-secondary">
		<PlaybackControls bind:isPlaying {frameDeltas} />
		<span class="grow"></span>
		<DimensionsSelector
			bind:width={forcedViewportDimensions[0]}
			bind:height={forcedViewportDimensions[1]}
			allowNulls={true}
			maxAxisSize={2 ** 13}
		/>
		<div class="flex flex-row">
			<ViewModePicker />
			{#if !standalone}
				<ModelSelector bind:model={appState.save.model} />
			{/if}
			{#if canFullscreen}
				<button
					class={[
						"flex size-6 flex-row items-center justify-center",
						"bg-background-primary hover:bg-background-selected",
					]}
					onclick={() => {
						fullscreenHandle?.requestFullscreen();
					}}
					title="Toggle Fullscreen"
				>
					<iconify-icon icon="material-symbols:fullscreen"></iconify-icon>
				</button>
			{/if}
			{#if standalone}
				<ThemePicker />
			{/if}
		</div>
	</div>
	<div class="relative grow bg-background-tertiary" bind:this={fullscreenHandle}>
		<ViewController mode={appState.save.viewMode} bind:controller={cameraController}>
			<Renderer
				shader={cachedShader}
				meshes={appState.save.model?.meshes ?? []}
				textures={appState.ephemeral.textureInstances}
				viewMatrix={cameraController?.viewMatrix ?? mat4.create()}
				projectionMatrix={cameraController?.projectionMatrix ?? mat4.create()}
				paused={!isPlaying}
				dimensions={forcedViewportDimensions}
				bind:glContext={appState.ephemeral.glCtx}
				bind:frameDeltas
			/>
		</ViewController>
		{#if hasErrors(appState.ephemeral.errorLogs)}
			<div class="absolute inset-0 h-fit max-h-full overflow-y-auto md:p-2">
				<ErrorReporter errorLogs={appState.ephemeral.errorLogs} />
			</div>
		{/if}
	</div>
</div>
