$('#image-file').on('change', function() {
  const file = document.getElementById('image-file').files[0];
  if(file == null) {
    return alert('No file selected.');
  } else {
    getSignedRequest(file);
  }
});

function getSignedRequest(file) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `/sign-s3?file-name=${encodeURIComponent(file.name)}&file-type=${encodeURIComponent(file.type)}`);
  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4) {
      if(xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        uploadFile(file, response.signedRequest, response.url);
      } else {
        alert('Error: Could not get signed URL.');
      }
    }
  };
  xhr.send();
}

function uploadFile(file, signedRequest, url) {
  const xhr = new XMLHttpRequest();
  xhr.open('PUT', signedRequest);
  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4) {
      if(xhr.status === 200) {
        $('#image-file-preview').attr('src', url);
        $('#image-url').attr('value', url);
      } else {
        alert('Error: Could not upload file.');
      }
    }
  };
  xhr.send(file);
}

var categories = [
  'category-1',
  'category-2',
  'category-3',
  'category-4'
];

$(function() {
  for(let i = 0; i < categories.length; i++) {
    $('.category-list').append(`<input type="checkbox" name="${categories[i]}" value="${categories[i]}">`);
  }
});

$('form').submit((e) => {
  e.preventDefault();
  var data = {
    image: $('#image-url').val(),
    categories: [],
    keywords: $('#keywords').val(),
    description: $('#description').val(),
    time: $('#time').val()
  }
  for(let i = 0; i < categories.length; i++) {
    if($(`input[name='${categories[i]}']`).is(':checked')) {
      data.categories.push(categories[i]);
    }
  }

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
