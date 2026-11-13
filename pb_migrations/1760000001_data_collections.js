/// <reference path="../pb_data/types.d.ts" />

// Collections de données : venues, artists, events, performances.
// Chaque ligne appartient à un utilisateur (champ `user`) et les règles d'API ne laissent
// voir, créer, modifier ou supprimer que ses propres lignes. Pas connecté = aucun accès.
migrate(
	(app) => {
		const usersId = app.findCollectionByNameOrId('users').id;

		// Règles communes. (Une règle à `null` serait réservée au superuser : on n'en utilise pas.)
		const ownOnly = '@request.auth.id != "" && user = @request.auth.id';
		const rules = {
			listRule: ownOnly,
			viewRule: ownOnly,
			// À la création, la ligne doit être déclarée au nom de l'utilisateur connecté.
			createRule: '@request.auth.id != "" && @request.body.user = @request.auth.id',
			// À la modification, on ne peut pas changer de propriétaire.
			updateRule: ownOnly + ' && @request.body.user:isset = false',
			deleteRule: ownOnly
		};

		const userField = () =>
			new RelationField({ name: 'user', required: true, collectionId: usersId, maxSelect: 1, cascadeDelete: true });
		const dateText = (name, required) =>
			new TextField({ name, required, pattern: '^\\d{4}-\\d{2}-\\d{2}$' });

		// Crée la collection avec ses champs et ses index, l'enregistre, puis pose les règles.
		// Les règles citent le champ `user` : PocketBase ne le connaît qu'une fois la collection
		// enregistrée, d'où un second `save`. Les champs passent par `fields.add` (pas par le
		// constructeur, qui n'accepte que des objets simples).
		const create = (name, fields, indexes) => {
			const collection = new Collection({ type: 'base', name });
			for (const field of fields) collection.fields.add(field);
			// Date d'ajout : l'appli s'en sert pour relire les lignes dans l'ordre où elles ont été créées.
			collection.fields.add(new AutodateField({ name: 'created', onCreate: true }));
			collection.indexes = indexes;
			app.save(collection);
			Object.assign(collection, rules);
			app.save(collection);
			return collection;
		};

		const venues = create(
			'venues',
			[
				userField(),
				new TextField({ name: 'name', required: true, max: 200 }),
				new TextField({ name: 'city', max: 200 }),
				new TextField({ name: 'country', max: 200 })
			],
			['CREATE INDEX `idx_venues_user` ON `venues` (`user`)']
		);

		const artists = create(
			'artists',
			[userField(), new TextField({ name: 'name', required: true, max: 200 })],
			['CREATE INDEX `idx_artists_user` ON `artists` (`user`)']
		);

		const events = create(
			'events',
			[
				userField(),
				new SelectField({ name: 'type', required: true, maxSelect: 1, values: ['concert', 'festival'] }),
				new TextField({ name: 'title', max: 200 }),
				dateText('startDate', true),
				dateText('endDate', false),
				new RelationField({ name: 'venue', collectionId: venues.id, maxSelect: 1 }),
				new SelectField({ name: 'status', required: true, maxSelect: 1, values: ['planned', 'attended', 'missed'] }),
				new BoolField({ name: 'ticketBought' }),
				new NumberField({ name: 'ticketPrice', min: 0 }),
				// Phase 3 : l'appli n'envoie pas encore de fichiers.
				new FileField({
					name: 'ticketFile',
					maxSelect: 1,
					maxSize: 10 * 1024 * 1024,
					mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
				}),
				new FileField({
					name: 'photos',
					maxSelect: 1000,
					maxSize: 10 * 1024 * 1024,
					mimeTypes: ['image/jpeg', 'image/png', 'image/webp']
				}),
				new JSONField({ name: 'daysAttended', maxSize: 100000 }),
				new SelectField({ name: 'thumb', maxSelect: 1, values: ['up', 'down'] }),
				new TextField({ name: 'comment', max: 1000 }),
				new JSONField({ name: 'companions', maxSize: 100000 })
			],
			['CREATE INDEX `idx_events_user_start` ON `events` (`user`, `startDate`)']
		);

		create(
			'performances',
			[
				userField(),
				// Un event supprimé emporte ses passages.
				new RelationField({ name: 'event', required: true, collectionId: events.id, maxSelect: 1, cascadeDelete: true }),
				new RelationField({ name: 'artist', required: true, collectionId: artists.id, maxSelect: 1 }),
				new SelectField({ name: 'billing', maxSelect: 1, values: ['headliner', 'support'] }),
				dateText('day', false),
				new SelectField({ name: 'status', required: true, maxSelect: 1, values: ['to_see', 'seen', 'missed'] }),
				new SelectField({ name: 'thumb', maxSelect: 1, values: ['up', 'down'] }),
				new TextField({ name: 'setlist', max: 20000 })
			],
			[
				'CREATE INDEX `idx_performances_user` ON `performances` (`user`)',
				'CREATE INDEX `idx_performances_event` ON `performances` (`event`)'
			]
		);
	},
	(app) => {
		// Ordre inverse : les collections qui pointent vers les autres partent d'abord.
		for (const name of ['performances', 'events', 'artists', 'venues']) {
			app.delete(app.findCollectionByNameOrId(name));
		}
	}
);
