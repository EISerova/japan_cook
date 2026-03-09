document.addEventListener('DOMContentLoaded', function() {
    // Добавляем подтверждение для важных действий
    const deleteButtons = document.querySelectorAll('.deletelink');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (!confirm('Вы уверены, что хотите удалить этот объект?')) {
                e.preventDefault();
            }
        });
    });
    
    // Подсветка полей с ошибками
    const errorFields = document.querySelectorAll('.errorlist');
    errorFields.forEach(field => {
        field.closest('.form-row').style.backgroundColor = '#fff0f0';
    });
});