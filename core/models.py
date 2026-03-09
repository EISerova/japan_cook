from django.db import models
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils.text import slugify
import re

# ========== МЕНЕДЖЕРЫ ==========
class PublishedManager(models.Manager):
    """Менеджер для опубликованных объектов"""
    def get_queryset(self):
        return super().get_queryset().filter(is_published=True)
    
    def recent(self, count=6):
        return self.get_queryset().order_by('-created_at')[:count]
    
    def from_collection(self, collection_slug):
        return self.get_queryset().filter(collections__slug=collection_slug)


# ========== ИНГРЕДИЕНТЫ ==========
class Ingredient(models.Model):
    """Модель ингредиента"""
    name = models.CharField('Название', max_length=100)
    slug = models.SlugField('URL', max_length=100, unique=True, blank=True)
    
    class Meta:
        verbose_name = 'Ингредиент'
        verbose_name_plural = 'Ингредиенты'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class RecipeIngredient(models.Model):
    """Связующая модель для ингредиентов в рецепте"""
    recipe = models.ForeignKey('Recipe', on_delete=models.CASCADE, related_name='recipe_ingredients', verbose_name='Рецепт')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='recipe_ingredients', verbose_name='Ингредиент')
    quantity = models.CharField('Количество', max_length=100)
    order = models.PositiveIntegerField('Порядок', default=0)
    
    class Meta:
        verbose_name = 'Ингредиент рецепта'
        verbose_name_plural = 'Ингредиенты рецепта'
        ordering = ['order']
        unique_together = ['recipe', 'ingredient']
    
    def __str__(self):
        return f"{self.ingredient.name}: {self.quantity}"


# ========== КОЛЛЕКЦИИ ==========
class Collection(models.Model):
    """Модель коллекции рецептов"""
    name = models.CharField('Название', max_length=100)
    slug = models.SlugField('URL', max_length=100, unique=True)
    description = models.TextField('Описание', blank=True)
    image = models.ImageField('Изображение коллекции', upload_to='collections/', blank=True, null=True)
    image_url = models.URLField('URL изображения', blank=True, null=True)
    order = models.PositiveIntegerField('Порядок', default=0)
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Коллекция'
        verbose_name_plural = 'Коллекции'
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name
    
    def get_absolute_url(self):
        return reverse('core:collection_detail', args=[self.slug])
    
    def get_published_recipes(self):
        return self.recipes.filter(is_published=True)
    
    def get_random_recipes(self, count=3):
        return self.get_published_recipes().order_by('?')[:count]
    
    def get_recent_recipes(self, count=6):
        return self.get_published_recipes().order_by('-created_at')[:count]


# ========== РЕЦЕПТЫ ==========
class Recipe(models.Model):
    """Модель рецепта"""
    DIFFICULTY_CHOICES = [
        ('easy', 'Легко'),
        ('medium', 'Средне'),
        ('hard', 'Сложно'),
    ]
    
    # Основная информация
    title = models.CharField('Название', max_length=200)
    slug = models.SlugField('URL', max_length=200, unique=True)
    description = models.TextField('Описание')
    image = models.ImageField('Главное фото', upload_to='recipes/')
    image_url = models.URLField('URL фото (для заглушек)', blank=True, null=True)
    
    # Параметры
    cooking_time = models.PositiveIntegerField('Время приготовления (мин)', default=30)
    servings = models.PositiveIntegerField('Количество порций', default=4)
    difficulty = models.CharField('Сложность', max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    
    # Связи
    collections = models.ManyToManyField(Collection, related_name='recipes', verbose_name='Коллекции', blank=True)
    
    # Статусы
    is_published = models.BooleanField('Опубликовано', default=True, db_index=True)
    is_featured = models.BooleanField('На главную', default=False, db_index=True, 
                                      help_text='Отображать в блоке "Главный рецепт"')
    
    # Даты
    created_at = models.DateTimeField('Дата создания', auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    objects = models.Manager()
    published = PublishedManager()
    
    class Meta:
        verbose_name = 'Рецепт'
        verbose_name_plural = 'Рецепты'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['slug']),
            models.Index(fields=['is_published', 'is_featured']),
        ]
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
            return reverse('core:recipe_detail', args=[self.slug])
    
    def get_first_collection(self):
        return self.collections.first()
    
    def get_ingredients(self):
        return self.recipe_ingredients.select_related('ingredient').all().order_by('order')
    
    def has_video(self):
        return self.videos.exists()
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        
        # Проверяем уникальность slug
        original_slug = self.slug
        counter = 1
        
        while Recipe.objects.filter(slug=self.slug).exclude(id=self.id).exists():
            self.slug = f"{original_slug}-{counter}"
            counter += 1
        
        super().save(*args, **kwargs)


# ========== ШАГИ ПРИГОТОВЛЕНИЯ ==========
class Step(models.Model):
    """Модель шага приготовления"""
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='steps', verbose_name='Рецепт')
    number = models.PositiveIntegerField('Номер шага')
    description = models.TextField('Описание')
    image = models.ImageField('Фото шага', upload_to='steps/', blank=True, null=True)
    image_url = models.URLField('URL фото шага', blank=True, null=True)
    
    class Meta:
        verbose_name = 'Шаг приготовления'
        verbose_name_plural = 'Шаги приготовления'
        ordering = ['number']
    
    def __str__(self):
        return f"Шаг {self.number}: {self.recipe.title}"
    
    def has_image(self):
        return bool(self.image or self.image_url)
    
    def save(self, *args, **kwargs):
        if not self.number:
            last_step = Step.objects.filter(recipe=self.recipe).order_by('-number').first()
            self.number = (last_step.number + 1) if last_step else 1
        super().save(*args, **kwargs)


class RecipeImage(models.Model):
    """Модель для дополнительных изображений"""
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='additional_images', verbose_name='Рецепт')
    image = models.ImageField('Изображение', upload_to='recipes/additional/')
    caption = models.CharField('Подпись', max_length=200, blank=True)
    step = models.ForeignKey(Step, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Шаг')
    
    class Meta:
        verbose_name = 'Дополнительное изображение'
        verbose_name_plural = 'Дополнительные изображения'
    
    def __str__(self):
        return f"Изображение для {self.recipe.title}"


# ========== ВИДЕО ==========
class Video(models.Model):
    """Модель видео"""
    VIDEO_TYPES = (
        ('youtube', 'YouTube'),
        ('vk', 'VK Видео'),
        ('rutube', 'RuTube'),
        ('other', 'Другое'),
    )
    
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='videos', verbose_name='Рецепт')
    title = models.CharField('Название видео', max_length=200, blank=True, 
                           help_text='Оставьте пустым, чтобы использовать название рецепта')
    video_type = models.CharField('Тип видео', max_length=20, choices=VIDEO_TYPES, default='vk')
    video_url = models.URLField('Ссылка на видео', max_length=500, blank=True)
    embed_code = models.TextField('Код для встраивания', blank=True)
    duration = models.CharField('Длительность', max_length=20, blank=True, help_text='Например: 15:30')
    order = models.PositiveIntegerField('Порядок', default=0)
    is_main = models.BooleanField('Главное видео', default=False)
    created_at = models.DateTimeField('Дата добавления', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        verbose_name = 'Видео'
        verbose_name_plural = 'Видео'
        ordering = ['order', '-created_at']
    
    def __str__(self):
        return self.title or f"Видео для {self.recipe.title}"
    
    def save(self, *args, **kwargs):
        if not self.title and self.recipe:
            self.title = f"Видео: {self.recipe.title}"
        if self.video_url and not self.embed_code:
            self.embed_code = self._convert_to_embed()
        super().save(*args, **kwargs)
    
    def _convert_to_embed(self):
        url, vtype = self.video_url, self.video_type
        patterns = {
            'vk': [
                r'vk\.com/video(-?\d+)_(\d+)',
                r'vk\.com/video/(-?\d+)_(\d+)',
                r'vkvideo\.ru/video/(-?\d+)_(\d+)',
            ],
            'youtube': [
                r'youtube\.com/watch\?v=([^&]+)',
                r'youtu\.be/([^?]+)',
            ],
            'rutube': [
                r'rutube\.ru/video/([^/?]+)',
            ]
        }
        
        if 'vk' in vtype or 'vk.com' in url:
            for pattern in patterns['vk']:
                match = re.search(pattern, url)
                if match:
                    oid, vid = match.groups()
                    return f'<iframe src="https://vkvideo.ru/video_ext.php?oid={oid}&id={vid}&hd=4" width="100%" height="100%" allowfullscreen></iframe>'
        
        elif 'youtube' in vtype or 'youtube.com' in url:
            for pattern in patterns['youtube']:
                match = re.search(pattern, url)
                if match:
                    vid = match.group(1)
                    return f'<iframe src="https://www.youtube.com/embed/{vid}" width="100%" height="100%" allowfullscreen></iframe>'
        
        elif 'rutube' in vtype or 'rutube.ru' in url:
            for pattern in patterns['rutube']:
                match = re.search(pattern, url)
                if match:
                    vid = match.group(1)
                    return f'<iframe src="https://rutube.ru/play/embed/{vid}" width="100%" height="100%" allowfullscreen></iframe>'
        
        return url
    
    def get_embed_html(self):
        return mark_safe(self.embed_code) if self.embed_code else '<p>Видео не доступно</p>'
    
    def get_absolute_url(self):
        return reverse('core:video_detail', args=[self.id])


# ========== БЛОГ ==========
class BlogPost(models.Model):
    """Модель для записей блога"""
    title = models.CharField('Заголовок', max_length=200)
    slug = models.SlugField('URL', max_length=200, unique=True)
    description = models.TextField('Краткое описание')
    content = models.TextField('Полный текст статьи')
    image = models.ImageField('Изображение', upload_to='blog/', blank=True, null=True)
    image_url = models.URLField('URL изображения', blank=True, null=True)
    author = models.CharField('Автор', max_length=100, blank=True)
    reading_time = models.PositiveIntegerField('Время чтения (мин)', default=5)
    created_at = models.DateTimeField('Дата создания', auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    is_published = models.BooleanField('Опубликовано', default=True, db_index=True)
    order = models.PositiveIntegerField('Порядок', default=0)
    
    objects = models.Manager()
    
    class PublishedManager(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(is_published=True)
        
        def recent(self, count=4):
            return self.get_queryset()[:count]
    
    published = PublishedManager()
    
    class Meta:
        verbose_name = 'Запись блога'
        verbose_name_plural = 'Записи блога'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['slug']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('core:blog_detail', args=[self.slug])
    
    def get_image(self):
        return self.image.url if self.image else self.image_url
    
    def get_content_html(self):
        return mark_safe(self.content)


# ========== ВДОХНОВЕНИЕ ==========
class Inspiration(models.Model):
    """Модель для записей вдохновения"""
    title = models.CharField('Заголовок', max_length=200)
    slug = models.SlugField('URL', max_length=200, unique=True)
    description = models.TextField('Описание')
    image = models.ImageField('Изображение', upload_to='inspiration/', blank=True, null=True)
    image_url = models.URLField('URL изображения', blank=True, null=True)
    created_at = models.DateTimeField('Дата создания', auto_now_add=True, db_index=True)
    is_published = models.BooleanField('Опубликовано', default=True, db_index=True)
    order = models.PositiveIntegerField('Порядок', default=0)
    
    objects = models.Manager()
    
    class PublishedManager(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(is_published=True)
        
        def recent(self, count=1):
            return self.get_queryset().order_by('-created_at')[:count]
    
    published = PublishedManager()
    
    class Meta:
        verbose_name = 'Вдохновение'
        verbose_name_plural = 'Вдохновение'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('core:inspiration_detail', args=[self.slug])
    
    def get_image(self):
        return self.image.url if self.image else self.image_url