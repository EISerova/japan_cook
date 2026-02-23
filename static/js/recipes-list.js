// Состояние
let isAccessibleMode = false;
let displayedRecipes = 6; // Показываем первые 6 рецептов

// Функция для рендеринга рецептов
function renderRecipes() {
    const recipesGrid = document.getElementById('recipes-grid');
    if (!recipesGrid) return;

    // Используем данные из базы (window.recipesData) вместо статического allRecipes
    const recipes = window.recipesData || [];
    const recipesToShow = recipes.slice(0, displayedRecipes);
    
    if (recipesToShow.length === 0) {
        recipesGrid.innerHTML = '<p class="no-recipes">Рецепты не найдены</p>';
        return;
    }
    
    recipesGrid.innerHTML = recipesToShow.map(recipe => `
        <div class="recipe-card" data-recipe-slug="${recipe.slug}">
            <div class="recipe-image-wrapper">
                <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image">
                <div class="recipe-category" style="background-color: var(--color-primary); color: var(--color-bg);">${recipe.category}</div>
            </div>
            <div class="recipe-info">
                <h3 class="recipe-card-title">${recipe.title}</h3>
                <div class="recipe-meta">
                    <span>⏱ ${recipe.time}</span>
                    <span>• ${recipe.difficulty}</span>
                </div>
                <button class="recipe-view-btn" data-recipe-slug="${recipe.slug}">Посмотреть рецепт →</button>
            </div>
        </div>
    `).join('');
    
    // Прячем кнопку "Загрузить еще", если показаны все рецепты
    const loadMore = document.getElementById('load-more');
    if (loadMore) {
        if (displayedRecipes >= recipes.length) {
            loadMore.style.display = 'none';
        } else {
            loadMore.style.display = 'block';
        }
    }
}

// Инициализация Lucide иконок
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// Обработчики событий
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем наличие данных
    if (!window.recipesData || window.recipesData.length === 0) {
        console.warn('Нет данных о рецептах');
    }
    
    renderRecipes();

    // Back to top button
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                backToTop.classList.remove('hidden');
            } else {
                backToTop.classList.add('hidden');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Accessibility toggle
    const accessibilityToggle = document.getElementById('accessibility-toggle');
    if (accessibilityToggle) {
        accessibilityToggle.addEventListener('click', () => {
            isAccessibleMode = !isAccessibleMode;
            document.body.classList.toggle('accessible-mode', isAccessibleMode);
        });
    }

    // Language toggle
    const languageToggle = document.getElementById('language-toggle');
    if (languageToggle) {
        languageToggle.addEventListener('click', () => {
            const language = document.documentElement.lang === 'ru' ? 'en' : 'ru';
            document.documentElement.lang = language;
            alert(`Language switched to ${language === 'ru' ? 'Russian' : 'English'}`);
        });
    }

    // Load more button
    const loadMore = document.getElementById('load-more');
    if (loadMore) {
        loadMore.addEventListener('click', () => {
            const recipes = window.recipesData || [];
            if (displayedRecipes < recipes.length) {
                displayedRecipes = Math.min(displayedRecipes + 3, recipes.length);
                renderRecipes();
            }
        });
    }

    // Клик по рецепту
    document.addEventListener('click', (e) => {
        const recipeCard = e.target.closest('.recipe-card');
        const viewBtn = e.target.closest('.recipe-view-btn');
        
    if (viewBtn || recipeCard) {
        const recipeSlug = (viewBtn || recipeCard).dataset.recipeSlug;
        if (recipeSlug) {
            window.location.href = `/recipe/${recipeSlug}/`;
        } else {
            console.error('Recipe slug not found');
        }
    }
    });

    // Фильтры
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', function() {
            document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.textContent;
            // Здесь можно добавить логику фильтрации
            console.log('Filter by:', filter);
            
            // Пример фильтрации (можно раскомментировать позже)
            // filterRecipes(filter);
        });
    });
});

// Функция для фильтрации (можно добавить позже)
function filterRecipes(category) {
    if (category === 'Все рецепты') {
        displayedRecipes = 6;
        renderRecipes();
    } else {
        // Логика фильтрации по категории
        console.log('Фильтрация по:', category);
    }
}