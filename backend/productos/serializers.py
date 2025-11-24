# productos/serializers.py

from rest_framework import serializers
from .models import Categoria, Producto

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