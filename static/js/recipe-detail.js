// Оптимизированный код для страницы рецепта
(function() {
    'use strict';

    // Кэшируем DOM элементы один раз
    const elements = {
        ingredientsList: document.getElementById('ingredients-list'),
        stepsList: document.getElementById('steps-list'),
        stepImagesContainer: document.getElementById('step-images-container'),
        stepImagesSection: document.getElementById('step-images-section'),
        categoriesContainer: document.getElementById('categories-container'),
        backToTop: document.getElementById('back-to-top'),
        backButton: document.getElementById('back-button'),
        shareLinkBtn: document.getElementById('share-link-btn'),
        notification: document.getElementById('copy-notification')
    };

    let timeoutId;

    // Функция для безопасного экранирования текста
    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    // Рендеринг ингредиентов
    function renderIngredients(ingredients) {
        if (!elements.ingredientsList || !ingredients?.length) return;
        
        elements.ingredientsList.innerHTML = ingredients.map(ing => `
            <li class="ingredient-item">
                <span class="ingredient-dot"></span>
                <span>${escapeHtml(ing.name)} — ${escapeHtml(ing.quantity)}</span>
            </li>
        `).join('');
    }

    // Рендеринг шагов приготовления
    function renderSteps(steps) {
        if (!elements.stepsList || !steps?.length) return;
        
        elements.stepsList.innerHTML = steps.map(step => `
            <div class="step-item">
                <div class="step-number" style="background-color: var(--color-primary); color: var(--color-bg);">${step.number}</div>
                <p class="step-text">${escapeHtml(step.text)}</p>
            </div>
        `).join('');
    }

    // Рендеринг изображений шагов
    function renderStepImages(steps) {
        if (!elements.stepImagesSection || !elements.stepImagesContainer) return;
        
        const stepsWithImages = steps?.filter(step => step.hasImage && step.image) || [];
        
        if (stepsWithImages.length > 0) {
            elements.stepImagesSection.classList.remove('hidden');
            elements.stepImagesContainer.innerHTML = stepsWithImages.map(step => `
                <div class="step-image-card">
                    <img src="${escapeHtml(step.image)}" alt="Шаг ${step.number}" class="step-image" loading="lazy">
                    <div class="step-image-number" style="background-color: var(--color-primary); color: var(--color-bg);">${step.number}</div>
                </div>
            `).join('');
        } else {
            elements.stepImagesSection.classList.add('hidden');
        }
    }

    // Рендеринг категорий
    function renderCategories(categories) {
        if (!elements.categoriesContainer || !categories?.length) return;
        
        elements.categoriesContainer.innerHTML = categories.map(cat => `
            <a href="${escapeHtml(cat.link)}" class="category-tag" style="background-color: var(--color-secondary); color: var(--color-bg);">${escapeHtml(cat.name)}</a>
        `).join('');
    }

    // Основная функция рендеринга
    function renderContent() {
        if (!window.recipeData) {
            console.warn('recipeData not found');
            return;
        }

        const { ingredients, steps, categories } = window.recipeData;

        renderIngredients(ingredients);
        renderSteps(steps);
        renderStepImages(steps);
        renderCategories(categories);
    }

    // Функция для копирования ссылки
    function setupShareButton() {
        if (!elements.shareLinkBtn || !elements.notification) return;
        
        elements.shareLinkBtn.addEventListener('click', function() {
            const url = window.location.href;
            
            navigator.clipboard.writeText(url)
                .then(function() {
                    elements.notification.style.display = 'block';
                    if (timeoutId) clearTimeout(timeoutId);
                    timeoutId = setTimeout(function() {
                        elements.notification.style.display = 'none';
                    }, 2000);
                })
                .catch(function(err) {
                    console.error('Не удалось скопировать ссылку: ', err);
                });
        });
    }

    // Настройка кнопки "Наверх"
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

    // Настройка кнопки "Назад"
    function setupBackButton() {
        if (!elements.backButton) return;
        
        elements.backButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back();
        });
    }

    // Инициализация
    function init() {
        // Инициализируем Lucide иконки
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        renderContent();
        setupShareButton();
        setupBackToTop();
        setupBackButton();
        
        console.log('Recipe page initialized');
    }

    // Запускаем после полной загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();