const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const { writeFileSync, readFileSync } = require("fs");

async function createPDF() {
  const document = await PDFDocument.load(readFileSync("./NodeJs_course_certificate.pdf"));
  const img = await document.embedPng(readFileSync('./public/image/bankid.png'));

  const courierBoldFont = await document.embedFont(StandardFonts.Courier);
  const firstPage = document.getPage(0);


  firstPage.moveTo(72, 400);
  firstPage.drawImage(img, {
    // x: 10,
    // y: 10,
    width:100,
    height:100,
  });
  firstPage.moveTo(10, 10);
  firstPage.drawLine({
    start: {x: 50, y:10},
    end: {x: 100, y:10},
    thickness: 2,
    color: rgb(0,0,0)
  })

  //const pdfBytes = await pdfDoc.save();

  firstPage.moveTo(72, 530);
  firstPage.drawText("Ms. Jane,", {
    font: courierBoldFont,
    size: 22,
  });

  firstPage.moveTo(72, 370);
  firstPage.drawText("Vibha \nJr Backend devloper \nLogRocket", {
    font: courierBoldFont,
    size: 12,
    lineHeight: 10,
  });

  writeFileSync("./pdfFiles/imagemodified.pdf", await document.save());
}

createPDF().catch((err) => console.log(err));