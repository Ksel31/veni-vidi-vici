// Sélection de dates du calendrier : un toucher = un jour valide, un second = la plage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choisirDate } from '../src/lib/rules.js';

const vide = { debut: '', fin: '' };

test('un seul toucher donne un jour valide (début = fin)', () => {
	assert.deepEqual(choisirDate(vide, '2026-07-10'), { debut: '2026-07-10', fin: '2026-07-10' });
});

test('un second toucher sur une autre date forme une plage, dans les deux ordres', () => {
	const un = choisirDate(vide, '2026-07-10');
	assert.deepEqual(choisirDate(un, '2026-07-12'), { debut: '2026-07-10', fin: '2026-07-12' });
	assert.deepEqual(choisirDate(un, '2026-07-08'), { debut: '2026-07-08', fin: '2026-07-10' });
});

test('retoucher le même jour garde un seul jour', () => {
	const un = choisirDate(vide, '2026-07-10');
	assert.deepEqual(choisirDate(un, '2026-07-10'), { debut: '2026-07-10', fin: '2026-07-10' });
});

test('un toucher après une plage complète recommence une sélection', () => {
	const plage = { debut: '2026-07-10', fin: '2026-07-12' };
	assert.deepEqual(choisirDate(plage, '2026-07-20'), { debut: '2026-07-20', fin: '2026-07-20' });
});

test('une fin vide (ancien état) compte comme un seul jour choisi', () => {
	assert.deepEqual(choisirDate({ debut: '2026-07-10', fin: '' }, '2026-07-11'), { debut: '2026-07-10', fin: '2026-07-11' });
});

test('mode concert : toujours une date seule, sans fin', () => {
	const un = choisirDate(vide, '2026-07-10', 'single');
	assert.deepEqual(un, { debut: '2026-07-10', fin: '' });
	assert.deepEqual(choisirDate(un, '2026-07-12', 'single'), { debut: '2026-07-12', fin: '' });
});
