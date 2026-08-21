"""Routes racines de FormaNova vers l’administration et l’API métier."""

from django.contrib import admin
from django.urls import include, path

# Route principale du projet: admin Django + API métier.
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
