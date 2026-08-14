from django.urls import path

from .views import login_view, logout_view, profile_view

# Endpoints utilisés par le frontend React.
urlpatterns = [
    path('auth/login', login_view, name='login'),
    path('auth/logout', logout_view, name='logout'),
    path('auth/profile', profile_view, name='profile'),
]
