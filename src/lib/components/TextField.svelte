<script>
	import Icon from './Icon.svelte';

	/**
	 * @type {{
	 *   id: string,
	 *   label: string,
	 *   icon: string,
	 *   type?: string,
	 *   value?: string,
	 *   autocomplete?: import("svelte/elements").FullAutoFill,
	 *   placeholder?: string,
	 *   invalid?: boolean,
	 *   describedBy?: string
	 * }}
	 */
	let {
		id,
		label,
		icon,
		type = 'text',
		value = $bindable(''),
		autocomplete = type === 'password' ? 'current-password' : 'username',
		placeholder = '',
		invalid = false,
		describedBy
	} = $props();
</script>

<!-- `invalid` : filet rouge. Le message qui l'accompagne est un FieldMessage placé juste dessous (describedBy = son id). -->
<div class="field" class:field-invalid={invalid}>
	<label for={id}>{label}</label>
	<div class="field-box">
		<Icon name={icon} size={20} />
		<input {id} {type} {autocomplete} {placeholder} aria-invalid={invalid} aria-describedby={describedBy} bind:value />
	</div>
</div>
