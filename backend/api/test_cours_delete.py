from django.test import Client, TestCase

from .models import (
    Cours,
    CoursPlanifie,
    Cursus,
    CursusCours,
    DemoUser,
    Filiere,
    InscriptionCours,
    Promotion,
)


class CoursDeleteApiTests(TestCase):
    """Vérifie que seuls les cours sans dépendance peuvent être supprimés."""

    # Une seule référente authentifiée sert de compte pour tous les tests de ce fichier.
    def setUp(self):
        self.client = Client()
        self.referente = DemoUser.objects.create(
            identifiant='referente.delete.cours',
            mot_de_passe='unused',
            role=DemoUser.ROLE_REFERENTE,
            nom='Référente suppression cours',
            email='referente-delete-cours@formanova.test',
            token='token-referente-delete-cours',
        )
        self.auth = {
            'HTTP_AUTHORIZATION': f'Bearer {self.referente.token}',
        }

    # Un cours qui n'appartient à aucun cursus doit pouvoir être supprimé sans contrainte.
    def test_delete_unlinked_course(self):
        cours = Cours.objects.create(nom='Cours sans cursus')

        response = self.client.delete(f'/api/cours/{cours.id}', **self.auth)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'detail': 'Cours supprimé.'})
        self.assertFalse(Cours.objects.filter(id=cours.id).exists())

    # Sans jeton d'authentification, la suppression doit être refusée et le cours conservé.
    def test_delete_requires_authentication(self):
        cours = Cours.objects.create(nom='Cours protégé')

        response = self.client.delete(f'/api/cours/{cours.id}')

        self.assertEqual(response.status_code, 401)
        self.assertTrue(Cours.objects.filter(id=cours.id).exists())

    # Un élève authentifié n'a pas le droit de supprimer un cours ; seule la référente le peut.
    def test_delete_requires_referente_role(self):
        cours = Cours.objects.create(nom='Cours réservé')
        eleve = DemoUser.objects.create(
            identifiant='eleve.delete.cours',
            mot_de_passe='unused',
            role=DemoUser.ROLE_ELEVE,
            nom='Élève suppression cours',
            email='eleve-delete-cours@formanova.test',
            token='token-eleve-delete-cours',
        )

        response = self.client.delete(
            f'/api/cours/{cours.id}',
            HTTP_AUTHORIZATION=f'Bearer {eleve.token}',
        )

        self.assertEqual(response.status_code, 403)
        self.assertTrue(Cours.objects.filter(id=cours.id).exists())

    # Un identifiant inexistant doit renvoyer 404 avec un message explicite.
    def test_delete_unknown_course_returns_not_found(self):
        response = self.client.delete('/api/cours/999999', **self.auth)

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {'detail': 'Cours introuvable.'})

    # Un cours rattaché à un cursus (via CursusCours) ne doit jamais être supprimable directement.
    def test_delete_is_blocked_when_course_belongs_to_cursus(self):
        cours = Cours.objects.create(nom='Cours rattaché')
        filiere = Filiere.objects.create(nom='Filière suppression cours')
        cursus = Cursus.objects.create(filiere=filiere, nom='Cursus rattaché')
        lien = CursusCours.objects.create(cursus=cursus, cours=cours, position=1)

        response = self.client.delete(f'/api/cours/{cours.id}', **self.auth)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                'detail': (
                    'Impossible de supprimer un cours associé à un cursus '
                    'ou à une offre planifiée.'
                ),
            },
        )
        self.assertTrue(Cours.objects.filter(id=cours.id).exists())
        self.assertTrue(CursusCours.objects.filter(id=lien.id).exists())

    # Le refus de suppression ne doit rien casser : planning et inscriptions existants restent intacts.
    def test_blocked_delete_preserves_planning_and_student_registration(self):
        cours = Cours.objects.create(nom='Cours planifié')
        filiere = Filiere.objects.create(nom='Filière cours planifié')
        cursus = Cursus.objects.create(filiere=filiere, nom='Cursus cours planifié')
        lien = CursusCours.objects.create(cursus=cursus, cours=cours, position=1)
        promotion = Promotion.objects.create(cursus=cursus, nom='Promotion cours planifié')
        cours_planifie = CoursPlanifie.objects.create(
            promotion=promotion,
            cursus_cours=lien,
        )
        eleve = DemoUser.objects.create(
            identifiant='eleve.inscrit.cours',
            mot_de_passe='unused',
            role=DemoUser.ROLE_ELEVE,
            nom='Élève inscrit au cours',
            email='eleve-inscrit-cours@formanova.test',
        )
        inscription = InscriptionCours.objects.create(
            eleve=eleve,
            cours_planifie=cours_planifie,
        )

        response = self.client.delete(f'/api/cours/{cours.id}', **self.auth)

        self.assertEqual(response.status_code, 400)
        self.assertTrue(Cours.objects.filter(id=cours.id).exists())
        self.assertTrue(CoursPlanifie.objects.filter(id=cours_planifie.id).exists())
        self.assertTrue(InscriptionCours.objects.filter(id=inscription.id).exists())
