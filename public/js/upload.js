var categories = [];
var formTemplate;
var curDate;
var formCount = 0;

$(function() {
  var dateObj = new Date();
  var curDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

  $.get('/categories', (res) => {
    categories = JSON.parse(res);
    categoriesObj = $('<div></div>', {
      "class" : "categories-list"
    });
    formTemplate = `
      <form>
        <input type="file" class="image-file" name="image-file" accept=".png,.jpg,.jpeg,.gif">
        <img class="image-file-preview" src="images/default-preview.png">
        <input type="hidden" name="image-url" value="images/default-preview.png"><br>
        <div class="category-list">
    `;
    for(let i = 0; i < categories.length; i++) {
      formTemplate =  formTemplate.concat(`${categories[i]}: <input type="checkbox" name="${categories[i]}" value="${categories[i]}" class="category-checkbox"> `);
    }
    formTemplate =  formTemplate.concat(`
        </div>
        <input type="text" name="keywords" placeholder="Keywords"><br>
        <input type="text" name="description" placeholder="Description"><br>
        <input type="date" name="date" min="01-09-2019" max="${curDate}" value="${curDate}"><br>
      </form>
    `);
    addForm();
  });
});

function addForm() {
  formCount++;
  $('.forms').append(formTemplate);
  $('form').last().attr('data-form-no', formCount);
  $('form').last().children('.image-file').attr('id', `image-file-${formCount}`);
}

$('.image-file').on('change', function() {
  var fileNo = $(this).parents('form')[0].attr('data-form-no');
  const file = document.getElementById(`image-file-${fileNo}`).files[0];
  if(file == null) {
    return alert('No file selected.');
  } else {
    getSignedRequest(file, fileNo);
  }
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
        $(`form[data-form-no="${fileNo}"]`).children('.image-file-preview').attr('src', url);
        $(`form[data-form-no="${fileNo}"]`).children('input[name="image-url"]').attr('value', url);
      } else {
        alert('Error: Could not upload file.');
      }
    }
  };
  xhr.send(file);
}

$('#submit-form').on('click', (e) => {
  e.preventDefault();
  $('form').each(() => {
    var data = {
      image: $(this).children('input[name="image-file"]').val(),
      categories: [],
      keywords: $(this).children('input[name="keywords"]').val(),
      description: $(this).children('input[name="description"]').val(),
      date: $(this).children('input[name="date"]').val()
    }
    $(this).children('.category-checkbox').each((el) => {
      if(el.is(':checked')) {
        data.categories.push(el.val());
      }
    });

    $.post('/upload', data, (err) => {
      if(err.length > 0) {
        var alertMsg = '';
        for(let i = 0; i < err.length; i++) {
          alertMsg += err[i] + '\r\n';
        }
        alert(alertMsg);
      } else {
        alert('Upload successful!');
      }
    });
  });
});

$('#add-item').on('click', () => {
  addForm();
});
