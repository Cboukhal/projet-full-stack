"""Table de routage HTTP de l’API FormaNova."""

from django.urls import path

from .academics_views import (
    cours_add_cursus_view,
    cours_detail_by_slug_view,
    cours_detail_view,
    cours_list_view,
    cours_offres_unitaires_view,
    cours_planifies_search_view,
    cursus_add_cours_view,
    cursus_cours_link_view,
    cursus_detail_view,
    cursus_list_view,
    eleves_search_view,
    filiere_detail_view,
    filieres_view,
    formateurs_search_view,
    inscriptions_view,
    mon_planning_detail_view,
    mon_planning_view,
    offre_cours_detail_view,
    offres_cours_view,
    promotion_detail_view,
    promotion_planning_view,
    promotions_list_view,
    salle_detail_view,
    salles_view,
)
from .views import (
    forgot_password_view,
    LoginAPIView,
    logout_view,
    profile_view,
    reset_password_view,
)

# Endpoints utilisés par le frontend React.
urlpatterns = [
    path('auth/login', LoginAPIView.as_view(), name='login'),
    path('auth/logout', logout_view, name='logout'),
    path('auth/profile', profile_view, name='profile'),
    path('auth/forgot-password', forgot_password_view, name='forgot-password'),
    path('auth/reset-password', reset_password_view, name='reset-password'),

    path('filieres', filieres_view, name='filieres'),
    path('filieres/<int:filiere_id>', filiere_detail_view, name='filiere-detail'),

    path('cursus', cursus_list_view, name='cursus-list'),
    path('cursus/<int:cursus_id>', cursus_detail_view, name='cursus-detail'),
    path('cursus/<int:cursus_id>/cours', cursus_add_cours_view, name='cursus-add-cours'),
    path('cursus/<int:cursus_id>/cours/<int:link_id>', cursus_cours_link_view, name='cursus-cours-link'),

    path('cours', cours_list_view, name='cours-list'),
    path('cours/par-slug/<slug:cours_slug>', cours_detail_by_slug_view, name='cours-detail-by-slug'),
    path('cours/<int:cours_id>/offres-unitaires', cours_offres_unitaires_view, name='cours-offres-unitaires'),
    path('cours/<int:cours_id>', cours_detail_view, name='cours-detail'),
    path('cours/<int:cours_id>/cursus', cours_add_cursus_view, name='cours-add-cursus'),

    path('offres-cours', offres_cours_view, name='offres-cours'),
    path('offres-cours/<int:offre_id>', offre_cours_detail_view, name='offre-cours-detail'),

    path('promotions', promotions_list_view, name='promotions-list'),
    path('promotions/<int:promotion_id>', promotion_detail_view, name='promotion-detail'),
    path('promotions/<int:promotion_id>/planning', promotion_planning_view, name='promotion-planning'),

    path('salles', salles_view, name='salles-list'),
    path('salles/<int:salle_id>', salle_detail_view, name='salle-detail'),

    path('eleves', eleves_search_view, name='eleves-search'),
    path('formateurs', formateurs_search_view, name='formateurs-search'),
    path('cours-planifies', cours_planifies_search_view, name='cours-planifies-search'),
    path('inscriptions', inscriptions_view, name='inscriptions'),

    path('mon-planning', mon_planning_view, name='mon-planning'),
    path('mon-planning/<int:cours_planifie_id>', mon_planning_detail_view, name='mon-planning-detail'),
]
