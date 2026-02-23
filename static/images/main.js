// Состояние приложения
const appState = {
    isAccessibleMode: false,
    language: 'ru',
    currentPage: 'main',
    searchQuery: ''
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    console.log('Application initialized');
    
    // Инициализация Lucide иконок (если они не были инициализированы в base.html)
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Настройка обработчиков событий
    setupEventListeners();
    
    // Проверка сохраненных настроек
    loadSettings();
});

// Настройка обработчиков событий
function setupEventListeners() {
    // Поиск рецептов
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Кнопка "Наверх"
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
        accessibilityToggle.addEventListener('click', toggleAccessibility);
    }
    
    // Language toggle
    const languageToggle = document.getElementById('language-toggle');
    if (languageToggle) {
        languageToggle.addEventListener('click', toggleLanguage);
    }
    
    // Навигация
    setupNavigation();
}

// Настройка навигации
function setupNavigation() {
    // Кнопка рецептов
    const navRecipes = document.getElementById('nav-recipes');
    if (navRecipes) {
        navRecipes.addEventListener('click', () => {
            showRecipesList();
        });
    }
    
    // Карточка суши
    const sushiCard = document.getElementById('sushi-card');
    if (sushiCard) {
        sushiCard.addEventListener('click', () => {
            showRecipeDetail(1);
        });
    }
    
    // Кнопка просмотра рецепта
    const viewRecipeBtn = document.getElementById('view-recipe-sushi');
    if (viewRecipeBtn) {
        viewRecipeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showRecipeDetail(1);
        });
    }
    
    // Делегирование событий для динамических элементов
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('recipe-link') || e.target.closest('.recipe-card')) {
            const recipeId = e.target.dataset.recipe || 
                           e.target.closest('.recipe-card')?.dataset.recipeId;
            if (recipeId) {
                showRecipeDetail(parseInt(recipeId));
            }
        }
    });
}

// Функция поиска
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    appState.searchQuery = query;
    
    // Здесь можно добавить логику поиска по рецептам
    console.log('Searching for:', query);
    
    // Показываем уведомление
    showNotification(`Поиск: ${query}`, 'info');
}

// Переключение accessibility режима
function toggleAccessibility() {
    appState.isAccessibleMode = !appState.isAccessibleMode;
    document.body.classList.toggle('accessible-mode', appState.isAccessibleMode);
    
    // Сохраняем настройку
    localStorage.setItem('accessibleMode', appState.isAccessibleMode);
    
    showNotification(
        appState.isAccessibleMode ? 'Режим повышенной доступности включен' : 'Обычный режим',
        'success'
    );
}

// Переключение языка
function toggleLanguage() {
    appState.language = appState.language === 'ru' ? 'en' : 'ru';
    localStorage.setItem('language', appState.language);
    
    // Здесь можно добавить полноценную смену языка
    const messages = {
        ru: 'Язык изменен на русский',
        en: 'Language switched to English'
    };
    
    showNotification(messages[appState.language], 'info');
}

// Загрузка сохраненных настроек
function loadSettings() {
    // Accessibility режим
    const savedAccessibleMode = localStorage.getItem('accessibleMode') === 'true';
    if (savedAccessibleMode) {
        appState.isAccessibleMode = true;
        document.body.classList.add('accessible-mode');
    }
    
    // Язык
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
        appState.language = savedLanguage;
    }
}

// Показать уведомление
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Переход к деталям рецепта
function showRecipeDetail(recipeId) {
    console.log('Showing recipe detail:', recipeId);
    appState.currentPage = 'recipe-detail';
    
    // Скрываем главную страницу
    const mainPage = document.getElementById('main-page');
    const recipeDetailPage = document.getElementById('recipe-detail-page');
    
    if (mainPage && recipeDetailPage) {
        mainPage.classList.add('hidden');
        recipeDetailPage.classList.remove('hidden');
        
        // Загружаем данные рецепта
        loadRecipeDetail(recipeId);
    }
}

// Показать список рецептов
function showRecipesList() {
    console.log('Showing recipes list');
    appState.currentPage = 'recipes-list';
    
    const mainPage = document.getElementById('main-page');
    const recipesListPage = document.getElementById('recipes-list-page');
    
    if (mainPage && recipesListPage) {
        mainPage.classList.add('hidden');
        recipesListPage.classList.remove('hidden');
        
        // Загружаем список рецептов
        loadRecipesList();
    }
}

// Вернуться на главную
function showMainPage() {
    appState.currentPage = 'main';
    
    const mainPage = document.getElementById('main-page');
    const recipeDetailPage = document.getElementById('recipe-detail-page');
    const recipesListPage = document.getElementById('recipes-list-page');
    
    if (mainPage && recipeDetailPage && recipesListPage) {
        mainPage.classList.remove('hidden');
        recipeDetailPage.classList.add('hidden');
        recipesListPage.classList.add('hidden');
    }
}

// Загрузка деталей рецепта (заглушка)
function loadRecipeDetail(recipeId) {
    const container = document.getElementById('recipe-detail-page');
    if (container) {
        container.innerHTML = `
            <div class="container">
                <button onclick="showMainPage()" class="back-button">← Назад</button>
                <div class="recipe-detail">
                    <h2>Загрузка рецепта...</h2>
                    <div class="loader"></div>
                </div>
            </div>
        `;
        
        // Здесь можно сделать AJAX запрос для получения данных рецепта
        setTimeout(() => {
            container.innerHTML = `
                <div class="container">
                    <button onclick="showMainPage()" class="back-button">← Назад</button>
                    <div class="recipe-detail">
                        <h2>Рецепт #${recipeId}</h2>
                        <p>Детальная информация о рецепте будет загружена с сервера.</p>
                    </div>
                </div>
            `;
        }, 1000);
    }
}

// Загрузка списка рецептов (заглушка)
function loadRecipesList() {
    const container = document.getElementById('recipes-list-page');
    if (container) {
        container.innerHTML = `
            <div class="container">
                <button onclick="showMainPage()" class="back-button">← На главную</button>
                <h2>Все рецепты</h2>
                <div class="recipes-list">
                    ${Array(6).fill(0).map((_, i) => `
                        <div class="recipe-item" onclick="showRecipeDetail(${i+1})">
                            <img src="https://images.unsplash.com/photo-1653697469316-955d5ebe5994?w=300" alt="Recipe">
                            <h3>Рецепт #${i+1}</h3>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Вспомогательная функция debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Экспортируем функции для глобального доступа
window.showMainPage = showMainPage;
window.showRecipeDetail = showRecipeDetail;
window.showRecipesList = showRecipesList;