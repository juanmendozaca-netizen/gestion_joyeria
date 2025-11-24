# productos/views.py

from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Categoria, Producto, CartItem
from .serializers import ProductoSerializer, CategoriaSerializer


# === Vistas existentes (sin cambios) ===

class ProductoListView(generics.ListAPIView):
    serializer_class = ProductoSerializer

    def get_queryset(self):
        queryset = Producto.objects.all()
        categoria_id = self.request.query_params.get('categoria')
        if categoria_id:
            queryset = queryset.filter(categoria_id=categoria_id)
        return queryset


class ProductoDetailView(generics.RetrieveAPIView):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    lookup_field = 'id'


class CategoriaListView(generics.ListAPIView):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


# === VISTAS DEL CARRITO CON DESCUENTOS APLICADOS ===

class CartItemListCreateView(APIView):
    def get(self, request):
        # ✅ Crear sesión si no existe
        if not request.session.session_key:
            request.session.create()
            request.session.modified = True
            request.session.save()
        
        session_id = request.session.session_key
        if not session_id:
            return Response([])
        
        items = CartItem.objects.filter(session_id=session_id).select_related('product')
        data = []
        for item in items:
            # ✅ Calcular precio final con descuento
            precio_base = float(item.product.precio)
            descuento = float(item.product.descuento)
            
            if descuento > 0:
                precio_final = precio_base * (1 - descuento / 100)
                tiene_descuento = True
                ahorro = precio_base * (descuento / 100)
            else:
                precio_final = precio_base
                tiene_descuento = False
                ahorro = 0.0
            
            data.append({
                'id': item.id,
                'product': {
                    'id': item.product.id,
                    'nombre': item.product.nombre,
                    'precio': precio_base,  # Precio original
                    'precio_final': precio_final,  # ✅ Precio con descuento
                    'descuento': descuento,
                    'tiene_descuento': tiene_descuento,
                    'ahorro': ahorro,
                    'imagen': item.product.imagen or "",
                },
                'quantity': item.quantity,
                'subtotal': precio_final * item.quantity,  # ✅ Subtotal con descuento
            })
        return Response(data)

    def post(self, request):
        # ✅ Crear sesión si no existe
        if not request.session.session_key:
            request.session.create()
            request.session.modified = True
            request.session.save()
        session_id = request.session.session_key

        product_id = request.data.get('product_id')
        quantity_raw = request.data.get('quantity', 1)

        if not product_id:
            return Response({'error': 'product_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = int(quantity_raw)
            if quantity <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return Response({'error': 'Cantidad debe ser un entero positivo'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Producto.objects.get(id=product_id)
        except Producto.DoesNotExist:
            return Response({'error': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if quantity > product.stock:
            return Response({'error': f'Solo hay {product.stock} unidades disponibles'}, status=status.HTTP_400_BAD_REQUEST)

        cart_item, created = CartItem.objects.get_or_create(
            session_id=session_id,
            product=product,
            defaults={'quantity': quantity}
        )
        if not created:
            if cart_item.quantity + quantity > product.stock:
                return Response({'error': f'Stock insuficiente. Máximo adicional: {product.stock - cart_item.quantity}'}, status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity += quantity
            cart_item.save()

        return Response({'message': 'Producto añadido al carrito'}, status=status.HTTP_201_CREATED)



class CartItemDetailView(APIView):
    """
    PATCH: Actualiza la cantidad de un item
    DELETE: Elimina un item del carrito
    """
    def patch(self, request, pk):
        session_id = request.session.session_key
        if not session_id:
            return Response({'error': 'Sesión no iniciada'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            item = CartItem.objects.get(id=pk, session_id=session_id)
        except CartItem.DoesNotExist:
            return Response({'error': 'Ítem no encontrado en tu carrito'}, status=status.HTTP_404_NOT_FOUND)

        quantity = request.data.get('quantity')
        if quantity is None:
            return Response({'error': 'Campo "quantity" requerido'}, status=status.HTTP_400_BAD_REQUEST)

        quantity = int(quantity)
        if quantity <= 0:
            item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        if quantity > item.product.stock:
            return Response({
                'error': f'Stock insuficiente. Disponible: {item.product.stock}'
            }, status=status.HTTP_400_BAD_REQUEST)

        item.quantity = quantity
        item.save()
        
        # ✅ Calcular precio final con descuento
        precio_base = float(item.product.precio)
        descuento = float(item.product.descuento)
        precio_final = precio_base * (1 - descuento / 100) if descuento > 0 else precio_base
        
        return Response({
            'id': item.id,
            'quantity': item.quantity,
            'subtotal': precio_final * item.quantity  # ✅ Con descuento
        })

    def delete(self, request, pk):
        session_id = request.session.session_key
        if not session_id:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        CartItem.objects.filter(id=pk, session_id=session_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)