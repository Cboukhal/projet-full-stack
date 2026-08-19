"""Tests Django du parcours « Mot de passe oublié ».

Le backend e-mail en mémoire permet d'inspecter le message sans dépendre de
MailHog. Chaque test s'exécute dans une transaction isolée par Django.
"""

import hashlib
import json
from datetime import timedelta
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from django.contrib.auth.hashers import check_password, make_password
from django.core import mail
from django.test import Client, TestCase, override_settings
from django.utils import timezone

from .models import DemoUser, PasswordResetToken


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    FRONTEND_URL='http://frontend.test',
    PASSWORD_RESET_TOKEN_TTL_SECONDS=3600,
)
class PasswordResetApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.initial_password = 'MotDePasse-Initial-2026!'
        # Le fichier crée son propre compte et ne dépend donc pas des données seedées.
        self.user = DemoUser.objects.create(
            identifiant='compte.reset',
            mot_de_passe=make_password(self.initial_password),
            role=DemoUser.ROLE_ELEVE,
            nom='Compte Réinitialisation',
            email='compte.reset@example.com',
        )
        # Chaque test inspecte uniquement les e-mails qu'il déclenche lui-même.
        mail.outbox.clear()

    def _forgot(self, email=None):
        body = {'email': self.user.email if email is None else email}
        return self.client.post(
            '/api/auth/forgot-password',
            data=json.dumps(body),
            content_type='application/json',
        )

    def _raw_token_from_email(self):
        # Le lien occupe sa propre ligne dans le message texte.
        reset_url = next(
            line for line in mail.outbox[-1].body.splitlines()
            if line.startswith('http://frontend.test/')
        )
        return parse_qs(urlparse(reset_url).query)['token'][0]

    def _request_raw_token(self, email=None):
        response = self._forgot(email)
        self.assertEqual(response.status_code, 200)
        return self._raw_token_from_email()

    def _reset(self, raw_token, password='Nouveau-MotDePasse-2026!'):
        return self.client.post(
            '/api/auth/reset-password',
            data=json.dumps({
                'token': raw_token,
                'newPassword': password,
                'confirmPassword': password,
            }),
            content_type='application/json',
        )

    def test_forgot_password_creates_hashed_one_hour_token_and_sends_email(self):
        before = timezone.now()
        response = self._forgot(self.user.email.upper())
        after = timezone.now()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.user.email])

        raw_token = self._raw_token_from_email()
        stored_token = PasswordResetToken.objects.get(user=self.user)
        expected_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
        # Le secret reçu par le navigateur n'apparaît jamais en clair en base.
        self.assertEqual(stored_token.token_hash, expected_hash)
        self.assertNotEqual(stored_token.token_hash, raw_token)
        self.assertIsNone(stored_token.used_at)
        self.assertGreaterEqual(stored_token.expires_at, before + timedelta(hours=1))
        self.assertLessEqual(stored_token.expires_at, after + timedelta(hours=1))
        self.assertIn(
            'http://frontend.test/reinitialiser-mot-de-passe?token=',
            mail.outbox[0].body,
        )

    def test_forgot_password_response_does_not_reveal_unknown_email(self):
        unknown_response = self._forgot('inconnu@example.com')
        self.assertEqual(unknown_response.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(PasswordResetToken.objects.count(), 0)

        known_response = self._forgot(self.user.email)
        self.assertEqual(known_response.status_code, 200)
        self.assertEqual(known_response.json(), unknown_response.json())

    def test_forgot_password_rejects_missing_invalid_or_malformed_email(self):
        missing = self.client.post(
            '/api/auth/forgot-password',
            data='{}',
            content_type='application/json',
        )
        invalid = self._forgot('adresse-invalide')
        malformed = self.client.post(
            '/api/auth/forgot-password',
            data='{',
            content_type='application/json',
        )

        self.assertEqual(missing.status_code, 400)
        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(malformed.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)

    @patch('api.views.send_mail', side_effect=OSError('SMTP indisponible'))
    def test_forgot_password_keeps_generic_response_when_email_fails(self, _send_mail):
        with self.assertLogs('api.views', level='ERROR'):
            response = self._forgot(self.user.email)

        self.assertEqual(response.status_code, 200)
        stored_token = PasswordResetToken.objects.get(user=self.user)
        self.assertIsNotNone(stored_token.used_at)

    def test_forgot_password_does_not_choose_between_duplicate_emails(self):
        DemoUser.objects.create(
            identifiant='autre.compte',
            mot_de_passe=self.user.mot_de_passe,
            role=DemoUser.ROLE_ELEVE,
            nom='Autre compte',
            email=self.user.email.upper(),
        )

        response = self._forgot(self.user.email)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(PasswordResetToken.objects.count(), 0)

    def test_new_request_invalidates_previous_reset_link(self):
        first_raw_token = self._request_raw_token()
        first_record = PasswordResetToken.objects.get(
            token_hash=hashlib.sha256(first_raw_token.encode('utf-8')).hexdigest(),
        )

        second_raw_token = self._request_raw_token()
        first_record.refresh_from_db()

        self.assertIsNotNone(first_record.used_at)
        self.assertEqual(self._reset(first_raw_token).status_code, 400)
        self.assertEqual(self._reset(second_raw_token).status_code, 200)

    def test_reset_password_hashes_password_and_invalidates_all_access(self):
        # Une session ouverte avant le changement doit cesser de fonctionner.
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'identifiant': self.user.identifiant,
                'motDePasse': self.initial_password,
            }),
            content_type='application/json',
        )
        session_token = login_response.json()['token']
        raw_token = self._request_raw_token()

        # Simule un second lien actif : le succès doit aussi l'invalider.
        PasswordResetToken.objects.create(
            user=self.user,
            token_hash=hashlib.sha256(b'autre-lien').hexdigest(),
            expires_at=timezone.now() + timedelta(hours=1),
        )
        response = self._reset(raw_token)

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(check_password('Nouveau-MotDePasse-2026!', self.user.mot_de_passe))
        self.assertIsNone(self.user.token)
        self.assertFalse(
            PasswordResetToken.objects.filter(user=self.user, used_at__isnull=True).exists(),
        )

        old_session = self.client.get(
            '/api/auth/profile',
            HTTP_AUTHORIZATION=f'Bearer {session_token}',
        )
        old_login = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'identifiant': self.user.identifiant,
                'motDePasse': self.initial_password,
            }),
            content_type='application/json',
        )
        new_login = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'identifiant': self.user.identifiant,
                'motDePasse': 'Nouveau-MotDePasse-2026!',
            }),
            content_type='application/json',
        )
        self.assertEqual(old_session.status_code, 401)
        self.assertEqual(old_login.status_code, 401)
        self.assertEqual(new_login.status_code, 200)

    def test_reset_password_token_cannot_be_reused(self):
        raw_token = self._request_raw_token()
        self.assertEqual(self._reset(raw_token).status_code, 200)
        self.assertEqual(self._reset(raw_token).status_code, 400)

    def test_profile_email_change_invalidates_pending_reset_link(self):
        raw_token = self._request_raw_token()
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'identifiant': self.user.identifiant,
                'motDePasse': self.initial_password,
            }),
            content_type='application/json',
        )
        profile_response = self.client.patch(
            '/api/auth/profile',
            data=json.dumps({'email': 'nouvelle.adresse@example.com'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f"Bearer {login_response.json()['token']}",
        )

        self.assertEqual(profile_response.status_code, 200)
        self.assertEqual(self._reset(raw_token).status_code, 400)
        self.assertIsNotNone(PasswordResetToken.objects.get(user=self.user).used_at)

    def test_reset_password_rejects_mismatched_passwords_without_using_token(self):
        raw_token = self._request_raw_token()
        response = self.client.post(
            '/api/auth/reset-password',
            data=json.dumps({
                'token': raw_token,
                'newPassword': 'Nouveau-MotDePasse-2026!',
                'confirmPassword': 'MotDePasse-Different-2026!',
            }),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
        stored_token = PasswordResetToken.objects.get(user=self.user)
        self.assertIsNone(stored_token.used_at)
        self.user.refresh_from_db()
        self.assertTrue(check_password(self.initial_password, self.user.mot_de_passe))

    def test_reset_password_applies_django_password_validators(self):
        raw_token = self._request_raw_token()
        response = self._reset(raw_token, password='12345678')

        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.json())
        self.assertIsNone(PasswordResetToken.objects.get(user=self.user).used_at)

    def test_reset_password_rejects_password_similar_to_demo_user(self):
        raw_token = self._request_raw_token()
        response = self._reset(raw_token, password=self.user.identifiant)

        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.json())
        self.assertIsNone(PasswordResetToken.objects.get(user=self.user).used_at)

    def test_reset_password_rejects_unknown_expired_and_used_tokens(self):
        expired_raw = 'jeton-expire'
        used_raw = 'jeton-utilise'
        PasswordResetToken.objects.create(
            user=self.user,
            token_hash=hashlib.sha256(expired_raw.encode('utf-8')).hexdigest(),
            expires_at=timezone.now() - timedelta(seconds=1),
        )
        PasswordResetToken.objects.create(
            user=self.user,
            token_hash=hashlib.sha256(used_raw.encode('utf-8')).hexdigest(),
            expires_at=timezone.now() + timedelta(hours=1),
            used_at=timezone.now(),
        )

        unknown_response = self._reset('jeton-inconnu')
        expired_response = self._reset(expired_raw)
        used_response = self._reset(used_raw)

        self.assertEqual(unknown_response.status_code, 400)
        self.assertEqual(expired_response.status_code, 400)
        self.assertEqual(used_response.status_code, 400)
        self.assertEqual(unknown_response.json(), expired_response.json())
        self.assertEqual(unknown_response.json(), used_response.json())

    def test_reset_password_rejects_missing_non_string_and_malformed_fields(self):
        missing = self.client.post(
            '/api/auth/reset-password',
            data='{}',
            content_type='application/json',
        )
        invalid_type = self.client.post(
            '/api/auth/reset-password',
            data=json.dumps({
                'token': [],
                'newPassword': 'Nouveau-MotDePasse-2026!',
                'confirmPassword': 'Nouveau-MotDePasse-2026!',
            }),
            content_type='application/json',
        )
        malformed = self.client.post(
            '/api/auth/reset-password',
            data='{',
            content_type='application/json',
        )

        self.assertEqual(missing.status_code, 400)
        self.assertEqual(invalid_type.status_code, 400)
        self.assertEqual(malformed.status_code, 400)
