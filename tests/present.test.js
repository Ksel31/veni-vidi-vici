import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceLabel } from '../src/lib/present.js';

test('prix : 0 = « Gratuit », null = rien à afficher', () => {
	assert.equal(priceLabel(0), 'Gratuit');
	assert.equal(priceLabel(null), '');
	assert.match(priceLabel(49), /^49,00\s€$/);
});
