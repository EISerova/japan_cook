// Оптимизированный код для страницы видео
(function() {
    'use strict';

    // Состояние
    let displayedVideos = 6;

    // Кэшируем DOM элементы
    const elements = {
        videosGrid: document.getElementById('videos-grid'),
        loadMore: document.getElementById('load-more'),
        searchInput: document.querySelector('.search-input')
    };

    // Функция для экранирования текста
    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    // Функция для рендеринга видео
    function renderVideos() {
        if (!elements.videosGrid) return;

        const videos = window.videosData || [];
        
        if (videos.length === 0) {
            elements.videosGrid.innerHTML = '<p class="no-videos">Видео не найдены</p>';
            return;
        }
        
        const videosToShow = videos.slice(0, displayedVideos);
        
        // Используем DocumentFragment для оптимизации
        const fragment = document.createDocumentFragment();
        const template = document.createElement('template');
        
        videosToShow.forEach(video => {
            // Формируем ссылку на рецепт, если есть
            const recipeLink = video.recipe_slug ? `/recipe/${video.recipe_slug}/` : '#';
            
            template.innerHTML = `
                <div class="video-card" data-video-id="${video.id}" data-recipe-slug="${video.recipe_slug || ''}">
                    <a href="/video/${video.id}/" style="text-decoration: none; color: inherit;">
                        <div class="video-image-container">
                            <img src="${escapeHtml(video.image)}" alt="${escapeHtml(video.title)}" class="video-image" loading="lazy">
                            <div class="video-overlay">
                                <div class="play-button">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                                    </svg>
                                </div>
                            </div>
                            <div class="duration-badge">${escapeHtml(video.duration)}</div>
                        </div>
                        <div>
                            <h3 class="video-title">${escapeHtml(video.title)}</h3>
                        </div>
                    </a>
                </div>
            `;
            fragment.appendChild(template.content.firstElementChild);
        });
        
        elements.videosGrid.innerHTML = '';
        elements.videosGrid.appendChild(fragment);
        
        // Обновляем видимость кнопки "Загрузить еще"
        toggleLoadMoreButton(videos.length);
    }

    // Функция для обновления кнопки "Загрузить еще"
    function toggleLoadMoreButton(totalVideos) {
        if (!elements.loadMore) return;
        
        if (displayedVideos >= totalVideos) {
            elements.loadMore.style.display = 'none';
        } else {
            elements.loadMore.style.display = 'inline-block';
        }
    }

    // Настройка кнопки "Загрузить еще"
    function setupLoadMore() {
        if (!elements.loadMore) return;
        
        elements.loadMore.addEventListener('click', () => {
            const videos = window.videosData || [];
            if (displayedVideos < videos.length) {
                displayedVideos = Math.min(displayedVideos + 3, videos.length);
                renderVideos();
            }
        });
    }

    // Настройка поиска
    function setupSearch() {
        if (!elements.searchInput) return;
        
        elements.searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const videos = window.videosData || [];
            
            if (searchTerm === '') {
                displayedVideos = 6;
                renderVideos();
                return;
            }
            
            const filteredVideos = videos.filter(video => 
                video.title.toLowerCase().includes(searchTerm)
            );
            
            if (filteredVideos.length === 0) {
                elements.videosGrid.innerHTML = '<p class="no-videos">Видео не найдены</p>';
            } else {
                elements.videosGrid.innerHTML = filteredVideos.map(video => {
                    const recipeLink = video.recipe_slug ? `/recipe/${video.recipe_slug}/` : '#';
                    return `
                        <div class="video-card" data-video-id="${video.id}" data-recipe-slug="${video.recipe_slug || ''}">
                            <a href="${recipeLink}" style="text-decoration: none; color: inherit;">
                                <div class="video-image-container">
                                    <img src="${escapeHtml(video.image)}" alt="${escapeHtml(video.title)}" class="video-image" loading="lazy">
                                    <div class="video-overlay">
                                        <div class="play-button">
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <div class="duration-badge">${escapeHtml(video.duration)}</div>
                                </div>
                                <div>
                                    <h3 class="video-title">${escapeHtml(video.title)}</h3>
                                </div>
                            </a>
                        </div>
                    `;
                }).join('');
            }
            
            // Прячем кнопку "Загрузить еще" при поиске
            if (elements.loadMore) {
                elements.loadMore.style.display = 'none';
            }
        });
    }

    // Инициализация
    document.addEventListener('DOMContentLoaded', () => {
        renderVideos();
        setupLoadMore();
        setupSearch();
        
        // Инициализируем Lucide иконки
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });

})();