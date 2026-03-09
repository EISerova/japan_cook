from django.contrib import admin
from django.utils.html import format_html, mark_safe
from django.utils.text import slugify
from .models import (
    Ingredient, Recipe, RecipeIngredient, 
    Collection, Step, RecipeImage, Video, BlogPost, Inspiration
)

# ========== INLINE КЛАССЫ ==========
class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 3
    fields = ['ingredient', 'quantity', 'order']


class StepInline(admin.TabularInline):
    model = Step
    extra = 1
    fields = ['number', 'description', 'image', 'image_url']


class RecipeImageInline(admin.TabularInline):
    model = RecipeImage
    extra = 1
    fields = ['image', 'caption', 'step']


class VideoInline(admin.TabularInline):
    model = Video
    extra = 1
    fields = ['title', 'video_type', 'video_url', 'embed_code', 'is_main', 'order', 'video_preview']
    readonly_fields = ['video_preview']
    
    def video_preview(self, obj):
        if obj and obj.id and obj.embed_code:
            return mark_safe(f'<div style="width: 160px; height: 90px; overflow: hidden;">{obj.embed_code}</div>')
        return "—"
    video_preview.short_description = 'Превью'


# ========== АДМИНКИ ==========
@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('title',)}
    list_display = ['title', 'difficulty', 'cooking_time', 'is_featured', 'is_published', 'created_at']
    list_filter = ['difficulty', 'collections', 'is_featured', 'is_published']
    list_editable = ['is_featured', 'is_published']
    search_fields = ['title']
    filter_horizontal = ['collections']
    date_hierarchy = 'created_at'
    inlines = [RecipeIngredientInline, StepInline, RecipeImageInline, VideoInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'slug', 'description', 'image', 'image_url')
        }),
        ('Параметры приготовления', {
            'fields': ('cooking_time', 'servings', 'difficulty')
        }),
        ('Коллекции', {
            'fields': ('collections',)
        }),
        ('Публикация', {
            'fields': ('is_featured', 'is_published')
        }),
    )


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}
    list_display = ['name', 'slug']
    search_fields = ['name']


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}
    list_display = ['name', 'order', 'recipe_count']
    list_editable = ['order']
    search_fields = ['name']
    
    def recipe_count(self, obj):
        return obj.recipes.count()
    recipe_count.short_description = 'Количество рецептов'


@admin.register(Step)
class StepAdmin(admin.ModelAdmin):
    list_display = ['recipe', 'number', 'has_image']
    list_filter = ['recipe']
    ordering = ['recipe', 'number']


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ['title', 'recipe', 'video_type', 'duration', 'is_main', 'order', 'video_preview']
    list_filter = ['video_type', 'is_main', 'recipe']
    search_fields = ['title', 'recipe__title', 'video_url']
    list_editable = ['is_main', 'order', 'duration']
    readonly_fields = ['embed_code_preview']
    autocomplete_fields = ['recipe']  # Добавляем эту строку для автокомплита
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('recipe', 'title', 'video_type')
        }),
        ('Видео', {
            'fields': ('video_url', 'embed_code'),
            'description': 'Введите ссылку на видео или вставьте iframe код напрямую'
        }),
        ('Длительность', {
            'fields': ('duration',),
            'description': 'Укажите длительность видео вручную (например: 15:30)'
        }),
        ('Настройки отображения', {
            'fields': ('order', 'is_main')
        }),
        ('Превью', {
            'fields': ('embed_code_preview',),
            'classes': ('wide',)
        }),
    )
    
    def video_preview(self, obj):
        if obj.embed_code:
            return mark_safe(f'<div style="width: 120px; height: 68px; overflow: hidden;">{obj.embed_code}</div>')
        return "Нет видео"
    video_preview.short_description = 'Превью'
    
    def embed_code_preview(self, obj):
        if obj.embed_code:
            return mark_safe(f'<div style="max-width: 560px; max-height: 315px;">{obj.embed_code}</div>')
        return "Введите ссылку или код видео"
    embed_code_preview.short_description = 'Предпросмотр видео'

    def embed_code_preview(self, obj):
        if obj.embed_code:
            return mark_safe(f'<div style="max-width: 560px; max-height: 315px;">{obj.embed_code}</div>')
        return "Введите ссылку или код видео"
    embed_code_preview.short_description = 'Предпросмотр видео'


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('title',)}
    list_display = ['title', 'author', 'reading_time', 'is_published', 'created_at', 'order']
    list_filter = ['is_published', 'author', 'created_at']
    list_editable = ['is_published', 'order', 'reading_time']
    search_fields = ['title', 'description', 'content']
    date_hierarchy = 'created_at'
    readonly_fields = ['image_preview']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'slug', 'description', 'content')
        }),
        ('Изображение', {
            'fields': ('image', 'image_url', 'image_preview'),
            'description': 'Загрузите изображение или укажите URL'
        }),
        ('Мета информация', {
            'fields': ('author', 'reading_time', 'order')
        }),
        ('Публикация', {
            'fields': ('is_published',)
        }),
    )
    
    actions = ['publish_posts', 'unpublish_posts']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 100px; max-width: 200px;" />', obj.image.url)
        elif obj.image_url:
            return format_html('<img src="{}" style="max-height: 100px; max-width: 200px;" />', obj.image_url)
        return "Нет изображения"
    image_preview.short_description = 'Превью'
    
    def publish_posts(self, request, queryset):
        count = queryset.update(is_published=True)
        self.message_user(request, f"{count} записей опубликовано")
    publish_posts.short_description = "Опубликовать выбранные записи"
    
    def unpublish_posts(self, request, queryset):
        count = queryset.update(is_published=False)
        self.message_user(request, f"{count} записей снято с публикации")
    unpublish_posts.short_description = "Снять с публикации"
    
    class Media:
        css = {
            'all': ('css/admin.css', 'css/admin-editor.css')
        }
        js = ('js/admin-editor.js',)
    
    def formfield_for_dbfield(self, db_field, **kwargs):
        formfield = super().formfield_for_dbfield(db_field, **kwargs)
        if db_field.name == 'content':
            formfield.widget.attrs.update({
                'rows': 20,
                'style': 'min-height: 400px;'
            })
        return formfield


@admin.register(Inspiration)
class InspirationAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('title',)}
    list_display = ['title', 'is_published', 'created_at', 'order']
    list_filter = ['is_published', 'created_at']
    list_editable = ['is_published', 'order']
    search_fields = ['title', 'description']
    date_hierarchy = 'created_at'
    readonly_fields = ['image_preview']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'slug', 'description')
        }),
        ('Изображение', {
            'fields': ('image', 'image_url', 'image_preview'),
            'description': 'Загрузите изображение или укажите URL'
        }),
        ('Публикация', {
            'fields': ('is_published', 'order')
        }),
    )
    
    actions = ['publish_posts', 'unpublish_posts']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 100px; max-width: 200px;" />', obj.image.url)
        elif obj.image_url:
            return format_html('<img src="{}" style="max-height: 100px; max-width: 200px;" />', obj.image_url)
        return "Нет изображения"
    image_preview.short_description = 'Превью'
    
    def publish_posts(self, request, queryset):
        count = queryset.update(is_published=True)
        self.message_user(request, f"{count} записей опубликовано")
    publish_posts.short_description = "Опубликовать выбранные записи"
    
    def unpublish_posts(self, request, queryset):
        count = queryset.update(is_published=False)
        self.message_user(request, f"{count} записей снято с публикации")
    unpublish_posts.short_description = "Снять с публикации"