let categories = [];
let formTemplate;
let curDate;
let formData = [];

$(function() {
  const dateObj = new Date();
  curDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

  $.get('/categories', (res) => {
    categories = JSON.parse(res);
    categoriesObj = $('<div></div>', {
      "class" : "categories-list"
    });
    formTemplate = `
      <form>
        <div class="img-preview"></div>
        <div class="form-details">
          <textarea class="description" rows="3" placeholder="Write a description..."></textarea>
          <span class="form-title">Choose upto 3 categories.</span>
          <div class="categories-container">
    `;
    for(let i = 0; i < categories.length; i++) {
      formTemplate = formTemplate.concat(`
        <div class="category-item" data-category="${categories[i]}">
          <span>${categories[i]}</span>
          <div class="category-box"></div>
        </div>
      `);
    }
    formTemplate =  formTemplate.concat(`
          </div>
          <span class="form-title">Add some keywords.</span>
          <ul class="keywords-container">
            <input type="text" placeholder="Use commas to separate keywords.">
          </ul>
          <span class="upload-title">Date of upload: </span><input type="date" value="${curDate}" max="${curDate}" min="2019-09-01">
        </div>
      </form>
    `);
  });
});

function addForm(imgUrl) {
  formData.push({
    image: imgUrl,
    categories: [],
    keywords: [],
    description: '',
    date: curDate
  });
  if(formData.length > 0) {
    $('.forms').css('justify-content', 'flex-start');
  }
  $('.add-item').before(formTemplate);
  $('form').last().attr('data-form-no', formData.length);
  $('form').last().children('.image-file').attr('id', `image-file-${formData.length}`);
  resizeBlob();
  $(`form[data-form-no="${formData.length}"]`).children('.img-preview').css('background-image', `url(${formData[formData.length - 1].image})`);
  blobs.push(
    {
      id: 'img-preview-clip-1',
      prevPath: getNewPath(imgPreviewViewBox),
      nextPath: getNewPath(imgPreviewViewBox),
      curPath: [],
      progress: 0
    }
  );
  $('.forms').animate({
    scrollLeft: formsInnerWidth - formsWidth
  },500);
}

$('body').on('change', '.image-file', function() {
  const file = document.getElementsByClassName(`image-file`)[0].files[0];

  if(file == null) {
    return alert('No file selected.');
  } else if (file.type != 'image/png' && file.type != 'image/jpeg' && file.type != 'image/jpg' && file.type != 'image/gif') {
    alert('Please upload one of the following image types:\n.png / .jpg / .jpeg / .gif');
  } else {
    getSignedRequest(file, formData.length);
  }
});

$('body').on('click', '.category-item', function() {
  let formNo = parseInt($(this).parents('form').attr('data-form-no'));
  if($(this).hasClass('category-item-active')) {
    $(this).toggleClass('category-item-active');
    let curCategory = $(this).attr('data-category');
    for(let i = 0; i < formData[formNo - 1].categories.length; i++) {
      if(formData[formNo - 1].categories[i] == curCategory) {
        formData[formNo - 1].categories.splice(i, 1);
        break;
      }
    }
    $(this).siblings().not('.category-item-active').removeClass('category-item-disabled');
  } else {
    if(formData[formNo - 1].categories.length < 3) {
      $(this).toggleClass('category-item-active');
      formData[formNo - 1].categories.push($(this).attr('data-category'));
      if(formData[formNo - 1].categories.length > 2) {
        $(this).siblings().not('.category-item-active').addClass('category-item-disabled');
      }
    }
  }
});

let removeSpan;
const alphaNumericRegex = /^[0-9a-zA-Z ]+$/;
$('body').on('input', 'input[type="text"]', function() {
  handleKeywordInput($(this));
});

$('body').on('focusout', 'input[type="text"]', function () {
  handleKeywordInput($(this), true);
});

function handleKeywordInput(inputEl, focusOut = false) {
  removeSpan = false;
  if(inputEl.val()) {
    const curChar = inputEl.val()[inputEl.val().length - 1];
    if(!alphaNumericRegex.test(curChar)) {
      removeLastChar();
      if(curChar == ',' && inputEl.val().length > 1) {
        addSpan();
      }
    } else if(curChar == ' ' && inputEl.val().length == 1) {
      removeLastChar();
    } else if(focusOut) {
      addSpan();
    }
  }

  function removeLastChar() {
    inputEl.val(inputEl.val().substring(0, inputEl.val().length - 1));
  }

  function addSpan() {
    let keywordString = '';
    for(let i = 0; i < inputEl.val().length; i++) {
      if (alphaNumericRegex.test(inputEl.val()[i]) && !(i == 0 && inputEl.val()[i] == ' ')) {
        keywordString = keywordString.concat(inputEl.val()[i]);
      }
    }
    inputEl.before(`<span>${keywordString}</span>`);
    formData[parseInt(inputEl.parents('form').attr('data-form-no')) - 1].keywords.push(keywordString);
    inputEl.attr('placeholder', '');
    inputEl.val('');
  }
}

$('body').on('click', '.keywords-container span', function() {
  $(this).remove();
});

$('body').on('keyup', 'input[type="text"]', function (e) {
  if(e.keyCode == 8 && !$(this).val() && removeSpan) {
    $(this).siblings('span').last().remove();
    if($(this).siblings('span').length < 1) {
      $(this).attr('placeholder', 'Use commas to separate keywords.');
    }
  }
  removeSpan = true;
});

$('body').on('change', '.description', function() {
  formData[parseInt($(this).parents('form').attr('data-form-no')) - 1].description = $(this).val();
});

$('body').on('change', 'input[type="date"]', function() {
  formData[parseInt($(this).parents('form').attr('data-form-no')) - 1].date = $(this).val() ? $(this).val() : curDate;
});

function getSignedRequest(file, fileNo) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `/sign-s3?file-name=${encodeURIComponent(file.name)}&file-type=${encodeURIComponent(file.type)}`);
  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4) {
      if(xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        uploadFile(file, response.signedRequest, response.url, fileNo);
      } else {
        alert('Error: Could not get signed URL.');
      }
    }
  };
  xhr.send();
}

function uploadFile(file, signedRequest, url, fileNo) {
  const xhr = new XMLHttpRequest();
  xhr.open('PUT', signedRequest);
  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4) {
      if(xhr.status === 200) {
        addForm(url);
      } else {
        alert('Error: Could not upload file.');
      }
    }
  };
  xhr.send(file);
}

$('.submit-form').on('click', (e) => {
  e.preventDefault();
  for(let i = 0; i < formData.length; i++) {
    $.post('/upload', formData[i], (err) => {
      if (err.length > 0) {
        let alertMsg = '';
        for (let i = 0; i < err.length; i++) {
          alertMsg += err[i] + '\r\n';
        }
        alert(alertMsg);
      } else {
        alert('Upload successful!');
      }
    });
  }
});

$('#add-item').on('click', () => {
  $('input[type="file"]').trigger('click');
});

// Drawing blobs

const pointScatter = 6;
const blobSpeed = 0.01;

let addItem = $('.add-item');
let addIconViewBox = {
  width: parseInt(addItem.attr('viewBox').split(' ')[2]),
  height: parseInt(addItem.attr('viewBox').split(' ')[3])
};
let imgPreviewViewBox = {};

let blobs = [
  {
    id: 'add-item',
    prevPath: getNewPath(addIconViewBox),
    nextPath: getNewPath(addIconViewBox),
    curPath: [],
    progress: 0
  }
];

drawBlob();

function drawBlob() {
  for(let i = 0; i < blobs.length; i++) {
    let svgData = {};
    if(i == 0) {
      svgData = Object.assign(svgData, addIconViewBox);
    } else {
      svgData = Object.assign(svgData, imgPreviewViewBox);
    }
    let multiplier = easeInOut(blobs[i].progress);
    for(let j = 0; j < 4; j++) {
      blobs[i].curPath[j] = [
        (blobs[i].prevPath[j][0] + ((blobs[i].nextPath[j][0] - blobs[i].prevPath[j][0]) * multiplier)),
        (blobs[i].prevPath[j][1] + ((blobs[i].nextPath[j][1] - blobs[i].prevPath[j][1]) * multiplier)),
        (blobs[i].prevPath[j][2] + ((blobs[i].nextPath[j][2] - blobs[i].prevPath[j][2]) * multiplier))
      ];
    }
    let curBlob = i > 0 ? $(`#${blobs[i].id} .blob`) : $(`#${blobs[i].id}`);
    curBlob.attr('d', `
    M ${(svgData.width / 2) + blobs[i].curPath[0][0]} ${blobs[i].curPath[0][1]}
    C ${(3 * svgData.width / 4) + blobs[i].curPath[0][2]} ${blobs[i].curPath[0][1]}, ${svgData.width - blobs[i].curPath[1][0]} ${(svgData.height / 4) + blobs[i].curPath[1][2]}, ${svgData.width - blobs[i].curPath[1][0]} ${(svgData.height / 2) + blobs[i].curPath[1][1]}
    S ${(3 * svgData.width / 4) + blobs[i].curPath[2][2]} ${svgData.height - blobs[i].curPath[2][1]}, ${svgData.width / 2 + blobs[i].curPath[2][0]} ${svgData.height - blobs[i].curPath[2][1]}
    S ${blobs[i].curPath[3][0]} ${(3 * svgData.height / 4) + blobs[i].curPath[3][2]}, ${blobs[i].curPath[3][0]} ${(svgData.height / 2) + blobs[i].curPath[3][1]}
    S ${(svgData.width / 4) - blobs[i].curPath[0][2]} ${blobs[i].curPath[0][1]}, ${(svgData.width / 2) + blobs[i].curPath[0][0]} ${blobs[i].curPath[0][1]}
    Z
  `);
    blobs[i].progress += blobSpeed;
    if(blobs[i].progress >= 1) {
      blobs[i].prevPath = Object.assign(blobs[i].prevPath, blobs[i].nextPath);
      blobs[i].nextPath = getNewPath(svgData);
      blobs[i].progress = 0;
    }
  }
  window.requestAnimationFrame(drawBlob);
}

function getNewPath(svgData) {
  let newPath = [];
  for(let i = 0; i < 4; i++) {
    newPath.push([
      Math.round(Math.random() * (svgData.width / pointScatter)),
      Math.round(Math.random() * (svgData.height / pointScatter)),
      svgData.height/8
    ]);
  }
  return newPath;
}

function easeInOut(t) {
  return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Scroll Indicator

let scrollIndicator = $('.scroll-indicator');
let scrollIndicatorWidth = scrollIndicator.width();
let scrollIndicatorContainerWidth = $('.submit-form').offset().left;
let scrollIndicatorPos = 0;
let formsWidth = $('.forms-container').width();
let formsInnerWidth;

$('.forms').on('scroll', function(e) {
  scrollIndicatorPos = $('.forms').scrollLeft() * (scrollIndicatorWidth / formsWidth);
  scrollIndicator.css('transform', `translate(${scrollIndicatorPos}px,-50%)`);
});

let scrollIndicatorState = 0;
let scrollMouseOrigin;
let scrollIndicatorOrigin;
scrollIndicator.mousedown((e) => {
  scrollIndicatorState = 1
  scrollMouseOrigin = e.pageX;
  scrollIndicatorOrigin = scrollIndicatorPos;
});
$(document).mousemove((e) => {
  if(scrollIndicatorState > 0) {
    scrollIndicatorState = 2;
    scrollIndicatorPos = scrollIndicatorOrigin + e.pageX - scrollMouseOrigin;
    if(scrollIndicatorPos < 0) {
      scrollIndicatorPos = 0;
    } else if(scrollIndicatorPos > scrollIndicatorContainerWidth - scrollIndicatorWidth) {
      scrollIndicatorPos = scrollIndicatorContainerWidth - scrollIndicatorWidth;
    }
    scrollIndicator.css('transform', `translate(${scrollIndicatorPos}px,-50%)`);
    $('.forms').scrollLeft(scrollIndicatorPos * (formsWidth / scrollIndicatorWidth));
  }
});
$(document).mouseup(() => {
  scrollIndicatorState = 0
});

$(window).bind('mousewheel DOMMouseScroll', function(e) {
  let newScrollPos = $('.forms').scrollLeft() - e.originalEvent.wheelDelta;
  $('.forms').scrollLeft(newScrollPos);
  scrollIndicatorPos = $('.forms').scrollLeft() * (scrollIndicatorWidth / formsWidth);
  scrollIndicator.css('transform', `translate(${scrollIndicatorPos}px,-50%)`);
});

// Resizing window

window.addEventListener('resize', resizeBlob);
resizeBlob();
function resizeBlob() {
  if($('.img-preview').length > 0) {
    $('.img-preview-clip-container').attr('viewBox', `0 0 ${$('.img-preview').width()} ${$('.img-preview').height()}`);
    imgPreviewViewBox = {
      width: parseInt($('.img-preview-clip-container').attr('viewBox').split(' ')[2]),
      height: parseInt($('.img-preview-clip-container').attr('viewBox').split(' ')[3])
    };
  }
  formsInnerWidth = document.getElementsByClassName('forms')[0].scrollWidth;
  scrollIndicatorContainerWidth = $('.submit-form').offset().left;
  formsWidth = $('.forms-container').width();
  scrollIndicatorWidth = scrollIndicatorContainerWidth * formsWidth / formsInnerWidth;
  scrollIndicator.css('width', `${scrollIndicatorWidth}px`);
}