
#productos/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('productos/', views.ProductoListView.as_view(), name='producto-list'),
    path('productos/<int:id>/', views.ProductoDetailView.as_view(), name='producto-detail'),
    path('categorias/', views.CategoriaListView.as_view(), name='categoria-list'),
    path('cart/', views.CartItemListCreateView.as_view(), name='cart-list'),
    path('cart/<int:pk>/', views.CartItemDetailView.as_view(), name='cart-detail'),
]