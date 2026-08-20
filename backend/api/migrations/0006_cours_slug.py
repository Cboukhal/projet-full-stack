"""Ajoute le champ slug des cours et le remplit pour les lignes déjà existantes."""

from django.db import migrations, models
from django.utils.text import slugify


def populate_course_slugs(apps, schema_editor):
    """Construit une URL unique pour chaque cours déjà présent en base."""
    Cours = apps.get_model('api', 'Cours')
    max_length = 180
    used_slugs = set()

    for cours in Cours.objects.order_by('id'):
        base = slugify(cours.nom) or 'cours'
        if base == 'nouveau' or base.isdigit():
            base = f'cours-{base}'
        base = base[:max_length].strip('-') or 'cours'

        candidate = base
        suffix = 2
        while candidate in used_slugs:
            suffix_text = f'-{suffix}'
            candidate = f'{base[:max_length - len(suffix_text)]}{suffix_text}'
            suffix += 1

        cours.slug = candidate
        cours.save(update_fields=['slug'])
        used_slugs.add(candidate)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_passwordresettoken'),
    ]

    operations = [
        migrations.AddField(
            model_name='cours',
            name='slug',
            # L'index unique est créé seulement à l'étape AlterField ci-dessous.
            field=models.SlugField(blank=True, db_index=False, max_length=180, null=True),
        ),
        migrations.RunPython(populate_course_slugs, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='cours',
            name='slug',
            field=models.SlugField(editable=False, max_length=180, unique=True),
        ),
    ]
