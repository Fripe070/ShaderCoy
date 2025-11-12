<script lang="ts">
	import { appState, defaultAppState } from "$lib/state.svelte.js";
	import DropdownPicker, { type DropdownElement } from "./DropdownPicker.svelte";

	const elements: DropdownElement[] = [
		{
			name: "Save Project",
			icon: "material-symbols:save",
			callback: () => {
				const projectData = JSON.stringify($state.snapshot(appState.saveData));

				// As of 2025/11/02, the file system access api is only supported in chromium-based browsers
				if ("showSaveFilePicker" in window) {
					// @ts-ignore
					window
						.showSaveFilePicker({
							suggestedName: "project.json",
							types: [
								{
									description: "JSON Files",
									accept: { "application/json": [".json"] },
								},
							],
						})
						.then(async (fileHandle: any) => {
							const writable = await fileHandle.createWritable();
							await writable.write(projectData);
							await writable.close();
						})
						.catch((err: any) => {
							// TODO: Error in UI
							console.error("Error saving file:", err);
						});
				} else {
					const blob = new Blob([projectData], { type: "application/json" });
					const url = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url;
					a.download = "project.json";
					a.click();
					URL.revokeObjectURL(url);
				}
			},
		},
		{
			name: "Load Project",
			icon: "material-symbols:folder-open",
			callback: () => {
				// FIXME: Make sure the object is valid
				// FIXME: Lags the entire app like crazy. Why?
				function loadProject(content: string) {
					try {
						const project = JSON.parse(content);
						// appState.saveData = project;
					} catch (error) {
						alert("Failed to load project: Invalid JSON");
					}
				}

				const input = document.createElement("input");
				input.type = "file";
				input.accept = ".json,application/json";
				input.onchange = (event) => {
					const file = (event.target as HTMLInputElement).files?.[0];
					if (!file) return;
					const reader = new FileReader();
					reader.onprogress = (event) => {
						if (event.lengthComputable) {
							loadProgress = event.loaded / event.total;
						}
					};
					reader.onload = (event) => {
						loadProgress = 1;
						loadProject(event.target?.result as string);
					};
					reader.readAsText(file);
				};
				input.click();
			},
		},
		{
			name: "Delete Project",
			icon: "material-symbols:delete",
			callback: () => {
				if (!confirm("Are you sure you want to delete the current project?")) return;
				appState.saveData = { ...defaultAppState.saveData };
			},
			class: "text-negative hover:!bg-negative/10",
		},
	];

	let loadProgress = $state(0);
</script>

<DropdownPicker title="" showTitle={false} {elements}>
	{#snippet buttonChildren()}
		<iconify-icon icon="material-symbols:file-copy" class="z-10"></iconify-icon>
		<div
			class="absolute bottom-0 left-0 w-full bg-accent opacity-40"
			style:height={`${loadProgress * 100}%`}
		></div>
	{/snippet}
</DropdownPicker>
