from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.contrib.sitemaps.views import sitemap
from core.sitemaps import (
    StaticViewSitemap, RecipeSitemap, BlogPostSitemap,
    InspirationSitemap, CollectionSitemap, VideoSitemap
)
from django.http import HttpResponse
import os

def robots_txt(request):
    file_path = os.path.join(settings.BASE_DIR, 'robots.txt')
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return HttpResponse(content, content_type='text/plain')

sitemaps = {
    'static': StaticViewSitemap,
    'recipes': RecipeSitemap,
    'blog': BlogPostSitemap,
    'inspiration': InspirationSitemap,
    'collections': CollectionSitemap,
    'videos': VideoSitemap,
}

urlpatterns = [
    path('admin/', admin.site.urls),
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),
    path('', include('core.urls')),
]

# Добавляем обслуживание медиа файлов в режиме разработки
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)