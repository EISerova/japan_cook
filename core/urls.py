from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    # Главная
    path('', views.home, name='home'),
    
    # Рецепты
    path('recipes/', views.recipes_list, name='recipes-list'),
    path('recipe/<slug:slug>/', views.recipe_detail, name='recipe_detail'),
    
    # Коллекции и ингредиенты
    path('collection/<slug:slug>/', views.collection_detail, name='collection_detail'),
    path('ingredient/<slug:ingredient_slug>/', views.recipes_by_ingredient, name='recipes_by_ingredient'),
    
    # Блог
    path('blog/', views.blog_list, name='blog_list'),
    path('blog/<slug:slug>/', views.blog_detail, name='blog_detail'),
    
    # Вдохновение
    path('inspiration/', views.inspiration_list, name='inspiration_list'),
    path('inspiration/<slug:slug>/', views.inspiration_detail, name='inspiration_detail'),
    
    # Видео
    path('video/', views.video_list, name='video_list'),
    path('video/<int:video_id>/', views.video_detail, name='video_detail'),
    
    # Поиск, о нас, создание
    path('search/', views.search, name='search'),
    path('about/', views.about, name='about'),
    path('admin/create-recipe/', views.create_recipe, name='create_recipe'),
]