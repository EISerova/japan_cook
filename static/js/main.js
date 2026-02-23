// Состояние приложения
let isAccessibleMode = false;
let language = 'ru';

// Функция для рендеринга данных
function renderContent() {
    // Рецепты (используем данные из базы, переданные через window.recentRecipesData)
    const recipesContainer = document.getElementById('recipes-container');
    if (recipesContainer && window.recentRecipesData) {
        recipesContainer.innerHTML = window.recentRecipesData.map(recipe => `
            <div class="recipe-card" data-recipe-slug="${recipe.slug}">
                <div class="recipe-image-container">
                    <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image">
                </div>
                <h4>${recipe.title}</h4>
                <button class="recipe-link" data-recipe-slug="${recipe.slug}">Посмотреть рецепт →</button>
            </div>
        `).join('');
    } else if (recipesContainer) {
        // Заглушка, если нет данных
        recipesContainer.innerHTML = '<p class="no-recipes">Рецепты не найдены</p>';
    }

    // Ингредиенты
    const ingredientsContainer = document.getElementById('ingredients-container');
    if (ingredientsContainer) {
        if (window.ingredientsData && window.ingredientsData.length > 0) {
            ingredientsContainer.innerHTML = window.ingredientsData.map(ingredient => `
                <a href="${ingredient.url}" class="ingredient-tag">${ingredient.name}</a>
            `).join('');
        } else {
            // Заглушка, если нет ингредиентов
            ingredientsContainer.innerHTML = '<p class="no-ingredients">Ингредиенты не найдены</p>';
        }
    }

    // Коллекции
    const collectionsContainer = document.getElementById('collections-container');
    if (collectionsContainer) {
        if (window.collectionsData && window.collectionsData.length > 0) {
            collectionsContainer.innerHTML = window.collectionsData.map(collection => {
                // Используем URL из данных, переданных из views.py
                return `
                    <a href="${collection.url}" class="collection-card">
                        <div class="collection-image-container">
                            <img src="${collection.image}" alt="${collection.name}" class="collection-image">
                        </div>
                        <div class="collection-title">${collection.name}</div>
                    </a>
                `;
            }).join('');
        } else {
            // Заглушка, если нет коллекций
            collectionsContainer.innerHTML = '<p class="no-collections">Коллекции не найдены</p>';
        }
    }

}

// Функции навигации
function showMainPage() {
    window.location.href = "/";
}

function showRecipesList() {
    window.location.href = "/recipes/";
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    renderContent();
     renderBlogPosts();

    // Инициализация Lucide иконок
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
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
            language = language === 'ru' ? 'en' : 'ru';
            alert(`Language switched to ${language === 'ru' ? 'Russian' : 'English'}`);
        });
    }

    // Navigation to featured recipe detail (блок "Тарелка суши")
    const viewRecipeSushi = document.getElementById('view-recipe-sushi');
    if (viewRecipeSushi) {
        viewRecipeSushi.addEventListener('click', (e) => {
            e.stopPropagation();
            const slug = viewRecipeSushi.dataset.recipeSlug;
            if (slug) {
                window.location.href = `/recipe/${slug}/`;
            } else {
                console.error('Recipe slug not found for featured recipe');
            }
        });
    }

    const sushiCard = document.getElementById('sushi-card');
    if (sushiCard) {
        sushiCard.addEventListener('click', () => {
            const slug = sushiCard.dataset.recipeSlug;
            if (slug) {
                window.location.href = `/recipe/${slug}/`;
            } else {
                console.error('Recipe slug not found for featured recipe');
            }
        });
    }

    // Navigation to recipes list
    const navRecipes = document.getElementById('nav-recipes');
    if (navRecipes) {
        navRecipes.addEventListener('click', () => {
            window.location.href = "/recipes/";
        });
    }

    // Делегирование событий для динамических элементов (Новые рецепты)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('recipe-link') || e.target.closest('.recipe-card')) {
            const recipeCard = e.target.closest('.recipe-card');
            if (recipeCard) {
                const recipeSlug = recipeCard.dataset.recipeSlug;
                if (recipeSlug) {
                    window.location.href = `/recipe/${recipeSlug}/`;
                } else {
                    console.error('Recipe slug not found on recipe card');
                }
            }
        }

        // Обработка клика по кнопке "Читать далее" в блоге
        if (e.target.classList.contains('blog-link') || e.target.closest('.blog-link')) {
        e.preventDefault();
        const button = e.target.closest('.blog-link');
        const postSlug = button.dataset.postSlug;
        if (postSlug) {
            window.location.href = `/blog/${postSlug}/`;
        }
    }
    
        // Обработка клика по карточке блога
        const blogCard = e.target.closest('.blog-card');
        if (blogCard && !e.target.closest('.blog-link')) {
            const postSlug = blogCard.dataset.postSlug;
            if (postSlug) {
                window.location.href = `/blog/${postSlug}/`;
            }
        }
    });
});


// Функция для рендеринга записей блога
function renderBlogPosts() {
    const blogContainer = document.getElementById('blog-container');
    if (!blogContainer) return;

    const posts = window.blogPostsData || [];
    
    if (posts.length === 0) {
        blogContainer.innerHTML = '<p class="no-posts">В блоге пока нет записей</p>';
        return;
    }
    
    blogContainer.innerHTML = posts.map(post => `
        <div class="blog-card" data-post-slug="${post.slug}">
            <div class="blog-image-container">
                <img src="${post.image}" alt="${post.title}" class="blog-image">
            </div>
            <div class="blog-content">
                <div class="blog-meta">
                    <span>
                        <i data-lucide="calendar" width="14" height="14"></i>
                        ${post.created_at}
                    </span>
                    <span>
                        <i data-lucide="clock" width="14" height="14"></i>
                        ${post.reading_time} мин
                    </span>
                </div>
                <h3>${post.title}</h3>
                <p>${post.description}</p>
                <button class="blog-link" data-post-slug="${post.slug}">
                    Читать далее →
                </button>
            </div>
        </div>
    `).join('');
    
    // Инициализируем иконки Lucide для новых элементов
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}