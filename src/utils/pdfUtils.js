import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc =  `${import.meta.env.BASE_URL}/pdf.worker.min.mjs`;
export const pdfToImage = async (pdfFile) => {

    try {
        const fileReader = new FileReader();
        const pdfBytes = await new Promise((resolve, reject) => {
            fileReader.onloadend = () => resolve(new Uint8Array(fileReader.result));
            fileReader.onerror = reject;
            fileReader.readAsArrayBuffer(pdfFile);
        });

        const pdf = await pdfjsLib.getDocument(pdfBytes).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('Error converting PDF to image:', error);
        return null;
    }
};