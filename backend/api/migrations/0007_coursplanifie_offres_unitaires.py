"""Ajoute le lien direct vers Cours sur CoursPlanifie pour permettre les offres à l'unité."""

from django.db import migrations, models
import django.db.models.deletion


def backfill_cours_planifie(apps, schema_editor):
    """Copie le cours du lien pédagogique avant de rendre la FK obligatoire."""
    CoursPlanifie = apps.get_model('api', 'CoursPlanifie')

    for offre in CoursPlanifie.objects.select_related('cursus_cours').iterator():
        offre.cours_id = offre.cursus_cours.cours_id
        offre.save(update_fields=['cours'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_cours_slug'),
    ]

    operations = [
        migrations.AddField(
            model_name='coursplanifie',
            name='cours',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='planifications',
                to='api.cours',
            ),
        ),
        migrations.RunPython(backfill_cours_planifie, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='coursplanifie',
            name='cours',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='planifications',
                to='api.cours',
            ),
        ),
        migrations.AlterField(
            model_name='coursplanifie',
            name='promotion',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='planning',
                to='api.promotion',
            ),
        ),
        migrations.AlterField(
            model_name='coursplanifie',
            name='cursus_cours',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='planifications',
                to='api.cursuscours',
            ),
        ),
        migrations.AddConstraint(
            model_name='coursplanifie',
            constraint=models.CheckConstraint(
                condition=(
                    models.Q(promotion__isnull=False, cursus_cours__isnull=False)
                    | models.Q(promotion__isnull=True, cursus_cours__isnull=True)
                ),
                name='cours_planifie_source_coherente',
            ),
        ),
    ]
