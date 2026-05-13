<script lang="ts">
	// import favicon from '$lib/assets/favicon.svg';
	import jleIcon from '$lib/assets/JLE.png';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={jleIcon} />
</svelte:head>

{@render children()}
