from django.db import models
from django.urls import reverse
from django.utils.safestring import mark_safe


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
    ingredient = models.ForeignKey('Ingredient', on_delete=models.CASCADE, related_name='recipe_ingredients', verbose_name='Ингредиент')
    quantity = models.CharField('Количество', max_length=100)  # "150 г", "2-3 шт.", "по вкусу"
    order = models.PositiveIntegerField('Порядок', default=0)
    
    class Meta:
        verbose_name = 'Ингредиент рецепта'
        verbose_name_plural = 'Ингредиенты рецепта'
        ordering = ['order']
        unique_together = ['recipe', 'ingredient']  # чтобы один ингредиент не добавили дважды
    
    def __str__(self):
        return f"{self.ingredient.name}: {self.quantity}"

class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_published=True)
    
    def recent(self, count=6):
        return self.get_queryset().order_by('-created_at')[:count]
    
    def from_collection(self, collection_slug):
        return self.get_queryset().filter(collections__slug=collection_slug)

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
    
    # Мета информация
    cooking_time = models.PositiveIntegerField('Время приготовления (мин)', default=30)
    servings = models.PositiveIntegerField('Количество порций', default=4)
    difficulty = models.CharField('Сложность', max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    
    # Коллекции
    collections = models.ManyToManyField('Collection', related_name='recipes', verbose_name='Коллекции', blank=True)
    
    # Даты
    created_at = models.DateTimeField('Дата создания', auto_now_add=True, db_index=True)
    is_published = models.BooleanField('Опубликовано', default=True, db_index=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    is_featured = models.BooleanField('На главную', default=False, db_index=True, 
                                      help_text='Отображать этот рецепт в блоке "Главный рецепт"')

    objects = models.Manager()  # все рецепты (включая неопубликованные для админа)
    published = PublishedManager()  # только опубликованные для пользователей
    
    class Meta:
        verbose_name = 'Рецепт'
        verbose_name_plural = 'Рецепты'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('recipe_detail', args=[self.slug])
    
    def get_collections_list(self):
        """Возвращает список коллекций для отображения"""
        return self.collections.all()
    
    def get_first_collection(self):
        """Возвращает первую коллекцию (для badge на карточке)"""
        return self.collections.first()
    
    # Методы для работы с ингредиентами
    def get_ingredients(self):
        """Возвращает все ингредиенты рецепта с количествами"""
        return self.recipe_ingredients.select_related('ingredient').all().order_by('order')
    
    def get_ingredients_list(self):
        """Возвращает список названий ингредиентов (для быстрого доступа)"""
        return [ri.ingredient.name for ri in self.recipe_ingredients.all()]
    
    def add_ingredient(self, ingredient, quantity, order=0):
        """Добавляет ингредиент к рецепту"""
        recipe_ingredient, created = self.recipe_ingredients.get_or_create(
            ingredient=ingredient,
            defaults={'quantity': quantity, 'order': order}
        )
        if not created:
            recipe_ingredient.quantity = quantity
            recipe_ingredient.order = order
            recipe_ingredient.save()
        return recipe_ingredient
    
    def has_video(self):
        """Проверяет, есть ли видео у рецепта"""
        return hasattr(self, 'video')
    

class Collection(models.Model):
    """Модель коллекции рецептов (например, "Вегетарианское", "Бэнто", "Праздники")"""
    
    name = models.CharField('Название', max_length=100)
    slug = models.SlugField('URL', max_length=100, unique=True)
    description = models.TextField('Описание', blank=True)
    image = models.ImageField('Изображение коллекции', upload_to='collections/', blank=True, null=True)
    image_url = models.URLField('URL изображения', blank=True, null=True)
    
    # Для сортировки
    order = models.PositiveIntegerField('Порядок', default=0)
    
    # Даты
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Коллекция'
        verbose_name_plural = 'Коллекции'
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name
    
    def get_absolute_url(self):
        return reverse('collection_detail', args=[self.slug])
    
    def get_all_recipes(self):
        """Возвращает все рецепты в коллекции"""
        return self.recipes.all()
    
    def get_published_recipes(self):
        """Возвращает только опубликованные рецепты"""
        return self.recipes.filter(is_published=True)
    
    def get_random_recipes(self, count=3):
        """Возвращает случайные рецепты из коллекции (для виджетов)"""
        return self.get_published_recipes().order_by('?')[:count]
    
    def get_recent_recipes(self, count=6):
        """Возвращает последние добавленные рецепты"""
        return self.get_published_recipes().order_by('-created_at')[:count]
    

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
        """Автоматически устанавливает номер шага, если не указан"""
        if not self.number:
            last_step = Step.objects.filter(recipe=self.recipe).order_by('-number').first()
            self.number = (last_step.number + 1) if last_step else 1
        super().save(*args, **kwargs)
    
    
class RecipeImage(models.Model):
    """Модель для дополнительных изображений рецепта"""
    
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='additional_images', verbose_name='Рецепт')
    image = models.ImageField('Изображение', upload_to='recipes/additional/')
    caption = models.CharField('Подпись', max_length=200, blank=True)
    step = models.ForeignKey(Step, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Шаг')
    
    class Meta:
        verbose_name = 'Дополнительное изображение'
        verbose_name_plural = 'Дополнительные изображения'
    
    def __str__(self):
        return f"Изображение для {self.recipe.title}"
    

class Video(models.Model):
    """Модель видео рецепта"""
    
    recipe = models.OneToOneField(Recipe, on_delete=models.CASCADE, related_name='video', verbose_name='Рецепт')
    title = models.CharField('Название видео', max_length=200, blank=True)
    video_url = models.URLField('URL видео (YouTube)')
    
    class Meta:
        verbose_name = 'Видео рецепта'
        verbose_name_plural = 'Видео рецептов'
    
    def __str__(self):
        return f"Видео для {self.recipe.title}"
    
    def get_embed_url(self):
        """Преобразует YouTube URL в embed формат"""
        if 'youtube.com/watch?v=' in self.video_url:
            video_id = self.video_url.split('v=')[1]
            return f'https://www.youtube.com/embed/{video_id}'
        return self.video_url
    
    def get_thumbnail_url(self):
        """Возвращает URL превью для YouTube видео"""
        if 'youtube.com/watch?v=' in self.video_url:
            video_id = self.video_url.split('v=')[1]
            return f'https://img.youtube.com/vi/{video_id}/maxresdefault.jpg'
        return None

class BlogPost(models.Model):
    """Модель для записей блога"""
    
    title = models.CharField('Заголовок', max_length=200)
    slug = models.SlugField('URL', max_length=200, unique=True)
    description = models.TextField('Краткое описание')
    content = models.TextField('Полный текст статьи')
    image = models.ImageField('Изображение', upload_to='blog/', blank=True, null=True)
    image_url = models.URLField('URL изображения', blank=True, null=True)
    
    # Мета информация
    author = models.CharField('Автор', max_length=100, blank=True)
    reading_time = models.PositiveIntegerField('Время чтения (мин)', default=5)
    
    # Даты
    created_at = models.DateTimeField('Дата создания', auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    is_published = models.BooleanField('Опубликовано', default=True, db_index=True)
    
    # Для сортировки
    order = models.PositiveIntegerField('Порядок', default=0)
    
    # Менеджеры - ОПРЕДЕЛЯЕМ ВНУТРИ КЛАССА
    objects = models.Manager()  # стандартный менеджер
    
    class PublishedManager(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(is_published=True)
        
        def recent(self, count=4):
            return self.get_queryset()[:count]
    
    published = PublishedManager()  # кастомный менеджер для опубликованных
    
    class Meta:
        verbose_name = 'Запись блога'
        verbose_name_plural = 'Записи блога'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('core:blog_detail', args=[self.slug])
    
    def get_image(self):
        """Возвращает URL изображения"""
        if self.image:
            return self.image.url
        return self.image_url
    
    def get_content_html(self):
        """Возвращает контент с безопасным HTML"""
        return mark_safe(self.content)


class Inspiration(models.Model):
    """Модель для записей вдохновения"""
    
    title = models.CharField('Заголовок', max_length=200)
    slug = models.SlugField('URL', max_length=200, unique=True)
    description = models.TextField('Описание')
    image = models.ImageField('Изображение', upload_to='inspiration/', blank=True, null=True)
    image_url = models.URLField('URL изображения', blank=True, null=True)
    
    # Даты
    created_at = models.DateTimeField('Дата создания', auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    is_published = models.BooleanField('Опубликовано', default=True, db_index=True)
    
    # Для сортировки
    order = models.PositiveIntegerField('Порядок', default=0)
    
    # Менеджеры
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
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('core:inspiration_detail', args=[self.slug])
    
    def get_image(self):
        """Возвращает URL изображения"""
        if self.image:
            return self.image.url
        return self.image_url