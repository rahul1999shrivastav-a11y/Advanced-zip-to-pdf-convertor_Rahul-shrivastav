async function processZip() {
    const fileInput = document.getElementById('zipInput');
    const status = document.getElementById('status');
    
    if (fileInput.files.length === 0) {
        alert("Please select a zip file!");
        return;
    }

    status.innerText = "Extracting and merging... this may take a moment.";
    
    try {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(fileInput.files[0]);
        
        // Initialize the master PDF document
        const { PDFDocument } = PDFLib;
        const mainPdfDoc = await PDFDocument.create();

        // Get file names and sort them alphabetically
        const fileNames = Object.keys(zipContent.files).sort();

        for (const filename of fileNames) {
            const file = zipContent.files[filename];
            if (file.dir) continue;

            const fileData = await file.async("uint8array");
            const extension = filename.toLowerCase().split('.').pop();

            // Case 1: If it's an Image
            if (['png', 'jpg', 'jpeg'].includes(extension)) {
                let image;
                if (extension === 'png') {
                    image = await mainPdfDoc.embedPng(fileData);
                } else {
                    image = await mainPdfDoc.embedJpg(fileData);
                }
                
                const page = mainPdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
            } 
            
            // Case 2: If it's a PDF
            else if (extension === 'pdf') {
                const donorPdfDoc = await PDFDocument.load(fileData);
                const pages = await mainPdfDoc.copyPages(donorPdfDoc, donorPdfDoc.getPageIndices());
                pages.forEach(page => mainPdfDoc.addPage(page));
            }
        }

        // Generate the final PDF
        const pdfBytes = await mainPdfDoc.save();
        
        // Trigger download
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "rahulshrivastav.pdf";
        link.click();

        status.innerText = "Success! Saved as rahulshrivastav.pdf";
    } catch (error) {
        console.error(error);
        status.innerText = "Error: " + error.message;
    }
}