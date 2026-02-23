// Состояние
let isAccessibleMode = false;
let displayedPosts = 2; // Показываем первые 2 поста

// Функция для рендеринга постов
function renderPosts() {
    const blogGrid = document.getElementById('blog-grid');
    if (!blogGrid) return;

    // Используем данные из базы
    const posts = window.blogPostsData || [];
    
    if (posts.length === 0) {
        blogGrid.innerHTML = `
            <div class="no-posts">
                <i data-lucide="book-open" width="48" height="48"></i>
                <p>В блоге пока нет записей</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }
    
    const postsToShow = posts.slice(0, displayedPosts);
    
    blogGrid.innerHTML = postsToShow.map(post => `
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
                    <span>
                        <i data-lucide="user" width="14" height="14"></i>
                        ${post.author}
                    </span>
                </div>
                <h3>${post.title}</h3>
                <p class="blog-description">${post.description}</p>
                <button class="blog-link" data-post-slug="${post.slug}">
                    Читать далее →
                </button>
            </div>
        </div>
    `).join('');
    
    // Прячем кнопку "Загрузить еще", если показаны все посты
    const loadMore = document.getElementById('load-more');
    if (loadMore) {
        if (displayedPosts >= posts.length) {
            loadMore.classList.add('hidden');
        } else {
            loadMore.classList.remove('hidden');
        }
    }
    
    // Инициализируем иконки Lucide для новых элементов
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    renderPosts();

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

    // Load more button
    const loadMore = document.getElementById('load-more');
    if (loadMore) {
        loadMore.addEventListener('click', () => {
            const posts = window.blogPostsData || [];
            if (displayedPosts < posts.length) {
                displayedPosts = Math.min(displayedPosts + 2, posts.length);
                renderPosts();
            }
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

    // Делегирование событий для кликов по карточкам и кнопкам
    document.addEventListener('click', (e) => {
        // Клик по кнопке "Читать далее"
        if (e.target.classList.contains('blog-link') || e.target.closest('.blog-link')) {
            e.preventDefault();
            const button = e.target.closest('.blog-link');
            const postSlug = button.dataset.postSlug;
            if (postSlug) {
                window.location.href = `/blog/${postSlug}/`;
            }
        }
        
        // Клик по карточке (но не по кнопке, чтобы избежать двойного срабатывания)
        const blogCard = e.target.closest('.blog-card');
        if (blogCard && !e.target.closest('.blog-link')) {
            const postSlug = blogCard.dataset.postSlug;
            if (postSlug) {
                window.location.href = `/blog/${postSlug}/`;
            }
        }
    });
});