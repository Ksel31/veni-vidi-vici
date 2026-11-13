/// <reference path="../pb_data/types.d.ts" />

// Au démarrage, la règle « Create » de `users` suit la variable VVV_INSCRIPTIONS_OUVERTES :
// "true" = n'importe qui peut créer un compte, sinon seul l'admin le peut.
// Pourquoi un hook et pas la migration : une migration ne s'exécute qu'une fois, alors qu'on veut
// pouvoir rouvrir (ou refermer) en changeant seulement l'environnement, puis en redémarrant.
onBootstrap((e) => {
	e.next();
	const ouvertes = $os.getenv('VVV_INSCRIPTIONS_OUVERTES') === 'true';
	const users = e.app.findCollectionByNameOrId('users');
	const voulue = ouvertes ? '' : null;
	if (users.createRule === voulue) return;
	users.createRule = voulue;
	e.app.save(users);
});
