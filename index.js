const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const { writeFileSync } = require("fs");

async function createPDF() {
  const document = await PDFDocument.create();
  const courierBoldFont = await document.embedFont(StandardFonts.Courier);
  const page = document.addPage([300, 400]);
  //const fontType = await document.embedFont(StandardFonts.Helvetica);

    page.moveTo(10,380)
    page.drawText('Verifiket', {
        font: courierBoldFont,
        size: 10,
        //lineHeight: 10,
    });
    page.moveTo(10,370)
    page.drawText('Transaktion 12345678900965438721', {
        font: courierBoldFont,
        size: 6,
        //lineHeight: 10,
    });
    page.moveTo(10,360)
    page.drawText('Dokument', {
        font: courierBoldFont,
        size: 8,
        //lineHeight: 10,
    });
    
    const text = `006-0023_4 rum och kök_Hyresavtal Bostad E-` +
    `SIGNERING.pdf `;
    const textSize = 6;
    const textWidth = courierBoldFont.widthOfTextAtSize(text, textSize);
    const textHeight = courierBoldFont.heightAtSize(textSize);
    page.drawText(text, {
        x:10,
        y:280,
        size: textSize,
        font: courierBoldFont,
        color: rgb(0, 0, 0),
    })
    page.drawRectangle({
        x:10,
        y:280,
        width:textWidth,
        height:textHeight+textSize,
        borderColor: rgb(0,0,0),
        borderWidth:0.5,
        padding:5
        //lineHeight: 10,
    });

    //Footer
    page.drawLine({
        start: { x:10, y:10},
        end: {x:100, y:10}
    })
    page.drawText('Transaktion 12345678900965438721', { 
        x: 102,
        y: 9,
        size:5,
        font:courierBoldFont
    })
    page.drawLine({
        start: { x:200, y:10},
        end: {x:290, y:10}
    })

  writeFileSync("./pdfFiles/modified.pdf", await document.save());
}

createPDF().catch((err) => console.log(err));