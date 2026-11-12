<script>
	/** @type {{ step: number, total?: number, title: string, help: string }} */
	let { step, total = 3, title, help } = $props();
</script>

<!-- ui.stepHeader : « Étape 1/3 », barre de progression claire (pas de lime), question, phrase d'aide. -->
<div class="step-header">
	<p class="step-label">Étape {step}/{total}</p>
	<div class="step-track" role="progressbar" aria-valuemin="0" aria-valuemax={total} aria-valuenow={step} aria-label="Progression">
		<span class="step-fill" style:width="{(step / total) * 100}%"></span>
	</div>
	<h2 class="step-title">{title}</h2>
	<p class="step-help">{help}</p>
</div>
