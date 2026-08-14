from django.db import models


# Utilisateur de démonstration : une seule table simplifiée qui remplace
# le modèle User de Django pour ce projet (pas d'inscription, données pré-remplies).
class DemoUser(models.Model):
    # Les quatre profils possibles côté frontend.
    ROLE_ELEVE = "eleve"
    ROLE_FORMATEUR = "formateur"
    ROLE_REFERENTE = "referente"
    ROLE_ADMIN = "administrateur"

    ROLE_CHOICES = [
        (ROLE_ELEVE, "Élève"),
        (ROLE_FORMATEUR, "Formateur"),
        (ROLE_REFERENTE, "Référente"),
        (ROLE_ADMIN, "Administrateur"),
    ]

    identifiant = models.CharField(max_length=150, unique=True)
    mot_de_passe = models.CharField(max_length=255)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    nom = models.CharField(max_length=150)
    email = models.EmailField()
    telephone = models.CharField(max_length=30, blank=True)
    specialite = models.CharField(max_length=150, blank=True)
    # Token de session courant, généré à la connexion et effacé à la déconnexion.
    # Vide (null) quand l'utilisateur n'est pas connecté.
    token = models.CharField(max_length=64, unique=True, null=True, blank=True)

    def __str__(self):
        return f"{self.nom} ({self.role})"