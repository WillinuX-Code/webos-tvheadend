export default class CanvasUtils {
    
    static MEASURE_STRING = 'One interesting Measure String';
    
    /**
     * Return character width approximation of current font
     * 
     * @param {CanvasRenderingContext2D} canvas 
     */
    getWidthPerCharacter(canvas) {
        return canvas.measureText(CanvasUtils.MEASURE_STRING).width / CanvasUtils.MEASURE_STRING.length;
    }

    /**
     * Faster shortened function with a complexity of 2
     * 
     * @param {CanvasRenderingContext2D} canvas 
     * @param {String} text 
     * @param {Number} drawingRect 
     */
    getShortenedText(canvas, text, maxWidth) {
        let result = text;
        // use test character to measure width per character
        var widthPerCharacter = this.getWidthPerCharacter(canvas);
        var textLength = canvas.measureText(result).width;
        if (textLength > maxWidth) {
            var overLength = textLength - maxWidth;
            // if(text.startsWith('Sebas')) {
            //     console.log('text: "%s" maxWidth: %d, textWidth: %d, deltaWidth: %d, widthPerCharacter: %d, textLength: %d, textOverLength: %d', text, maxWidth, textLength, overLength, widthPerCharacter, result.length, overLength/widthPerCharacter);
            // }
            result = result.substring(0, result.length - 1 - parseInt(overLength/widthPerCharacter));
            if (result.length <= 3) {
                return '...'.substring(0, result.length);
            }
            result = result.substring(0, result.length - 3) + '...';
        } 
        return result;
    }

    /**
     * Wraps a text inside a given area
     * 
     * @param {CanvasRenderingContext2D} canvas 
     * @param {String} text 
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} maxWidth 
     * @param {Number} lineHeight 
     */
    wrapText(canvas, text, x, y, maxWidth, lineHeight) {
        var line = ''; 
        var widthPerCharacter = this.getWidthPerCharacter(canvas);
        var maxCharactersPerLine = maxWidth / widthPerCharacter - 1;
        var index = 0;
        var newIndex = 0;
        while(index < text.length -1) {
            newIndex = index + maxCharactersPerLine > text.length ? text.length : index + maxCharactersPerLine;
            line = text.substring(index, newIndex);
            index = newIndex;
            // cutoff leading space
            if(line.startsWith(' ')) {
                line = line.substring(1,line.length-1);
            }
            // if we reached the end print out the line 
            if(index === text.length) {
                canvas.fillText(line, x, y);
                break;
            }
            // lucky we sliced at a space
            if(line.endsWith(' ')) {
                canvas.fillText(line, x, y);
                y += lineHeight;
                continue;
            } 
            // go back to find space first space
            for(var i=line.length-1; i>=0; i--) {
                if(line[i] === ' ') {
                    canvas.fillText(line.substring(0, i), x, y);
                    y += lineHeight;
                    break;
                }
                index -= 1;
            }
        }
    }

    /**
     * Writes a text to a specific position without changing the canvas context
     * 
     * @param {CanvasRenderingContext2D} canvas 
     * @param {String} text
     * @param {Number} x 
     * @param {Number} y 
     * @param {{fontSize: Number, 
     *          fillStyle: String, 
     *          fontFace: String, 
     *          textAlign: 'center'|'end'|'left'|'right'|'start', 
     *          textBaseline: 'alphabetic'|'top'|'hanging'|'middle'|'ideographic'|'bottom', 
     *          isBold: Boolean}} options
     */
    writeText(canvas, text, x, y, options) {
        // set default options
        options.fontFace = options.fontFace || 'Arial';
        options.textAlign = options.textAlign || 'left';
        options.textBaseline = options.textBaseline || 'middle';
        options.fillStyle = options.fillStyle || '#FFFFFF';
        options.fontSize = options.fontSize || 20;
        options.isBold = options.isBold !== undefined || false;

        // remember old text style
        let oldFont = canvas.font;
        let oldFillStyle = canvas.fillStyle;
        let oldTextAlign = canvas.textAlign;
        let oldTextBaseline = canvas.textBaseline;

        // set new text style
        canvas.font = options.fontSize + 'px ' + options.fontFace;
        if(options.isBold) {canvas.font = 'bold ' + canvas.font}
        canvas.fillStyle = options.fillStyle;
        canvas.textAlign = options.textAlign;
        canvas.textBaseline = options.textBaseline;

        // write text
        canvas.fillText(text, x, y);

        // reset text style
        canvas.font = oldFont;
        canvas.fillStyle = oldFillStyle;
        canvas.textAlign = oldTextAlign;
        canvas.textBaseline = oldTextBaseline;
    }
}