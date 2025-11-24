# productos/middleware.py
# Middleware temporal para debugging de sesiones

class SessionDebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Antes del request
        print(f"\n{'='*60}")
        print(f"🔍 REQUEST: {request.method} {request.path}")
        print(f"📝 Session Key ANTES: {request.session.session_key}")
        print(f"🍪 Cookies recibidas: {request.COOKIES.keys()}")
        
        response = self.get_response(request)
        
        # ✅ FORZAR que se envíe la cookie de sesión
        if request.session.session_key:
            response.set_cookie(
                'sessionid',
                request.session.session_key,
                max_age=1209600,  # 2 semanas
                httponly=True,
                samesite='Lax',
                secure=False,
                path='/',
            )
            print(f"🚀 FORZANDO cookie sessionid: {request.session.session_key}")
        
        # Después del request
        print(f"📝 Session Key DESPUÉS: {request.session.session_key}")
        print(f"🍪 Cookies enviadas: {response.cookies.keys()}")
        if 'sessionid' in response.cookies:
            print(f"✅ Cookie sessionid configurada: {response.cookies['sessionid'].value}")
        print(f"{'='*60}\n")
        
        return response