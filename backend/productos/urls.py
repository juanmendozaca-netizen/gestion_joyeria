# productos/urls.py
from django.urls import path
from . import views, auth_views

urlpatterns = [
    # ========================================
    # CSRF Token
    # ========================================
    path('auth/csrf/', auth_views.GetCSRFTokenView.as_view(), name='csrf-token'),
    
    # ========================================
    # AUTENTICACIÓN
    # ========================================
    path('auth/register/', auth_views.RegisterView.as_view(), name='register'),
    path('auth/login/', auth_views.LoginView.as_view(), name='login'),
    path('auth/logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('auth/profile/', auth_views.UserProfileView.as_view(), name='profile'),
    path('auth/check/', auth_views.CheckAuthView.as_view(), name='check-auth'),
    
    # ========================================
    # PRODUCTOS Y CATEGORÍAS
    # ========================================
    path('productos/', views.ProductoListView.as_view(), name='producto-list'),
    path('productos/<int:id>/', views.ProductoDetailView.as_view(), name='producto-detail'),
    path('categorias/', views.CategoriaListView.as_view(), name='categoria-list'),
    
    # ========================================
    # CARRITO
    # ========================================
    path('cart/', views.CartItemListCreateView.as_view(), name='cart-list'),
    path('cart/<int:pk>/', views.CartItemDetailView.as_view(), name='cart-detail'),
    
    # ========================================
    # ÓRDENES
    # ========================================
    path('orders/', views.CreateOrderView.as_view(), name='create-order'),
    path('orders/history/', views.UserOrderListView.as_view(), name='order-history'),
    
    # ========================================
    # PAGOS - STRIPE
    # ========================================
    path('payments/stripe/create-checkout-session/', views.CreateStripeCheckoutSessionView.as_view(), name='stripe-checkout'),
    path('payments/stripe/confirm-payment/', views.ConfirmStripePaymentView.as_view(), name='stripe-confirm'),  # ✅ NUEVA
    path('payments/stripe/webhook/', views.stripe_webhook, name='stripe-webhook'),
]