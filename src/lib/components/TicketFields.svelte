<script>
	import Icon from './Icon.svelte';

	/**
	 * Champs du billet, communs à l'ajout et à la modification.
	 * @type {{ bought: boolean, priceText: string, boughtHint: string, pricePlaceholder: string, priceId: string }}
	 */
	let {
		bought = $bindable(false),
		priceText = $bindable(''),
		boughtHint,
		pricePlaceholder,
		priceId
	} = $props();
</script>

<button class="check-row" type="button" aria-pressed={bought} onclick={() => (bought = !bought)}>
	<span class="check-box" class:check-on={bought}>
		{#if bought}<Icon name="check" size={18} />{/if}
	</span>
	<span>
		<span class="check-title">Billet acheté</span>
		<span class="check-meta">{boughtHint}</span>
	</span>
</button>
<div class="field">
	<label for={priceId}>Prix du billet (optionnel)</label>
	<div class="field-box">
		<Icon name="euro" size={20} />
		<input id={priceId} inputmode="decimal" bind:value={priceText} placeholder={pricePlaceholder} autocomplete="off" />
	</div>
</div>
<div class="upload-box">
	<Icon name="upload" size={26} />
	<p>Ajouter le billet</p>
	<p class="upload-hint">PDF ou image.</p>
</div>
