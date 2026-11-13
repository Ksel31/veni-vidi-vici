/// <reference path="../pb_data/types.d.ts" />

// Inscriptions publiques fermées : `createRule = null` veut dire « superusers seulement ».
// C'est l'admin qui crée les comptes, dans le tableau de bord (collection `users`).
// Pour rouvrir : voir pb_hooks/inscriptions.pb.js (variable VVV_INSCRIPTIONS_OUVERTES).
migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.createRule = null;
		app.save(users);
	},
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.createRule = '';
		app.save(users);
	}
);
