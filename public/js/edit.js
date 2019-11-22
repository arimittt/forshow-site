let spectacles;
let categories;
const table = $('table');

let indexUpdated = [];

$(() => {
    $.get('/categories', (res) => {
        categories = JSON.parse(res);
        fetch('/search')
            .then((res) => {
                return res.json();
            })
            .then(function (jsonData) {
                spectacles = jsonData;
                spectacles.forEach((el) => {
                    let categoriesInsertion = '';
                    categories.forEach((category) => {
                        let isSelected = false;
                        el.categories.forEach((elCategory) => {
                            if(elCategory == category) {
                                isSelected = true;
                            }
                        });
                        categoriesInsertion = categoriesInsertion.concat(`
                            <div class="category-item ${isSelected ? ' category-item-active' : (el.categories.length >= 3 ? 'category-item-disabled' : '')}">
                                <span>${category}</span>
                                <div class="category-box"></div>
                            </div>
                        `);
                    });
                    let keywordInsertion = '';
                    el.keywords.forEach((keyword) => {
                        keywordInsertion = keywordInsertion.concat(`<span data-keyword="${keyword}">${keyword}</span>`);
                    });
                    table.append(`
                    <tr data-id="${el.id}">
                        <td>${el.id}</td>
                        <td>
                            <div class="table-img-preview" style="background-image: url('${el.image}')"></div>
                        </td>
                        <td contenteditable="true">${el.description}</td>
                        <td class="categories-container">${categoriesInsertion}</td>
                        <td class="keywords-container">${keywordInsertion + '<input type="text" placeholder="Add keywords...">'}</td>
                    </tr>
                `);
                });
            })
            .catch(err => console.error(err));
    })
});

$('body').on('click', '.category-item', function () {
    if (!$(this).hasClass('category-item-disabled')) {
        $(this).toggleClass('category-item-active');
        if ($(this).hasClass('category-item-active')) {
            if ($(this).siblings('.category-item-active').length >= 2) {
                $(this).siblings().not('.category-item-active').addClass('category-item-disabled');
            }
        } else {
            $(this).siblings().removeClass('category-item-disabled');
        }
    }
});

$('body').on('click', '.keywords-container span', function () {
    $(this).remove();
});

$('body').on('keyup', 'input[type="text"]', function (e) {
    if (e.keyCode == 8 && !$(this).val() && removeSpan) {
        $(this).siblings('span').last().remove();
        if ($(this).siblings('span').length < 1) {
            $(this).attr('placeholder', 'Use commas to separate keywords.');
        }
    }
    removeSpan = true;
});

let removeSpan;
const alphaNumericRegex = /^[0-9a-zA-Z ]+$/;
$('body').on('input', 'input[type="text"]', function () {
    handleKeywordInput($(this));
});

$('body').on('focusout', 'input[type="text"]', function () {
    handleKeywordInput($(this), true);
});

function handleKeywordInput(inputEl, focusOut = false) {
    removeSpan = false;
    if (inputEl.val()) {
        const curChar = inputEl.val()[inputEl.val().length - 1];
        if (!alphaNumericRegex.test(curChar)) {
            removeLastChar();
            if (curChar == ',' && inputEl.val().length > 1) {
                addSpan();
            }
        } else if (curChar == ' ' && inputEl.val().length == 1) {
            removeLastChar();
        } else if (focusOut) {
            addSpan();
        }
    }

    function removeLastChar() {
        inputEl.val(inputEl.val().substring(0, inputEl.val().length - 1));
    }

    function addSpan() {
        let keywordString = '';
        for (let i = 0; i < inputEl.val().length; i++) {
            if (alphaNumericRegex.test(inputEl.val()[i]) && !(i == 0 && inputEl.val()[i] == ' ')) {
                keywordString = keywordString.concat(inputEl.val()[i]).toLowerCase();
            }
        }
        inputEl.before(`<span>${keywordString}</span>`);
        let updateValue = [];
        inputEl.push(keywordString);
        $(inputEl).val('');
    }
}

$('.save-button').on('click', () => {
    let update = [];
    for(let i = 0; i < spectacles.length; i++) {
        const curElement = $(`tr[data-id="${spectacles[i].id}"]`);
        let curSpectacle  = {
            id: spectacles[i].id,
            description: curElement.children('td').eq(2).text(),
            categories: [],
            keywords: []
        };
        let updateDescription = false;
        let updateCategories = false;
        let updateKeywords = false;
        curElement.find('.category-item-active').each(function() {
            curSpectacle.categories.push($(this).children('span').text());
        });
        curElement.children('.keywords-container').children('span').each(function() {
            curSpectacle.keywords.push($(this).text());
        });
        if(spectacles[i].description != curSpectacle.description) {
            updateDescription = true;
        }
        spectacles[i].categories.forEach(function(el) {
            if(!curSpectacle.categories.includes(el)) {
                updateCategories = true;
            }
        });
        curSpectacle.categories.forEach(function (el) {
            if (!spectacles[i].categories.includes(el)) {
                updateCategories = true;
            }
        });
        spectacles[i].keywords.forEach(function(el) {
            if(!curSpectacle.keywords.includes(el)) {
                updateKeywords = true;
            }
        });
        curSpectacle.keywords.forEach(function (el) {
            if (!spectacles[i].keywords.includes(el)) {
                updateKeywords = true;
            }
        });
        if(updateDescription || updateCategories || updateKeywords) {
            update.push(curSpectacle);
        }
    }

    console.log(update);

    $.post('/edit', {update: update}, (err) => {
        if (err.length > 0) {
            let alertMsg = '';
            for (let i = 0; i < err.length; i++) {
                alertMsg += err[i] + '\r\n';
            }
            alert(alertMsg);
        } else {
            alert('Saved changes!');
        }
    });
});