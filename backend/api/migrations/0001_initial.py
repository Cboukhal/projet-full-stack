from django.contrib.auth.hashers import make_password
from django.db import migrations, models

from api.data import USERS


def seed_demo_users(apps, schema_editor):
    DemoUser = apps.get_model("api", "DemoUser")
    for user in USERS:
        DemoUser.objects.update_or_create(
            identifiant=user["identifiant"],
            defaults={
                "mot_de_passe": make_password(user["motDePasse"]),
                "role": user["role"],
                "nom": user["nom"],
                "email": user["email"],
                "telephone": user.get("telephone", ""),
                "specialite": user.get("specialite", ""),
            },
        )


def unseed_demo_users(apps, schema_editor):
    DemoUser = apps.get_model("api", "DemoUser")
    DemoUser.objects.all().delete()


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="DemoUser",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("identifiant", models.CharField(max_length=150, unique=True)),
                ("mot_de_passe", models.CharField(max_length=255)),
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("eleve", "Élève"),
                            ("formateur", "Formateur"),
                            ("referente", "Référente"),
                            ("administrateur", "Administrateur"),
                        ],
                        max_length=30,
                    ),
                ),
                ("nom", models.CharField(max_length=150)),
                ("email", models.EmailField(max_length=254)),
                ("telephone", models.CharField(blank=True, max_length=30)),
                ("specialite", models.CharField(blank=True, max_length=150)),
            ],
        ),
        migrations.RunPython(seed_demo_users, unseed_demo_users),
    ]