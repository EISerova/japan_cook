document.addEventListener('DOMContentLoaded', function() {
    initCollections();
    initImagePreview();
});

function initImagePreview() {
    const imageField = document.querySelector('.field-image');
    if (!imageField) return;
    
    const currentImageLink = imageField.querySelector('a[href*="recipes/"]');
    if (!currentImageLink) return;
    
    const imageUrl = currentImageLink.href;
    
    // Создаем только превью, не трогая остальное
    const previewBlock = document.createElement('div');
    previewBlock.style.margin = '10px 0 10px 0'; // Изменено с 200px на 0
    previewBlock.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 5px; color: #000000; font-family: 'Nunito', sans-serif; font-size: 14px;">Текущее изображение:</div>
        <img src="${imageUrl}" alt="Preview" style="max-width: 200px; max-height: 150px; border: 2px solid #dee2e6; border-radius: 4px; padding: 5px; background: white;">
    `;
    
    // Вставляем перед полем загрузки
    const fileInput = imageField.querySelector('input[type="file"]');
    if (fileInput) {
        fileInput.parentNode.insertBefore(previewBlock, fileInput);
    }
}

function initCollections() {
    const field = document.querySelector('.field-collections');
    if (!field) return;
    
    field.querySelectorAll('.help, p').forEach(el => el.remove());
    
    const container = document.createElement('div');
    container.className = 'collections-button-container';
    
    // Создаем несколько скрытых полей вместо одного
    function updateHiddenInputs() {
        // Удаляем старые скрытые поля
        document.querySelectorAll('input[name="collections"]').forEach(input => input.remove());
        
        // Создаем новое скрытое поле для каждого выбранного значения
        document.querySelectorAll('.collection-button.selected').forEach(btn => {
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = 'collections';
            hidden.value = btn.dataset.value;
            field.appendChild(hidden);
        });
    }
    
    // Получаем все option из оригинального select
    const originalSelect = field.querySelector('select[name="collections"]');
    const options = originalSelect ? Array.from(originalSelect.options) : [];
    
    // Создаем кнопки
    options.forEach(opt => {
        const button = document.createElement('span');
        button.className = 'collection-button';
        button.dataset.value = opt.value;
        button.textContent = opt.text;
        
        if (opt.selected) {
            button.classList.add('selected');
        }
        
        button.addEventListener('click', function() {
            this.classList.toggle('selected');
            updateHiddenInputs();
        });
        
        container.appendChild(button);
    });
    
    // Удаляем оригинальный select
    if (originalSelect) {
        originalSelect.remove();
    }
    
    const addLink = document.createElement('a');
    addLink.href = '/admin/core/collection/add/';
    addLink.className = 'add-collection-link';
    addLink.innerHTML = '<span>+</span>';
    addLink.title = 'Добавить новую коллекцию';
    container.appendChild(addLink);
    
    field.appendChild(container);
    
    // Инициализация
    updateHiddenInputs();
}