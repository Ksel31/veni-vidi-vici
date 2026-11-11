<script>
	/** @type {{ artists: import('#lib/store.js').Artist[], taken: string[], placeholder: string, onAdd: (name: string) => void }} */
	let { artists, taken, placeholder, onAdd } = $props();

	let query = $state('');

	const matches = $derived.by(() => {
		const text = query.trim().toLowerCase();
		if (!text) return [];
		const used = new Set(taken.map((name) => name.toLowerCase()));
		return artists
			.filter((artist) => artist.name.toLowerCase().includes(text) && !used.has(artist.name.toLowerCase()))
			.slice(0, 6);
	});

	/** @param {string} [name] */
	function commit(name = query) {
		const trimmed = name.trim();
		if (!trimmed) return;
		onAdd(trimmed);
		query = '';
	}

	/** Le clavier Android envoie souvent « Entrée » comme envoi du formulaire. */
	/** @param {SubmitEvent} event */
	function onSubmit(event) {
		event.preventDefault();
		commit();
	}
</script>

<form class="field" onsubmit={onSubmit}>
	<label class="visually-hidden" for="artist-query">Ajouter un groupe</label>
	<div class="field-box">
		<input
			id="artist-query"
			bind:value={query}
			{placeholder}
			autocomplete="off"
			autocapitalize="off"
			enterkeyhint="done"
		/>
		<button class="add-artist" type="submit" aria-label="Ajouter le groupe">
			<span class="icon" style:width="20px" style:height="20px" style:--icon="url('/icons/plus.svg')"></span>
		</button>
	</div>
	{#if matches.length > 0}
		<ul class="suggestions">
			{#each matches as artist (artist.id)}
				<li>
					<button type="button" onpointerdown={(event) => event.preventDefault()} onclick={() => commit(artist.name)}>
						{artist.name}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</form>
