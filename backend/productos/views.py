# productos/views.py
import stripe
from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Categoria, Producto, CartItem
from .serializers import ProductoSerializer, CategoriaSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Order, OrderItem, CartItem
from .serializers import CreateOrderSerializer, OrderSerializer
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


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
        # ✅ PRIORIDAD: Si está autenticado, usar user. Si no, usar session_id
        if request.user.is_authenticated:
            # Usuario autenticado: buscar por user
            items = CartItem.objects.filter(user=request.user).select_related('product')
        else:
            # Usuario invitado: buscar por session_id
            if not request.session.session_key:
                request.session.create()
                request.session.modified = True
                request.session.save()
            
            session_id = request.session.session_key
            items = CartItem.objects.filter(
                session_id=session_id, 
                user__isnull=True
            ).select_related('product')
        
        # Construir respuesta (igual que antes)
        data = []
        for item in items:
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
                    'precio': precio_base,
                    'precio_final': precio_final,
                    'descuento': descuento,
                    'tiene_descuento': tiene_descuento,
                    'ahorro': ahorro,
                    'imagen': item.product.imagen or "",
                },
                'quantity': item.quantity,
                'subtotal': precio_final * item.quantity,
            })
        return Response(data)

    def post(self, request):
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

        # ✅ LÓGICA ACTUALIZADA: Usar user si está autenticado, session_id si no
        if request.user.is_authenticated:
            # Usuario autenticado
            cart_item, created = CartItem.objects.get_or_create(
                user=request.user,
                product=product,
                defaults={'quantity': quantity}
            )
        else:
            # Usuario invitado
            if not request.session.session_key:
                request.session.create()
                request.session.modified = True
                request.session.save()
            
            session_id = request.session.session_key
            cart_item, created = CartItem.objects.get_or_create(
                session_id=session_id,
                product=product,
                user__isnull=True,
                defaults={'quantity': quantity}
            )
        
        # Si ya existía, incrementar cantidad
        if not created:
            if cart_item.quantity + quantity > product.stock:
                return Response({
                    'error': f'Stock insuficiente. Máximo adicional: {product.stock - cart_item.quantity}'
                }, status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity += quantity
            cart_item.save()

        return Response({'message': 'Producto añadido al carrito'}, status=status.HTTP_201_CREATED)


class CartItemDetailView(APIView):
    """
    PATCH: Actualiza la cantidad de un item
    DELETE: Elimina un item del carrito
    """
    def patch(self, request, pk):
        # ✅ Buscar item por user o session_id
        if request.user.is_authenticated:
            try:
                item = CartItem.objects.get(id=pk, user=request.user)
            except CartItem.DoesNotExist:
                return Response({'error': 'Ítem no encontrado en tu carrito'}, status=status.HTTP_404_NOT_FOUND)
        else:
            session_id = request.session.session_key
            if not session_id:
                return Response({'error': 'Sesión no iniciada'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                item = CartItem.objects.get(id=pk, session_id=session_id, user__isnull=True)
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
        
        # Calcular precio final con descuento
        precio_base = float(item.product.precio)
        descuento = float(item.product.descuento)
        precio_final = precio_base * (1 - descuento / 100) if descuento > 0 else precio_base
        
        return Response({
            'id': item.id,
            'quantity': item.quantity,
            'subtotal': precio_final * item.quantity
        })

    def delete(self, request, pk):
        # ✅ Eliminar item por user o session_id
        if request.user.is_authenticated:
            CartItem.objects.filter(id=pk, user=request.user).delete()
        else:
            session_id = request.session.session_key
            if not session_id:
                return Response(status=status.HTTP_400_BAD_REQUEST)
            CartItem.objects.filter(id=pk, session_id=session_id, user__isnull=True).delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)


# === VISTAS DE ÓRDENES ===

class CreateOrderView(APIView):
    """
    POST /api/orders/
    Crea una nueva orden a partir del carrito del usuario.
    Requiere autenticación.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Obtener carrito de la sesión actual
        session_id = request.session.session_key
        if not session_id:
            return Response(
                {'error': 'Carrito vacío o sesión no iniciada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart_items = CartItem.objects.filter(session_id=session_id).select_related('product')
        if not cart_items.exists():
            return Response(
                {'error': 'El carrito está vacío'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calcular total
        total = 0
        order_items_data = []
        for item in cart_items:
            product = item.product
            precio_unitario = float(product.precio)
            descuento_aplicado = float(product.descuento)
            precio_final = precio_unitario * (1 - descuento_aplicado / 100) if descuento_aplicado > 0 else precio_unitario
            subtotal = precio_final * item.quantity

            total += subtotal
            order_items_data.append({
                'product': product,
                'nombre_producto': product.nombre,
                'precio_unitario': precio_unitario,
                'cantidad': item.quantity,
                'subtotal': subtotal,
                'descuento_aplicado': descuento_aplicado,
            })

        if total <= 0:
            return Response(
                {'error': 'Total inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear orden
        order = Order.objects.create(
            user=request.user,
            total=total,
            payment_method=serializer.validated_data['payment_method'],
            payment_status='pending',
            direccion_envio=serializer.validated_data['direccion_envio'],
            ciudad_envio=serializer.validated_data['ciudad_envio'],
            codigo_postal_envio=serializer.validated_data['codigo_postal_envio'],
            telefono_envio=serializer.validated_data['telefono_envio'],
        )

        # Crear items
        for item_data in order_items_data:
            OrderItem.objects.create(
                order=order,
                product=item_data['product'],
                nombre_producto=item_data['nombre_producto'],
                precio_unitario=item_data['precio_unitario'],
                cantidad=item_data['cantidad'],
                subtotal=item_data['subtotal'],
                descuento_aplicado=item_data['descuento_aplicado'],
            )

        # ✅ Limpiar carrito tras crear la orden
        CartItem.objects.filter(session_id=session_id).delete()

        # Serializar y responder
        order_serializer = OrderSerializer(order)
        return Response(order_serializer.data, status=status.HTTP_201_CREATED)


class UserOrderListView(APIView):
    """
    GET /api/orders/history/
    Lista todas las órdenes del usuario autenticado.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).prefetch_related('items')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


# === VISTAS DE STRIPE ===

@method_decorator(csrf_exempt, name='dispatch')
class CreateStripeCheckoutSessionView(APIView):
    """
    POST /api/payments/stripe/create-checkout-session/
    Crea una sesión de pago en Stripe.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # ✅ Configurar Stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        print('========================================')
        print('🔍 DEBUG STRIPE BACKEND')
        print('========================================')
        print(f'Secret Key (primeros 20 chars): {settings.STRIPE_SECRET_KEY[:20]}...')
        print(f'Usuario autenticado: {request.user.username}')
        print(f'User ID: {request.user.id}')
        
        # ✅ Verificar que la clave existe
        if not stripe.api_key or stripe.api_key == '':
            return Response({
                'error': 'Stripe no está configurado correctamente en el servidor'
            }, status=500)
        
        # Buscar carrito
        if request.user.is_authenticated:
            cart_items = CartItem.objects.filter(user=request.user).select_related('product')
        else:
            session_id = request.session.session_key
            if not session_id:
                return Response({'error': 'Carrito vacío'}, status=400)
            cart_items = CartItem.objects.filter(session_id=session_id, user__isnull=True).select_related('product')
        
        print(f'Items en carrito: {cart_items.count()}')
        
        if not cart_items.exists():
            return Response({'error': 'Carrito vacío'}, status=400)

        # Preparar line items
        line_items = []
        for item in cart_items:
            product = item.product
            descuento = float(product.descuento)
            precio_unitario = float(product.precio)
            
            if descuento > 0:
                precio_con_descuento = int(precio_unitario * (1 - descuento / 100) * 100)
            else:
                precio_con_descuento = int(precio_unitario * 100)

            line_items.append({
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': product.nombre,
                        'description': product.descripcion[:100] if product.descripcion else '',
                    },
                    'unit_amount': precio_con_descuento,
                },
                'quantity': item.quantity,
            })
            
            print(f'  - {product.nombre}: ${precio_con_descuento/100} x {item.quantity}')

        # URL de tu frontend
        frontend_url = "http://localhost:5173"

        try:
            print('🔵 Creando sesión en Stripe...')
            
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=f'{frontend_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}',
                cancel_url=f'{frontend_url}/cart',
                metadata={
                    'user_id': str(request.user.id),
                }
            )
            
            print(f'✅ Sesión creada exitosamente!')
            print(f'   Session ID: {checkout_session.id}')
            print(f'   URL correcta: {checkout_session.url}')
            print('========================================')
            
            return Response({
                'sessionId': checkout_session.id,
                'url': checkout_session.url
            })
            
        except stripe.error.StripeError as e:
            print(f"❌ Error de Stripe: {str(e)}")
            print('========================================')
            return Response({'error': f'Error de Stripe: {str(e)}'}, status=500)
        except Exception as e:
            print(f"❌ Error general: {str(e)}")
            print('========================================')
            return Response({'error': str(e)}, status=500)


@csrf_exempt
def stripe_webhook(request):
    """
    Webhook de Stripe para procesar eventos de pago.
    """
    stripe.api_key = settings.STRIPE_SECRET_KEY
    
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    event = None

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return JsonResponse({'error': 'Invalid payload'}, status=400)
    except stripe.error.SignatureVerificationError:
        return JsonResponse({'error': 'Invalid signature'}, status=400)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session['metadata']['user_id']

        try:
            from django.contrib.auth.models import User
            user = User.objects.get(id=user_id)
            cart_items = CartItem.objects.filter(user=user).select_related('product')

            total = 0
            order_items_data = []
            for item in cart_items:
                product = item.product
                precio_unitario = float(product.precio)
                descuento = float(product.descuento)
                precio_final = precio_unitario * (1 - descuento / 100) if descuento > 0 else precio_unitario
                subtotal = precio_final * item.quantity
                total += subtotal
                order_items_data.append({
                    'product': product,
                    'nombre_producto': product.nombre,
                    'precio_unitario': precio_unitario,
                    'cantidad': item.quantity,
                    'subtotal': subtotal,
                    'descuento_aplicado': descuento,
                })

            shipping_details = session.get('shipping_details', {})
            customer_details = session.get('customer_details', {})
            
            # ✅ CORRECCIÓN: Manejo seguro del teléfono
            telefono = customer_details.get('phone') or ''
            
            order = Order.objects.create(
                user=user,
                total=total,
                payment_method='stripe',
                payment_status='paid',
                stripe_payment_intent_id=session.get('payment_intent', ''),
                direccion_envio=shipping_details.get('address', {}).get('line1') or 'N/A',
                ciudad_envio=shipping_details.get('address', {}).get('city') or 'N/A',
                codigo_postal_envio=shipping_details.get('address', {}).get('postal_code') or 'N/A',
                telefono_envio=telefono,  # ✅ Nunca será None
            )

            for item_data in order_items_data:
                OrderItem.objects.create(
                    order=order,
                    product=item_data['product'],
                    nombre_producto=item_data['nombre_producto'],
                    precio_unitario=item_data['precio_unitario'],
                    cantidad=item_data['cantidad'],
                    subtotal=item_data['subtotal'],
                    descuento_aplicado=item_data['descuento_aplicado'],
                )

            CartItem.objects.filter(user=user).delete()

        except Exception as e:
            print(f"❌ Error en webhook: {e}")
            return JsonResponse({'error': 'Order creation failed'}, status=500)

    return JsonResponse({'status': 'success'})


class ConfirmStripePaymentView(APIView):
    """
    POST /api/payments/stripe/confirm-payment/
    Confirma un pago de Stripe y crea la orden.
    Se llama desde el frontend tras redirección de éxito.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'session_id es requerido'}, status=400)

        try:
            # Verificar la sesión de Stripe
            session = stripe.checkout.Session.retrieve(session_id)
            
            # Verificar que el pago fue exitoso
            if session.payment_status != 'paid':
                return Response({
                    'error': 'El pago no ha sido completado'
                }, status=400)
            
            # Verificar que es del usuario correcto
            user_id_from_stripe = int(session.metadata.get('user_id'))
            if user_id_from_stripe != request.user.id:
                return Response({
                    'error': 'Sesión de pago no válida para este usuario'
                }, status=403)
            
            # Verificar si ya existe una orden con este payment_intent
            payment_intent_id = session.payment_intent
            existing_order = Order.objects.filter(
                stripe_payment_intent_id=payment_intent_id
            ).first()
            
            if existing_order:
                return Response({
                    'message': 'Orden ya existente',
                    'order': OrderSerializer(existing_order).data
                }, status=200)
            
            # Obtener carrito del usuario
            cart_items = CartItem.objects.filter(user=request.user).select_related('product')
            
            if not cart_items.exists():
                return Response({
                    'error': 'Carrito vacío (ya fue procesado)'
                }, status=400)
            
            # Calcular total y preparar items
            total = 0
            order_items_data = []
            for item in cart_items:
                product = item.product
                precio_unitario = float(product.precio)
                descuento = float(product.descuento)
                precio_final = precio_unitario * (1 - descuento / 100) if descuento > 0 else precio_unitario
                subtotal = precio_final * item.quantity
                total += subtotal
                
                order_items_data.append({
                    'product': product,
                    'nombre_producto': product.nombre,
                    'precio_unitario': precio_unitario,
                    'cantidad': item.quantity,
                    'subtotal': subtotal,
                    'descuento_aplicado': descuento,
                })
            
            # Obtener información de envío/cliente de Stripe
            customer_details = session.get('customer_details', {})
            shipping_details = session.get('shipping_details', {})
            
            # ✅ CORRECCIÓN CRÍTICA: Manejo seguro de todos los campos
            direccion = shipping_details.get('address', {}).get('line1') or 'N/A'
            ciudad = shipping_details.get('address', {}).get('city') or 'N/A'
            codigo_postal = shipping_details.get('address', {}).get('postal_code') or 'N/A'
            
            # ✅ Múltiples fallbacks para el teléfono
            telefono = (
                customer_details.get('phone') or 
                shipping_details.get('phone') or 
                ''  # ✅ String vacío como último recurso
            )
            
            # Crear orden
            order = Order.objects.create(
                user=request.user,
                total=total,
                payment_method='stripe',
                payment_status='paid',
                stripe_payment_intent_id=payment_intent_id,
                direccion_envio=direccion,
                ciudad_envio=ciudad,
                codigo_postal_envio=codigo_postal,
                telefono_envio=telefono,  # ✅ Nunca será None
            )
            
            # Crear items de la orden
            for item_data in order_items_data:
                OrderItem.objects.create(
                    order=order,
                    product=item_data['product'],
                    nombre_producto=item_data['nombre_producto'],
                    precio_unitario=item_data['precio_unitario'],
                    cantidad=item_data['cantidad'],
                    subtotal=item_data['subtotal'],
                    descuento_aplicado=item_data['descuento_aplicado'],
                )
            
            # Limpiar carrito
            CartItem.objects.filter(user=request.user).delete()
            
            return Response({
                'message': 'Orden creada exitosamente',
                'order': OrderSerializer(order).data
            }, status=201)
            
        except stripe.error.StripeError as e:
            return Response({
                'error': f'Error de Stripe: {str(e)}'
            }, status=500)
        except Exception as e:
            print(f"❌ Error al confirmar pago: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': str(e)
            }, status=500)