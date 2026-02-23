from django.contrib import admin
from django.utils.html import format_html
from django.utils.text import slugify
from .models import (
    Ingredient, Recipe, RecipeIngredient, 
    Collection, Step, RecipeImage, Video, BlogPost, Inspiration
)

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

@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('title',)}
    list_display = ['title', 'difficulty', 'cooking_time', 'is_featured', 'is_published', 'created_at']  # добавлено is_featured
    list_filter = ['difficulty', 'collections', 'is_featured', 'is_published']  # добавлено is_featured
    search_fields = ['title', 'description']
    inlines = [RecipeIngredientInline, StepInline, RecipeImageInline]
    filter_horizontal = ['collections']
    list_editable = ['is_featured', 'is_published']  # добавлено is_featured
    date_hierarchy = 'created_at'
    
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
            'fields': ('is_featured', 'is_published')  # добавлено is_featured
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
    list_display = ['recipe', 'title', 'video_url']

@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('title',)}
    list_display = ['title', 'author', 'reading_time', 'is_published', 'created_at', 'order']
    list_filter = ['is_published', 'author', 'created_at']
    search_fields = ['title', 'description', 'content']
    list_editable = ['is_published', 'order', 'reading_time']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'slug', 'description', 'content')
        }),
        ('Изображение', {
            'fields': ('image', 'image_url'),
            'description': 'Загрузите изображение или укажите URL'
        }),
        ('Мета информация', {
            'fields': ('author', 'reading_time', 'order')
        }),
        ('Публикация', {
            'fields': ('is_published',)
        }),
    )
    
    # Добавляем возможность просмотра превью изображения
    readonly_fields = ['image_preview']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 100px; max-width: 200px;" />', obj.image.url)
        elif obj.image_url:
            return format_html('<img src="{}" style="max-height: 100px; max-width: 200px;" />', obj.image_url)
        return "Нет изображения"
    image_preview.short_description = 'Превью'
    
    # Добавляем действия
    actions = ['publish_posts', 'unpublish_posts']
    
    def publish_posts(self, request, queryset):
        queryset.update(is_published=True)
        self.message_user(request, f"{queryset.count()} записей опубликовано")
    publish_posts.short_description = "Опубликовать выбранные записи"
    
    def unpublish_posts(self, request, queryset):
        queryset.update(is_published=False)
        self.message_user(request, f"{queryset.count()} записей снято с публикации")
    unpublish_posts.short_description = "Снять с публикации"
    
    # Подключаем CSS и JS для редактора

    class Media:
        css = {
            'all': ('css/admin.css', 'css/admin-editor.css')
        }
        js = ('js/admin-editor.js',)
    
    # Добавляем настройку для поля content
    def formfield_for_dbfield(self, db_field, **kwargs):
        formfield = super().formfield_for_dbfield(db_field, **kwargs)
        if db_field.name == 'content':
            formfield.widget.attrs['rows'] = 20  # Устанавливаем количество строк
            formfield.widget.attrs['style'] = 'min-height: 400px;'
        return formfield
    
@admin.register(Inspiration)
class InspirationAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('title',)}
    list_display = ['title', 'is_published', 'created_at', 'order']
    list_filter = ['is_published', 'created_at']
    search_fields = ['title', 'description']
    list_editable = ['is_published', 'order']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'slug', 'description')
        }),
        ('Изображение', {
            'fields': ('image', 'image_url'),
            'description': 'Загрузите изображение или укажите URL'
        }),
        ('Публикация', {
            'fields': ('is_published', 'order')
        }),
    )
    
    # Добавляем возможность просмотра превью изображения
    readonly_fields = ['image_preview']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 100px; max-width: 200px;" />', obj.image.url)
        elif obj.image_url:
            return format_html('<img src="{}" style="max-height: 100px; max-width: 200px;" />', obj.image_url)
        return "Нет изображения"
    image_preview.short_description = 'Превью'
    
    # Добавляем действия
    actions = ['publish_posts', 'unpublish_posts']
    
    def publish_posts(self, request, queryset):
        queryset.update(is_published=True)
        self.message_user(request, f"{queryset.count()} записей опубликовано")
    publish_posts.short_description = "Опубликовать выбранные записи"
    
    def unpublish_posts(self, request, queryset):
        queryset.update(is_published=False)
        self.message_user(request, f"{queryset.count()} записей снято с публикации")
    unpublish_posts.short_description = "Снять с публикации"