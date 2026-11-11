<script>
	import Icon from './Icon.svelte';

	/** @type {{ id: string, label: string, icon: string, type?: string, value?: string }} */
	let { id, label, icon, type = 'text', value = $bindable('') } = $props();
</script>

<div class="field">
	<label for={id}>{label}</label>
	<div class="field-box">
		<Icon name={icon} size={20} />
		<input {id} {type} autocomplete={type === 'password' ? 'current-password' : 'username'} bind:value />
	</div>
</div>
