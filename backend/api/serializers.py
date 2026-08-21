"""Sérialiseurs DRF utilisés par les points d’entrée d’authentification."""

from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    """Valide les deux champs attendus par React et génère le formulaire DRF."""

    identifiant = serializers.CharField(
        label='Identifiant',
        trim_whitespace=True,
    )
    motDePasse = serializers.CharField(
        label='Mot de passe',
        write_only=True,
        trim_whitespace=False,
        # Le navigateur masque la valeur dans l'interface navigable DRF.
        style={'input_type': 'password'},
    )
