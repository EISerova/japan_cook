from django.contrib import admin
from django.urls import path, include  # добавьте include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # Подключаем URL-маршруты приложения core
    path('', include('core.urls')),
]

# Добавляем обслуживание медиа файлов в режиме разработки
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)