const radius = 1500;
const maxRotSpeed = 0.1;
const imageSize = [$('.img-clip-container').attr('viewBox').split(' ')[2], $('.img-clip-container').attr('viewBox').split(' ')[2]];

/*
let spectacles;

$(() => {
    fetch('/search')
        .then((res) => {
            return res.json();
        })
        .then(function(jsonData) {
            spectacles = jsonData;
            console.log(spectacles);
        })
        .catch(err => console.error(err));
});
*/

let spectacles = [];

for(let i = 0; i < 10; i++) {
    spectacles.push({
        url: 'images/1_KBTR.jpg'
    });
}

const cssRenderer = new THREE.CSS3DRenderer();
document.getElementById('container').appendChild(cssRenderer.domElement);
const cssScene = new THREE.Scene();
const canvas = document.getElementById('gl');
const glRenderer = new THREE.WebGLRenderer({ canvas });
const glScene = new THREE.Scene();

const minFov = 20;
const maxFov = 120;
let fov = maxFov; // Set to minFov on deploy.
const near = 0.2;
const far = 100;
let camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, near, far);

window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    glRenderer.setSize(window.innerWidth, window.innerHeight);
    imgViewbox = {
        width: imageSize[0],
        height: imageSize[1]
    }
    $('.img-preview-clip-container').attr('viewBox', `0 0 ${imgViewbox.width} ${imgViewbox.height}`);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

$(window).on('mousewheel DOMMouseScroll', function(e) {
    fov += e.originalEvent.deltaY > 0 ? 1 : -1;
    if(fov > maxFov) {
        fov = maxFov;
    } else if(fov < minFov) {
        fov = minFov;
    }
    camera.fov = fov;
    camera.updateProjectionMatrix();
});

for(let i = 0; i < spectacles.length; i++) {
    newItem();
}

function newItem() {
    let itemTemplate = document.createElement('div');
    itemTemplate.className = 'spectacle-item';
    itemTemplate.style.backgroundImage = "url('images/1_KBTR.jpg')";
    itemTemplate.style.width = `${imageSize[0]}px`;
    itemTemplate.style.height = `${imageSize[1]}px`;
    let cssObject = new THREE.CSS3DObject(itemTemplate);
    let angles = [
        Math.floor(Math.random() * Math.PI),
        Math.floor(Math.random() * Math.PI * 2)
    ];
    cssObject.position.x = radius * Math.sin(angles[0]) * Math.cos(angles[1]);
    cssObject.position.y = radius * Math.sin(angles[0]) * Math.sin(angles[1]);
    cssObject.position.z = radius * Math.cos(angles[0]);
    cssObject.rotation.y = angles[0];
    cssObject.rotation.x = angles[1];
    cssScene.add(cssObject);
}

// Creating world sphere
const sphereGeometry = new THREE.SphereBufferGeometry(100, 64, 32);
const sphereWireframe = new THREE.WireframeGeometry(sphereGeometry);
const sphereMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 1,
    transparent: true,
    opacity: 0.15
});
const sphereLines = new THREE.LineSegments(sphereWireframe, sphereMaterial);
glScene.add(sphereLines);

// Getting mouse coordinates
let mouseX = window.innerWidth/2;
let mouseY = window.innerHeight/2;
window.addEventListener('mousemove', function(e) {
    mouseX = e.clientX/window.innerWidth;
    mouseY = (e.clientY/window.innerHeight);
});

resizeCanvas();

const worldAxis = {
    x: new THREE.Vector3(1, 0, 0),
    y: new THREE.Vector3(0, 1, 0),
    z: new THREE.Vector3(0, 0, 1)
}
let theta = 0;
let phi = 0;
function render() {
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
    glRenderer.render(glScene, camera);
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

drawBlob();

function drawBlob() {
    for (let i = 0; i < blobs.length; i++) {
        const svgData = {
            width: imageSize[0],
            height: imageSize[1]
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