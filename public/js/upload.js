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
