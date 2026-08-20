"""Tests de suppression des filières, avec leurs contraintes de dépendance."""

from django.test import Client, TestCase

from .models import (
    Cours,
    CoursPlanifie,
    Cursus,
    CursusCours,
    DemoUser,
    Filiere,
    InscriptionCours,
    InscriptionPromotion,
    Promotion,
)


class FiliereDeleteApiTests(TestCase):
    """Contrat de suppression d'une filière depuis l'espace référente."""

    # Réutilise les comptes seedés (marie.petit, camille.dubois) plutôt que d'en recréer.
    def setUp(self):
        self.client = Client()
        self.referente = DemoUser.objects.get(identifiant='marie.petit')
        self.referente.token = 'token-referente-delete-tests'
        self.referente.save(update_fields=['token'])
        self.auth = {
            'HTTP_AUTHORIZATION': f'Bearer {self.referente.token}',
        }

    # Une filière sans aucun cursus ni élève rattaché doit pouvoir être supprimée.
    def test_delete_empty_filiere(self):
        filiere = Filiere.objects.create(nom='Filière vide')

        response = self.client.delete(f'/api/filieres/{filiere.id}', **self.auth)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'detail': 'Filière supprimée.'})
        self.assertFalse(Filiere.objects.filter(id=filiere.id).exists())

    # Sans jeton, la suppression est refusée et la filière reste en base.
    def test_delete_requires_authentication(self):
        filiere = Filiere.objects.create(nom='Filière protégée')

        response = self.client.delete(f'/api/filieres/{filiere.id}')

        self.assertEqual(response.status_code, 401)
        self.assertTrue(Filiere.objects.filter(id=filiere.id).exists())

    # Un élève ne doit pas pouvoir supprimer une filière, seule la référente le peut.
    def test_delete_requires_referente_role(self):
        filiere = Filiere.objects.create(nom='Filière réservée')
        eleve = DemoUser.objects.get(identifiant='camille.dubois')
        eleve.token = 'token-eleve-delete-tests'
        eleve.save(update_fields=['token'])

        response = self.client.delete(
            f'/api/filieres/{filiere.id}',
            HTTP_AUTHORIZATION=f'Bearer {eleve.token}',
        )

        self.assertEqual(response.status_code, 403)
        self.assertTrue(Filiere.objects.filter(id=filiere.id).exists())

    # La présence d'un seul cursus rattaché suffit à bloquer la suppression.
    def test_delete_is_blocked_when_a_cursus_is_attached(self):
        filiere = Filiere.objects.create(nom='Filière avec cursus')
        Cursus.objects.create(filiere=filiere, nom='Cursus rattaché')

        response = self.client.delete(f'/api/filieres/{filiere.id}', **self.auth)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['code'], 'filiere_non_vide')
        self.assertEqual(response.json()['nbCursus'], 1)
        self.assertEqual(response.json()['nbEleves'], 0)
        self.assertTrue(Filiere.objects.filter(id=filiere.id).exists())

    # Un élève lié via une inscription à une promotion du cursus doit être compté dans nbEleves.
    def test_delete_counts_student_linked_by_promotion(self):
        filiere = Filiere.objects.create(nom='Filière avec promotion')
        cursus = Cursus.objects.create(filiere=filiere, nom='Cursus promotion')
        promotion = Promotion.objects.create(cursus=cursus, nom='Promotion test')
        eleve = DemoUser.objects.get(identifiant='camille.dubois')
        InscriptionPromotion.objects.create(eleve=eleve, promotion=promotion)

        response = self.client.delete(f'/api/filieres/{filiere.id}', **self.auth)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['nbCursus'], 1)
        self.assertEqual(response.json()['nbEleves'], 1)
        self.assertTrue(Filiere.objects.filter(id=filiere.id).exists())

    # Un élève lié via une inscription à un cours planifié (et non à la promotion entière) compte aussi.
    def test_delete_counts_student_linked_by_planned_course(self):
        filiere = Filiere.objects.create(nom='Filière avec cours')
        cursus = Cursus.objects.create(filiere=filiere, nom='Cursus cours')
        cours = Cours.objects.create(nom='Cours test')
        lien = CursusCours.objects.create(cursus=cursus, cours=cours, position=1)
        promotion = Promotion.objects.create(cursus=cursus, nom='Promotion cours')
        cours_planifie = CoursPlanifie.objects.create(
            promotion=promotion,
            cursus_cours=lien,
        )
        eleve = DemoUser.objects.get(identifiant='camille.dubois')
        InscriptionCours.objects.create(eleve=eleve, cours_planifie=cours_planifie)

        response = self.client.delete(f'/api/filieres/{filiere.id}', **self.auth)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['nbCursus'], 1)
        self.assertEqual(response.json()['nbEleves'], 1)
        self.assertTrue(Filiere.objects.filter(id=filiere.id).exists())
