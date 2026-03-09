// Состояние
const state = {
    displayedRecipes: 6,
    filteredRecipes: [],
    currentFilter: 'all' // Используем slug для фильтрации
};

// Кэшируем DOM элементы
const elements = {
    recipesGrid: document.getElementById('recipes-grid'),
    loadMore: document.getElementById('load-more'),
    filterTags: document.querySelectorAll('.filter-tag'),
    backToTop: document.getElementById('back-to-top'),
    accessibilityToggle: document.getElementById('accessibility-toggle'),
    languageToggle: document.getElementById('language-toggle')
};

// Функция для фильтрации рецептов по коллекции
function filterRecipesByCollection(recipes, filterSlug) {
    console.log('Filtering by:', filterSlug);
    console.log('All recipes:', recipes);
    
    if (filterSlug === 'all') {
        console.log('Showing all recipes:', recipes.length);
        return recipes;
    }
    
    const filtered = recipes.filter(recipe => {
        // Проверяем, есть ли у рецепта коллекции и содержит ли он нужный slug
        const hasCollection = recipe.collections && 
                             Array.isArray(recipe.collections) && 
                             recipe.collections.includes(filterSlug);
        
        if (hasCollection) {
            console.log(`Recipe "${recipe.title}" matches collection ${filterSlug}`);
        }
        
        return hasCollection;
    });
    
    console.log(`Found ${filtered.length} recipes for collection ${filterSlug}`);
    return filtered;
}

// Функция для рендеринга рецептов
function renderRecipes() {
    if (!elements.recipesGrid) return;

    const recipes = window.recipesData || [];
    console.log('Current filter:', state.currentFilter);
    
    state.filteredRecipes = filterRecipesByCollection(recipes, state.currentFilter);
    const recipesToShow = state.filteredRecipes.slice(0, state.displayedRecipes);
    
    console.log(`Displaying ${recipesToShow.length} of ${state.filteredRecipes.length} filtered recipes`);
    
    if (recipesToShow.length === 0) {
        elements.recipesGrid.innerHTML = '<p class="no-recipes">Рецепты не найдены</p>';
        return;
    }
    
    // Используем DocumentFragment для оптимизации
    const fragment = document.createDocumentFragment();
    const template = document.createElement('template');
    
    recipesToShow.forEach(recipe => {
        template.innerHTML = `
            <div class="recipe-card" data-recipe-slug="${recipe.slug}">
                <div class="recipe-image-wrapper">
                    <img src="${recipe.image}" alt="${recipe.title}" loading="lazy" class="recipe-image">
                </div>
                <h4>${recipe.title}</h4>
                <button class="recipe-view-btn" data-recipe-slug="${recipe.slug}">Посмотреть рецепт →</button>
            </div>
        `;
        fragment.appendChild(template.content.firstElementChild);
    });
    
    elements.recipesGrid.innerHTML = '';
    elements.recipesGrid.appendChild(fragment);
    
    // Обновляем видимость кнопки "Загрузить еще"
    toggleLoadMoreButton();
    
    // Инициализируем Lucide иконки для новых элементов
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Обновление кнопки "Загрузить еще"
function toggleLoadMoreButton() {
    if (!elements.loadMore) return;
    const totalRecipes = state.filteredRecipes.length;
    elements.loadMore.style.display = state.displayedRecipes >= totalRecipes ? 'none' : 'block';
}

// Обработчик скролла для кнопки "Наверх"
function setupBackToTop() {
    if (!elements.backToTop) return;
    
    const toggleBackToTop = () => {
        elements.backToTop.classList.toggle('hidden', window.scrollY <= 400);
    };
    
    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    
    elements.backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Обработчик кликов (делегирование событий)
function setupEventDelegation() {
    document.addEventListener('click', (e) => {
        // Клик по рецепту
        const recipeCard = e.target.closest('.recipe-card');
        const viewBtn = e.target.closest('.recipe-view-btn');
        
        if (viewBtn || recipeCard) {
            e.preventDefault();
            const recipeSlug = (viewBtn || recipeCard).dataset.recipeSlug;
            if (recipeSlug) {
                window.location.href = `/recipe/${recipeSlug}/`;
            }
            return;
        }
        
        // Клик по фильтрам
        const filterTag = e.target.closest('.filter-tag');
        if (filterTag) {
            e.preventDefault();
            const filter = filterTag.dataset.filter;
            
            console.log('Filter clicked:', filter);
            
            // Обновляем активный класс
            document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
            filterTag.classList.add('active');
            
            // Применяем фильтр
            state.currentFilter = filter;
            state.displayedRecipes = 6; // Сбрасываем на первые 6
            renderRecipes();
        }
    });
}

// Настройка кнопки "Загрузить еще"
function setupLoadMore() {
    if (!elements.loadMore) return;
    
    elements.loadMore.addEventListener('click', () => {
        const totalRecipes = state.filteredRecipes.length;
        if (state.displayedRecipes < totalRecipes) {
            state.displayedRecipes = Math.min(state.displayedRecipes + 3, totalRecipes);
            renderRecipes();
        }
    });
}

// Настройка accessibility режима
function setupAccessibility() {
    if (!elements.accessibilityToggle) return;
    
    elements.accessibilityToggle.addEventListener('click', () => {
        document.body.classList.toggle('accessible-mode');
    });
}

// Настройка переключения языка
function setupLanguageToggle() {
    if (!elements.languageToggle) return;
    
    elements.languageToggle.addEventListener('click', () => {
        const currentLang = document.documentElement.lang;
        const newLang = currentLang === 'ru' ? 'en' : 'ru';
        document.documentElement.lang = newLang;
        console.log(`Language switched to ${newLang}`);
    });
}

// Инициализация приложения
function init() {
    // Проверяем наличие данных
    if (!window.recipesData) {
        console.warn('recipesData not found');
        return;
    }
    
    console.log('Initializing recipes page with data:', window.recipesData);
    console.log('Collections data:', window.collections);
    
    // Кэшируем фильтры заново (на случай, если DOM изменился)
    elements.filterTags = document.querySelectorAll('.filter-tag');
    
    // Инициализируем все компоненты
    renderRecipes();
    setupBackToTop();
    setupEventDelegation();
    setupLoadMore();
    setupAccessibility();
    setupLanguageToggle();
    
    // Инициализируем Lucide иконки если есть
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    console.log(`Loaded ${window.recipesData.length} recipes`);
}

// Запускаем после полной загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}