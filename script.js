// Get canvas and set its size
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

// Define colors that will update with theme
function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        outline: isDark ? '#ffffff' : '#000000',
        cutLines: isDark ? '#888888' : '#666666'
    };
}

// Set canvas size based on visualization panel size
function resizeCanvas() {
    const panel = document.querySelector('.visualization-panel');
    canvas.width = panel.clientWidth - 40;
    canvas.height = panel.clientWidth * 0.6;
    
    // If we have values, redraw when resizing
    const sheetWidth = Number(document.getElementById('sheetWidth').value);
    if (sheetWidth) {
        calculateCuts();
    }
}

// Call resize on load and window resize
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// Listen for theme changes
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
            const sheetWidth = Number(document.getElementById('sheetWidth').value);
            if (sheetWidth) {
                calculateCuts(); // Redraw with new theme colors
            }
        }
    });
});

observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-theme']
});

function calculateCuts() {
    // Get input values
    const sheetWidth = Number(document.getElementById('sheetWidth').value);
    const sheetHeight = Number(document.getElementById('sheetHeight').value);
    const cutWidth = Number(document.getElementById('cutWidth').value);
    const cutHeight = Number(document.getElementById('cutHeight').value);

    // Validate inputs
    if (!sheetWidth || !sheetHeight || !cutWidth || !cutHeight) {
        document.getElementById('results').innerHTML = 'Please fill in all dimensions';
        return;
    }

    // Calculate both orientations and use the one that yields more pieces
    const layout1 = {
        across: Math.floor(sheetWidth / cutWidth),
        down: Math.floor(sheetHeight / cutHeight),
        rotated: false
    };
    const pieces1 = layout1.across * layout1.down;

    const layout2 = {
        across: Math.floor(sheetWidth / cutHeight),
        down: Math.floor(sheetHeight / cutWidth),
        rotated: true
    };
    const pieces2 = layout2.across * layout2.down;

    // Use the better layout
    let piecesAcross, piecesDown, finalCutWidth, finalCutHeight, isRotated;
    if (pieces1 >= pieces2) {
        piecesAcross = layout1.across;
        piecesDown = layout1.down;
        finalCutWidth = cutWidth;
        finalCutHeight = cutHeight;
        isRotated = false;
    } else {
        piecesAcross = layout2.across;
        piecesDown = layout2.down;
        finalCutWidth = cutHeight;
        finalCutHeight = cutWidth;
        isRotated = true;
    }

    const totalPieces = piecesAcross * piecesDown;

    // Calculate scrap
    const usedWidth = piecesAcross * finalCutWidth;
    const usedHeight = piecesDown * finalCutHeight;
    const scrapWidth = sheetWidth - usedWidth;
    const scrapHeight = sheetHeight - usedHeight;

    // Display results with rounded numbers
    document.getElementById('results').innerHTML = `
        <div class="result-item full-width">
            <div class="result-value" style="font-size: 18px; margin-bottom: 12px;">Pieces that can be cut: ${totalPieces}</div>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <div class="result-item" style="flex: 1;">
                <div class="result-label">Layout</div>
                <div class="result-value">${piecesAcross} across × ${piecesDown} down</div>
            </div>
            <div class="result-item" style="flex: 1;">
                <div class="result-label">Remaining scrap</div>
                <div class="result-value">Width: ${Math.round(scrapWidth)}" × Height: ${Math.round(scrapHeight)}"</div>
            </div>
        </div>
    `;

    // Draw the visualization
    drawCuttingPlan(sheetWidth, sheetHeight, cutWidth, cutHeight, piecesAcross, piecesDown, isRotated);
}

function drawCuttingPlan(sheetWidth, sheetHeight, cutWidth, cutHeight, piecesAcross, piecesDown, isRotated) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale to fit the sheet on canvas
    const scale = Math.min(
        (canvas.width - 40) / sheetWidth,
        (canvas.height - 40) / sheetHeight
    );

    // Calculate centered position
    const startX = (canvas.width - (sheetWidth * scale)) / 2;
    const startY = (canvas.height - (sheetHeight * scale)) / 2;

    // Draw sheet outline with thicker stroke
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(startX, startY, sheetWidth * scale, sheetHeight * scale);

    // Draw cut lines with thinner stroke
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;

    // Use the appropriate dimensions based on rotation
    const pieceWidth = isRotated ? cutHeight : cutWidth;
    const pieceHeight = isRotated ? cutWidth : cutHeight;

    // Draw vertical cut lines
    for (let i = 1; i <= piecesAcross; i++) {
        const x = startX + (i * pieceWidth * scale);
        if (x <= startX + (sheetWidth * scale)) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, startY + (sheetHeight * scale));
            ctx.stroke();
        }
    }

    // Draw horizontal cut lines
    for (let i = 1; i <= piecesDown; i++) {
        const y = startY + (i * pieceHeight * scale);
        if (y <= startY + (sheetHeight * scale)) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(startX + (sheetWidth * scale), y);
            ctx.stroke();
        }
    }

    // Draw scrap areas with semi-transparent overlay
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';  // Very light red for scrap areas

    // Calculate scrap dimensions
    const usedWidth = piecesAcross * pieceWidth;
    const usedHeight = piecesDown * pieceHeight;
    const scrapWidth = sheetWidth - usedWidth;
    const scrapHeight = sheetHeight - usedHeight;

    if (scrapWidth > 0) {
        // Draw vertical scrap area
        ctx.fillRect(
            startX + (usedWidth * scale),
            startY,
            scrapWidth * scale,
            sheetHeight * scale
        );
    }

    if (scrapHeight > 0) {
        // Draw horizontal scrap area
        ctx.fillRect(
            startX,
            startY + (usedHeight * scale),
            usedWidth * scale,
            scrapHeight * scale
        );
    }

    if (scrapWidth > 0 && scrapHeight > 0) {
        // Draw corner scrap area (to make it slightly darker where scraps overlap)
        ctx.fillRect(
            startX + (usedWidth * scale),
            startY + (usedHeight * scale),
            scrapWidth * scale,
            scrapHeight * scale
        );
    }
}