<script>
	/** En-tête du stepper d'ajout : numéro d'étape, barre de progression, question et aide.
	 *  @type {{ step: number, total?: number, title: string, help: string }} */
	let { step, total = 3, title, help } = $props();
</script>

<div class="step-header">
	<p class="step-label">Étape {step}/{total}</p>
	<div class="step-track" aria-hidden="true">
		<span class="step-fill" style:width="{(step / total) * 100}%"></span>
	</div>
	<h2 class="step-title">{title}</h2>
	<p class="step-help">{help}</p>
</div>
