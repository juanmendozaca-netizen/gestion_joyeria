# productos/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Categoria, Producto, UserProfile, Order, OrderItem

# ========================================
# SERIALIZERS EXISTENTES (Mantener)
# ========================================

class ProductoSerializer(serializers.ModelSerializer):
    precio_final = serializers.SerializerMethodField()
    tiene_descuento = serializers.SerializerMethodField()
    ahorro = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = '__all__'
    
    def get_precio_final(self, obj):
        """Calcula el precio final aplicando el descuento"""
        if obj.descuento > 0:
            return float(obj.precio * (1 - obj.descuento / 100))
        return float(obj.precio)
    
    def get_tiene_descuento(self, obj):
        """Indica si el producto tiene descuento activo"""
        return obj.descuento > 0
    
    def get_ahorro(self, obj):
        """Calcula el ahorro en dinero"""
        if obj.descuento > 0:
            return float(obj.precio * (obj.descuento / 100))
        return 0.0

class CategoriaSerializer(serializers.ModelSerializer):
    productos = ProductoSerializer(many=True, read_only=True)

    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'productos']


# ========================================
# NUEVOS SERIALIZERS: AUTENTICACIÓN
# ========================================

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['telefono', 'direccion', 'ciudad', 'codigo_postal', 'pais']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']
        read_only_fields = ['id']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)
    
    # Campos opcionales del perfil
    telefono = serializers.CharField(required=False, allow_blank=True)
    direccion = serializers.CharField(required=False, allow_blank=True)
    ciudad = serializers.CharField(required=False, allow_blank=True)
    codigo_postal = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 
            'telefono', 'direccion', 'ciudad', 'codigo_postal'
        ]
    
    def validate(self, data):
        # Validar que las contraseñas coincidan
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden"})
        
        # Validar email único
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Este email ya está registrado"})
        
        return data
    
    def create(self, validated_data):
        # Extraer campos del perfil
        telefono = validated_data.pop('telefono', '')
        direccion = validated_data.pop('direccion', '')
        ciudad = validated_data.pop('ciudad', '')
        codigo_postal = validated_data.pop('codigo_postal', '')
        
        # Remover password_confirm
        validated_data.pop('password_confirm')
        
        # Crear usuario
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Crear perfil
        UserProfile.objects.create(
            user=user,
            telefono=telefono,
            direccion=direccion,
            ciudad=ciudad,
            codigo_postal=codigo_postal
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


# ========================================
# NUEVOS SERIALIZERS: ÓRDENES
# ========================================

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id', 'nombre_producto', 'precio_unitario', 
            'cantidad', 'subtotal', 'descuento_aplicado'
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'numero_orden', 'user_email', 'user_name',
            'total', 'payment_status', 'payment_method',
            'direccion_envio', 'ciudad_envio', 'codigo_postal_envio', 'telefono_envio',
            'fecha_creacion', 'fecha_pago', 'items'
        ]
        read_only_fields = [
            'id', 'numero_orden', 'fecha_creacion', 'fecha_pago'
        ]


class CreateOrderSerializer(serializers.Serializer):
    """
    Serializer para crear una orden desde el carrito
    """
    payment_method = serializers.ChoiceField(choices=['stripe', 'culqi'])
    
    # Información de envío
    direccion_envio = serializers.CharField()
    ciudad_envio = serializers.CharField()
    codigo_postal_envio = serializers.CharField()
    telefono_envio = serializers.CharField()
    
    def validate(self, data):
        # Aquí podrías agregar validaciones adicionales
        # Por ejemplo, verificar que el carrito no esté vacío
        return data