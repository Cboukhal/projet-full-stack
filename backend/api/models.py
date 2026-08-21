from django.db import models
from django.utils.text import slugify


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


class PasswordResetToken(models.Model):
    # Le jeton reçu par e-mail n'est jamais enregistré en clair : seul son
    # condensat SHA-256 permet de retrouver la demande lors de la validation.
    user = models.ForeignKey(
        DemoUser,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
    )
    token_hash = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    # Une date, plutôt qu'un simple booléen, conserve l'instant d'utilisation
    # tout en permettant de distinguer un jeton encore actif (valeur null).
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Réinitialisation de {self.user.identifiant}"


# Salle physique identifiée par sa localisation (bâtiment, étage, numéro), gérée
# indépendamment des cours pour permettre un référentiel de salles réutilisable.
class Salle(models.Model):
    # Les bâtiments sont désignés par une lettre (A, B, C...), pas par un numéro.
    numero_batiment = models.CharField(max_length=10)
    numero_etage = models.PositiveIntegerField()
    numero_salle = models.PositiveIntegerField()

    class Meta:
        # Deux salles ne peuvent pas partager le même numéro sur le même étage et bâtiment.
        unique_together = [("numero_batiment", "numero_etage", "numero_salle")]
        ordering = ["numero_batiment", "numero_etage", "numero_salle"]

    def __str__(self):
        return f"Bât. {self.numero_batiment} — Étage {self.numero_etage} — Salle {self.numero_salle}"


# Regroupement de haut niveau des cursus (ex. "Développement", "Data").
class Filiere(models.Model):
    nom = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    statut = models.CharField(max_length=30, default="Actif")

    def __str__(self):
        return self.nom


# Parcours pédagogique composé d'une suite ordonnée de cours (voir CursusCours).
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
    # Clé textuelle stable utilisée dans les URL publiques à la place de l'identifiant numérique.
    slug = models.SlugField(max_length=180, unique=True, editable=False)
    technologie = models.CharField(max_length=150, blank=True)
    # Texte libre ("2 sem.") plutôt qu'un nombre : c'est ce que le formulaire envoie.
    duree = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    objectifs = models.TextField(blank=True)
    statut = models.CharField(max_length=30, default="Actif")

    def _make_unique_slug(self):
        max_length = self._meta.get_field("slug").max_length
        base = slugify(self.nom) or "cours"

        # Ces valeurs ont un sens particulier dans les routes React.
        if base == "nouveau" or base.isdigit():
            base = f"cours-{base}"
        base = base[:max_length].strip("-") or "cours"

        candidate = base
        suffix = 2
        queryset = type(self).objects.exclude(pk=self.pk)
        while queryset.filter(slug=candidate).exists():
            suffix_text = f"-{suffix}"
            candidate = f"{base[:max_length - len(suffix_text)]}{suffix_text}"
            suffix += 1
        return candidate

    def save(self, *args, **kwargs):
        # Le slug est généré une seule fois : renommer un cours ne casse pas ses anciens liens.
        if not self.slug:
            self.slug = self._make_unique_slug()
        return super().save(*args, **kwargs)

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
    # Une occurrence planifiée peut provenir du planning d'une promotion ou
    # constituer une offre autonome à laquelle un élève s'inscrit à l'unité.
    # Le lien direct vers Cours donne une source commune aux deux modes.
    cours = models.ForeignKey(Cours, on_delete=models.PROTECT, related_name="planifications")
    promotion = models.ForeignKey(
        Promotion,
        on_delete=models.CASCADE,
        related_name="planning",
        null=True,
        blank=True,
    )
    cursus_cours = models.ForeignKey(
        CursusCours,
        on_delete=models.PROTECT,
        related_name="planifications",
        null=True,
        blank=True,
    )
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
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(promotion__isnull=False, cursus_cours__isnull=False)
                    | models.Q(promotion__isnull=True, cursus_cours__isnull=True)
                ),
                name="cours_planifie_source_coherente",
            ),
        ]

    def save(self, *args, **kwargs):
        # Pour un planning de promotion, le cours est toujours celui du lien
        # pédagogique. Cela empêche les deux clés étrangères de diverger.
        if self.cursus_cours_id:
            self.cours_id = self.cursus_cours.cours_id
            if kwargs.get("update_fields") is not None:
                kwargs["update_fields"] = set(kwargs["update_fields"]) | {"cours"}
        return super().save(*args, **kwargs)

    def __str__(self):
        contexte = self.promotion.nom if self.promotion else "Cours à l'unité"
        return f"{contexte} — {self.cours.nom}"


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
