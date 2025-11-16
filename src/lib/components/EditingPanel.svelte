<script lang="ts">
	import ThemePicker from "$lib/components/ThemePicker.svelte";
	import tabs from "./tabs/index.js";
	import ProjectManager from "./ProjectManager.svelte";

	let activeTabId: keyof typeof tabs = $state(Object.keys(tabs)[0]);
</script>

<div class="flex h-full w-full flex-col">
	<div class="z-10 flex flex-row bg-background-secondary">
		{#each Object.entries(tabs) as [id, tab] (id)}
			<button
				class={[
					"flex h-6 shrink flex-row items-center gap-1 overflow-x-hidden overflow-y-hidden px-1",
					id === activeTabId
						? "border-b-2 border-accent bg-background-primary"
						: "bg-background-primary/50 hover:bg-background-selected",
				]}
				onclick={() => {
					activeTabId = id;
				}}
			>
				<iconify-icon icon={tab.icon}></iconify-icon>
				<span>{tab.label}</span>
			</button>
		{/each}
		<span class="grow"> </span>
		<ProjectManager />
		<ThemePicker />
	</div>
	<div class="relative grow overflow-y-auto">
		{#each Object.entries(tabs) as [id, { component: TabComponent }] (id) }
			<div class={id === activeTabId ? "contents" : "hidden"}>
				<TabComponent />
			</div>
		{/each}
	</div>
</div>
