// colorExtractor.js

function getDominantColorsFromURL(imageURL, colorCount) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "Anonymous"; // Enable CORS for the image
        image.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = this.width;
            canvas.height = this.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(this, 0, 0);
            const imageData = ctx.getImageData(0, 0, this.width, this.height).data;

            // Helper function to calculate the median cut
            function medianCut(imageData, colorCount) {
                // Create an array to hold the colors
                const colors = [];
                for (let i = 0; i < imageData.length; i += 4) {
                    // Get the RGB values
                    const r = imageData[i];
                    const g = imageData[i + 1];
                    const b = imageData[i + 2];
                    // Convert to a single integer for easy sorting
                    const value = (r << 16) | (g << 8) | b;
                    // Add the color to the array
                    colors.push(value);
                }

                // Sort the colors by their red component
                colors.sort((a, b) => (a >> 16) - (b >> 16));

                // Split the colors into color groups
                const groups = [];
                for (let i = 0; i < colorCount; i++) {
                    const start = Math.floor((i * colors.length) / colorCount);
                    const end = Math.floor(((i + 1) * colors.length) / colorCount);
                    groups.push(colors.slice(start, end));
                }

                // Calculate the median color for each group
                const medianColors = groups.map(group => {
                    let sumR = 0;
                    let sumG = 0;
                    let sumB = 0;
                    for (const color of group) {
                        sumR += (color >> 16) & 0xFF;
                        sumG += (color >> 8) & 0xFF;
                        sumB += color & 0xFF;
                    }
                    const medianR = Math.round(sumR / group.length);
                    const medianG = Math.round(sumG / group.length);
                    const medianB = Math.round(sumB / group.length);
                    return [medianR, medianG, medianB];
                });
                // Convert RGB to HSV and adjust brightness
                const hsvColors = medianColors.map(color => {
                    // Convert the color to HSV
                    let [r, g, b] = color;
                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    let h, s, v = max / 255;

                    const d = max - min;
                    s = max === 0 ? 0 : d / max;

                    if (max === min) {
                        h = 0; // achromatic
                    } else {
                        switch (max) {
                            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                            case g: h = (b - r) / d + 2; break;
                            case b: h = (r - g) / d + 4; break;
                        }
                        h /= 6;
                    }

                    // Adjust colors
                    s = Math.min(s, 0.625)
                    v = 1;

                    console.log(h, s, v)

                    // Convert back to RGB
                    let i = Math.floor(h * 6);
                    let f = h * 6 - i;
                    let p = v * (1 - s);
                    let q = v * (1 - f * s);
                    let t = v * (1 - (1 - f) * s);
                    switch (i % 6) {
                        case 0: r = v; g = t; b = p; break;
                        case 1: r = q; g = v; b = p; break;
                        case 2: r = p; g = v; b = t; break;
                        case 3: r = p; g = q; b = v; break;
                        case 4: r = t; g = p; b = v; break;
                        case 5: r = v; g = p; b = q; break;
                    }

                    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
                });

                return hsvColors;
            }

            const dominantColors = medianCut(imageData, colorCount);
            resolve(dominantColors);
        };
        image.onerror = function () {
            reject(new Error('Failed to load the image'));
        };
        image.src = imageURL;
    });
}

export { getDominantColorsFromURL };