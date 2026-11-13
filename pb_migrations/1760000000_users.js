/// <reference path="../pb_data/types.d.ts" />

// Collection `users` : connexion par nom d'utilisateur + mot de passe, e-mail facultatif.
// PocketBase crée déjà `users` (avec `email`, `name`, `avatar`) : on l'adapte au lieu de la recréer.
migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');

		// Nom d'utilisateur : obligatoire, unique sans tenir compte des majuscules.
		users.fields.add(new TextField({ name: 'username', required: true, min: 1, max: 50 }));
		users.indexes.push('CREATE UNIQUE INDEX `idx_users_username` ON `users` (`username` COLLATE NOCASE)');
		users.passwordAuth.identityFields = ['username'];

		// L'e-mail devient facultatif (l'index unique existant ignore déjà les e-mails vides).
		users.fields.getByName('email').required = false;

		users.fields.add(new TextField({ name: 'firstName', max: 100 }));
		users.fields.add(new BoolField({ name: 'onboardingSeen' }));

		// Avatar : le champ existe déjà, on borne seulement la taille (l'appli envoie ~192 px en JPEG).
		users.fields.getByName('avatar').maxSize = 2 * 1024 * 1024;

		// Pas de serveur d'e-mails : on coupe l'alerte « nouvelle connexion ».
		users.authAlert.enabled = false;

		// Sans cette règle, PocketBase refuse de changer l'e-mail directement (il exige un e-mail de
		// confirmation). L'appli permet d'ajouter ou de corriger son e-mail dans le profil : on autorise
		// donc chaque utilisateur à gérer SON propre compte. Aucun envoi d'e-mail n'est nécessaire.
		users.manageRule = 'id = @request.auth.id';

		app.save(users);
	},
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.passwordAuth.identityFields = ['email'];
		users.indexes = users.indexes.filter((index) => !index.includes('idx_users_username'));
		users.fields.removeByName('username');
		users.fields.removeByName('firstName');
		users.fields.removeByName('onboardingSeen');
		users.fields.getByName('email').required = true;
		users.fields.getByName('avatar').maxSize = 0;
		users.authAlert.enabled = true;
		users.manageRule = null;
		app.save(users);
	}
);
