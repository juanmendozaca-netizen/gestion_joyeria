# productos/models.py

from django.db import models
from django.contrib.auth.models import User

# ========================================
# MODELOS EXISTENTES (Mantener)
# ========================================

class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)

    def __str__(self):
        return self.nombre

class Producto(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField()
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='productos')
    imagen = models.URLField(blank=True, null=True)  
    descuento = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    def __str__(self):
        return self.nombre
    
    @property
    def precio_final(self):
        """Calcula el precio final con descuento"""
        if self.descuento > 0:
            return float(self.precio * (1 - self.descuento / 100))
        return float(self.precio)
    
    @property
    def tiene_descuento(self):
        return self.descuento > 0
    
    @property
    def ahorro(self):
        if self.descuento > 0:
            return float(self.precio * (self.descuento / 100))
        return 0.0

class CartItem(models.Model):
    # Para usuarios invitados
    session_id = models.CharField(max_length=100, null=True, blank=True)  # ✅ Agregar null=True, blank=True
    
    # Para usuarios autenticados (NUEVO)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='cart_items'
    )
    
    product = models.ForeignKey(Producto, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        pass  # ✅ Remover unique_together
    
    def __str__(self):
        if self.user:
            return f"{self.quantity}x {self.product.nombre} - Usuario: {self.user.username}"
        return f"{self.quantity}x {self.product.nombre} - Sesión: {self.session_id}"

# ========================================
# NUEVOS MODELOS: PERFIL DE USUARIO
# ========================================

class UserProfile(models.Model):
    """
    Perfil extendido del usuario con información adicional
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    telefono = models.CharField(max_length=20, blank=True)
    direccion = models.TextField(blank=True)
    ciudad = models.CharField(max_length=100, blank=True)
    codigo_postal = models.CharField(max_length=10, blank=True)
    pais = models.CharField(max_length=50, default='Perú')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Perfil de {self.user.username}"


# ========================================
# NUEVOS MODELOS: ÓRDENES Y COMPRAS
# ========================================

class Order(models.Model):
    """
    Orden de compra - Historial de pedidos
    """
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('paid', 'Pagado'),
        ('failed', 'Fallido'),
        ('refunded', 'Reembolsado'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('stripe', 'Stripe (Tarjeta)'),
        ('culqi', 'Culqi (Yape)'),
    ]
    
    # Relaciones
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    
    # Información de la orden
    numero_orden = models.CharField(max_length=50, unique=True, editable=False)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Estado y pago
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    
    # IDs de transacción de las pasarelas
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    culqi_charge_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Información de envío (capturada en el momento de la compra)
    direccion_envio = models.TextField()
    ciudad_envio = models.CharField(max_length=100)
    codigo_postal_envio = models.CharField(max_length=10)
    telefono_envio = models.CharField(max_length=20, blank=True, default='')
    
    # Timestamps
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_pago = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"Orden {self.numero_orden} - {self.user.username}"
    
    def save(self, *args, **kwargs):
        # Generar número de orden único
        if not self.numero_orden:
            import uuid
            self.numero_orden = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    """
    Items individuales de cada orden
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Producto, on_delete=models.SET_NULL, null=True)
    
    # Información del producto en el momento de la compra
    nombre_producto = models.CharField(max_length=200)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    cantidad = models.PositiveIntegerField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Si hubo descuento
    descuento_aplicado = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.cantidad}x {self.nombre_producto} - Orden {self.order.numero_orden}"
    
    def save(self, *args, **kwargs):
        # Calcular subtotal automáticamente
        self.subtotal = self.precio_unitario * self.cantidad
        super().save(*args, **kwargs)