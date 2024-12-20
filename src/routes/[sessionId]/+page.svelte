<script lang="ts">
	import { SessionState } from '$lib/game';

	let { data } = $props();
</script>

<header>
	<h1>
		{#if data.session.state === SessionState.Joining}
			Joining
		{:else if data.session.state === SessionState.Dealing}
			Dealing
		{:else if data.session.state === SessionState.Bidding}
			Bidding
		{:else if data.session.state === SessionState.Tricking}
			Tricking
		{:else if data.session.state === SessionState.Scoring}
			Scoring
		{:else if data.session.state === SessionState.Finished}
			Finished
		{/if}
	</h1>
</header>

<footer>
	{data.session}
</footer>
