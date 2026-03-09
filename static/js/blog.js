// Оптимизированный код для страницы блога
(function() {
    'use strict';

    // Состояние (убрали isAccessibleMode, так как он уже есть в main.js)
    let displayedPosts = 2;

    // Кэшируем DOM элементы
    const elements = {
        blogGrid: document.getElementById('blog-grid'),
        loadMore: document.getElementById('load-more'),
        backToTop: document.getElementById('back-to-top')
    };

    // Функция для экранирования текста
    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    // Функция для рендеринга постов
    function renderPosts() {
        if (!elements.blogGrid) return;

        const posts = window.blogPostsData || [];
        
        if (posts.length === 0) {
            elements.blogGrid.innerHTML = `
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
        
        // Используем DocumentFragment для оптимизации
        const fragment = document.createDocumentFragment();
        const template = document.createElement('template');
        
        postsToShow.forEach(post => {
            template.innerHTML = `
                <div class="blog-card" data-post-slug="${post.slug}">
                    <div class="blog-image-container">
                        <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" class="blog-image" loading="lazy">
                    </div>
                    <div class="blog-content">
                        <div class="blog-meta">
                            <span>
                                <i data-lucide="calendar" width="14" height="14"></i>
                                ${escapeHtml(post.created_at)}
                            </span>
                            <span>
                                <i data-lucide="clock" width="14" height="14"></i>
                                ${escapeHtml(post.reading_time)} мин
                            </span>
                            ${post.author ? `
                            <span>
                                <i data-lucide="user" width="14" height="14"></i>
                                ${escapeHtml(post.author)}
                            </span>
                            ` : ''}
                        </div>
                        <h3>${escapeHtml(post.title)}</h3>
                        <p class="blog-description">${escapeHtml(post.description)}</p>
                        <button class="blog-link" data-post-slug="${post.slug}">
                            Читать далее →
                        </button>
                    </div>
                </div>
            `;
            fragment.appendChild(template.content.firstElementChild);
        });
        
        elements.blogGrid.innerHTML = '';
        elements.blogGrid.appendChild(fragment);
        
        // Обновляем видимость кнопки "Загрузить еще"
        toggleLoadMoreButton(posts.length);
        
        // Инициализируем иконки Lucide для новых элементов
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Функция для обновления кнопки "Загрузить еще"
    function toggleLoadMoreButton(totalPosts) {
        if (!elements.loadMore) return;
        
        if (displayedPosts >= totalPosts) {
            elements.loadMore.classList.add('hidden');
        } else {
            elements.loadMore.classList.remove('hidden');
        }
    }

    // Настройка кнопки "Загрузить еще"
    function setupLoadMore() {
        if (!elements.loadMore) return;
        
        elements.loadMore.addEventListener('click', () => {
            const posts = window.blogPostsData || [];
            if (displayedPosts < posts.length) {
                displayedPosts = Math.min(displayedPosts + 2, posts.length);
                renderPosts();
            }
        });
    }

    // Настройка обработчиков событий
    function setupEventListeners() {
        // Back to top button (дублируется с main.js, но оставим для надежности)
        if (elements.backToTop) {
            const toggleBackToTop = () => {
                elements.backToTop.classList.toggle('hidden', window.scrollY <= 400);
            };
            
            window.addEventListener('scroll', toggleBackToTop, { passive: true });
            
            elements.backToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // Load more
        setupLoadMore();

        // Делегирование событий для кликов по карточкам и кнопкам
        document.addEventListener('click', (e) => {
            // Клик по кнопке "Читать далее"
            const blogLink = e.target.closest('.blog-link');
            if (blogLink) {
                e.preventDefault();
                const postSlug = blogLink.dataset.postSlug;
                if (postSlug) {
                    window.location.href = `/blog/${postSlug}/`;
                }
                return;
            }
            
            // Клик по карточке (но не по кнопке)
            const blogCard = e.target.closest('.blog-card');
            if (blogCard && !e.target.closest('.blog-link')) {
                const postSlug = blogCard.dataset.postSlug;
                if (postSlug) {
                    window.location.href = `/blog/${postSlug}/`;
                }
            }
        });
    }

    // Инициализация
    document.addEventListener('DOMContentLoaded', () => {
        renderPosts();
        setupEventListeners();
    });

})();