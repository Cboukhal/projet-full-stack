from django.test import Client, TestCase


class ApiSmokeTests(TestCase):
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

    def test_cors_preflight_is_accepted(self):
        # Vérifie que le navigateur peut faire un préflight CORS.
        response = self.client.options(
            '/api/auth/login',
            HTTP_ORIGIN='http://localhost:5173',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(response['Access-Control-Allow-Origin'], 'http://localhost:5173')
