import json

from django.test import Client, TestCase

from .models import (
    Cours,
    CoursPlanifie,
    Cursus,
    CursusCours,
    DemoUser,
    Filiere,
    InscriptionPromotion,
    Promotion,
)


class ApiSmokeTests(TestCase):
    """Tests de bout en bout des routes d'authentification et de profil."""

    def setUp(self):
        # Client Django de test pour appeler les routes HTTP.
        self.client = Client()

    def _login(self, identifiant, mot_de_passe):
        # Petit utilitaire partagé par les tests pour se connecter et récupérer le token.
        response = self.client.post(
            '/api/auth/login',
            data=f'{{"identifiant":"{identifiant}","motDePasse":"{mot_de_passe}"}}',
            content_type='application/json',
            HTTP_ORIGIN='http://localhost:5173',
        )
        return response.json()

    def test_login_returns_user_and_token(self):
        # Vérifie que la route de connexion renvoie bien un token et un user.
        payload = self._login('camille.dubois', 'eleve123')

        self.assertIn('token', payload)
        self.assertEqual(len(payload['token']), 64)
        self.assertEqual(payload['user']['role'], 'eleve')

    def test_login_displays_the_drf_browsable_form(self):
        # Un navigateur demande du HTML : DRF affiche alors le formulaire POST.
        response = self.client.get(
            '/api/auth/login',
            HTTP_ACCEPT='text/html',
        )

        # La ressource reste POST-only, mais la réponse 405 contient désormais
        # une véritable page DRF avec les deux champs du sérialiseur.
        self.assertEqual(response.status_code, 405)
        self.assertTrue(response['Content-Type'].startswith('text/html'))
        self.assertContains(response, 'name="identifiant"', status_code=405)
        self.assertContains(response, 'name="motDePasse"', status_code=405)

    def test_login_accepts_the_drf_html_form(self):
        response = self.client.post(
            '/api/auth/login',
            data={
                'identifiant': 'camille.dubois',
                'motDePasse': 'eleve123',
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.json())

    # Un JSON syntaxiquement invalide, une liste ou null doivent tous retourner la même erreur 400.
    def test_login_keeps_generic_errors_for_invalid_json(self):
        for invalid_body in ('{', '[]', 'null'):
            with self.subTest(body=invalid_body):
                response = self.client.post(
                    '/api/auth/login',
                    data=invalid_body,
                    content_type='application/json',
                )

                self.assertEqual(response.status_code, 400)
                self.assertEqual(response.json(), {'detail': 'Requête invalide.'})

    def test_profile_requires_authentication(self):
        # Sans token, le profil n'est pas accessible.
        response = self.client.get('/api/auth/profile')
        self.assertEqual(response.status_code, 401)

    def test_profile_returns_authenticated_user(self):
        # Avec un token valide, le profil de l'utilisateur connecté est renvoyé.
        login_payload = self._login('julien.marchand', 'formateur123')
        response = self.client.get(
            '/api/auth/profile',
            HTTP_AUTHORIZATION=f'Bearer {login_payload["token"]}',
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['nom'], 'Julien Marchand')
        self.assertNotIn('motDePasse', payload)

    def test_logout_invalidates_token(self):
        # Après déconnexion, l'ancien token ne fonctionne plus.
        login_payload = self._login('julien.marchand', 'formateur123')
        token = login_payload['token']

        logout_response = self.client.post(
            '/api/auth/logout',
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )
        self.assertEqual(logout_response.status_code, 200)

        profile_response = self.client.get(
            '/api/auth/profile',
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )
        self.assertEqual(profile_response.status_code, 401)

    def test_profile_update_persists_changes(self):
        # PATCH met à jour la fiche de l'utilisateur connecté et renvoie les nouvelles valeurs.
        login_payload = self._login('camille.dubois', 'eleve123')
        token = login_payload['token']

        response = self.client.patch(
            '/api/auth/profile',
            data='{"nom":"Camille D.","telephone":"06 00 00 00 00"}',
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['nom'], 'Camille D.')
        self.assertEqual(payload['telephone'], '06 00 00 00 00')
        # L'email n'était pas dans le payload : il doit rester inchangé.
        self.assertEqual(payload['email'], 'camille.dubois@mail.fr')

    def test_profile_update_rejects_empty_name(self):
        # Le nom et l'email restent obligatoires même en modification.
        login_payload = self._login('camille.dubois', 'eleve123')
        response = self.client.patch(
            '/api/auth/profile',
            data='{"nom":""}',
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {login_payload["token"]}',
        )
        self.assertEqual(response.status_code, 400)

    def test_cors_preflight_is_accepted(self):
        # Vérifie que le navigateur peut faire un préflight CORS.
        response = self.client.options(
            '/api/auth/login',
            HTTP_ORIGIN='http://localhost:5173',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(response['Access-Control-Allow-Origin'], 'http://localhost:5173')


class AcademicsApiTests(TestCase):
    """Tests d'intégration du parcours filière → cursus → cours → promotion → inscription."""

    def setUp(self):
        self.client = Client()
        # Fixtures propres à cette classe, indépendantes des données seedées par migration.
        self.filiere = Filiere.objects.create(nom='Data', description='', statut='Actif')
        self.cursus = Cursus.objects.create(
            filiere=self.filiere, nom='Data Analyst', duree_mois=6, statut='Actif',
        )
        self.cours_1 = Cours.objects.create(nom='Python', statut='Actif')
        self.cours_2 = Cours.objects.create(nom='SQL', statut='Actif')
        self.lien_1 = CursusCours.objects.create(cursus=self.cursus, cours=self.cours_1, position=1)
        self.lien_2 = CursusCours.objects.create(cursus=self.cursus, cours=self.cours_2, position=2)
        self.eleve = DemoUser.objects.get(identifiant='camille.dubois')

    def _token(self, identifiant, mot_de_passe):
        # Connexion directe à l'API pour obtenir un jeton, sans passer par _login (classe sœur).
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps({'identifiant': identifiant, 'motDePasse': mot_de_passe}),
            content_type='application/json',
        )
        return response.json()['token']

    def _auth(self, identifiant, mot_de_passe):
        # Raccourci pour obtenir directement l'en-tête Authorization prêt à l'emploi.
        return {'HTTP_AUTHORIZATION': f'Bearer {self._token(identifiant, mot_de_passe)}'}

    def test_referente_only_endpoints_reject_other_roles(self):
        # Un élève ne peut pas accéder à l'espace référente.
        response = self.client.get('/api/filieres', **self._auth('camille.dubois', 'eleve123'))
        self.assertEqual(response.status_code, 403)

    # Création, listing puis suppression d'une filière vide : le cas nominal complet.
    def test_filiere_create_list_delete(self):
        auth = self._auth('marie.petit', 'referente123')

        create = self.client.post(
            '/api/filieres',
            data=json.dumps({'nom': 'Réseaux', 'description': 'x'}),
            content_type='application/json',
            **auth,
        )
        self.assertEqual(create.status_code, 201)
        filiere_id = create.json()['id']

        listing = self.client.get('/api/filieres', **auth)
        noms = [f['nom'] for f in listing.json()]
        self.assertIn('Réseaux', noms)

        delete = self.client.delete(f'/api/filieres/{filiere_id}', **auth)
        self.assertEqual(delete.status_code, 200)

    # Une filière liée à un cursus (créé dans setUp) ne doit pas pouvoir être supprimée.
    def test_filiere_delete_blocked_when_cursus_attached(self):
        auth = self._auth('marie.petit', 'referente123')
        response = self.client.delete(f'/api/filieres/{self.filiere.id}', **auth)
        self.assertEqual(response.status_code, 400)

    # Un nouveau cours ajouté au cursus doit se placer en dernière position de l'ordre pédagogique.
    def test_cursus_add_cours_appends_to_ordre(self):
        auth = self._auth('marie.petit', 'referente123')
        cours_3 = Cours.objects.create(nom='Gestion de projet', statut='Actif')

        response = self.client.post(
            f'/api/cursus/{self.cursus.id}/cours',
            data=json.dumps({'coursId': cours_3.id}),
            content_type='application/json',
            **auth,
        )
        self.assertEqual(response.status_code, 201)
        ordre = response.json()['ordrePedagogique']
        self.assertEqual([item['titre'] for item in ordre], ['Python', 'SQL', 'Gestion de projet'])

    # Retirer un cours du cursus doit renuméroter les positions restantes sans trou.
    def test_cursus_cours_link_delete_renumbers_positions(self):
        auth = self._auth('marie.petit', 'referente123')
        response = self.client.delete(f'/api/cursus/{self.cursus.id}/cours/{self.lien_1.id}', **auth)
        self.assertEqual(response.status_code, 200)
        ordre = response.json()['ordrePedagogique']
        self.assertEqual(ordre, [{'id': self.lien_2.id, 'coursId': self.cours_2.id, 'titre': 'SQL',
                                   'technologie': '', 'position': 1}])

    # Créer une promotion doit générer une ligne de planning "à planifier" par cours du cursus
    # et calculer automatiquement la date de fin estimée (durée du cursus).
    def test_promotion_creation_generates_planning_rows(self):
        auth = self._auth('marie.petit', 'referente123')
        response = self.client.post(
            '/api/promotions',
            data=json.dumps({'cursusId': self.cursus.id, 'nom': 'Promo Test', 'dateDebut': '2026-02-01',
                              'effectifMax': 20}),
            content_type='application/json',
            **auth,
        )
        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(len(payload['planning']), 2)
        self.assertEqual(payload['dateFinEstimee'], '2026-08-01')  # +6 mois
        self.assertTrue(all(item['statut'] == 'à planifier' for item in payload['planning']))

    # Renseigner les dates d'une ligne de planning fait passer son statut à "planifié".
    def test_promotion_planning_update_marks_planifie(self):
        auth = self._auth('marie.petit', 'referente123')
        promotion = Promotion.objects.create(cursus=self.cursus, nom='Promo B', effectif_max=10)
        cp = CoursPlanifie.objects.create(promotion=promotion, cursus_cours=self.lien_1)

        response = self.client.patch(
            f'/api/promotions/{promotion.id}/planning',
            data=json.dumps({'items': [
                {'id': cp.id, 'dateDebut': '2026-03-01T09:00:00', 'dateFin': '2026-03-05T17:00:00'},
            ]}),
            content_type='application/json',
            **auth,
        )
        self.assertEqual(response.status_code, 200)
        row = response.json()['planning'][0]
        self.assertEqual(row['statut'], 'planifié')

    # Sans avoir validé le cours précédent du cursus, l'inscription est bloquée (409) sauf en forçant.
    def test_inscription_cours_enforces_prerequisite_then_allows_force(self):
        auth = self._auth('marie.petit', 'referente123')
        promotion = Promotion.objects.create(cursus=self.cursus, nom='Promo C', effectif_max=10)
        cp_2 = CoursPlanifie.objects.create(promotion=promotion, cursus_cours=self.lien_2)

        blocked = self.client.post(
            '/api/inscriptions',
            data=json.dumps({'eleveId': self.eleve.id, 'type': 'cours', 'cibleId': cp_2.id}),
            content_type='application/json',
            **auth,
        )
        self.assertEqual(blocked.status_code, 409)

        forced = self.client.post(
            '/api/inscriptions',
            data=json.dumps({'eleveId': self.eleve.id, 'type': 'cours', 'cibleId': cp_2.id, 'force': True}),
            content_type='application/json',
            **auth,
        )
        self.assertEqual(forced.status_code, 201)
        self.assertEqual(forced.json()['statut'], 'Forcée')

    # unique_together empêche un élève de s'inscrire deux fois à la même promotion.
    def test_inscription_promotion_rejects_duplicate(self):
        auth = self._auth('marie.petit', 'referente123')
        promotion = Promotion.objects.create(cursus=self.cursus, nom='Promo D', effectif_max=10)
        body = json.dumps({'eleveId': self.eleve.id, 'type': 'promotion', 'cibleId': promotion.id})

        first = self.client.post('/api/inscriptions', data=body, content_type='application/json', **auth)
        self.assertEqual(first.status_code, 201)

        second = self.client.post('/api/inscriptions', data=body, content_type='application/json', **auth)
        self.assertEqual(second.status_code, 400)

    # Le planning personnel est réservé aux élèves, pas aux référentes.
    def test_mon_planning_requires_eleve_role(self):
        auth = self._auth('marie.petit', 'referente123')
        response = self.client.get('/api/mon-planning', **auth)
        self.assertEqual(response.status_code, 403)

    # Un cours planifié doit apparaître dans le planning d'un élève inscrit à toute la promotion.
    def test_mon_planning_lists_courses_from_enrolled_promotion(self):
        promotion = Promotion.objects.create(cursus=self.cursus, nom='Promo E', effectif_max=10)
        CoursPlanifie.objects.create(promotion=promotion, cursus_cours=self.lien_1)
        InscriptionPromotion.objects.create(eleve=self.eleve, promotion=promotion)

        auth = self._auth('camille.dubois', 'eleve123')
        response = self.client.get('/api/mon-planning', **auth)
        self.assertEqual(response.status_code, 200)
        titres = [item['titre'] for item in response.json()]
        self.assertIn('Python', titres)
