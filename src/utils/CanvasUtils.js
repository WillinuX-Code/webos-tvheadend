export default class CanvasUtils {
 
    static MEASURE_STRING = "One Measure String";
    
    /**
     * Faster shortened function with a complexity of 2
     * 
     * @param {CanvasRenderingContext2D} canvas 
     * @param {String} text 
     * @param {Rect} drawingRect 
     */
    getShortenedText(canvas, text, drawingRect) {
        let result = text;
        let maxWidth = drawingRect.right - drawingRect.left;
        // use test character to measure width per character
        var widthPerCharacter = canvas.measureText(CanvasUtils.MEASURE_STRING).width / CanvasUtils.MEASURE_STRING.length;
        var textLength = canvas.measureText(result).width;
        if (textLength > maxWidth) {
            var overLength = textLength - maxWidth;
            //if(text.startsWith("Sebas")) {
            //     console.log("text: \"%s\" maxWidth: %d, textWidth: %d, deltaWidth: %d, widthPerCharacter: %d, textLength: %d, textOverLength: %d", text, maxWidth, textLength, overLength, widthPerCharacter, result.length, overLength/widthPerCharacter);
            //}
            // remove 1 + 2 buffer characters
            result = result.substring(0, result.length - 3 - parseInt(overLength/widthPerCharacter));
            if (result.length <= 3) {
                return "...".substring(0, result.length);
            }
            result = result.substring(0, result.length - 3) + "...";
        } 
        return result;
    }
}