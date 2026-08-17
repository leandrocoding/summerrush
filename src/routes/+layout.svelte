<script lang="ts">
	import jleIcon from '$lib/assets/JLE.png';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={jleIcon} />
</svelte:head>

{@render children()}
