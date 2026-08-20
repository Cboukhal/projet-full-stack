"""Vues d’authentification : connexion, profil, mot de passe oublié."""

import hashlib
import json
import logging
import secrets
from collections.abc import Mapping
from datetime import timedelta
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.password_validation import password_changed, validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework import status
from rest_framework.exceptions import ParseError
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .auth import make_token, require_token_auth
from .http import parse_json_body
from .models import DemoUser, PasswordResetToken
from .serializers import LoginSerializer


# Cette réponse identique pour une adresse connue ou inconnue empêche de
# découvrir quels comptes existent dans l'application.
FORGOT_PASSWORD_RESPONSE = {
    'detail': (
        'Si un compte correspond à cette adresse, un e-mail de '
        'réinitialisation a été envoyé.'
    ),
}
INVALID_RESET_TOKEN_RESPONSE = {
    'detail': 'Ce lien de réinitialisation est invalide ou a expiré.',
}
logger = logging.getLogger(__name__)


def _public_user(user):
    # On enlève le mot de passe avant de renvoyer l'utilisateur au frontend.
    return {
        'identifiant': user.identifiant,
        'role': user.role,
        'nom': user.nom,
        'email': user.email,
        'telephone': user.telephone,
        'specialite': user.specialite,
    }


def _find_user_by_credentials(identifiant, mot_de_passe):
    # Recherche simple dans les données de démonstration.
    user = DemoUser.objects.filter(identifiant=identifiant).first()
    if user and check_password(mot_de_passe, user.mot_de_passe):
        return user
    return None


def _hash_reset_token(raw_token):
    # Un condensat à taille fixe suffit pour la recherche en base sans exposer
    # le secret brut si la base de données devait être consultée.
    return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()


def _create_password_reset_token(user, requested_email):
    with transaction.atomic():
        # Verrouiller aussi l'utilisateur sérialise deux demandes concurrentes :
        # la seconde invalidera toujours le jeton créé par la première.
        locked_user = DemoUser.objects.select_for_update().get(pk=user.pk)
        # L'adresse a pu être modifiée entre la recherche initiale et le verrou.
        # Dans ce cas, aucun lien ne doit partir vers l'ancienne adresse.
        if locked_user.email.casefold() != requested_email.casefold():
            return None

        # token_urlsafe s'appuie sur le générateur cryptographique du système.
        # 32 octets fournissent une entropie suffisante pour un lien à usage unique.
        raw_token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(
            seconds=settings.PASSWORD_RESET_TOKEN_TTL_SECONDS,
        )
        # Une nouvelle demande remplace les liens précédents de ce compte.
        PasswordResetToken.objects.filter(
            user=locked_user,
            used_at__isnull=True,
        ).update(used_at=timezone.now())
        PasswordResetToken.objects.create(
            user=locked_user,
            token_hash=_hash_reset_token(raw_token),
            expires_at=expires_at,
        )

    return raw_token, locked_user


def _send_password_reset_email(user, raw_token):
    # urlencode protège le jeton lorsqu'il est placé dans la chaîne de requête.
    query = urlencode({'token': raw_token})
    reset_url = (
        f"{settings.FRONTEND_URL.rstrip('/')}"
        f"/reinitialiser-mot-de-passe?{query}"
    )
    message = (
        f"Bonjour {user.nom},\n\n"
        "Une demande de réinitialisation de votre mot de passe a été reçue.\n"
        f"Utilisez ce lien avant son expiration :\n{reset_url}\n\n"
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail."
    )
    send_mail(
        subject='Réinitialisation de votre mot de passe FormaNova',
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )


class LoginAPIView(GenericAPIView):
    """Connexion JSON pour React avec formulaire dans l'interface navigable DRF."""

    serializer_class = LoginSerializer
    # La route de connexion est publique et n'utilise pas l'authentification
    # SessionAuthentication de DRF : l'application conserve son token DemoUser.
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            payload = request.data
        except ParseError:
            # Conserve le message historique de l'API pour un JSON illisible.
            return Response(
                {'detail': 'Requête invalide.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Un objet JSON ou un formulaire possède des paires champ/valeur ; une
        # liste ou une valeur scalaire ne représente pas des identifiants.
        if not isinstance(payload, Mapping):
            return Response(
                {'detail': 'Requête invalide.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=payload)
        if not serializer.is_valid():
            # Conserve le contrat d'erreur attendu par le frontend existant.
            return Response(
                {'detail': 'Identifiant et mot de passe requis.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        identifiant = serializer.validated_data['identifiant']
        mot_de_passe = serializer.validated_data['motDePasse']
        user = _find_user_by_credentials(identifiant, mot_de_passe)
        if not user:
            return Response(
                {'detail': 'Identifiant ou mot de passe incorrect.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Chaque connexion renouvelle le token et invalide sa valeur précédente.
        user.token = make_token()
        user.save(update_fields=['token'])

        return Response({'token': user.token, 'user': _public_user(user)})


@csrf_exempt
@require_http_methods(['POST'])
def forgot_password_view(request):
    # Le client fournit seulement l'adresse e-mail associée au compte.
    payload, error_response = parse_json_body(request)
    if error_response:
        return error_response

    email = payload.get('email', '')
    if not isinstance(email, str) or not email.strip():
        return JsonResponse({'detail': "L'adresse e-mail est requise."}, status=400)
    email = email.strip()

    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({'detail': "L'adresse e-mail n'est pas valide."}, status=400)

    # La recherche insensible à la casse accepte, par exemple, Nom@Domaine.fr.
    # Deux comptes partageant la même adresse seraient ambigus : par sécurité,
    # aucun n'est sélectionné et la réponse publique reste strictement identique.
    matching_users = list(
        DemoUser.objects.filter(email__iexact=email).order_by('pk')[:2],
    )
    user = matching_users[0] if len(matching_users) == 1 else None
    if user:
        created_token = _create_password_reset_token(user, email)
        if created_token:
            raw_token, locked_user = created_token
            try:
                _send_password_reset_email(locked_user, raw_token)
            except Exception:  # noqa: BLE001 - frontière volontaire avec le backend SMTP
                # Une panne SMTP ne doit pas permettre de déduire que le compte existe.
                # Le lien non envoyé est immédiatement rendu inutilisable.
                PasswordResetToken.objects.filter(
                    token_hash=_hash_reset_token(raw_token),
                    used_at__isnull=True,
                ).update(used_at=timezone.now())
                logger.exception(
                    "Échec de l'envoi d'un e-mail de réinitialisation pour l'utilisateur %s.",
                    locked_user.pk,
                )

    # La réponse ne révèle jamais si l'adresse appartient à un compte.
    return JsonResponse(FORGOT_PASSWORD_RESPONSE)


@csrf_exempt
@require_http_methods(['POST'])
def reset_password_view(request):
    payload, error_response = parse_json_body(request)
    if error_response:
        return error_response

    raw_token = payload.get('token', '')
    new_password = payload.get('newPassword', '')
    confirm_password = payload.get('confirmPassword', '')

    # Les contrôles de type évitent qu'une liste ou une valeur null provoque
    # une erreur serveur pendant le hachage ou la validation.
    if not all(isinstance(value, str) for value in (raw_token, new_password, confirm_password)):
        return JsonResponse({'detail': 'Tous les champs sont requis.'}, status=400)
    if not raw_token.strip() or not new_password or not confirm_password:
        return JsonResponse({'detail': 'Tous les champs sont requis.'}, status=400)
    if new_password != confirm_password:
        return JsonResponse({'detail': 'Les mots de passe ne correspondent pas.'}, status=400)

    token_hash = _hash_reset_token(raw_token.strip())

    # Le verrou de ligne garantit qu'un même jeton ne peut pas être consommé
    # simultanément par deux requêtes concurrentes.
    with transaction.atomic():
        reset_token = (
            PasswordResetToken.objects.select_for_update()
            .select_related('user')
            .filter(token_hash=token_hash)
            .first()
        )
        now = timezone.now()
        if (
            reset_token is None
            or reset_token.used_at is not None
            or reset_token.expires_at <= now
        ):
            return JsonResponse(INVALID_RESET_TOKEN_RESPONSE, status=400)

        user = reset_token.user
        try:
            # Réutilise les quatre validateurs configurés dans settings.py.
            validate_password(new_password, user=user)
        except ValidationError as error:
            return JsonResponse(
                {
                    'detail': 'Le mot de passe ne respecte pas les règles de sécurité.',
                    'errors': error.messages,
                },
                status=400,
            )

        # Le mot de passe et l'invalidation de tous les accès sont enregistrés
        # ensemble : aucune mise à jour partielle n'est possible.
        user.mot_de_passe = make_password(new_password)
        user.token = None
        user.save(update_fields=['mot_de_passe', 'token'])
        # Informe les validateurs Django qu'un changement effectif a eu lieu.
        password_changed(new_password, user=user)
        PasswordResetToken.objects.filter(
            user=user,
            used_at__isnull=True,
        ).update(used_at=now)

    return JsonResponse({'detail': 'Votre mot de passe a été réinitialisé.'})


@csrf_exempt
@require_http_methods(['GET', 'PATCH'])
@require_token_auth
def profile_view(request):
    # GET : renvoie les infos de l'utilisateur authentifié par son token.
    if request.method == 'GET':
        return JsonResponse(_public_user(request.demo_user))

    # PATCH : met à jour la fiche de l'utilisateur authentifié (jamais celle d'un autre).
    try:
        payload = json.loads(request.body.decode('utf-8') or '{}')
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({'detail': 'Requête invalide.'}, status=400)

    if not isinstance(payload, dict):
        return JsonResponse({'detail': 'Requête invalide.'}, status=400)

    user = request.demo_user
    # Seuls ces champs sont modifiables ; identifiant, rôle et mot de passe ne passent pas par ici.
    nom = payload.get('nom', user.nom).strip()
    email = payload.get('email', user.email).strip()
    telephone = payload.get('telephone', user.telephone).strip()
    specialite = payload.get('specialite', user.specialite).strip()

    if not nom or not email:
        return JsonResponse({'detail': 'Le nom et l\'email sont requis.'}, status=400)

    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({'detail': "L'adresse e-mail n'est pas valide."}, status=400)
    if DemoUser.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
        return JsonResponse({'detail': "Cette adresse e-mail est déjà utilisée."}, status=400)

    with transaction.atomic():
        # Le verrou coordonne la modification avec une éventuelle demande de
        # réinitialisation lancée au même instant.
        user = DemoUser.objects.select_for_update().get(pk=user.pk)
        email_changed = user.email.casefold() != email.casefold()
        user.nom = nom
        user.email = email
        user.telephone = telephone
        user.specialite = specialite
        user.save(update_fields=['nom', 'email', 'telephone', 'specialite'])
        if email_changed:
            # Un lien envoyé à l'ancienne adresse ne doit plus donner accès au compte.
            PasswordResetToken.objects.filter(
                user=user,
                used_at__isnull=True,
            ).update(used_at=timezone.now())

    return JsonResponse(_public_user(user))


@csrf_exempt
@require_http_methods(['POST'])
@require_token_auth
def logout_view(request):
    # Invalide le token côté serveur pour que d'anciennes copies ne fonctionnent plus.
    request.demo_user.token = None
    request.demo_user.save(update_fields=['token'])
    return JsonResponse({'detail': 'Déconnecté.'})
