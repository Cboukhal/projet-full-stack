from datetime import date, datetime, timezone

from django.db import migrations


def seed_academics(apps, schema_editor):
    Filiere = apps.get_model('api', 'Filiere')
    Cursus = apps.get_model('api', 'Cursus')
    Cours = apps.get_model('api', 'Cours')
    CursusCours = apps.get_model('api', 'CursusCours')
    Promotion = apps.get_model('api', 'Promotion')
    CoursPlanifie = apps.get_model('api', 'CoursPlanifie')
    InscriptionPromotion = apps.get_model('api', 'InscriptionPromotion')
    DemoUser = apps.get_model('api', 'DemoUser')

    filiere = Filiere.objects.create(
        nom='Développement',
        description="Filière de formation aux métiers du développement d'applications.",
        statut='Actif',
    )

    cursus = Cursus.objects.create(
        filiere=filiere,
        nom="CDA — Concepteur Développeur d'Applications",
        description="Cursus complet de développement full-stack.",
        duree_mois=12,
        statut='Actif',
    )

    cours_data = [
        ('Algorithmique & initiation à la programmation', 'Python', '2 sem.'),
        ('SQL avancé', 'PostgreSQL', '1 sem.'),
        ('Gestion de projet', 'Agile/Scrum', '1 sem.'),
    ]
    liens = []
    for position, (nom, technologie, duree) in enumerate(cours_data, start=1):
        cours = Cours.objects.create(nom=nom, technologie=technologie, duree=duree, statut='Actif')
        liens.append(CursusCours.objects.create(cursus=cursus, cours=cours, position=position))

    promotion = Promotion.objects.create(
        cursus=cursus,
        nom='Promo 2026-A',
        date_debut=date(2026, 1, 12),
        date_fin_estimee=date(2026, 12, 15),
        effectif_max=24,
    )

    julien = DemoUser.objects.filter(identifiant='julien.marchand').first()
    CoursPlanifie.objects.create(
        promotion=promotion,
        cursus_cours=liens[0],
        formateur=julien,
        salle='Salle B204',
        date_debut=datetime(2026, 1, 12, 9, 0, tzinfo=timezone.utc),
        date_fin=datetime(2026, 1, 23, 17, 0, tzinfo=timezone.utc),
    )
    for lien in liens[1:]:
        CoursPlanifie.objects.create(promotion=promotion, cursus_cours=lien)

    camille = DemoUser.objects.filter(identifiant='camille.dubois').first()
    if camille:
        InscriptionPromotion.objects.create(eleve=camille, promotion=promotion)


def unseed_academics(apps, schema_editor):
    for model_name in ['InscriptionCours', 'InscriptionPromotion', 'CoursPlanifie', 'Promotion',
                        'CursusCours', 'Cours', 'Cursus', 'Filiere']:
        apps.get_model('api', model_name).objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_cours_cursus_filiere_cursuscours_cursus_filiere_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_academics, unseed_academics),
    ]
