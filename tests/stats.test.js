import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, statsYears, ticketSpending } from '../src/lib/stats.js';

function makeEvent(changes) {
	return {
		id: 'e', type: 'concert', title: null, startDate: '2025-03-01', endDate: null, venueId: null,
		status: 'attended', ticketBought: false, ticketPrice: null, ticketFile: null, photos: [],
		daysAttended: [], thumb: null, comment: '', companions: [], ...changes
	};
}

function makePerformance(id, eventId, artistId, status = 'seen') {
	return { id, eventId, artistId, billing: null, day: null, status, thumb: null, setlist: '' };
}

const state = {
	userId: 'u',
	venues: [{ id: 'v1', name: 'AB', city: 'Bruxelles', country: 'Belgique' }],
	artists: [{ id: 'a1', name: 'Alpha' }, { id: 'a2', name: 'Beta' }],
	events: [
		makeEvent({ id: 'c1', startDate: '2025-03-01', venueId: 'v1', thumb: 'up', companions: ['Léa', 'léa'] }),
		makeEvent({ id: 'c2', startDate: '2025-06-01', venueId: 'v1', thumb: 'down', companions: ['Léa'] }),
		makeEvent({ id: 'f1', type: 'festival', title: 'Fest', startDate: '2024-07-01', endDate: '2024-07-03', daysAttended: ['2024-07-01', '2024-07-02'] }),
		makeEvent({ id: 'm1', startDate: '2025-08-01', status: 'missed' })
	],
	performances: [
		makePerformance('p1', 'c1', 'a1'),
		makePerformance('p2', 'c2', 'a1'),
		makePerformance('p3', 'c2', 'a2', 'missed'),
		makePerformance('p4', 'f1', 'a2')
	],
	onboardingSeen: true
};

test("les années proposées sont celles des events vus, la plus récente d'abord", () => {
	assert.deepEqual(statsYears(state), ['2025', '2024']);
});

test("chiffres clés d'une année : seuls les events vus comptent", () => {
	const stats = computeStats(state, '2025');
	assert.equal(stats.seenCount, 2);
	assert.equal(stats.concerts, 2);
	assert.equal(stats.festivals, 0);
	assert.equal(stats.bands, 1);
	assert.equal(stats.venues, 1);
	assert.equal(stats.missed, 1);
});

test('toutes années cumulées : jours de festival = jours cochés', () => {
	const stats = computeStats(state, '');
	assert.equal(stats.seenCount, 3);
	assert.equal(stats.festivalDays, 2);
	assert.equal(stats.bands, 2);
});

test('classements : groupe revu, accompagnants comptés une fois par event', () => {
	const stats = computeStats(state, '');
	assert.deepEqual(stats.topBands.map((row) => [row.label, row.count]), [['Alpha', 2]]);
	assert.deepEqual(stats.topCompanions.map((row) => [row.label, row.count]), [['Léa', 2]]);
});

test('ressenti : un pouce haut, un pouce bas', () => {
	const stats = computeStats(state, '2025');
	assert.equal(stats.likedCount, 1);
	assert.equal(stats.dislikedCount, 1);
	assert.equal(stats.likedShare, 50);
});

test('compte vide : tout est à zéro, sans erreur', () => {
	const empty = { userId: 'u', venues: [], artists: [], events: [], performances: [], onboardingSeen: false };
	const stats = computeStats(empty, '');
	assert.equal(stats.seenCount, 0);
	assert.equal(stats.likedShare, 0);
	assert.deepEqual(statsYears(empty), []);
});

test('dépenses : 0 (gratuit) compte dans le total et la moyenne, null est ignoré', () => {
	const spending = ticketSpending([{ ticketPrice: 50 }, { ticketPrice: 0 }, { ticketPrice: null }, { ticketPrice: 10 }]);
	assert.deepEqual(spending, { count: 3, total: 60, average: 20 });
	assert.deepEqual(ticketSpending([{ ticketPrice: null }]), { count: 0, total: 0, average: null });
});
