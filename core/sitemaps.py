from django.contrib.sitemaps import Sitemap
from django.urls import reverse, NoReverseMatch
from .models import Recipe, BlogPost, Inspiration, Collection, Video

class StaticViewSitemap(Sitemap):
    """Карта для статических страниц"""
    priority = 0.8
    changefreq = 'monthly'

    def items(self):
        return ['core:home', 'core:recipes-list', 'core:blog_list', 
                'core:inspiration_list', 'core:video_list', 'core:about']

    def location(self, item):
        try:
            return reverse(item)
        except NoReverseMatch:
            print(f"Warning: No reverse match for {item}")
            return '/'


class RecipeSitemap(Sitemap):
    """Карта для рецептов"""
    changefreq = 'weekly'
    priority = 1.0

    def items(self):
        return Recipe.published.all()

    def lastmod(self, obj):
        if obj.updated_at:
            return obj.updated_at
        if obj.created_at:
            return obj.created_at
        return None
    
    def location(self, obj):
        try:
            return obj.get_absolute_url()
        except NoReverseMatch:
            print(f"Warning: No reverse match for recipe {obj.slug}")
            return '/'


class BlogPostSitemap(Sitemap):
    """Карта для записей блога"""
    changefreq = 'weekly'
    priority = 0.9

    def items(self):
        return BlogPost.published.all()

    def lastmod(self, obj):
        if obj.updated_at:
            return obj.updated_at
        if obj.created_at:
            return obj.created_at
        return None
    
    def location(self, obj):
        try:
            return obj.get_absolute_url()
        except NoReverseMatch:
            print(f"Warning: No reverse match for blog {obj.slug}")
            return '/'


class InspirationSitemap(Sitemap):
    """Карта для вдохновения"""
    changefreq = 'monthly'
    priority = 0.7

    def items(self):
        return Inspiration.published.all()

    def lastmod(self, obj):
        return obj.created_at or None
    
    def location(self, obj):
        try:
            return obj.get_absolute_url()
        except NoReverseMatch:
            print(f"Warning: No reverse match for inspiration {obj.slug}")
            return '/'


class CollectionSitemap(Sitemap):
    """Карта для коллекций"""
    changefreq = 'monthly'
    priority = 0.6

    def items(self):
        return Collection.objects.all()
    
    def lastmod(self, obj):
        return obj.created_at or None
    
    def location(self, obj):
        try:
            return obj.get_absolute_url()
        except NoReverseMatch:
            print(f"Warning: No reverse match for collection {obj.slug}")
            return '/'


class VideoSitemap(Sitemap):
    """Карта для видео"""
    changefreq = 'monthly'
    priority = 0.8

    def items(self):
        return Video.objects.all()

    def lastmod(self, obj):
        return obj.created_at or obj.updated_at or None
    
    def location(self, obj):
        try:
            return reverse('core:video_detail', args=[obj.id])
        except NoReverseMatch:
            print(f"Warning: No reverse match for video {obj.id}")
            return '/'