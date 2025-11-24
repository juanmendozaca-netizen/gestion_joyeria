"""
Django settings for ecommerce_api project.
"""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-_af4g4a$!4m)e=9-3@0_0k48n*p9e95prppni$tsp%dlvt1wt1'

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'localhost:8000', '127.0.0.1:8000']


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'productos',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'productos.middleware.SessionDebugMiddleware',  # ✅ DEBE ir después de SessionMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'ecommerce_api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ecommerce_api.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ========================================
# CONFIGURACIÓN CORS Y SESIONES (CORREGIDA)
# ========================================

# Permitir requests desde el frontend React
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# ✅ Permitir envío de cookies entre dominios
CORS_ALLOW_CREDENTIALS = True

# ✅ IMPORTANTE: Exponer headers necesarios
CORS_EXPOSE_HEADERS = ['Set-Cookie']

# ✅ Permitir headers específicos
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# ✅ CSRF para desarrollo local
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# ✅ CONFIGURACIÓN DE SESIONES (SOLUCIÓN AL PROBLEMA)
# Usar 'Lax' en desarrollo local (no 'None' que requiere HTTPS)
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = False  # False porque estamos en HTTP (desarrollo)
SESSION_COOKIE_HTTPONLY = True  # Seguridad adicional

# ✅ Configuración CSRF
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False  # Debe ser False para que JS pueda leerlo

# ✅ CRÍTICO: Permitir cookies en localhost
SESSION_COOKIE_DOMAIN = None
CSRF_COOKIE_DOMAIN = None

# ✅ Nombre de la cookie de sesión
SESSION_COOKIE_NAME = 'sessionid'

# ✅ La cookie debe funcionar en todas las rutas
SESSION_COOKIE_PATH = '/'

# ✅ Opcional: Aumentar tiempo de vida de la sesión (por defecto es 2 semanas)
SESSION_COOKIE_AGE = 1209600  # 2 semanas en segundos

# ✅ IMPORTANTE: Forzar que Django guarde la sesión en cada request
SESSION_SAVE_EVERY_REQUEST = True

# ✅ Usar sesiones basadas en base de datos (más confiable que caché)
SESSION_ENGINE = 'django.contrib.sessions.backends.db'