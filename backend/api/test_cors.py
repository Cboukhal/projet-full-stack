"""Tests du middleware CORS utilisé entre React et Django."""

from django.test import Client, SimpleTestCase, override_settings


DEV_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
]


@override_settings(CORS_ALLOWED_ORIGINS=DEV_ORIGINS)
class CORSMiddlewareTests(SimpleTestCase):
    def setUp(self):
        self.client = Client()

    def _preflight(self, origin):
        # Authorization déclenche ce préflight avant l'appel de /profile.
        return self.client.options(
            '/api/auth/profile',
            HTTP_ORIGIN=origin,
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='GET',
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS='authorization',
        )

    def test_development_origins_are_allowed(self):
        for origin in DEV_ORIGINS:
            with self.subTest(origin=origin):
                response = self._preflight(origin)

                self.assertEqual(response.status_code, 204)
                self.assertEqual(response['Access-Control-Allow-Origin'], origin)
                self.assertEqual(response['Access-Control-Allow-Credentials'], 'true')
                self.assertIn('Authorization', response['Access-Control-Allow-Headers'])
                self.assertIn('Origin', response['Vary'])

    def test_cors_headers_are_kept_on_an_api_error(self):
        # Même un 401 doit rester lisible par React au lieu d'être masqué par CORS.
        response = self.client.get(
            '/api/auth/profile',
            HTTP_ORIGIN='http://localhost:5174',
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response['Access-Control-Allow-Origin'],
            'http://localhost:5174',
        )

    def test_unknown_origin_is_not_allowed(self):
        response = self._preflight('http://site-non-autorise.test')

        self.assertEqual(response.status_code, 405)
        self.assertNotIn('Access-Control-Allow-Origin', response)
