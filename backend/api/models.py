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


class Filiere(models.Model):
    nom = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    statut = models.CharField(max_length=30, default="Actif")

    def __str__(self):
        return self.nom


class Cursus(models.Model):
    filiere = models.ForeignKey(Filiere, on_delete=models.PROTECT, related_name="cursus_set")
    nom = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    duree_mois = models.PositiveIntegerField(default=0)
    statut = models.CharField(max_length=30, default="Actif")
    # Sert à afficher "modifié il y a X jours" côté frontend sans champ dédié.
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nom


class Cours(models.Model):
    nom = models.CharField(max_length=150)
    technologie = models.CharField(max_length=150, blank=True)
    # Texte libre ("2 sem.") plutôt qu'un nombre : c'est ce que le formulaire envoie.
    duree = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    objectifs = models.TextField(blank=True)
    statut = models.CharField(max_length=30, default="Actif")

    def __str__(self):
        return self.nom


class CursusCours(models.Model):
    # Association cursus <-> cours avec un ordre pédagogique (une ligne = un cours du cursus).
    cursus = models.ForeignKey(Cursus, on_delete=models.CASCADE, related_name="cours_ordre")
    cours = models.ForeignKey(Cours, on_delete=models.PROTECT, related_name="cursus_associes")
    position = models.PositiveIntegerField()

    class Meta:
        ordering = ["position"]
        unique_together = [("cursus", "cours")]

    def __str__(self):
        return f"{self.cursus.nom} #{self.position} — {self.cours.nom}"


class Promotion(models.Model):
    # Un groupe d'élèves suivant un cursus donné à une période donnée.
    cursus = models.ForeignKey(Cursus, on_delete=models.PROTECT, related_name="promotions")
    nom = models.CharField(max_length=150)
    date_debut = models.DateField(null=True, blank=True)
    # Calculée côté API à partir de date_debut + durée du cursus, jamais saisie à la main.
    date_fin_estimee = models.DateField(null=True, blank=True)
    effectif_max = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.nom


class CoursPlanifie(models.Model):
    # Une occurrence planifiée d'un cours du cursus, au sein d'une promotion donnée.
    promotion = models.ForeignKey(Promotion, on_delete=models.CASCADE, related_name="planning")
    cursus_cours = models.ForeignKey(CursusCours, on_delete=models.PROTECT, related_name="planifications")
    formateur = models.ForeignKey(
        DemoUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cours_planifies",
        limit_choices_to={"role": DemoUser.ROLE_FORMATEUR},
    )
    salle = models.CharField(max_length=150, blank=True)
    date_debut = models.DateTimeField(null=True, blank=True)
    date_fin = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [("promotion", "cursus_cours")]

    def __str__(self):
        return f"{self.promotion.nom} — {self.cursus_cours.cours.nom}"


class InscriptionPromotion(models.Model):
    # Inscription d'un élève à une promotion entière. unique_together empêche les doublons.
    STATUT_VALIDEE = "Validée"
    STATUT_FORCEE = "Forcée"
    STATUT_ANNULEE = "Annulée"

    eleve = models.ForeignKey(
        DemoUser,
        on_delete=models.CASCADE,
        related_name="inscriptions_promotion",
        limit_choices_to={"role": DemoUser.ROLE_ELEVE},
    )
    promotion = models.ForeignKey(Promotion, on_delete=models.CASCADE, related_name="inscriptions")
    date_inscription = models.DateField(auto_now_add=True)
    statut = models.CharField(max_length=30, default=STATUT_VALIDEE)

    class Meta:
        unique_together = [("eleve", "promotion")]


class InscriptionCours(models.Model):
    # Inscription d'un élève à un seul cours planifié ("à l'unité"), avec son propre contrôle
    # de prérequis (voir _prerequis_satisfaits dans academics_views.py).
    STATUT_VALIDEE = "Validée"
    STATUT_FORCEE = "Forcée"
    STATUT_ANNULEE = "Annulée"

    eleve = models.ForeignKey(
        DemoUser,
        on_delete=models.CASCADE,
        related_name="inscriptions_cours",
        limit_choices_to={"role": DemoUser.ROLE_ELEVE},
    )
    cours_planifie = models.ForeignKey(CoursPlanifie, on_delete=models.CASCADE, related_name="inscriptions")
    date_inscription = models.DateField(auto_now_add=True)
    statut = models.CharField(max_length=30, default=STATUT_VALIDEE)

    class Meta:
        unique_together = [("eleve", "cours_planifie")]