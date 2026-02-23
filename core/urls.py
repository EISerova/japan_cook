from django.urls import path
from . import views

app_name = 'core'  # пространство имен для приложения

urlpatterns = [
    path('', views.home, name='home'),
    path('recipes/', views.recipes_list, name='recipes-list'),
    path('recipe/<slug:slug>/', views.recipe_detail, name='recipe_detail'),
    path('collection/<slug:slug>/', views.collection_detail, name='collection_detail'),
    path('ingredient/<slug:ingredient_slug>/', views.recipes_by_ingredient, name='recipes_by_ingredient'),
    path('blog/', views.blog_list, name='blog_list'),
    path('blog/<slug:slug>/', views.blog_detail, name='blog_detail'),
    path('inspiration/', views.inspiration_list, name='inspiration_list'),
    path('inspiration/<slug:slug>/', views.inspiration_detail, name='inspiration_detail'),
    path('admin/create-recipe/', views.create_recipe, name='create_recipe'),    

]