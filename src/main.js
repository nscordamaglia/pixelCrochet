import './style.css';

// --- Gestión de Modo Noche ---
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark') body.classList.add('dark-mode');

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
});

// --- Lógica Original de la App ---
const imageInput = document.getElementById('imageInput');
const colsInput = document.getElementById('colsInput');
const rowsInput = document.getElementById('rowsInput');
const scalePatternInput = document.getElementById('scalePatternInput');
const offsetColsInput = document.getElementById('offsetColsInput');
const offsetRowsInput = document.getElementById('offsetRowsInput');
const btnConfig = document.getElementById('btnConfig');
const btnCenter = document.getElementById('btnCenter');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnUp = document.getElementById('btnUp');
const btnDown = document.getElementById('btnDown');

const sourceCanvas = document.getElementById('sourceCanvas');
const gridCanvas = document.getElementById('gridCanvas');
const ctxSource = sourceCanvas.getContext('2d', { willReadFrequently: true });
const ctxGrid = gridCanvas.getContext('2d');

let img = null;
let cols = 50;
let rows = 50;
let scalePattern = 100;
let scaleFactor = 1;

// posición de la imagen dentro del patrón (en celdas)
let imgOffsetCols = 0;
let imgOffsetRows = 0;

// zoom / pan de la vista
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isPanning = false;
let startPanX = 0;
let startPanY = 0;

// márgenes para numeración alrededor del patrón
const marginLeft = 40;   // espacio para números de filas a la izquierda
const marginTop = 20;    // pequeño margen arriba
const marginRight = 20;
const marginBottom = 40; // espacio para números de columnas abajo

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        img = new Image();
        img.onload = () => {
            document.getElementById('info').textContent =
                'Imagen cargada. Elige columnas/filas/escala y pulsa "Configurar Lienzo".';
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
});

btnConfig.addEventListener('click', () => {
    if (!img) {
        alert('Primero carga una imagen.');
        return;
    }

    cols = parseInt(colsInput.value, 10);
    rows = parseInt(rowsInput.value, 10);
    if (!cols || !rows || cols <= 0 || rows <= 0) {
        alert('Valores de columnas/filas inválidos');
        return;
    }

    scalePattern = parseInt(scalePatternInput.value, 10);
    if (!scalePattern || scalePattern <= 0 || scalePattern > 100) {
        scalePattern = 100;
        scalePatternInput.value = 100;
    }
    scaleFactor = scalePattern / 100;

    imgOffsetCols = parseInt(offsetColsInput.value, 10) || 0;
    imgOffsetRows = parseInt(offsetRowsInput.value, 10) || 0;

    sourceCanvas.width = cols;
    sourceCanvas.height = rows;

    scale = 1;
    offsetX = 0;
    offsetY = 0;

    redrawSource();
    drawAll();
    document.getElementById('info').textContent =
        `Lienzo ${cols}x${rows}. Escala ${scalePattern}%. Offset (${imgOffsetCols}, ${imgOffsetRows}).`;
});

btnCenter.addEventListener('click', () => {
    imgOffsetCols = 0;
    imgOffsetRows = 0;
    offsetColsInput.value = 0;
    offsetRowsInput.value = 0;
    redrawSource();
    drawAll();
});

btnLeft.addEventListener('click', () => {
    imgOffsetCols -= 1;
    offsetColsInput.value = imgOffsetCols;
    redrawSource();
    drawAll();
});
btnRight.addEventListener('click', () => {
    imgOffsetCols += 1;
    offsetColsInput.value = imgOffsetCols;
    redrawSource();
    drawAll();
});
btnUp.addEventListener('click', () => {
    imgOffsetRows -= 1;
    offsetRowsInput.value = imgOffsetRows;
    redrawSource();
    drawAll();
});
btnDown.addEventListener('click', () => {
    imgOffsetRows += 1;
    offsetRowsInput.value = imgOffsetRows;
    redrawSource();
    drawAll();
});

window.addEventListener('keydown', (e) => {
    if (!img) return;
    let moved = false;
    switch (e.key) {
        case 'ArrowLeft':
            imgOffsetCols -= 1;
            moved = true;
            break;
        case 'ArrowRight':
            imgOffsetCols += 1;
            moved = true;
            break;
        case 'ArrowUp':
            imgOffsetRows -= 1;
            moved = true;
            break;
        case 'ArrowDown':
            imgOffsetRows += 1;
            moved = true;
            break;
    }
    if (moved) {
        offsetColsInput.value = imgOffsetCols;
        offsetRowsInput.value = imgOffsetRows;
        redrawSource();
        drawAll();
        e.preventDefault();
    }
});

function redrawSource() {
    if (!img) return;

    ctxSource.clearRect(0, 0, cols, rows);
    ctxSource.fillStyle = '#ffffff';
    ctxSource.fillRect(0, 0, cols, rows);

    const patternAspect = cols / rows;
    const imgAspect = img.width / img.height;

    let drawWidth, drawHeight;
    if (imgAspect > patternAspect) {
        const usableWidth = cols * scaleFactor;
        drawWidth = usableWidth;
        drawHeight = usableWidth / imgAspect;
    } else {
        const usableHeight = rows * scaleFactor;
        drawHeight = usableHeight;
        drawWidth = usableHeight * imgAspect;
    }

    let offsetXsrc = (cols - drawWidth) / 2;
    let offsetYsrc = (rows - drawHeight) / 2;

    offsetXsrc += imgOffsetCols;
    offsetYsrc += imgOffsetRows;

    ctxSource.drawImage(img, offsetXsrc, offsetYsrc, drawWidth, drawHeight);
}

function drawAll() {
    const width = gridCanvas.width;
    const height = gridCanvas.height;
    const isDarkMode = body.classList.contains('dark-mode');

    ctxGrid.setTransform(1, 0, 0, 1, 0, 0);
    ctxGrid.clearRect(0, 0, width, height);

    // Fondo según el tema
    ctxGrid.fillStyle = isDarkMode ? '#0f172a' : '#f5f5f5';
    ctxGrid.fillRect(0, 0, width, height);

    ctxGrid.save();
    ctxGrid.translate(offsetX, offsetY);
    ctxGrid.scale(scale, scale);
    ctxGrid.imageSmoothingEnabled = false;

    const patternWidth = width - marginLeft - marginRight;
    const patternHeight = height - marginTop - marginBottom;
    const cellWidth = patternWidth / cols;
    const cellHeight = patternHeight / rows;
    const originX = marginLeft;
    const originY = marginTop;

    // Imagen con opacidad (en modo oscuro la hacemos un poco más tenue)
    ctxGrid.globalAlpha = isDarkMode ? 0.3 : 0.4;
    ctxGrid.drawImage(sourceCanvas, originX, originY, cellWidth * cols, cellHeight * rows);
    ctxGrid.globalAlpha = 1.0;

    // Colores del grid y textos según tema
    const gridColor = isDarkMode ? '#475569' : '#000000';
    const gridThickColor = isDarkMode ? '#94a3b8' : '#000000';
    const textColor = isDarkMode ? '#f8fafc' : '#000000';

    // grilla fina
    ctxGrid.strokeStyle = gridColor;
    ctxGrid.lineWidth = 1 / scale;

    ctxGrid.beginPath();
    for (let c = 0; c <= cols; c++) {
        const x = Math.floor(originX + c * cellWidth) + 0.5;
        ctxGrid.moveTo(x, Math.floor(originY));
        ctxGrid.lineTo(x, Math.floor(originY + patternHeight));
    }
    for (let r = 0; r <= rows; r++) {
        const y = Math.floor(originY + patternHeight - r * cellHeight) + 0.5;
        ctxGrid.moveTo(Math.floor(originX), y);
        ctxGrid.lineTo(Math.floor(originX + patternWidth), y);
    }
    ctxGrid.stroke();

    // grilla gruesa cada 5 filas
    ctxGrid.strokeStyle = gridThickColor;
    ctxGrid.lineWidth = 2 / scale;

    ctxGrid.beginPath();
    for (let r = 0; r <= rows; r += 5) {
        const y = Math.floor(originY + patternHeight - r * cellHeight) + 0.5;
        ctxGrid.moveTo(Math.floor(originX), y);
        ctxGrid.lineTo(Math.floor(originX + patternWidth), y);
    }
    ctxGrid.stroke();

    // NUMERACIÓN
    ctxGrid.fillStyle = textColor;
    ctxGrid.font = `${10 / scale}px Arial`;
    
    // Filas
    ctxGrid.textAlign = 'right';
    ctxGrid.textBaseline = 'middle';
    for (let r = 5; r <= rows; r += 5) {
        const y = Math.floor(originY + patternHeight - r * cellHeight + cellHeight / 2);
        const label = r.toString();
        ctxGrid.fillText(label, Math.floor(originX - 5 / scale), y);
    }

    // Columnas
    ctxGrid.textAlign = 'center';
    ctxGrid.textBaseline = 'top';
    for (let c = 0; c <= cols; c += 5) {
        if (c === 0) continue;
        const x = Math.floor(originX + c * cellWidth - cellWidth / 2);
        const label = c.toString();
        ctxGrid.fillText(label, x, Math.floor(originY + patternHeight + 5 / scale));
    }

    ctxGrid.restore();
}

// zoom con rueda
gridCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;

    const dir = e.deltaY < 0 ? 1 : -1;
    const oldScale = scale;
    scale *= dir > 0 ? zoomFactor : 1 / zoomFactor;
    if (scale < 0.5) scale = 0.5;
    if (scale > 20) scale = 20;

    offsetX = mouseX - (mouseX - offsetX) * (scale / oldScale);
    offsetY = mouseY - (mouseY - offsetY) * (scale / oldScale);

    drawAll();
});

// pan con mouse
gridCanvas.addEventListener('mousedown', (e) => {
    isPanning = true;
    startPanX = e.clientX - offsetX;
    startPanY = e.clientY - offsetY;
});

window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    offsetX = e.clientX - startPanX;
    offsetY = e.clientY - startPanY;
    drawAll();
});

window.addEventListener('mouseup', () => {
    isPanning = false;
});
