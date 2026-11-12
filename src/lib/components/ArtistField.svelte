<script>
	/** @type {{ artists: import('#lib/store.js').Artist[], taken: string[], placeholder: string, onAdd: (name: string) => void }} */
	let { artists, taken, placeholder, onAdd } = $props();

	let query = $state('');
	/** @type {HTMLInputElement | null} */
	let input = $state(null);
	// Lu au pointerdown : au pointerup le clavier a parfois déjà vidé le champ lié.
	let buffered = '';

	const matches = $derived.by(() => {
		const text = query.trim().toLowerCase();
		if (!text) return [];
		const used = new Set(taken.map((name) => name.toLowerCase()));
		return artists
			.filter((artist) => artist.name.toLowerCase().includes(text) && !used.has(artist.name.toLowerCase()))
			.slice(0, 6);
	});

	function typedValue() {
		return input?.value ?? query;
	}

	/**
	 * Le groupe s'insère sous le doigt. Le clic qui suit le pointerup
	 * tomberait sur la croix de la nouvelle ligne et l'enlèverait tout de suite.
	 */
	function swallowNextClick() {
		/** @param {Event} event */
		const stop = (event) => {
			event.preventDefault();
			event.stopPropagation();
			document.removeEventListener('click', stop, true);
		};
		document.addEventListener('click', stop, true);
		// Le clic fantôme suit tout de suite. Au-delà, c'est un vrai toucher (un jour, une croix).
		setTimeout(() => document.removeEventListener('click', stop, true), 80);
	}

	/** @param {string} name */
	function commit(name) {
		const trimmed = name.trim();
		if (!trimmed) return;
		onAdd(trimmed);
		query = '';
		buffered = '';
		if (input) input.value = '';
	}

	function remember() {
		buffered = typedValue();
	}

	/** @param {PointerEvent} event @param {string} name */
	function release(event, name) {
		const el = event.currentTarget;
		if (!(el instanceof HTMLElement)) return;
		const box = el.getBoundingClientRect();
		const inside =
			event.clientX >= box.left &&
			event.clientX <= box.right &&
			event.clientY >= box.top &&
			event.clientY <= box.bottom;
		if (!inside) return;
		swallowNextClick();
		commit(name);
	}

	/** @param {SubmitEvent} event */
	function onSubmit(event) {
		event.preventDefault();
		commit(buffered || typedValue());
	}

	/** @param {KeyboardEvent} event */
	function onKey(event) {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		const value = event.currentTarget instanceof HTMLInputElement ? event.currentTarget.value : typedValue();
		commit(value);
	}
</script>

<form class="field" onsubmit={onSubmit}>
	<label class="visually-hidden" for="artist-query">Ajouter un groupe</label>
	<div class="field-box">
		<input
			id="artist-query"
			bind:this={input}
			bind:value={query}
			{placeholder}
			autocomplete="off"
			autocapitalize="off"
			enterkeyhint="done"
			onkeydown={onKey}
		/>
		<button
			class="add-artist"
			type="button"
			aria-label="Ajouter le groupe"
			onpointerdown={remember}
			onpointerup={(event) => release(event, buffered || typedValue())}
		>
			<span class="icon" style:width="20px" style:height="20px" style:--icon="url('/icons/plus.svg')"></span>
		</button>
	</div>
	{#if matches.length > 0}
		<ul class="suggestions">
			{#each matches as artist (artist.id)}
				<li>
					<button
						type="button"
						onpointerdown={(event) => {
							event.preventDefault();
							buffered = artist.name;
						}}
						onpointerup={(event) => release(event, artist.name)}
					>
						{artist.name}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</form>
