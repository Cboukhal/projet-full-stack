import base64

from django.test import Client, SimpleTestCase


class ApiSmokeTests(SimpleTestCase):
    def setUp(self):
        # Client Django de test pour appeler les routes HTTP.
        self.client = Client()

    def test_login_returns_user_and_token(self):
        # Vérifie que la route de connexion renvoie bien un token et un user.
        response = self.client.post(
            '/api/auth/login',
            data='{"identifiant":"camille.dubois","motDePasse":"eleve123"}',
            content_type='application/json',
            HTTP_ORIGIN='http://localhost:5173',
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn('token', payload)
        self.assertEqual(payload['user']['role'], 'eleve')

        decoded_token = base64.b64decode(payload['token']).decode('utf-8')
        self.assertTrue(decoded_token.startswith('camille.dubois:'))

    def test_profile_returns_public_user(self):
        # Vérifie que le profil public n'expose pas le mot de passe.
        response = self.client.get('/api/auth/profile?role=formateur')

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['nom'], 'Julien Marchand')
        self.assertNotIn('motDePasse', payload)

    def test_cors_preflight_is_accepted(self):
        # Vérifie que le navigateur peut faire un préflight CORS.
        response = self.client.options(
            '/api/auth/login',
            HTTP_ORIGIN='http://localhost:5173',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(response['Access-Control-Allow-Origin'], 'http://localhost:5173')
