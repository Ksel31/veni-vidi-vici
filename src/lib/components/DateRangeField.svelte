<script>
	import Icon from './Icon.svelte';
	import { dateParts } from '#lib/present.js';
	import { todayIso } from '#lib/rules.js';

	/** @type {{ start?: string, end?: string, mode?: 'single' | 'range', label?: string, inputId?: string, placeholder?: string, invalid?: boolean, describedBy?: string }} */
	let {
		start = $bindable(''),
		end = $bindable(''),
		mode = 'range',
		label: fieldLabel = 'Dates',
		inputId = 'date-range',
		placeholder = 'Choisir les dates',
		invalid = false,
		describedBy = undefined
	} = $props();

	const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
	const MONTHS_LONG = [
		'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
		'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
	];
	const HEADS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

	let open = $state(false);
	// Brouillon : le choix ne touche le formulaire qu'au clic sur « Valider ».
	let draftStart = $state('');
	let draftEnd = $state('');
	/** @type {HTMLButtonElement | undefined} */
	let fieldButton = $state();
	/** @type {HTMLElement | undefined} */
	let panel = $state();

	const today = new Date();
	let viewYear = $state(today.getFullYear());
	let viewMonth = $state(today.getMonth() + 1);
	const todayKey = todayIso();

	const rangeText = $derived(formatRange(start, end));
	const draftText = $derived(formatRange(draftStart, draftEnd));
	const cells = $derived(monthCells(viewYear, viewMonth));
	// « Valider » attend une date. Un festival d'un seul jour : un toucher suffit (la fin = le début).
	const canValidate = $derived(Boolean(draftStart));

	/** @param {string} iso */
	function formatDay(iso) {
		const { day, month } = dateParts(iso);
		return `${day} ${MONTHS[month - 1]}`;
	}

	/** @param {string} from @param {string} to */
	function formatRange(from, to) {
		if (!from) return '';
		if (!to || to === from) {
			const one = dateParts(from);
			return `${one.day} ${MONTHS[one.month - 1]} ${one.year}`;
		}
		const a = dateParts(from);
		const b = dateParts(to);
		if (a.year === b.year && a.month === b.month) {
			return `${a.day} – ${b.day} ${MONTHS[a.month - 1]} ${a.year}`;
		}
		if (a.year === b.year) {
			return `${formatDay(from)} – ${formatDay(to)} ${a.year}`;
		}
		return `${formatDay(from)} ${a.year} – ${formatDay(to)} ${b.year}`;
	}

	/** @param {number} year @param {number} month */
	function monthCells(year, month) {
		const first = new Date(year, month - 1, 1);
		let lead = (first.getDay() + 6) % 7;
		const count = new Date(year, month, 0).getDate();
		/** @type {(string | null)[]} */
		const list = [];
		for (let i = 0; i < lead; i++) list.push(null);
		for (let day = 1; day <= count; day++) {
			list.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
		}
		return list;
	}

	function openCalendar() {
		draftStart = start;
		draftEnd = end;
		const focus = start || end;
		if (focus) {
			const parts = dateParts(focus);
			viewYear = parts.year;
			viewMonth = parts.month;
		}
		open = true;
		// Le focus entre dans la fenêtre une fois affichée
		queueMicrotask(() => panel?.focus());
	}

	/** Ferme sans rien changer (voile, Échap) et rend le focus au champ. */
	function closeCalendar() {
		open = false;
		fieldButton?.focus();
	}

	function validate() {
		if (!canValidate) return;
		start = draftStart;
		end = mode === 'single' ? '' : draftEnd || draftStart;
		closeCalendar();
	}

	/** @param {KeyboardEvent} event */
	function onKeydown(event) {
		if (open && event.key === 'Escape') closeCalendar();
	}

	function previousMonth() {
		if (viewMonth === 1) {
			viewMonth = 12;
			viewYear -= 1;
		} else {
			viewMonth -= 1;
		}
	}

	function nextMonth() {
		if (viewMonth === 12) {
			viewMonth = 1;
			viewYear += 1;
		} else {
			viewMonth += 1;
		}
	}

	/** Premier toucher = début, second = fin (une date seule pour un concert). @param {string} iso */
	function pick(iso) {
		if (mode === 'single') {
			draftStart = iso;
			return;
		}
		if (!draftStart || draftEnd) {
			draftStart = iso;
			draftEnd = '';
		} else if (iso < draftStart) {
			draftEnd = draftStart;
			draftStart = iso;
		} else {
			draftEnd = iso;
		}
	}

	/** @param {string} iso */
	function dayClass(iso) {
		const classes = [];
		if (iso === todayKey) classes.push('cal-day-today');
		if (draftStart && (iso === draftStart || iso === draftEnd)) classes.push('cal-day-on');
		else if (draftStart && draftEnd && iso > draftStart && iso < draftEnd) classes.push('cal-day-in');
		return classes.join(' ');
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="field" class:field-invalid={invalid}>
	<label for={inputId}>{fieldLabel}</label>
	<button
		id={inputId}
		bind:this={fieldButton}
		class="field-box range-field"
		type="button"
		aria-haspopup="dialog"
		aria-expanded={open}
		aria-describedby={describedBy}
		onclick={openCalendar}
	>
		<Icon name="calendar" size={20} />
		<span class:range-empty={!rangeText}>{rangeText || placeholder}</span>
	</button>
</div>

<!-- Calendrier flottant (components/ui.elyx : calendarDialog) : posé au-dessus du formulaire, sur un voile noir. -->
{#if open}
	<div class="calendar-layer">
		<button class="calendar-scrim" type="button" tabindex="-1" aria-label="Fermer le calendrier" onclick={closeCalendar}></button>
		<div class="calendar" role="dialog" aria-modal="true" aria-label={fieldLabel} tabindex="-1" bind:this={panel}>
			<div class="cal-top">
				<p class="cal-top-label">{fieldLabel}</p>
				<p class="cal-top-range" class:range-empty={!draftText}>{draftText || placeholder}</p>
			</div>
			<div class="cal-nav">
				<button type="button" aria-label="Mois précédent" onclick={previousMonth}>
					<Icon name="arrow-left" size={20} />
				</button>
				<p>{MONTHS_LONG[viewMonth - 1]} {viewYear}</p>
				<button type="button" aria-label="Mois suivant" onclick={nextMonth}>
					<Icon name="chevron-right" size={20} />
				</button>
			</div>
			<div class="cal-heads">
				{#each HEADS as name}
					<span>{name}</span>
				{/each}
			</div>
			<div class="cal-grid">
				{#each cells as cell, index (cell ?? `empty-${index}`)}
					{#if cell}
						<button class="cal-day {dayClass(cell)}" type="button" onclick={() => pick(cell)}>
							{dateParts(cell).day}
						</button>
					{:else}
						<span class="cal-day cal-empty"></span>
					{/if}
				{/each}
			</div>
			<div class="cal-footer">
				<button class="btn btn-primary" type="button" disabled={!canValidate} onclick={validate}>Valider</button>
			</div>
		</div>
	</div>
{/if}
