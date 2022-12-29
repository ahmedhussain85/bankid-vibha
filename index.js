const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const { writeFileSync, readFileSync } = require("fs");

async function createPDF() {
  const document = await PDFDocument.create();
  const courierBoldFont = await document.embedFont(StandardFonts.Helvetica);
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
    
    //const text = '006-0023_4 rum och kök_Hyresavtal Bostad E-SIGNERING.pdf';
    const textSize = 5;
    //const textWidth = courierBoldFont.widthOfTextAtSize(text, textSize);
    const textHeight = courierBoldFont.heightAtSize(textSize);
    page.moveTo(15, 345)
    page.drawText('2006-0023_4 rum och kök_Hyresavtal Bostad E-\nSIGNERING.pdf', {
        size: textSize,
        font: courierBoldFont,
        color: rgb(0, 0, 0),
        lineHeight: 6,
    })
    page.moveTo(15, 333)
    page.drawText('Huvuddokument\n5 sidor\nStartades 2021-08-04 08:03:46 CEST(+0200) av AB\nVäsbyhem eSignering(AVe)\nFärdigställt 2021-08-04 08:16:30 CEST(+0200)', {
        size: textSize,
        font: courierBoldFont,
        color: rgb(0, 0, 0),
        lineHeight: 6,
    })
    page.moveTo(10, 305)
    page.drawRectangle({
        // x:10,
        // y:340,
        width:130,
        height:50,
        borderColor: rgb(0,0,0),
        borderWidth:0.5,
        padding:5
        //lineHeight: 10,
    });
    page.moveTo(10,295)
    page.drawText('Initierare', {
        font: courierBoldFont,
        size: 8,
        //lineHeight: 10,
    });
    page.moveTo(15, 280)
    page.drawText('AB Väsbyhem eSignering(AVe)', {
        size: textSize,
        font: courierBoldFont,
        color: rgb(0, 0, 0),
        lineHeight: 6,
    })
    page.moveTo(15, 274)
    page.drawText('AB Väsbyhem\nOrg. nr 556476-7233\nuthyrningen@vasbyhem.se', {
        size: textSize,
        font: courierBoldFont,
        color: rgb(0, 0, 0),
        lineHeight: 6,
    })
    page.moveTo(10, 257)
    page.drawRectangle({
        // x:10,
        // y:340,
        width:130,
        height:33 ,
        borderColor: rgb(0,0,0),
        borderWidth:0.5,
        padding:5
        //lineHeight: 10,
    });
    page.moveTo(10,247)
    page.drawText('Signerande parter', {
        font: courierBoldFont,
        size: 8,
        //lineHeight: 10,
    });
    page.moveTo(15, 232)
    page.drawText('AB Väsbyhem eSignering(AVe)', {
        size: textSize,
        font: courierBoldFont,
        color: rgb(0, 0, 0),
        lineHeight: 6,
    })
    page.moveTo(10, 207)
    page.drawRectangle({
        // x:10,
        // y:340,
        width:130,
        height:35,
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
        x: 108,
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