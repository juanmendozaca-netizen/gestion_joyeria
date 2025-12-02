#ecommerce_api/urls.py
from django.contrib import admin
from django.urls import path, include
from productos.views import stripe_webhook

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('productos.urls')),
    path('webhooks/stripe/', stripe_webhook, name='stripe-webhook'),
    
]

