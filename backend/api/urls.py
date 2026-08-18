from django.urls import path

from .academics_views import (
    cours_add_cursus_view,
    cours_detail_view,
    cours_list_view,
    cours_planifies_search_view,
    cursus_add_cours_view,
    cursus_cours_link_view,
    cursus_detail_view,
    cursus_list_view,
    eleves_search_view,
    filiere_detail_view,
    filieres_view,
    inscriptions_view,
    mon_planning_detail_view,
    mon_planning_view,
    promotion_detail_view,
    promotion_planning_view,
    promotions_list_view,
)
from .views import login_view, logout_view, profile_view

# Endpoints utilisés par le frontend React.
urlpatterns = [
    path('auth/login', login_view, name='login'),
    path('auth/logout', logout_view, name='logout'),
    path('auth/profile', profile_view, name='profile'),

    path('filieres', filieres_view, name='filieres'),
    path('filieres/<int:filiere_id>', filiere_detail_view, name='filiere-detail'),

    path('cursus', cursus_list_view, name='cursus-list'),
    path('cursus/<int:cursus_id>', cursus_detail_view, name='cursus-detail'),
    path('cursus/<int:cursus_id>/cours', cursus_add_cours_view, name='cursus-add-cours'),
    path('cursus/<int:cursus_id>/cours/<int:link_id>', cursus_cours_link_view, name='cursus-cours-link'),

    path('cours', cours_list_view, name='cours-list'),
    path('cours/<int:cours_id>', cours_detail_view, name='cours-detail'),
    path('cours/<int:cours_id>/cursus', cours_add_cursus_view, name='cours-add-cursus'),

    path('promotions', promotions_list_view, name='promotions-list'),
    path('promotions/<int:promotion_id>', promotion_detail_view, name='promotion-detail'),
    path('promotions/<int:promotion_id>/planning', promotion_planning_view, name='promotion-planning'),

    path('eleves', eleves_search_view, name='eleves-search'),
    path('cours-planifies', cours_planifies_search_view, name='cours-planifies-search'),
    path('inscriptions', inscriptions_view, name='inscriptions'),

    path('mon-planning', mon_planning_view, name='mon-planning'),
    path('mon-planning/<int:cours_planifie_id>', mon_planning_detail_view, name='mon-planning-detail'),
]
