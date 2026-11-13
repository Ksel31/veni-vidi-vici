import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyPerformanceRules, historyEvents, isPast, normalizeEvent, toConfirmEvents, upcomingEvents } from '../src/lib/rules.js';

/** Un event minimal : on ne précise que ce qui change d'un test à l'autre. */
function makeEvent(changes) {
	return {
		id: 'e1', type: 'concert', title: null, startDate: '2026-05-10', endDate: null, venueId: null,
		status: 'planned', ticketBought: false, ticketPrice: null, ticketFile: null, photos: [],
		daysAttended: [], thumb: null, comment: '', companions: [], ...changes
	};
}

test("le jour même reste à venir, le lendemain l'event est passé", () => {
	const event = makeEvent({ startDate: '2026-05-10' });
	assert.equal(isPast(event, '2026-05-10'), false);
	assert.equal(isPast(event, '2026-05-11'), true);
});

test('un festival est passé à partir du lendemain de sa date de fin', () => {
	const festival = makeEvent({ type: 'festival', startDate: '2026-05-10', endDate: '2026-05-12' });
	assert.equal(isPast(festival, '2026-05-12'), false);
	assert.equal(isPast(festival, '2026-05-13'), true);
});

test("une date repassée dans le futur remet l'event en planned", () => {
	const event = makeEvent({ status: 'attended', startDate: '2999-01-01' });
	assert.equal(normalizeEvent(event).status, 'planned');
});

test('« à confirmer » = planned et passé, « à venir » = planned et pas passé', () => {
	const state = {
		events: [
			makeEvent({ id: 'old', startDate: '2000-01-01' }),
			makeEvent({ id: 'next', startDate: '2999-01-01' }),
			makeEvent({ id: 'seen', startDate: '2000-01-01', status: 'attended' })
		]
	};
	assert.deepEqual(toConfirmEvents(state).map((e) => e.id), ['old']);
	assert.deepEqual(upcomingEvents(state).map((e) => e.id), ['next']);
	assert.deepEqual(historyEvents(state).map((e) => e.id), ['seen']);
});

test('festival raté : tous ses passages passent en missed', () => {
	const festival = makeEvent({ type: 'festival', startDate: '2000-01-01', endDate: '2000-01-02', status: 'missed' });
	const performances = [
		{ id: 'p1', eventId: 'e1', status: 'to_see' },
		{ id: 'p2', eventId: 'autre', status: 'to_see' }
	];
	const result = applyPerformanceRules(festival, performances);
	assert.equal(result[0].status, 'missed');
	assert.equal(result[1].status, 'to_see');
});
