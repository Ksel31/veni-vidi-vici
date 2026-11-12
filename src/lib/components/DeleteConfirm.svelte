<script>
	import Icon from './Icon.svelte';

	/** @type {{ onCancel: () => void, onConfirm: () => void }} */
	let { onCancel, onConfirm } = $props();
</script>

<div class="glass-card delete-panel" role="dialog" aria-labelledby="delete-title">
	<p class="card-title" id="delete-title">Supprimer cet event ?</p>
	<p class="hint">L'event, ses groupes et son compte rendu seront effacés.</p>
	<div class="choice-row">
		<button class="btn btn-secondary" type="button" onclick={onCancel}>Annuler</button>
		<button class="btn btn-primary" type="button" onclick={onConfirm}>
			<Icon name="trash" size={22} />
			Supprimer l'event
		</button>
	</div>
</div>
