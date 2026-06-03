<script lang="ts">
	// import favicon from '$lib/assets/favicon.svg';
	import jleIcon from '$lib/assets/JLE.png';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={jleIcon} />
</svelte:head>

{@render children()}

<style>
	/* Language Toggle Hide/Show Logic */
	:global(input[name="language-switch"]) {
		display: none;
	}

	:global(.lang-label) {
		display: inline-block;
		padding: 8px 16px;
		margin-right: 8px;
		margin-bottom: 20px;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
		background-color: #f9f9f9;
		font-weight: 500;
	}

	:global(#btn-en:checked ~ .btn-en-label),
	:global(#btn-de:checked ~ .btn-local-label) {
		background-color: #333;
		color: white;
		border-color: #333;
	}

	:global(.lang-en),
	:global(.lang-local) {
		display: none;
	}

	:global(#btn-en:checked ~ .lang-en),
	:global(#btn-de:checked ~ .lang-local) {
		display: block;
	}
</style>
