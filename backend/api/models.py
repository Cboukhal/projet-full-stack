from django.db import models


class DemoUser(models.Model):
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

    def __str__(self):
        return f"{self.nom} ({self.role})"