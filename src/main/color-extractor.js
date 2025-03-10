// colorExtractor.js

function getDominantColorsFromURL(imageURL, colorCount = 5) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "Anonymous";
        image.onload = function() {
            // 优化1：缩小画布尺寸提升性能
            const canvas = document.createElement("canvas");
            const MAX_SIZE = 200;
            const scale = Math.min(MAX_SIZE / this.width, MAX_SIZE / this.height);
            canvas.width = this.width * scale;
            canvas.height = this.height * scale;
            
            const ctx = canvas.getContext("2d");
            ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
            
            // 优化2：跳过透明像素
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = [];
            for (let i = 0; i < imageData.data.length; i += 4) {
                if (imageData.data[i+3] < 128) continue; // 忽略半透明像素
                pixels.push([
                    imageData.data[i],   // R
                    imageData.data[i+1], // G
                    imageData.data[i+2]  // B
                ]);
            }

            // 优化3：改进的中位切分算法
            const quantize = (pixels, maxDepth = 4, depth = 0) => {
                if (depth === maxDepth || pixels.length === 0) {
                    const color = pixels.reduce((acc, val) => {
                        acc[0] += val[0];
                        acc[1] += val[1];
                        acc[2] += val[2];
                        return acc;
                    }, [0, 0, 0]).map(comp => Math.round(comp / pixels.length));
                    return [color];
                }

                // 按颜色范围最大的通道排序
                const channels = {
                    r: Math.max(...pixels.map(p => p[0])) - Math.min(...pixels.map(p => p[0])),
                    g: Math.max(...pixels.map(p => p[1])) - Math.min(...pixels.map(p => p[1])),
                    b: Math.max(...pixels.map(p => p[2])) - Math.min(...pixels.map(p => p[2]))
                };
                const maxChannel = Object.keys(channels).reduce((a, b) => 
                    channels[a] > channels[b] ? a : b
                );

                const sorted = [...pixels].sort((a, b) => 
                    a[maxChannel === 'r' ? 0 : maxChannel === 'g' ? 1 : 2] - 
                    b[maxChannel === 'r' ? 0 : maxChannel === 'g' ? 1 : 2]
                );

                const mid = Math.floor(sorted.length / 2);
                return [
                    ...quantize(sorted.slice(0, mid), maxDepth, depth + 1),
                    ...quantize(sorted.slice(mid), maxDepth, depth + 1)
                ];
            };

            // 优化4：颜色后处理
            const processColors = (colors) => {
                return colors
                    // 转换为HSL格式
                    .map(color => {
                        const [r, g, b] = color.map(c => c / 255);
                        const max = Math.max(r, g, b);
                        const min = Math.min(r, g, b);
                        let h, s, l = (max + min) / 2;

                        if (max === min) {
                            h = s = 0;
                        } else {
                            const d = max - min;
                            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                            switch(max) {
                                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                                case g: h = (b - r) / d + 2; break;
                                case b: h = (r - g) / d + 4; break;
                            }
                            h /= 6;
                        }
                        return { h: h*360, s, l, original: color };
                    })
                    // 过滤低饱和度颜色
                    .filter(c => c.s > 0.1)
                    // 按亮度排序
                    .sort((a, b) => b.l - a.l)
                    // 转换为适合文字的颜色
                    .map(c => {
                        // 调整亮度和饱和度
                        const optimalL = c.l > 0.6 ? 0.9 : 0.1; // 高亮背景用深色，反之亦然
                        const adjustedS = Math.max(c.s * 1.2, 0.8);
                        
                        // HSL转RGB
                        const q = optimalL < 0.5 ? 
                            optimalL * (1 + adjustedS) : 
                            optimalL + adjustedS - optimalL * adjustedS;
                        const p = 2 * optimalL - q;
                        
                        const hueToRGB = (p, q, t) => {
                            if(t < 0) t += 1;
                            if(t > 1) t -= 1;
                            if(t < 1/6) return p + (q - p) * 6 * t;
                            if(t < 1/2) return q;
                            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                            return p;
                        };
                        
                        const r = hueToRGB(p, q, c.h/360 + 1/3);
                        const g = hueToRGB(p, q, c.h/360);
                        const b = hueToRGB(p, q, c.h/360 - 1/3);
                        
                        return `rgb(${[
                            Math.round(r * 255),
                            Math.round(g * 255),
                            Math.round(b * 255)
                        ].join(',')})`;
                    })
                    // 去重
                    .filter((color, index, self) => 
                        self.findIndex(c => c === color) === index
                    )
                    .slice(0, colorCount);
            };

            const palette = processColors(quantize(pixels));
            resolve(palette);
        };
        image.onerror = () => reject(new Error('Failed to load image'));
        image.src = imageURL;
    });
}

export { getDominantColorsFromURL };