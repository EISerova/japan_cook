import random
from django.db.models import Count

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.urls import reverse
from django.utils.text import slugify
from .models import Recipe, Collection, Ingredient, RecipeIngredient, Step, Video, RecipeImage, BlogPost, Inspiration

# Главная страница
def home(request):
    """Главная страница сайта"""
    recent_recipes = Recipe.published.recent(3)
    collections = Collection.objects.all()[:4]
    
    # Получаем последнюю запись вдохновения
    latest_inspiration = Inspiration.published.recent(1).first()
    
    # Получаем последние записи блога
    recent_blog_posts = BlogPost.published.all()[:2]
    
    # Получаем все ингредиенты и сортируем их случайно
    all_ingredients = Ingredient.objects.all()
    ingredients = all_ingredients.order_by('?')[:6]
    
    # Получаем рекомендуемый рецепт для блока "Тарелка суши"
    featured_recipe = Recipe.published.filter(is_featured=True).first()
    
    # Преобразуем рецепты для JavaScript
    recent_recipes_json = []
    for recipe in recent_recipes:
        recent_recipes_json.append({
            'id': recipe.id,
            'slug': recipe.slug,
            'title': recipe.title,
            'image': recipe.image.url if recipe.image else recipe.image_url,
        })
    
    # Преобразуем коллекции для JavaScript
    collections_json = []
    for collection in collections:
        collections_json.append({
            'id': collection.id,
            'name': collection.name,
            'slug': collection.slug,
            'image': collection.image.url if collection.image else collection.image_url,
            'url': reverse('core:collection_detail', args=[collection.slug])
        })

    # Преобразуем ингредиенты для JavaScript с готовыми URL
    ingredients_json = []
    for ingredient in ingredients:
        ingredients_json.append({
            'id': ingredient.id,
            'name': ingredient.name,
            'slug': ingredient.slug,
            'url': reverse('core:recipes_by_ingredient', args=[ingredient.slug])
        })
    
    # Преобразуем записи блога для JavaScript
    blog_posts_json = []
    for post in recent_blog_posts:
        blog_posts_json.append({
            'id': post.id,
            'slug': post.slug,
            'title': post.title,
            'description': post.description,
            'image': post.get_image(),
            'reading_time': post.reading_time,
            'author': post.author or 'Администратор',
            'created_at': post.created_at.strftime('%d.%m.%Y'),
        })
    
    context = {
            'recent_recipes': recent_recipes,
            'recent_recipes_json': recent_recipes_json,
            'collections': collections,
            'collections_json': collections_json,
            'ingredients': ingredients,
            'ingredients_json': ingredients_json,
            'featured_recipe': featured_recipe,
            'recent_blog_posts': recent_blog_posts,
            'blog_posts_json': blog_posts_json,
            'latest_inspiration': latest_inspiration,  # Добавляем последнее вдохновение
        }
    return render(request, 'base.html', context)

# Страница списка рецептов
def recipes_list(request):
    """Страница со всеми рецептами"""
    recipes = Recipe.published.all()
    
    # Преобразуем рецепты в формат для JavaScript
    recipes_json = []
    for recipe in recipes:
        # Получаем первую коллекцию для категории
        first_collection = recipe.get_first_collection()
        
        recipes_json.append({
            'id': recipe.id,
            'slug': recipe.slug,
            'title': recipe.title,
            'category': first_collection.name if first_collection else 'Без категории',
            'time': f"{recipe.cooking_time} мин",
            'difficulty': recipe.get_difficulty_display(),
            'image': recipe.image.url if recipe.image else recipe.image_url,
        })
    
    context = {
        'recipes': recipes,
        'recipes_json': recipes_json,
    }
    return render(request, 'recipes-list.html', context)

# Детальная страница рецепта
def recipe_detail(request, slug):
    """Детальная страница рецепта"""
    recipe = get_object_or_404(Recipe, slug=slug, is_published=True)
    ingredients = recipe.get_ingredients()
    steps = recipe.steps.all()
    collections = recipe.collections.all()
    
    context = {
        'recipe': recipe,
        'ingredients': ingredients,
        'steps': steps,
        'collections': collections,
    }
    return render(request, 'recipe-detail.html', context)

# Функция для создания рецепта (административная функция)
def create_recipe(request):
    """
    Функция для создания нового рецепта (доступна только администраторам)
    """
    if request.method == 'POST':
        try:
            # 1. Создаем основной объект Recipe
            recipe = Recipe.objects.create(
                title=request.POST.get('title'),
                slug=slugify(request.POST.get('title')),
                description=request.POST.get('description'),
                image=request.FILES.get('image'),
                image_url=request.POST.get('image_url'),
                cooking_time=request.POST.get('cooking_time', 30),
                servings=request.POST.get('servings', 4),
                difficulty=request.POST.get('difficulty', 'medium'),
                is_published=request.POST.get('is_published', False) == 'on',
            )
            
            # 2. Добавляем коллекции
            collection_ids = request.POST.getlist('collections')
            if collection_ids:
                recipe.collections.set(collection_ids)
            
            # 3. Добавляем ингредиенты
            ingredient_names = request.POST.getlist('ingredient_name')
            ingredient_quantities = request.POST.getlist('ingredient_quantity')
            
            for i, name in enumerate(ingredient_names):
                if name and ingredient_quantities[i]:
                    ingredient, _ = Ingredient.objects.get_or_create(
                        name=name,
                        defaults={'slug': slugify(name)}
                    )
                    RecipeIngredient.objects.create(
                        recipe=recipe,
                        ingredient=ingredient,
                        quantity=ingredient_quantities[i],
                        order=i
                    )
            
            # 4. Добавляем шаги
            step_descriptions = request.POST.getlist('step_description')
            for i, desc in enumerate(step_descriptions):
                if desc:
                    Step.objects.create(
                        recipe=recipe,
                        number=i+1,
                        description=desc,
                    )
            
            # 5. Добавляем видео
            video_url = request.POST.get('video_url')
            if video_url:
                Video.objects.create(
                    recipe=recipe,
                    video_url=video_url
                )
            
            messages.success(request, f'Рецепт "{recipe.title}" успешно создан!')
            return redirect('recipe_detail', slug=recipe.slug)
            
        except Exception as e:
            messages.error(request, f'Ошибка при создании рецепта: {e}')
    
    # GET запрос - показываем форму
    collections = Collection.objects.all()
    context = {
        'collections': collections,
        'difficulty_choices': Recipe.DIFFICULTY_CHOICES,
    }
    return render(request, 'admin/create_recipe.html', context)

# Страница коллекции
def collection_detail(request, slug):
    """Страница с рецептами из определенной коллекции"""
    collection = get_object_or_404(Collection, slug=slug)
    recipes = collection.get_published_recipes()
    
    # Преобразуем рецепты в формат для JavaScript
    recipes_json = []
    for recipe in recipes:
        first_collection = recipe.get_first_collection()
        recipes_json.append({
            'id': recipe.id,
            'slug': recipe.slug,
            'title': recipe.title,
            'category': first_collection.name if first_collection else 'Без категории',
            'time': f"{recipe.cooking_time} мин",
            'difficulty': recipe.get_difficulty_display(),
            'image': recipe.image.url if recipe.image else recipe.image_url,
        })
    
    context = {
        'collection': collection,
        'recipes': recipes,
        'recipes_json': recipes_json,  # ← Это передается в шаблон
    }
    return render(request, 'collection_detail.html', context)

def recipes_by_ingredient(request, ingredient_slug):
    """Страница с рецептами, содержащими определенный ингредиент"""
    ingredient = get_object_or_404(Ingredient, slug=ingredient_slug)
    
    # Получаем все рецепты, которые содержат этот ингредиент
    recipes = Recipe.published.filter(
        recipe_ingredients__ingredient=ingredient
    ).distinct()
    
    # Преобразуем рецепты в формат для JavaScript
    recipes_json = []
    for recipe in recipes:
        first_collection = recipe.get_first_collection()
        recipes_json.append({
            'id': recipe.id,
            'slug': recipe.slug,
            'title': recipe.title,
            'category': first_collection.name if first_collection else 'Без категории',
            'time': f"{recipe.cooking_time} мин",
            'difficulty': recipe.get_difficulty_display(),
            'image': recipe.image.url if recipe.image else recipe.image_url,
        })
    
    context = {
        'ingredient': ingredient,
        'recipes': recipes,
        'recipes_json': recipes_json,
    }
    return render(request, 'recipes-by-ingredient.html', context)


def blog_list(request):
    """Страница со списком всех записей блога"""
    blog_posts = BlogPost.published.all()
    
    # Преобразуем записи в формат для JavaScript
    blog_posts_json = []
    for post in blog_posts:
        blog_posts_json.append({
            'id': post.id,
            'slug': post.slug,
            'title': post.title,
            'description': post.description,
            'image': post.get_image(),
            'reading_time': post.reading_time,
            'author': post.author or 'Администратор',
            'created_at': post.created_at.strftime('%d.%m.%Y'),
        })
    
    context = {
        'blog_posts': blog_posts,
        'blog_posts_json': blog_posts_json,
    }
    return render(request, 'blog-list.html', context)


def blog_detail(request, slug):
    """Детальная страница записи блога"""
    blog_post = get_object_or_404(BlogPost, slug=slug, is_published=True)
    
    # Получаем похожие записи (последние 3, исключая текущую)
    related_posts = BlogPost.published.exclude(id=blog_post.id)[:3]
    
    context = {
        'blog_post': blog_post,
        'related_posts': related_posts,
    }
    return render(request, 'blog-detail.html', context)

def inspiration_list(request):
    """Страница со списком всех записей вдохновения"""
    inspirations = Inspiration.published.all()
    
    # Преобразуем записи в формат для JavaScript
    inspirations_json = []
    for item in inspirations:
        inspirations_json.append({
            'id': item.id,
            'slug': item.slug,
            'title': item.title,
            'description': item.description,
            'image': item.get_image(),
            'created_at': item.created_at.strftime('%d.%m.%Y'),
        })
    
    context = {
        'inspirations': inspirations,
        'inspirations_json': inspirations_json,
    }
    return render(request, 'inspiration-list.html', context)


def inspiration_detail(request, slug):
    """Детальная страница записи вдохновения"""
    inspiration = get_object_or_404(Inspiration, slug=slug, is_published=True)
    
    context = {
        'inspiration': inspiration,
    }
    return render(request, 'inspiration-detail.html', context)