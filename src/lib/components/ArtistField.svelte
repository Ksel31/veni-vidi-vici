<script>
	import { showInfoToast } from '#lib/toast.js';
	import { nomDejaPris } from '#lib/rules.js';
	import FieldMessage from './FieldMessage.svelte';
	import Icon from './Icon.svelte';

	/** @type {{ artists: import('#lib/store.js').Artist[], taken: string[], placeholder: string, inputId?: string, onAdd: (name: string) => void }} */
	let { artists, taken, placeholder, inputId = 'artist-query', onAdd } = $props();

	let query = $state('');
	/** Le dernier nom tenté est déjà dans le line-up : message sous le champ, texte conservé. */
	let duplicate = $state(false);
	/** @type {HTMLInputElement | null} */
	let input = $state(null);

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
	 * Garde le focus dans le champ au toucher d'un bouton, pour que le clavier mobile reste ouvert.
	 * Non reproduit sur bureau (le « + » y marche avec ou sans) : précaution pour le tactile.
	 * @param {PointerEvent} event
	 */
	function keepFocus(event) {
		event.preventDefault();
	}

	/** @param {string} name */
	function commit(name) {
		const trimmed = name.trim();
		if (!trimmed) return;
		duplicate = nomDejaPris(taken, trimmed);
		if (duplicate) return;
		// Une erreur dans l'écran parent ne doit pas rester muette : sans ça, le « + » semble ne rien faire.
		try {
			onAdd(trimmed);
		} catch (error) {
			console.error(error);
			showInfoToast("Impossible d'ajouter ce groupe. Réessaie.");
			return;
		}
		query = '';
		if (input) input.value = '';
	}

	/** @param {SubmitEvent} event */
	function onSubmit(event) {
		event.preventDefault();
		commit(typedValue());
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
	<label class="visually-hidden" for={inputId}>Ajouter un groupe</label>
	<div class="field-box">
		<input
			id={inputId}
			bind:this={input}
			bind:value={query}
			{placeholder}
			autocomplete="off"
			autocapitalize="off"
			enterkeyhint="done"
			aria-invalid={duplicate}
			aria-describedby={duplicate ? `${inputId}-error` : undefined}
			oninput={() => (duplicate = false)}
			onkeydown={onKey}
		/>
		<button
			class="add-artist"
			type="button"
			aria-label="Ajouter le groupe"
			onpointerdown={keepFocus}
			onclick={() => commit(typedValue())}
		>
			<Icon name="plus" size={20} />
		</button>
	</div>
	{#if duplicate}<FieldMessage id="{inputId}-error" text="Déjà dans le line-up" />{/if}
	{#if matches.length > 0}
		<ul class="suggestions">
			{#each matches as artist (artist.id)}
				<li>
					<button
						type="button"
						onpointerdown={keepFocus}
						onclick={() => commit(artist.name)}
					>
						{artist.name}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</form>
