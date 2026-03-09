import random
from django.db.models import Q, Count, Prefetch
from django.core.paginator import Paginator
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.urls import reverse
from django.utils.text import slugify
from django.utils import timezone
from .models import Recipe, Collection, Ingredient, RecipeIngredient, Step, Video, BlogPost, Inspiration

# ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
def format_recipe_json(recipe, include_collections=False):
    """Форматирует рецепт для JSON"""
    data = {
        'id': recipe.id,
        'slug': recipe.slug,
        'title': recipe.title,
        'time': f"{recipe.cooking_time} мин",
        'difficulty': recipe.get_difficulty_display(),
        'image': recipe.image.url if recipe.image else recipe.image_url,
    }
    
    if include_collections:
        data['collections'] = [c.slug for c in recipe.collections.all()]
    
    first_collection = recipe.get_first_collection()
    data['category'] = first_collection.name if first_collection else 'Без категории'
    
    return data


def format_collection_json(collection):
    """Форматирует коллекцию для JSON"""
    return {
        'id': collection.id,
        'name': collection.name,
        'slug': collection.slug,
        'image': collection.image.url if collection.image else collection.image_url,
        'url': reverse('core:collection_detail', args=[collection.slug])
    }


def format_ingredient_json(ingredient):
    """Форматирует ингредиент для JSON"""
    return {
        'id': ingredient.id,
        'name': ingredient.name,
        'slug': ingredient.slug,
        'url': reverse('core:recipes_by_ingredient', args=[ingredient.slug])
    }


def format_blog_post_json(post):
    """Форматирует запись блога для JSON"""
    return {
        'id': post.id,
        'slug': post.slug,
        'title': post.title,
        'description': post.description,
        'image': post.get_image(),
        'reading_time': post.reading_time,
        'author': post.author or 'Администратор',
        'created_at': post.created_at.strftime('%d.%m.%Y'),
    }


def format_inspiration_json(item):
    """Форматирует запись вдохновения для JSON"""
    return {
        'id': item.id,
        'slug': item.slug,
        'title': item.title,
        'description': item.description,
        'image': item.get_image(),
        'created_at': item.created_at.strftime('%d.%m.%Y'),
    }


def format_video_json(video):
    """Форматирует видео для JSON"""
    recipe_image = None
    if video.recipe:
        recipe_image = video.recipe.image.url if video.recipe.image else video.recipe.image_url
    
    return {
        'id': video.id,
        'title': video.title or f"Видео: {video.recipe.title}",
        'duration': video.duration or '—',
        'image': recipe_image or "https://images.unsplash.com/photo-1638628081165-b5afe1ecebf3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        'recipe_slug': video.recipe.slug if video.recipe else None,
        'embed_code': video.embed_code,
    }


# ========== ГЛАВНАЯ СТРАНИЦА ==========
def home(request):
    """Главная страница сайта"""
    recent_recipes = Recipe.published.select_related().prefetch_related('collections')[:3]
    collections = Collection.objects.all()[:4]
    latest_inspiration = Inspiration.published.order_by('-created_at').first()
    recent_blog_posts = BlogPost.published.all()[:2]
    ingredients = Ingredient.objects.order_by('?')[:6]
    featured_recipe = Recipe.published.filter(is_featured=True).first()
    
    context = {
        'recent_recipes': recent_recipes,
        'recent_recipes_json': [format_recipe_json(r) for r in recent_recipes],
        'collections': collections,
        'collections_json': [format_collection_json(c) for c in collections],
        'ingredients': ingredients,
        'ingredients_json': [format_ingredient_json(i) for i in ingredients],
        'featured_recipe': featured_recipe,
        'recent_blog_posts': recent_blog_posts,
        'blog_posts_json': [format_blog_post_json(p) for p in recent_blog_posts],
        'latest_inspiration': latest_inspiration,
    }
    return render(request, 'home.html', context)


# ========== РЕЦЕПТЫ ==========
def recipes_list(request):
    """Страница со всеми рецептами"""
    recipes = Recipe.published.prefetch_related('collections').all()
    collections = Collection.objects.all()
    
    context = {
        'recipes': recipes,
        'recipes_json': [format_recipe_json(r, include_collections=True) for r in recipes],
        'collections': collections,
        'collections_json': [{'id': c.id, 'name': c.name, 'slug': c.slug} for c in collections],
    }
    return render(request, 'recipes-list.html', context)


def recipe_detail(request, slug):
    """Детальная страница рецепта"""
    recipe = get_object_or_404(
        Recipe.objects.prefetch_related(
            'collections',
            Prefetch('steps', queryset=Step.objects.order_by('number')),
            Prefetch('recipe_ingredients__ingredient')
        ),
        slug=slug, 
        is_published=True
    )
    
    ingredients_list = [
        f"{ing.ingredient.name} {ing.quantity}" 
        for ing in recipe.get_ingredients()
    ]
    
    # Формируем JSON-LD данные
    json_ld = {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": recipe.title,
        "description": recipe.description,
        "image": request.build_absolute_uri(recipe.image.url if recipe.image else recipe.image_url),
        "author": {"@type": "Person", "name": "Японская кузина"},
        "datePublished": recipe.created_at.strftime("%Y-%m-%d"),
        "dateModified": (recipe.updated_at or recipe.created_at).strftime("%Y-%m-%d"),
        "prepTime": f"PT{recipe.cooking_time}M",
        "totalTime": f"PT{recipe.cooking_time}M",
        "recipeYield": f"{recipe.servings} порций",
        "recipeCategory": [c.name for c in recipe.collections.all()],
        "recipeCuisine": "Японская кухня",
        "recipeIngredient": ingredients_list,
        "keywords": ", ".join([c.name for c in recipe.collections.all()]) or "японская кухня",
        "mainEntityOfPage": request.build_absolute_uri(),
    }
    
    context = {
        'recipe': recipe,
        'ingredients': recipe.get_ingredients(),
        'steps': recipe.steps.all(),
        'collections': recipe.collections.all(),
        'json_ld': json_ld,
    }
    return render(request, 'recipe-detail.html', context)


def collection_detail(request, slug):
    """Детальная страница коллекции рецептов"""
    collection = get_object_or_404(Collection, slug=slug)
    recipes = collection.recipes.filter(is_published=True)
    
    context = {
        'collection': collection,
        'recipes': recipes,
        'recipes_json': [format_recipe_json(r) for r in recipes],
    }
    return render(request, 'collection_detail.html', context)


def recipes_by_ingredient(request, ingredient_slug):
    """Страница с рецептами по ингредиенту"""
    ingredient = get_object_or_404(Ingredient, slug=ingredient_slug)
    recipes = Recipe.published.filter(recipe_ingredients__ingredient=ingredient).distinct()
    
    context = {
        'ingredient': ingredient,
        'recipes': recipes,
        'recipes_json': [format_recipe_json(r) for r in recipes],
    }
    return render(request, 'recipes-by-ingredient.html', context)


# ========== БЛОГ ==========
def blog_list(request):
    """Страница со списком записей блога"""
    blog_posts = BlogPost.published.all()
    
    context = {
        'blog_posts': blog_posts,
        'blog_posts_json': [format_blog_post_json(p) for p in blog_posts],
    }
    return render(request, 'blog-list.html', context)


def blog_detail(request, slug):
    """Детальная страница записи блога"""
    blog_post = get_object_or_404(BlogPost, slug=slug, is_published=True)
    related_posts = BlogPost.published.exclude(id=blog_post.id)[:3]
    
    context = {
        'blog_post': blog_post,
        'related_posts': related_posts,
    }
    return render(request, 'blog-detail.html', context)


# ========== ВДОХНОВЕНИЕ ==========
def inspiration_list(request):
    """Страница со списком вдохновения"""
    inspirations = Inspiration.published.all()
    
    context = {
        'inspirations': inspirations,
        'inspirations_json': [format_inspiration_json(i) for i in inspirations],
    }
    return render(request, 'inspiration-list.html', context)


def inspiration_detail(request, slug):
    """Детальная страница вдохновения"""
    inspiration = get_object_or_404(Inspiration, slug=slug, is_published=True)
    
    return render(request, 'inspiration-detail.html', {'inspiration': inspiration})


# ========== ВИДЕО ==========
def video_list(request):
    """Страница со списком видео"""
    videos = Video.objects.select_related('recipe').order_by('-created_at')
    
    context = {
        'videos': videos,
        'videos_json': [format_video_json(v) for v in videos],
    }
    return render(request, 'video_list.html', context)


def video_detail(request, video_id):
    """Детальная страница видео"""
    video = get_object_or_404(Video.objects.select_related('recipe'), id=video_id)
    related_videos = Video.objects.exclude(id=video.id).select_related('recipe')[:3]
    
    context = {
        'video': video,
        'related_videos': related_videos,
    }
    return render(request, 'video_detail.html', context)


# ========== ПОИСК ==========
def search(request):
    """Поиск по сайту"""
    query = request.GET.get('q', '').strip()
    selected_type = request.GET.get('type', 'all')
    page = request.GET.get('page', 1)
    
    if not query or len(query) < 2:
        return render(request, 'search_results.html', {
            'query': query,
            'selected_type': selected_type,
            'counts': {'recipes': 0, 'blog': 0, 'inspiration': 0, 'total': 0},
            'results': {'recipes': [], 'blog': [], 'inspiration': []},
            'error': 'Введите минимум 2 символа для поиска' if query else None
        })
    
    # Оптимизированные запросы
    base_filters = Q(title__icontains=query) | Q(description__icontains=query)
    
    recipes_qs = Recipe.objects.filter(base_filters).only(
        'id', 'title', 'slug', 'image', 'image_url'
    ).distinct()
    
    blog_qs = BlogPost.objects.filter(base_filters).only(
        'id', 'title', 'slug', 'created_at', 'reading_time'
    ).distinct()
    
    inspiration_qs = Inspiration.objects.filter(base_filters).only(
        'id', 'title', 'slug', 'description'
    ).distinct()
    
    counts = {
        'recipes': recipes_qs.count(),
        'blog': blog_qs.count(),
        'inspiration': inspiration_qs.count(),
    }
    counts['total'] = sum(counts.values())
    
    context = {
        'query': query,
        'selected_type': selected_type,
        'counts': counts,
        'results': {'recipes': [], 'blog': [], 'inspiration': []}
    }
    
    # Фильтрация по типу
    if selected_type == 'all':
        context['results'].update({
            'recipes': recipes_qs[:6],
            'blog': blog_qs[:6],
            'inspiration': inspiration_qs[:6]
        })
    else:
        paginator = Paginator(locals()[f"{selected_type}_qs"], 12)
        page_obj = paginator.get_page(page)
        context['results'][selected_type] = page_obj
        context.update({'paginator': paginator, 'page_obj': page_obj})
    
    return render(request, 'search_results.html', context)


# ========== СЛУЖЕБНЫЕ ==========
def about(request):
    """Страница О нас"""
    return render(request, 'about.html', {'title': 'О проекте'})


def create_recipe(request):
    """Функция для создания нового рецепта (административная)"""
    if request.method == 'POST':
        try:
            recipe = Recipe.objects.create(
                title=request.POST.get('title'),
                slug=slugify(request.POST.get('title')),
                description=request.POST.get('description'),
                image=request.FILES.get('image'),
                image_url=request.POST.get('image_url'),
                cooking_time=int(request.POST.get('cooking_time', 30)),
                servings=int(request.POST.get('servings', 4)),
                difficulty=request.POST.get('difficulty', 'medium'),
                is_published=request.POST.get('is_published', False) == 'on',
            )
            
            if collection_ids := request.POST.getlist('collections'):
                recipe.collections.set(map(int, collection_ids))
            
            # Добавление ингредиентов
            ingredient_names = request.POST.getlist('ingredient_name')
            ingredient_quantities = request.POST.getlist('ingredient_quantity')
            
            for i, (name, qty) in enumerate(zip(ingredient_names, ingredient_quantities)):
                if name and qty:
                    ingredient, _ = Ingredient.objects.get_or_create(
                        name=name,
                        defaults={'slug': slugify(name)}
                    )
                    RecipeIngredient.objects.create(
                        recipe=recipe,
                        ingredient=ingredient,
                        quantity=qty,
                        order=i
                    )
            
            # Добавление шагов
            for i, desc in enumerate(request.POST.getlist('step_description')):
                if desc:
                    Step.objects.create(
                        recipe=recipe,
                        number=i+1,
                        description=desc,
                    )
            
            if video_url := request.POST.get('video_url'):
                Video.objects.create(recipe=recipe, video_url=video_url)
            
            messages.success(request, f'Рецепт "{recipe.title}" успешно создан!')
            return redirect('recipe_detail', slug=recipe.slug)
            
        except Exception as e:
            messages.error(request, f'Ошибка при создании рецепта: {e}')
    
    collections = Collection.objects.all()
    return render(request, 'admin/create_recipe.html', {
        'collections': collections,
        'collections_json': [{'id': c.id, 'name': c.name} for c in collections],
        'difficulty_choices': Recipe.DIFFICULTY_CHOICES,
    })