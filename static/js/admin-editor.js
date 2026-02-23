(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const textareas = document.querySelectorAll('textarea[name="content"]');
        
        textareas.forEach(textarea => {
            if (!textarea) return;

            // Контейнер для редактора
            const editorContainer = document.createElement('div');
            editorContainer.className = 'editor-container';
            textarea.parentNode.insertBefore(editorContainer, textarea);
            editorContainer.appendChild(textarea);

            // Создаем панель инструментов
            const toolbar = document.createElement('div');
            toolbar.className = 'editor-toolbar';
            
            const buttons = [
                // Базовое форматирование
                { tag: 'b', label: '<b>B</b>', title: 'Жирный (Ctrl+B)' },
                { tag: 'i', label: '<i>I</i>', title: 'Курсив (Ctrl+I)' },
                { tag: 'u', label: '<u>U</u>', title: 'Подчеркнутый (Ctrl+U)' },
                { type: 'separator' },
                
                // Заголовки
                { tag: 'h3', label: 'H3', title: 'Заголовок 3' },
                { tag: 'h4', label: 'H4', title: 'Заголовок 4' },
                { tag: 'p', label: '¶ P', title: 'Абзац' },
                { type: 'separator' },
                
                // Списки
                { tag: 'ul', label: '• UL', title: 'Маркированный список' },
                { tag: 'ol', label: '1. OL', title: 'Нумерованный список' },
                { tag: 'li', label: '→ LI', title: 'Элемент списка' },
                { type: 'separator' },
                
                // Специальные
                { tag: 'br', label: '↵ BR', title: 'Перенос строки' },
                { tag: 'hr', label: '— HR', title: 'Горизонтальная линия' },
                { type: 'separator' },
                
                // Очистка
                { action: 'clear', label: '🗑 Очистить', title: 'Очистить форматирование' }
            ];

            // Создаем кнопки
            buttons.forEach(btn => {
                if (btn.type === 'separator') {
                    const sep = document.createElement('span');
                    sep.className = 'separator';
                    toolbar.appendChild(sep);
                    return;
                }

                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'editor-btn';
                button.innerHTML = btn.label;
                button.title = btn.title || '';
                
                if (btn.tag) {
                    button.dataset.tag = btn.tag;
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        insertTag(textarea, btn.tag);
                        updatePreview(textarea);
                    });
                } else if (btn.action === 'clear') {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        clearFormatting(textarea);
                        updatePreview(textarea);
                    });
                }
                
                toolbar.appendChild(button);
            });

            // Создаем контейнер для предпросмотра
            const previewContainer = document.createElement('div');
            previewContainer.className = 'editor-preview';
            previewContainer.innerHTML = `
                <h4>Предпросмотр:</h4>
                <div class="preview-content"></div>
            `;

            // Добавляем все элементы
            editorContainer.insertBefore(toolbar, textarea);
            editorContainer.appendChild(previewContainer);

            // Добавляем статус-бар
            const statusBar = document.createElement('div');
            statusBar.className = 'editor-status';
            statusBar.innerHTML = `
                <span>Горячие клавиши:</span>
                <kbd>Ctrl+B</kbd> <kbd>Ctrl+I</kbd> <kbd>Ctrl+U</kbd>
                <span style="margin-left: 20px;">Для нового абзаца: Enter дважды</span>
                <span>Для переноса строки: Shift+Enter</span>
            `;
            editorContainer.appendChild(statusBar);

            // Функция обновления предпросмотра
            function updatePreview(textarea) {
                const previewContent = previewContainer.querySelector('.preview-content');
                let html = textarea.value;
                
                // Сохраняем HTML теги от экранирования
                const tags = [];
                html = html.replace(/<\/?[^>]+>/g, function(tag) {
                    tags.push(tag);
                    return `###TAG${tags.length - 1}###`;
                });
                
                // Экранируем специальные символы
                html = html.replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                
                // Восстанавливаем теги
                html = html.replace(/###TAG(\d+)###/g, function(match, index) {
                    return tags[index];
                });
                
                // Обрабатываем HTML для предпросмотра
                html = html
                    .replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/g, '<b>$1</b>')
                    .replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/g, '<i>$1</i>')
                    .replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/g, '<u>$1</u>')
                    .replace(/&lt;h3&gt;(.*?)&lt;\/h3&gt;/g, '<h3>$1</h3>')
                    .replace(/&lt;h4&gt;(.*?)&lt;\/h4&gt;/g, '<h4>$1</h4>')
                    .replace(/&lt;p&gt;(.*?)&lt;\/p&gt;/g, '<p>$1</p>')
                    .replace(/&lt;ul&gt;(.*?)&lt;\/ul&gt;/g, '<ul>$1</ul>')
                    .replace(/&lt;ol&gt;(.*?)&lt;\/ol&gt;/g, '<ol>$1</ol>')
                    .replace(/&lt;li&gt;(.*?)&lt;\/li&gt;/g, '<li>$1</li>')
                    .replace(/&lt;br&gt;/g, '<br>')
                    .replace(/&lt;hr&gt;/g, '<hr>');
                
                // Добавляем базовые стили для предпросмотра
                const styledHtml = `
                    <style>
                        .preview-content { 
                            font-family: 'Inter', sans-serif; 
                            line-height: 1.8;
                            color: #212529;
                        }
                        .preview-content p { 
                            margin: 0 0 1.2em 0;
                            line-height: 1.8;
                        }
                        .preview-content h3 { 
                            font-size: 1.6rem; 
                            margin: 2rem 0 1rem;
                            font-weight: 600;
                            color: #1a1a1a;
                        }
                        .preview-content h4 { 
                            font-size: 1.3rem; 
                            margin: 1.5rem 0 0.8rem;
                            font-weight: 600;
                            color: #2c3e50;
                        }
                        .preview-content ul, .preview-content ol { 
                            margin: 0.8rem 0 1.2rem 1.5rem;
                            padding-left: 1.5rem;
                        }
                        .preview-content li { 
                            margin: 0.3rem 0;
                            line-height: 1.6;
                        }
                        .preview-content hr { 
                            margin: 2rem 0;
                            border: 0;
                            border-top: 2px solid #dee2e6;
                        }
                        .preview-content br {
                            display: block;
                            content: "";
                            margin: 0.3rem 0;
                        }
                        .preview-content b, .preview-content strong { font-weight: 700; }
                        .preview-content i, .preview-content em { font-style: italic; }
                        .preview-content u { text-decoration: underline; }
                    </style>
                    ${html}
                `;
                
                previewContent.innerHTML = styledHtml || '<span style="color: #999;">Введите текст для предпросмотра...</span>';
            }

            // Функция вставки тега
            function insertTag(textarea, tag) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = textarea.value.substring(start, end);
                
                let before = textarea.value.substring(0, start);
                let after = textarea.value.substring(end);
                let newText = '';
                let newCursorPos = start;
                
                switch(tag) {
                    case 'h3':
                    case 'h4':
                    case 'p':
                        if (selectedText) {
                            newText = before + `<${tag}>${selectedText}</${tag}>` + after;
                            newCursorPos = end + 2 * (tag.length + 2);
                        } else {
                            newText = before + `<${tag}>\n\n</${tag}>` + after;
                            newCursorPos = start + tag.length + 3;
                        }
                        break;
                        
                    case 'b':
                    case 'i':
                    case 'u':
                        if (selectedText) {
                            newText = before + `<${tag}>${selectedText}</${tag}>` + after;
                            newCursorPos = end + 2 * (tag.length + 2);
                        } else {
                            newText = before + `<${tag}></${tag}>` + after;
                            newCursorPos = start + tag.length + 2;
                        }
                        break;
                        
                    case 'ul':
                    case 'ol':
                        if (selectedText) {
                            const lines = selectedText.split('\n').filter(line => line.trim());
                            const listItems = lines.map(line => `  <li>${line}</li>`).join('\n');
                            newText = before + `<${tag}>\n${listItems}\n</${tag}>` + after;
                            newCursorPos = start + tag.length + 3 + listItems.length + tag.length + 4;
                        } else {
                            newText = before + `<${tag}>\n  <li></li>\n</${tag}>` + after;
                            newCursorPos = start + tag.length + 6;
                        }
                        break;
                        
                    case 'li':
                        if (selectedText) {
                            newText = before + `<li>${selectedText}</li>` + after;
                            newCursorPos = end + 8;
                        } else {
                            newText = before + `<li></li>` + after;
                            newCursorPos = start + 4;
                        }
                        break;
                        
                    case 'br':
                        newText = before + '<br>\n' + after;
                        newCursorPos = start + 5;
                        break;
                        
                    case 'hr':
                        newText = before + '\n<hr>\n' + after;
                        newCursorPos = start + 6;
                        break;
                }
                
                if (newText) {
                    textarea.value = newText;
                    textarea.selectionStart = textarea.selectionEnd = newCursorPos;
                }
                
                textarea.focus();
                
                // Триггерим событие change
                const event = new Event('change', { bubbles: true });
                textarea.dispatchEvent(event);
            }

            // Функция очистки форматирования
            function clearFormatting(textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = textarea.value.substring(start, end);
                
                if (selectedText) {
                    const cleanedText = selectedText.replace(/<\/?[^>]+(>|$)/g, '');
                    textarea.value = textarea.value.substring(0, start) + cleanedText + textarea.value.substring(end);
                    
                    setTimeout(() => {
                        textarea.selectionStart = start;
                        textarea.selectionEnd = start + cleanedText.length;
                    }, 0);
                }
                
                const event = new Event('change', { bubbles: true });
                textarea.dispatchEvent(event);
            }

            // Обновляем предпросмотр при вводе
            textarea.addEventListener('input', () => updatePreview(textarea));
            textarea.addEventListener('change', () => updatePreview(textarea));

            // Горячие клавиши
            textarea.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch(e.key) {
                        case 'b':
                            e.preventDefault();
                            insertTag(textarea, 'b');
                            updatePreview(textarea);
                            break;
                        case 'i':
                            e.preventDefault();
                            insertTag(textarea, 'i');
                            updatePreview(textarea);
                            break;
                        case 'u':
                            e.preventDefault();
                            insertTag(textarea, 'u');
                            updatePreview(textarea);
                            break;
                    }
                }
            });

            // Первоначальное обновление предпросмотра
            updatePreview(textarea);
        });
    });
})();