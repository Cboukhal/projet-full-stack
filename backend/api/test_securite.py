"""Tests de sécurité  : authentification, rôles, IDOR, injections."""

import json

from django.contrib.auth.hashers import make_password
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


class AuthenticationSecurityTests(TestCase):
    """Aucune route protégée ne doit répondre sans jeton valide."""

    def setUp(self):
        self.client = Client()
        self.eleve = DemoUser.objects.create(
            identifiant='secu.eleve',
            mot_de_passe=make_password('MotDePasse-Eleve-2026!'),
            role=DemoUser.ROLE_ELEVE,
            nom='Sécurité mika',
            email='secu.eleve@example.com',
        )

    # Chaque route protégée doit refuser un appel sans en-tête Authorization.
    def test_protected_routes_reject_missing_token(self):
        for path in ('/api/auth/profile', '/api/mon-planning', '/api/filieres'):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 401)

    # Un jeton inventé ne doit jamais être accepté, même de la bonne longueur.
    def test_protected_routes_reject_forged_or_random_token(self):
        forged_token = 'a' * 64
        response = self.client.get(
            '/api/auth/profile',
            HTTP_AUTHORIZATION=f'Bearer {forged_token}',
        )
        self.assertEqual(response.status_code, 401)


    # Un mot de passe incorrect ne doit jamais renvoyer de jeton, quel que soit le compte visé.
    def test_login_never_returns_token_on_wrong_password(self):
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'identifiant': self.eleve.identifiant,
                'motDePasse': 'mauvais-mot-de-passe',
            }),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 401)
        self.assertNotIn('token', response.json())

    # Le message d'erreur doit être identique pour un identifiant inconnu ou un mot de passe
    # faux : cela évite de révéler quels identifiants existent (énumération de comptes).
    def test_login_error_does_not_reveal_account_existence(self):
        unknown_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({'identifiant': 'inconnu.absent', 'motDePasse': 'peu importe'}),
            content_type='application/json',
        )
        wrong_password_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'identifiant': self.eleve.identifiant,
                'motDePasse': 'mauvais-mot-de-passe',
            }),
            content_type='application/json',
        )
        self.assertEqual(unknown_response.status_code, wrong_password_response.status_code)
        self.assertEqual(unknown_response.json(), wrong_password_response.json())

    # Les mots de passe ne doivent jamais apparaître en clair dans la base.
    def test_password_is_never_stored_in_plain_text(self):
        self.assertNotEqual(self.eleve.mot_de_passe, 'MotDePasse-Eleve-2026!')
        self.assertTrue(self.eleve.mot_de_passe.startswith('pbkdf2_'))

    # Une réponse publique (login, profil) ne doit jamais exposer le hash du mot de passe.
    def test_public_responses_never_leak_password_hash(self):
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'identifiant': self.eleve.identifiant,
                'motDePasse': 'MotDePasse-Eleve-2026!',
            }),
            content_type='application/json',
        )
        self.assertNotIn('motDePasse', login_response.json()['user'])
        self.assertNotIn('mot_de_passe', json.dumps(login_response.json()))

        profile_response = self.client.get(
            '/api/auth/profile',
            HTTP_AUTHORIZATION=f"Bearer {login_response.json()['token']}",
        )
        self.assertNotIn('mot_de_passe', json.dumps(profile_response.json()))

    # Se déconnecter doit invalider immédiatement le jeton côté serveur.
    def test_logout_invalidates_token_immediately(self):
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'identifiant': self.eleve.identifiant,
                'motDePasse': 'MotDePasse-Eleve-2026!',
            }),
            content_type='application/json',
        )
        token = login_response.json()['token']

        logout_response = self.client.post(
            '/api/auth/logout',
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )
        self.assertEqual(logout_response.status_code, 200)

        reused_response = self.client.get(
            '/api/auth/profile',
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )
        self.assertEqual(reused_response.status_code, 401)

    # Se reconnecter doit émettre un nouveau jeton et invalider l'ancien.
    def test_new_login_invalidates_previous_session_token(self):
        first_login = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'identifiant': self.eleve.identifiant,
                'motDePasse': 'MotDePasse-Eleve-2026!',
            }),
            content_type='application/json',
        )
        first_token = first_login.json()['token']

        second_login = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'identifiant': self.eleve.identifiant,
                'motDePasse': 'MotDePasse-Eleve-2026!',
            }),
            content_type='application/json',
        )
        self.assertNotEqual(first_token, second_login.json()['token'])

        stale_response = self.client.get(
            '/api/auth/profile',
            HTTP_AUTHORIZATION=f'Bearer {first_token}',
        )
        self.assertEqual(stale_response.status_code, 401)


class RoleAccessControlTests(TestCase):
    """Une route réservée à un rôle doit refuser tous les autres rôles."""

    def setUp(self):
        self.client = Client()
        self.eleve = DemoUser.objects.create(
            identifiant='secu.role.eleve',
            mot_de_passe=make_password('MotDePasse-2026!'),
            role=DemoUser.ROLE_ELEVE,
            nom='Élève Rôle',
            email='secu.role.eleve@example.com',
        )
        self.formateur = DemoUser.objects.create(
            identifiant='secu.role.formateur',
            mot_de_passe=make_password('MotDePasse-2026!'),
            role=DemoUser.ROLE_FORMATEUR,
            nom='Formateur Rôle',
            email='secu.role.formateur@example.com',
        )
        self.referente = DemoUser.objects.create(
            identifiant='secu.role.referente',
            mot_de_passe=make_password('MotDePasse-2026!'),
            role=DemoUser.ROLE_REFERENTE,
            nom='Référente Rôle',
            email='secu.role.referente@example.com',
        )

    def _token_for(self, user):
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'identifiant': user.identifiant,
                'motDePasse': 'MotDePasse-2026!',
            }),
            content_type='application/json',
        )
        return response.json()['token']

    # Les routes de gestion pédagogique sont réservées au rôle référente : un
    # élève ou un formateur authentifié doit recevoir 403, jamais 200.
    def test_non_referente_roles_are_forbidden_from_referente_routes(self):
        for user in (self.eleve, self.formateur):
            with self.subTest(role=user.role):
                token = self._token_for(user)
                response = self.client.get(
                    '/api/filieres',
                    HTTP_AUTHORIZATION=f'Bearer {token}',
                )
                self.assertEqual(response.status_code, 403)

    # "mon-planning" est réservé aux élèves : une référente authentifiée
    # (donc avec un jeton valide) ne doit pas pouvoir l'utiliser à leur place.
    def test_non_eleve_roles_are_forbidden_from_mon_planning(self):
        for user in (self.formateur, self.referente):
            with self.subTest(role=user.role):
                token = self._token_for(user)
                response = self.client.get(
                    '/api/mon-planning',
                    HTTP_AUTHORIZATION=f'Bearer {token}',
                )
                self.assertEqual(response.status_code, 403)

    # Une requête d'écriture (création de filière) doit aussi être bloquée pour un élève,
    # pas seulement la lecture : l'élévation de privilèges ne doit pas passer par POST.
    def test_eleve_cannot_create_filiere(self):
        token = self._token_for(self.eleve)
        response = self.client.post(
            '/api/filieres',
            data=json.dumps({'nom': 'Filière créée par un élève'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Filiere.objects.filter(nom='Filière créée par un élève').exists())


    # Un identifiant contenant une syntaxe SQL classique ne doit ni faire planter la
    # requête, ni permettre de se connecter (l'ORM Django paramètre déjà les requêtes,
    # ce test documente et garantit qu'aucune concaténation SQL n'a été introduite).
    def test_login_is_not_vulnerable_to_sql_injection_payloads(self):
        payloads = [
            "' OR '1'='1",
            "'; DROP TABLE api_demouser; --",
            "' OR 1=1 --",
        ]
        for payload in payloads:
            with self.subTest(payload=payload):
                response = self.client.post(
                    '/api/auth/login',
                    data=json.dumps({'identifiant': payload, 'motDePasse': payload}),
                    content_type='application/json',
                )
                self.assertEqual(response.status_code, 401)

        # La table n'a pas été supprimée par le payload DROP TABLE ci-dessus.
        self.assertTrue(DemoUser.objects.filter(pk=self.referente.pk).exists())

    # Un texte de recherche contenant des caractères spéciaux SQL ne doit pas faire
    # planter la recherche (elle doit simplement ne rien trouver) INJETION SQL .
    def test_search_endpoints_handle_sql_special_characters_safely(self):
        token = self._token()
        response = self.client.get(
            '/api/eleves',
            {'search': "%' OR '1'='1"},
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )
        self.assertEqual(response.status_code, 200)

    # Une balise <script> envoyée dans un champ texte doit être stockée telle quelle
    # (le frontend React échappe déjà l'affichage) et non provoquer d'erreur serveur.
    def test_create_filiere_stores_html_payload_without_executing_or_crashing(self):
        token = self._token()
        payload_name = '<script>alert(1)</script>'
        response = self.client.post(
            '/api/filieres',
            data=json.dumps({'nom': payload_name}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['nom'], payload_name)

    # Un corps JSON mal formé sur une route protégée doit renvoyer 400, pas 500.
    def test_malformed_json_body_does_not_crash_protected_route(self):
        token = self._token()
        response = self.client.post(
            '/api/filieres',
            data='{ceci nest pas du json',
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )
        self.assertIn(response.status_code, (400, 405))
