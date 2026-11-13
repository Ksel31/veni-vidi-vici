// Un festival peut durer un seul jour : début = fin partout (validation, jours, stats, libellé).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { festivalDatesValid } from '../src/lib/rules.js';
import { dayCount, dayCountLabel, daysFrom } from '../src/lib/present.js';
import { computeStats } from '../src/lib/stats.js';

test('validation : début = fin est accepté, fin avant début ou date vide refusés', () => {
	assert.equal(festivalDatesValid('2025-07-10', '2025-07-10'), true);
	assert.equal(festivalDatesValid('2025-07-10', '2025-07-12'), true);
	assert.equal(festivalDatesValid('2025-07-10', '2025-07-09'), false);
	assert.equal(festivalDatesValid('2025-07-10', ''), false);
	assert.equal(festivalDatesValid('', ''), false);
});

test("décompte : un festival d'un jour = 1 jour sélectionnable", () => {
	assert.deepEqual(daysFrom('2025-07-10', '2025-07-10'), ['2025-07-10']);
	assert.equal(dayCount('2025-07-10', '2025-07-10'), 1);
	assert.equal(dayCount('2025-07-10', null), 1);
	assert.equal(dayCount('2025-07-10', '2025-07-12'), 3);
});

test('libellé : singulier pour 1, pluriel au-delà', () => {
	assert.equal(dayCountLabel(1), '1 jour');
	assert.equal(dayCountLabel(3), '3 jours');
});

test("stats : « jours de festival » compte 1 pour un festival d'un jour", () => {
	const festival = (id, changes) => ({
		id, type: 'festival', title: 'Fest', startDate: '2025-07-10', endDate: '2025-07-10', venueId: null,
		status: 'attended', ticketBought: false, ticketPrice: null, ticketFile: null, photos: [],
		daysAttended: [], thumb: null, comment: '', companions: [], ...changes
	});
	const state = {
		userId: 'u', venues: [], artists: [], performances: [], onboardingSeen: true,
		events: [
			festival('f1', { daysAttended: ['2025-07-10'] }), // jour coché
			festival('f2', {}) // vu sans jour coché : la plage entière, soit 1
		]
	};
	assert.equal(computeStats(state, '2025').festivalDays, 2);
});
