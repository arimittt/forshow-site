// Keep maxSpectacleCount a product of horizontalDensity times an integer to avoid "orphans/widows".

let maxSpectacleCount = 60;
let radius = 1500;
let horizontalDensity = 12;
let verticalDensity = 10;
let imageSize = [384, 384];
const maxRotSpeed = 0.1;
const sidebarAnimSpeed = 0.3;
const sphereVisible = true;

let spectacles = [];
let categories = [];
let keywords = [];

let filter = {
    categories: [],
    keywords: []
}

function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};

$(() => {
    fetch('/search')
        .then((res) => {
            return res.json();
        })
        .then(function (jsonData) {
            spectacles = jsonData;

            for(let i = 0; i < spectacles.length; i++) {
                for(let j = 0; j < spectacles[i].keywords.length; j++) {
                    let isDuplicate = false;
                    for(let k = 0; k < keywords.length; k++) {
                        if(spectacles[i].keywords[j] == keywords[k]) {
                            isDuplicate = true;
                            break;
                        }
                    }
                    if(!isDuplicate) {
                        keywords.push(spectacles[i].keywords[j]);
                    }
                }
            }

            keywords.sort();
            const filterGroup = getUrlParameter('g') ? getUrlParameter('g') : undefined;
            console.log(filterGroup);
            if(!filterGroup) {
                insertSpectacles(spectacles);
            } else {
                let groupSpectacles = [];
                for(let i = 0; i < spectacles.length; i++) {
                    for(let j = 0; j < spectacles[i].keywords.length; j++) {
                        if(spectacles[i].keywords[j].replace(/ /g, '').toLowerCase().includes(filterGroup)) {
                            groupSpectacles.push(spectacles[i]);
                            j = spectacles[i].keywords.length;
                            break;
                        }
                    }
                }
                if(groupSpectacles.length >= 1) {
                    insertSpectacles(groupSpectacles);
                } else {
                    insertSpectacles(spectacles);
                }
            }
            

            keywords.forEach((keyword) => {
                $('.keywords-dropdown-scroll').append(`
                    <div class="keywords-dropdown-item" data-keyword="${keyword}">
                        ${keyword}
                    </div>
                `);
            });
        })
        .catch(err => console.error(err));

    $.get('/categories', (res) => {
        categories = JSON.parse(res);
        categories.forEach((cat) => {
            $('.categories-container').append(`
                <div class="category-item" data-category="${cat}">
                    <span>${cat}</span>
                    <div class="category-box"></div>
                </div>
            `);
        });
    })

    if ($('.filter-icon').css('opacity') != '1') {
        window.addEventListener('mousemove', function (e) {
            if (!isPaused) {
                mouseX = e.clientX / window.innerWidth;
                mouseY = e.clientY / window.innerHeight;
            }
        });
    }
});

function insertSpectacles(spectaclesArr) {
    let visibleSpectacles = [];
    if(spectaclesArr.length <= maxSpectacleCount) {
        visibleSpectacles = spectaclesArr;
    } else {
        let visibleSpectaclesIndex = [];
        for (let i = 0; i < Math.min(maxSpectacleCount, spectaclesArr.length); i++) {
            randomIndex = Math.floor(Math.random() * spectaclesArr.length);
            let isUnique = false;
            while (!isUnique) {
                randomIndex = Math.floor(Math.random() * spectaclesArr.length);
                let isDuplicate = false;
                for (let j = 0; j < visibleSpectaclesIndex.length; j++) {
                    if (visibleSpectaclesIndex[j] == randomIndex) {
                        isDuplicate = true;
                        break;
                    }
                }
                isUnique = !isDuplicate;
            }
            visibleSpectacles.push(spectaclesArr[randomIndex]);
        }
    }
    
    while(cssScene.children.length > 0) {
        cssScene.remove(cssScene.children[0]);
    }

    const sceneCenter = new THREE.Vector3(0, 0, 0);
    for (let i = 0; i < visibleSpectacles.length; i++) {
        const curRow = Math.floor(i / horizontalDensity);
        let angles = [
            ((Math.PI * 2) * (i / horizontalDensity)) + (((curRow + (curRow % 2 == 0 ? 0 : 1)) / 2) % 2 == 0 ? (Math.PI * 2) / (horizontalDensity * 2) : 0),
            0
        ];
        if (curRow == 0) {
            angles[1] = 0;
        } else {
            angles[1] = (curRow - (curRow % 2 == 0 ? (curRow + (curRow / 2)) : ((curRow - 1) / 2))) * verticalDensity * Math.PI / 180;
        }
        addItem(visibleSpectacles[i], angles);
    }

    function addItem(item, angles) {
        let itemTemplate = document.createElement('div');
        itemTemplate.className = 'spectacle-item';
        itemTemplate.style.backgroundImage = `url('${item.image}')`;
        itemTemplate.style.width = `${imageSize[0]}px`;
        itemTemplate.style.height = `${imageSize[1]}px`;
        let itemCategories = '';
        let itemKeywords = '';
        for (let j = 0; j < item.categories.length; j++) {
            itemCategories = itemCategories.concat(item.categories[j] + (j == item.categories.length - 1 ? '' : ','));
        }
        for (let j = 0; j < item.keywords.length; j++) {
            itemKeywords = itemKeywords.concat(item.keywords[j] + (j == item.keywords.length - 1 ? '' : ','));
        }
        itemTemplate.setAttribute('data-id', item.id);
        itemTemplate.setAttribute('data-categories', itemCategories);
        itemTemplate.setAttribute('data-keywords', itemKeywords);
        let cssObject = new THREE.CSS3DObject(itemTemplate);
        cssObject.position.x = radius * Math.sin(angles[0]);
        cssObject.position.y = radius * angles[1];
        cssObject.position.z = radius * Math.cos(angles[0]);
        cssObject.lookAt(sceneCenter);
        cssScene.add(cssObject);
    }
}

let blobSize = [$('.focus-image').width(), $('.focus-image').height()];
let isPaused = false;
const sidebar = $('.sidebar');

function restartAnim(el, className, animDuration) {
    const animDir = el.hasClass(className) ? 'reverse' : 'normal';
    if (animDir == 'normal') {
        el.addClass(className);
        el.css('animation-direction', 'normal');
    } else {
        el.css('animation-direction', 'reverse');
    }
    let newEl = el.clone(true);
    el.before(newEl);
    el.remove();
    if(animDir == 'reverse') {
        setTimeout(() => {
            newEl.removeClass(className);
        }, animDuration * 1000);
    }
}

$('body').on('click', '.filter-icon', () => {
    if(!isPaused) {
        togglePause('sidebar');
    }
});

$('body').on('click', '.back-icon', () => {
    togglePause('sidebar');
});

$('body').on('click', '.apply-filter', () => {
    let spectaclesArr = [];
    for(let i = 0; i < spectacles.length; i++) {
        let showSpectacle = false;
        for(let j = 0; j < filter.categories.length; j++) {
            for(let k = 0; k < spectacles[i].categories.length; k++) {
                if(spectacles[i].categories[k] == filter.categories[j]) {
                    showSpectacle = true;
                    spectaclesArr.push(spectacles[i]);
                    break;
                }
            }
            if(showSpectacle) {
                break;
            }
        }
        if(!showSpectacle) {
            for (let j = 0; j < filter.keywords.length; j++) {
                for (let k = 0; k < spectacles[i].keywords.length; k++) {
                    if (spectacles[i].keywords[k] == filter.keywords[j]) {
                        showSpectacle = true;
                        spectaclesArr.push(spectacles[i]);
                        break;
                    }
                }
                if (showSpectacle) {
                    break;
                }
            }
        }
    }
    if(spectaclesArr.length) {
        insertSpectacles(spectaclesArr);
    } else {
        insertSpectacles(spectacles);
    }
    togglePause();
});

const normalVignette = 15;
const pauseVignette = 50;
let curVignette;
const vignetteEl = $('.vignette');
const vignetteSpeed = 2;
let mode;
function toggleVignette(curMode) {
    if (curMode == 'light' || curMode == 'dark') {
        mode = curMode;
        if (curMode == 'light') {
            curVignette = pauseVignette;
        } else if (curMode == 'dark') {
            curVignette = normalVignette;
        }
    }
    if (mode == 'light') {
        curVignette -= vignetteSpeed;
    } else if (mode == 'dark') {
        curVignette += vignetteSpeed;
    }
    vignetteEl.css('--vignette-strength', curVignette + 'vw');
    if ((mode == 'light' && curVignette > normalVignette) || (mode == 'dark' && curVignette < pauseVignette)) {
        setTimeout(function() {
            requestAnimationFrame(toggleVignette);
        },16);
    }
}

const focusContainer = $('.spectacle-focus-container');

function togglePause(source, id) {
    if (isPaused) {
        isPaused = false;
        toggleVignette('light');
        $('.vignette').css('pointer-events', 'none');
    } else {
        isPaused = true;
        toggleVignette('dark');
        $('.vignette').css('pointer-events', 'all');
        dampRot();
    }

    if(source == 'sidebar') {
        restartAnim($('.sidebar'), 'sidebar-in', sidebarAnimSpeed);
    } else if(source == 'focus') {
        focusContainer.css('display', 'block');
        $('.focus-image').attr('src', spectacles[checkId(id)].image);
        $('.focus-description').empty();
        $('.focus-categories').empty();
        $('.focus-keywords').empty();
        $('.focus-description').append(spectacles[checkId(id)].description);
        spectacles[checkId(id)].categories.forEach(function (el) {
            $('.focus-categories').append(`<div class="focus-categories-item">${el}</div>`);
        });
        spectacles[checkId(id)].keywords.forEach(function (el) {
            $('.focus-keywords').append(`<div class="focus-keywords-item">${el}</div>`);
        });
    } else if(source == 'settings') {
        $('.settings-container').css('display', 'block');
    } else {
        if($('.sidebar').hasClass('sidebar-in')) {
            restartAnim($('.sidebar'), 'sidebar-in', sidebarAnimSpeed);
        }
        if (focusContainer.css('display') == 'block') {
            focusContainer.css('display', 'none');
        }
        if ($('.settings-container').css('display') == 'block') {
            maxSpectacleCount = $('.spectacle-count-input').val();
            imageSize = [$('.image-size-input').val(), $('.image-size-input').val()];
            insertSpectacles(spectacles);
            $('.settings-container').css('display', 'none');
        }
    }
}

$('.vignette').on('click', () => {
    if(isPaused) {
        togglePause();
    }
});

function checkId(id) {
    for(let i = 0; i < spectacles.length; i++) {
        if(spectacles[i].id == id) {
            return i;
        }
    }
}

endRot = [0.51, 0.50];

function dampRot() {
    if(mouseX.toFixed(2) != endRot[0]) {
        mouseX += 0.01 * (mouseX > endRot[0] ? -1 : 1);
    }
    if (mouseY.toFixed(2) != endRot[1]) {
        mouseY += 0.01 * (mouseY > endRot[1] ? -1 : 1);
    }

    if (mouseX.toFixed(2) != endRot[0] || mouseY.toFixed(2) != endRot[1]) {
        requestAnimationFrame(dampRot);
    }
}

$('body').on('click', '.category-item', function() {
    $(this).toggleClass('category-item-active');
    if (!$(this).hasClass('category-item-active')) {
        for(let i = 0; i < filter.categories.length; i++) {
            if(filter.categories[i] == $(this).attr('data-category')) {
                filter.categories.splice(i, 1);
            }
        }
    } else {
        filter.categories.push($(this).attr('data-category'));
    }
});

$('body').on('click', '.keywords-dropdown-item', function() {
    let addKeyword = true;
    for(let i = 0; i < filter.keywords.length; i++) {
        if(filter.keywords[i] == $(this).attr('data-keyword')) {
            addKeyword = false;
            break;
        }
    }
    if(addKeyword) {
        filter.keywords.push($(this).attr('data-keyword'));
        $('.keywords-container').append(`<span data-keyword="${$(this).attr('data-keyword')}">${$(this).text()}</span>`);
    }
    $('.keyword-input').val('');
    $('.keywords-dropdown-item').each(function () {
        $(this).css('display', 'block');
    });
});

$('body').on('click', '.keywords-container span', function() {
    for (let i = 0; i < filter.keywords.length; i++) {
        if (filter.keywords[i] == $(this).attr('data-keyword')) {
            filter.keywords.splice(i, 1);
            break;
        }
    }
    $(this).remove();
});

$('body').on('keyup', '.keyword-input', function() {
    const inputText = $(this).val().toLowerCase();
    $('.keywords-dropdown-item').each(function() {
        if($(this).attr('data-keyword').indexOf(inputText) != -1) {
            $(this).css('display', 'block');
        } else {
            $(this).css('display', 'none');
        }
    });
});

$('.blob').attr('d', `
    M ${imageSize[0]/2} 0
    c ${imageSize[0] / 2} 0, -${imageSize[0] / 2} 0, 0 0
    S ${imageSize[0]} ${imageSize[1] / 2}, ${imageSize[0]} ${imageSize[1] / 2}
    S ${imageSize[0]} ${imageSize[1]}, ${imageSize[0]/2} ${imageSize[1]}
    S 0 ${imageSize[1] / 2}, 0 ${imageSize[1] / 2}
    S 0 0, ${imageSize[0]/2} 0
    z
`);

const cssRenderer = new THREE.CSS3DRenderer();
document.getElementById('container').appendChild(cssRenderer.domElement);
const cssScene = new THREE.Scene();

const canvas = document.getElementById('gl');
const glRenderer = new THREE.WebGLRenderer({ canvas });
const glScene = new THREE.Scene();

if(sphereVisible) {
    // Creating world sphere
    const sphereGeometry = new THREE.SphereBufferGeometry(100, 64, 32);
    const sphereWireframe = new THREE.WireframeGeometry(sphereGeometry);
    const sphereMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 1,
        transparent: true,
        opacity: 0.1
    });
    const sphereLines = new THREE.LineSegments(sphereWireframe, sphereMaterial);
    glScene.add(sphereLines);
    glScene.background = new THREE.Color(0x111111);
}

const minFov = 20;
const maxFov = 120;
let fov = 50; // For testing; set to minFov on deploy.
const near = 0.2;
const far = 100;
let camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, near, far);

window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    if(sphereVisible) {
        glRenderer.setSize(window.innerWidth, window.innerHeight);
    }
    imgViewbox = {
        width: imageSize[0],
        height: imageSize[1]
    }
    $('.img-preview-clip-container').attr('viewBox', `0 0 ${imgViewbox.width} ${imgViewbox.height}`);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    blobSize = [$('.focus-image').width(), $('.focus-image').height()];
}

$(window).on('mousewheel DOMMouseScroll', function(e) {
    if(!isPaused) {
        fov += e.originalEvent.deltaY > 0 ? 1 : -1;
        if (fov > maxFov) {
            fov = maxFov;
        } else if (fov < minFov) {
            fov = minFov;
        }
        camera.fov = fov;
        camera.updateProjectionMatrix();
    }
});

// Getting mouse coordinates
let mouseX = 0.5;
let mouseY = 0.5;

resizeCanvas();

let theta = 0;
let phi = 0;

function render() {
    if(mouseX > 1) {
        mouseX = 1;
    } else if(mouseX < 0) {
        mouseX = 0;
    }
    if(mouseY > 1) {
        mouseY = 1;
    } else if(mouseY < 0) {
        mouseY = 0;
    }
    const yIncrement = (mouseX - 0.5)*maxRotSpeed*(fov/maxFov);
    const xIncrement = (mouseY - 0.5)*maxRotSpeed*(fov/maxFov);
    phi += xIncrement;
    theta += yIncrement;
    if(phi > Math.PI/2) {
        phi = Math.PI/2;
    } else if (phi < Math.PI / 2 * -1) {
        phi = Math.PI / 2 * -1;
    }
    if (theta > Math.PI * 2) {
        theta -= Math.PI * 2;
    } else if (theta < 0) {
        theta += Math.PI * 2;
    }
    camera.lookAt(getCameraTarget());
    cssRenderer.render(cssScene, camera);
    if(sphereVisible) {
        glRenderer.render(glScene, camera);
    }
    requestAnimationFrame(render);
}
requestAnimationFrame(render);

function getCameraTarget() {
    const res = new THREE.Vector3(-1 * radius * Math.sin(theta), -1 * radius * Math.sin(phi), radius * Math.cos(theta));
    return res;
}

// Drawing blobs

const pointScatter = 6;
const blobSpeed = 0.01;

let blobs = [
    {
        id: 'img-clip',
        prevPath: getNewPath(),
        nextPath: getNewPath(),
        curPath: [],
        progress: 0
    }
];


// Not updating blobs in 3D due to performance reasons.

drawBlob();

function drawBlob() {
    for (let i = 0; i < blobs.length; i++) {
        const svgData = {
            width: blobSize[0],
            height: blobSize[1]
        };
        let multiplier = easeInOut(blobs[i].progress);
        for (let j = 0; j < 4; j++) {
            blobs[i].curPath[j] = [
                (blobs[i].prevPath[j][0] + ((blobs[i].nextPath[j][0] - blobs[i].prevPath[j][0]) * multiplier)),
                (blobs[i].prevPath[j][1] + ((blobs[i].nextPath[j][1] - blobs[i].prevPath[j][1]) * multiplier)),
                (blobs[i].prevPath[j][2] + ((blobs[i].nextPath[j][2] - blobs[i].prevPath[j][2]) * multiplier))
            ];
        }
        let curBlob = i > 0 ? $(`#${blobs[i].id} .blob`) : $(`#${blobs[i].id} path`);
        curBlob.attr('d', `
            M ${(svgData.width / 2) + blobs[i].curPath[0][0]} ${blobs[i].curPath[0][1]}
            C ${(3 * svgData.width / 4) + blobs[i].curPath[0][2]} ${blobs[i].curPath[0][1]}, ${svgData.width - blobs[i].curPath[1][0]} ${(svgData.height / 4) + blobs[i].curPath[1][2]}, ${svgData.width - blobs[i].curPath[1][0]} ${(svgData.height / 2) + blobs[i].curPath[1][1]}
            S ${(3 * svgData.width / 4) + blobs[i].curPath[2][2]} ${svgData.height - blobs[i].curPath[2][1]}, ${svgData.width / 2 + blobs[i].curPath[2][0]} ${svgData.height - blobs[i].curPath[2][1]}
            S ${blobs[i].curPath[3][0]} ${(3 * svgData.height / 4) + blobs[i].curPath[3][2]}, ${blobs[i].curPath[3][0]} ${(svgData.height / 2) + blobs[i].curPath[3][1]}
            S ${(svgData.width / 4) - blobs[i].curPath[0][2]} ${blobs[i].curPath[0][1]}, ${(svgData.width / 2) + blobs[i].curPath[0][0]} ${blobs[i].curPath[0][1]}
            Z
        `);
        blobs[i].progress += blobSpeed;
        if (blobs[i].progress >= 1) {
            blobs[i].prevPath = Object.assign(blobs[i].prevPath, blobs[i].nextPath);
            blobs[i].nextPath = getNewPath();
            blobs[i].progress = 0;
        }
    }
    window.requestAnimationFrame(drawBlob);
}

function getNewPath() {
    let newPath = [];
    for (let i = 0; i < 4; i++) {
        newPath.push([
            Math.round(Math.random() * (imageSize[0] / pointScatter)),
            Math.round(Math.random() * (imageSize[1] / pointScatter)),
            imageSize[1] / 8
        ]);
    }
    return newPath;
}

function easeInOut(t) {
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Inspect Spectacle

$('body').on('click', '.spectacle-item', function () {
    if(!isPaused) {
        togglePause('focus', $(this).attr('data-id'));
    }
});

$('.close-icon').on('click', () => {
    togglePause();
});

$(document).keyup(function(e) {
    if(e.keyCode == 27) {
        if(isPaused) {
            togglePause();
        }
    } else if(e.keyCode == 72) {
        if(!isPaused) {
            $('.ui-container').toggleClass('toggle-ui');
        }
    }
});

let touchOrigin = [0,0];

document.addEventListener('touchstart', (e) => {
    touchOrigin = [e.touches[0].clientX, e.touches[0].clientY];
    mouseX = 0.5;
    mouseY = 0.5;
});

document.addEventListener('touchmove', (e) => {
    mouseX = ((touchOrigin[0] - e.touches[0].clientX) / (window.innerWidth * 2)) + 0.5;
    console.log((touchOrigin[1] - e.touches[0].clientY) / (window.innerHeight * 2));
    if (Math.abs((touchOrigin[1] - e.touches[0].clientY) / (window.innerHeight * 2)) > 0.05) {
        fov += touchOrigin[1] - e.touches[0].clientY > 0 ? 1 : -1;
        if (fov > maxFov) {
            fov = maxFov;
        } else if (fov < minFov) {
            fov = minFov;
        }
        camera.fov = fov;
        camera.updateProjectionMatrix();
    }
});

document.addEventListener('touchend', () => {
    endRot[0] = 0.50;
    dampRot();
});

// Settings

$('.settings-button').on('click', () => {
    if(!isPaused) {
        togglePause('settings');
    }
});