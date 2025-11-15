<script lang="ts">
	import { type Snippet } from "svelte";
	import { type ProjectState } from "$lib/state.svelte.js";
	import { type CameraController } from "./ViewController.js";
	import staticCameraController from "./StaticViewController.svelte.js";
	import orbitCameraController from "./OrbitViewController.svelte.js";

	let {
		children,
		mode,
		controller = $bindable<CameraController>(undefined),
	}: {
		children: Snippet;
		mode: ProjectState["viewMode"];
		controller?: CameraController;
	} = $props();

	const controllers: Record<ProjectState["viewMode"], CameraController> = {
		"2d": staticCameraController(),
		// TODO: Make these two share the same internal state, only differing by projection matrix
		"orthographic-orbit": orbitCameraController("orthographic"),
		"perspective-orbit": orbitCameraController("perspective"),
	};
	$effect(() => {
		controller = controllers[mode];
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="user-select-none touch-none"
	style:cursor={controller?.cursor ?? "auto"}
	oncontextmenu={(event) => {
		controller?.handleContextMenu ? controller.handleContextMenu(event) : event.preventDefault();
	}}
	onkeydown={(event) => controller?.handleKeyDown?.(event)}
	onkeyup={(event) => controller?.handleKeyUp?.(event)}
	onwheel={(event) => controller?.handleWheel?.(event)}
	onpointerdown={(event) => controller?.handlePointerDown?.(event)}
	onpointerup={(event) => controller?.handlePointerUp?.(event)}
	onpointermove={(event) => controller?.handlePointerMove?.(event)}
>
	{@render children()}
</div>
