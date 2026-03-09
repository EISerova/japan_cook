(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const textareas = document.querySelectorAll('textarea[name="content"]');
        
        textareas.forEach(textarea => {
            if (!textarea) return;

            // История изменений
            let history = [textarea.value];
            let historyIndex = 0;
            let isHistoryRestoring = false;

            // Сохраняем состояние в историю
            function saveToHistory(value) {
                if (isHistoryRestoring) return;
                
                // Обрезаем историю до текущего индекса
                history = history.slice(0, historyIndex + 1);
                history.push(value);
                historyIndex++;
                
                // Ограничиваем размер истории
                if (history.length > 50) {
                    history.shift();
                    historyIndex--;
                }
            }

            // Отмена действия
            function undo() {
                if (historyIndex > 0) {
                    isHistoryRestoring = true;
                    historyIndex--;
                    textarea.value = history[historyIndex];
                    updatePreview(textarea);
                    isHistoryRestoring = false;
                }
            }

            // Повтор действия
            function redo() {
                if (historyIndex < history.length - 1) {
                    isHistoryRestoring = true;
                    historyIndex++;
                    textarea.value = history[historyIndex];
                    updatePreview(textarea);
                    isHistoryRestoring = false;
                }
            }

            // Контейнер для редактора
            const editorContainer = document.createElement('div');
            editorContainer.className = 'editor-container';
            textarea.parentNode.insertBefore(editorContainer, textarea);
            editorContainer.appendChild(textarea);

            // Создаем панель инструментов
            const toolbar = document.createElement('div');
            toolbar.className = 'editor-toolbar';
            
            const buttons = [
                { tag: 'b', label: '<b>B</b>', title: 'Жирный (Ctrl+B)' },
                { tag: 'i', label: '<i>I</i>', title: 'Курсив (Ctrl+I)' },
                { tag: 'u', label: '<u>U</u>', title: 'Подчеркнутый (Ctrl+U)' },
                { type: 'separator' },
                { tag: 'h3', label: 'H3', title: 'Заголовок 3' },
                { tag: 'h4', label: 'H4', title: 'Заголовок 4' },
                { tag: 'p', label: '¶ P', title: 'Абзац' },
                { type: 'separator' },
                { tag: 'ul', label: '• UL', title: 'Маркированный список' },
                { tag: 'ol', label: '1. OL', title: 'Нумерованный список' },
                { tag: 'li', label: '→ LI', title: 'Элемент списка' },
                { type: 'separator' },
                { tag: 'br', label: '↵ BR', title: 'Перенос строки' },
                { tag: 'hr', label: '— HR', title: 'Горизонтальная линия' },
                { type: 'separator' },
                { action: 'undo', label: '↩ Undo', title: 'Отменить (Ctrl+Z)' },
                { action: 'redo', label: '↪ Redo', title: 'Повторить (Ctrl+Y)' },
                { type: 'separator' },
                { action: 'clear', label: '🗑 Очистить', title: 'Очистить форматирование' }
            ];

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
                        const oldValue = textarea.value;
                        insertTag(textarea, btn.tag);
                        if (oldValue !== textarea.value) {
                            saveToHistory(textarea.value);
                        }
                        updatePreview(textarea);
                    });
                } else if (btn.action === 'clear') {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        const oldValue = textarea.value;
                        clearFormatting(textarea);
                        if (oldValue !== textarea.value) {
                            saveToHistory(textarea.value);
                        }
                        updatePreview(textarea);
                    });
                } else if (btn.action === 'undo') {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        undo();
                    });
                } else if (btn.action === 'redo') {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        redo();
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

            editorContainer.insertBefore(toolbar, textarea);
            editorContainer.appendChild(previewContainer);

            // Добавляем стили для таблиц
            const style = document.createElement('style');
            style.textContent = `
                .preview-content table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 20px 0; 
                    border: 1px solid #dee2e6;
                }
                .preview-content th, 
                .preview-content td { 
                    padding: 12px 15px; 
                    border: 1px solid #dee2e6; 
                    text-align: left;
                }
                .preview-content th { 
                    background-color: #C17A5C; 
                    color: white; 
                    font-weight: 600;
                }
                .preview-content tr:nth-child(even) { 
                    background-color: #f8f9fa; 
                }
                .preview-content { 
                    font-family: 'Inter', sans-serif; 
                    line-height: 1.8;
                    color: #212529;
                }
            `;
            document.head.appendChild(style);

            function updatePreview(textarea) {
                const previewContent = previewContainer.querySelector('.preview-content');
                previewContent.innerHTML = textarea.value;
            }

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
                const event = new Event('change', { bubbles: true });
                textarea.dispatchEvent(event);
            }

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

            // Отслеживаем изменения для истории
            textarea.addEventListener('input', function() {
                saveToHistory(this.value);
                updatePreview(this);
            });

            textarea.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch(e.key) {
                        case 'b':
                            e.preventDefault();
                            const oldB = textarea.value;
                            insertTag(textarea, 'b');
                            if (oldB !== textarea.value) saveToHistory(textarea.value);
                            updatePreview(textarea);
                            break;
                        case 'i':
                            e.preventDefault();
                            const oldI = textarea.value;
                            insertTag(textarea, 'i');
                            if (oldI !== textarea.value) saveToHistory(textarea.value);
                            updatePreview(textarea);
                            break;
                        case 'u':
                            e.preventDefault();
                            const oldU = textarea.value;
                            insertTag(textarea, 'u');
                            if (oldU !== textarea.value) saveToHistory(textarea.value);
                            updatePreview(textarea);
                            break;
                        case 'z':
                            e.preventDefault();
                            undo();
                            break;
                        case 'y':
                            e.preventDefault();
                            redo();
                            break;
                    }
                }
            });

            updatePreview(textarea);
            
            // Сохраняем начальное состояние
            saveToHistory(textarea.value);
        });
    });
})();