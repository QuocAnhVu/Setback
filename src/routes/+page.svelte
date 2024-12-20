<script lang="ts">
	import { Session } from '$lib/game';
	let { data, form } = $props();
</script>

<header>
	<h1 class="font-bold">Setback!</h1>
</header>

<main>
	{#if 'user' in data && data.user !== undefined}
		<div>
			Hello, {data.user}!
		</div>
		<form method="POST" action="?">
			<div>
				<button formaction="?/create">Create New</button>
			</div>
		</form>
		<form method="POST" action="?">
			<div>
				<label>
					Session
					<input name="session" type="number" />
				</label>
				<button formaction="?/join">Join</button>
			</div>
		</form>
	{:else}
		<form method="POST" action="?">
			<label>
				Username:
				<input name="user" type="text" />
			</label>
			<button formaction="?/login">Log In</button>
		</form>
	{/if}
</main>

<footer>
	{#if form?.msg}
		<div class="text-red-500">{form?.msg}</div>
	{/if}
</footer>

<style>
	.grid-cols-16 {
		grid-template-columns: repeat(16, minmax(0, 1fr));
	}
</style>
