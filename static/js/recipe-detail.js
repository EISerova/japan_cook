// Состояние
let isAccessibleMode = false;

// Рендеринг данных из Django
function renderContent() {
    // Ингредиенты
    const ingredientsList = document.getElementById('ingredients-list');
    if (ingredientsList && window.recipeData && window.recipeData.ingredients) {
        ingredientsList.innerHTML = window.recipeData.ingredients.map(ingredient => `
            <li class="ingredient-item">
                <span class="ingredient-dot"></span>
                <span>${ingredient.name} — ${ingredient.quantity}</span>
            </li>
        `).join('');
    }

    // Шаги приготовления
    const stepsList = document.getElementById('steps-list');
    if (stepsList && window.recipeData && window.recipeData.steps) {
        stepsList.innerHTML = window.recipeData.steps.map(step => `
            <div class="step-item">
                <div class="step-number" style="background-color: var(--color-primary); color: var(--color-bg);">${step.number}</div>
                <p class="step-text">${step.text}</p>
            </div>
        `).join('');
    }

    // Изображения шагов (только те, у которых есть фото)
    const stepsWithImages = window.recipeData && window.recipeData.steps ? 
        window.recipeData.steps.filter(step => step.hasImage) : [];
    const stepImagesContainer = document.getElementById('step-images-container');
    const stepImagesSection = document.getElementById('step-images-section');
    
    if (stepsWithImages.length > 0) {
        stepImagesSection.classList.remove('hidden');
        stepImagesContainer.innerHTML = stepsWithImages.map(step => `
            <div class="step-image-card">
                <img src="${step.image}" alt="Шаг ${step.number}" class="step-image">
                <div class="step-image-number" style="background-color: var(--color-primary); color: var(--color-bg);">${step.number}</div>
            </div>
        `).join('');
    } else {
        stepImagesSection.classList.add('hidden');
    }

    // Категории (коллекции)
    const categoriesContainer = document.getElementById('categories-container');
    if (categoriesContainer && window.recipeData && window.recipeData.categories) {
        categoriesContainer.innerHTML = window.recipeData.categories.map(category => `
            <a href="${category.link}" class="category-tag" style="background-color: var(--color-secondary); color: var(--color-bg);">${category.name}</a>
        `).join('');
    }
    
    // Заголовок рецепта
    const titleElement = document.querySelector('.recipe-title');
    if (titleElement && window.recipeData && window.recipeData.title) {
        titleElement.textContent = window.recipeData.title;
    }
    
    // Описание
    const descriptionElement = document.querySelector('.recipe-description p');
    if (descriptionElement && window.recipeData && window.recipeData.description) {
        descriptionElement.textContent = window.recipeData.description;
    }
    
    // Главное изображение
    const mainImage = document.querySelector('.recipe-main-image img');
    if (mainImage && window.recipeData && window.recipeData.image) {
        mainImage.src = window.recipeData.image;
        mainImage.alt = window.recipeData.title || 'Рецепт';
    }
    
    // Мета информация
    updateMetaInfo();
    
    // Видео секция
    updateVideoSection();
}

// Обновление мета-информации
function updateMetaInfo() {
    if (!window.recipeData) return;
    
    const metaItems = document.querySelectorAll('.meta-item');
    if (metaItems.length >= 4) {
        // Сложность
        const difficultySpan = metaItems[0].querySelector('.meta-text');
        if (difficultySpan && window.recipeData.difficulty) {
            difficultySpan.textContent = `Сложность: ${window.recipeData.difficulty}`;
        }
        
        // Порции
        const servingsSpan = metaItems[1].querySelector('.meta-text');
        if (servingsSpan && window.recipeData.servings) {
            servingsSpan.textContent = `Порций: ${window.recipeData.servings}`;
        }
        
        // Время приготовления
        const cookTimeSpan = metaItems[2].querySelector('.meta-text');
        if (cookTimeSpan && window.recipeData.cooking_time) {
            cookTimeSpan.textContent = `Время приготовления: ${window.recipeData.cooking_time} мин`;
        }

    }
}

// Обновление видео секции
function updateVideoSection() {
    const videoSection = document.querySelector('.video-section');
    if (!videoSection) return;
    
    if (window.recipeData && window.recipeData.has_video && window.recipeData.video_url) {
        videoSection.classList.remove('hidden');
        
        // Здесь можно добавить логику для встраивания видео
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
            // Если нужно заменить плейсхолдер на реальное видео
            // videoContainer.innerHTML = `<iframe ...></iframe>`;
        }
    } else {
        videoSection.classList.add('hidden');
    }
}

// Инициализация Lucide иконок
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// Обработчики событий
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, есть ли данные из Django
    if (typeof window.recipeData !== 'undefined') {
        renderContent();
    } else {
        console.warn('recipeData не найден. Убедитесь, что данные переданы из шаблона.');
    }

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

    // Back button
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.history.back();
        });
    }
    
    // Инициализация кнопок поделиться (можно добавить функционал)
    const shareButtons = document.querySelectorAll('.share-button');
    shareButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Логика для кнопок поделиться
            console.log('Share button clicked');
        });
    });
});