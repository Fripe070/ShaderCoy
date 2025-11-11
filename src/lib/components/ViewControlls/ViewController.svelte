<script lang="ts">
	import type { Snippet } from "svelte";
	import { mat4 } from "gl-matrix";
	import { type ProjectState } from "$lib/state.svelte.js";
	import { noUnhandledCase } from "$lib/utils.svelte.js";
	import OrbitCameraController from "./OrbitViewController.svelte.js";
	import StaticCameraController from "./StaticViewController.svelte.js";
	import { ViewController } from "./ViewController.js";

	let {
		children,
		viewMatrix = $bindable<mat4>(mat4.create()),
		mode,
	}: {
		children: Snippet;
		viewMatrix?: mat4;
		mode: ProjectState["viewMode"];
	} = $props();

	let activeController: ViewController | null = $state(null);
	const staticController = new StaticCameraController();
	const orbitController = new OrbitCameraController();

	$effect(() => {
		switch (mode) {
			default:
				noUnhandledCase(mode);
			case "2d":
				activeController = staticController;
				break;
			case "orthographic-orbit":
			case "perspective-orbit":
				activeController = orbitController;
				break;
		}
		console.debug(
			"Active controller changed to:",
			Object.getPrototypeOf(activeController).constructor.name
		);
	});

	// FIXME: I want to pass an updator function to the controller,
	// which it can call whenever it wants to update the view matrix.
	// For now we just call update after every input event.
	const andUpdate = (fn: () => void) => {
		fn();
		if (activeController) {
			viewMatrix = activeController.getMatrix();
		}
	};
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="view-controller contents cursor-all-scroll"
	onkeydown={(e) => andUpdate(() => activeController?.keyDown(e))}
	onkeyup={(e) => andUpdate(() => activeController?.keyUp(e))}
	onmousedown={(e) => andUpdate(() => activeController?.mouseDown(e))}
	onmouseup={(e) => andUpdate(() => activeController?.mouseUp(e))}
	onmousemove={(e) => andUpdate(() => activeController?.mouseMove(e))}
	onwheel={(e) => andUpdate(() => activeController?.mouseWheel(e))}
>
	{@render children()}
</div>
