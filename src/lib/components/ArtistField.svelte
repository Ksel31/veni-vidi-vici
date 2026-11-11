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

	function commit(name = query) {
		const trimmed = name.trim();
		if (!trimmed) return;
		onAdd(trimmed);
		query = '';
	}

	/** @param {KeyboardEvent} event */
	function onKey(event) {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		commit();
	}

	// Sur téléphone, le premier toucher ferme le clavier et le clic n'arrive pas.
	// On ajoute donc au pointerdown, avant que le champ perde le focus.
	/** @param {PointerEvent} event @param {string} name */
	function pick(event, name) {
		event.preventDefault();
		commit(name);
	}
</script>

<div class="field">
	<label class="visually-hidden" for="artist-query">Ajouter un groupe</label>
	<div class="field-box">
		<input
			id="artist-query"
			bind:value={query}
			{placeholder}
			autocomplete="off"
			autocapitalize="off"
			enterkeyhint="done"
			onkeydown={onKey}
		/>
		<button class="add-artist" type="button" aria-label="Ajouter le groupe" onclick={() => commit()}>
			<span class="icon" style:width="20px" style:height="20px" style:--icon="url('/icons/plus.svg')"></span>
		</button>
	</div>
	{#if matches.length > 0}
		<ul class="suggestions">
			{#each matches as artist (artist.id)}
				<li>
					<button type="button" onpointerdown={(event) => pick(event, artist.name)}>{artist.name}</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
