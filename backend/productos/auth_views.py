# productos/auth_views.py
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from .models import CartItem

from .serializers import RegisterSerializer, LoginSerializer, UserSerializer


# ✅ NUEVA: Vista para CSRF token (como CBV)
class GetCSRFTokenView(APIView):
    """
    GET /api/auth/csrf/
    Obtener CSRF token para peticiones POST/PUT/PATCH/DELETE
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Forzar generación del token CSRF
        csrf_token = get_token(request)
        return Response({
            'detail': 'CSRF cookie set',
            'csrfToken': csrf_token
        })


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Registro de nuevos usuarios
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Guardar session_id ANTES del registro
        old_session_id = request.session.session_key
        
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Crear token de autenticación
            token, created = Token.objects.get_or_create(user=user)
            
            # Autenticar automáticamente
            login(request, user)
            
            # ✅ MIGRAR CARRITO DE INVITADO A USUARIO
            if old_session_id:
                self._migrate_cart(old_session_id, user)
            
            return Response({
                'message': 'Usuario registrado exitosamente',
                'user': UserSerializer(user).data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _migrate_cart(self, session_id, user):
        """Migra items del carrito de sesión a usuario"""
        guest_items = CartItem.objects.filter(session_id=session_id, user__isnull=True)
        
        for guest_item in guest_items:
            # Buscar si el usuario ya tiene este producto
            user_item = CartItem.objects.filter(
                user=user,
                product=guest_item.product
            ).first()
            
            if user_item:
                # Si ya existe, sumar cantidades
                user_item.quantity += guest_item.quantity
                user_item.save()
                guest_item.delete()
            else:
                # Si no existe, transferir al usuario
                guest_item.user = user
                guest_item.session_id = None
                guest_item.save()


class LoginView(APIView):
    """
    POST /api/auth/login/
    Login de usuarios
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Guardar session_id ANTES del login
        old_session_id = request.session.session_key
        
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        # Autenticar usuario
        user = authenticate(request, username=username, password=password)
        
        if user is None:
            return Response({
                'error': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Login
        login(request, user)
        
        # ✅ MIGRAR CARRITO DE INVITADO A USUARIO
        if old_session_id:
            self._migrate_cart(old_session_id, user)
        
        # Obtener o crear token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Login exitoso',
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_200_OK)
    
    def _migrate_cart(self, session_id, user):
        """Migra items del carrito de sesión a usuario"""
        guest_items = CartItem.objects.filter(session_id=session_id, user__isnull=True)
        
        for guest_item in guest_items:
            # Buscar si el usuario ya tiene este producto
            user_item = CartItem.objects.filter(
                user=user,
                product=guest_item.product
            ).first()
            
            if user_item:
                # Si ya existe, sumar cantidades
                user_item.quantity += guest_item.quantity
                user_item.save()
                guest_item.delete()
            else:
                # Si no existe, transferir al usuario
                guest_item.user = user
                guest_item.session_id = None
                guest_item.save()
                

class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Logout de usuarios
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Eliminar token
        try:
            request.user.auth_token.delete()
        except:
            pass
        
        # Logout de sesión
        logout(request)
        
        return Response({
            'message': 'Logout exitoso'
        }, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    """
    GET /api/auth/profile/
    Obtener información del usuario autenticado
    
    PUT/PATCH /api/auth/profile/
    Actualizar información del usuario
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        serializer = UserSerializer(
            request.user, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CheckAuthView(APIView):
    """
    GET /api/auth/check/
    Verificar si el usuario está autenticado
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        if request.user.is_authenticated:
            return Response({
                'authenticated': True,
                'user': UserSerializer(request.user).data
            })
        else:
            return Response({
                'authenticated': False
            })