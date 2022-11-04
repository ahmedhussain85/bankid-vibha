//const res = require("express/lib/response");

console.log("This is coming from script.js");

var qrGeneratedCode = qrIm;
let loginStatus = '';
//let hintCode = "outstandingTransaction";
var orderStat = orderStatus;
var hint = "outstandingTransaction";

$.ajaxSetup({
    headers: {'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')},
    type: "GET",
    cache:false,
    dataType: "json",
});
var qrcode = new QRCode(document.getElementById("qrcode"), {
    text: qrGeneratedCode,
    width: 256,
    height: 256,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
});
var renew = setInterval(function(){
    if(orderStat == "complete")
    {
        clearInterval(renew);
        alert("Successfully logged in with BankID!");
    }
    else if(hint == "startFailed")
    {
        clearInterval(renew);
        alert("Failed to log in with BankID!");
    }
    else if (hint == "outstandingTransaction" || hint == "userSign")
    {
        const Url = "/ajaxcall/";
        console.log("ajax call");
        $.ajax({url: Url}).done(function (resp) {
            console.log("got response");
            qrGeneratedCode = resp.qrImg;
            orderStat = resp.orderStatus;
            hint = resp.hintCode;
            qrcode.clear()
            qrcode.makeCode(qrGeneratedCode);
    
            //console.log ("orderStat:" +resp.orderStatus);
            console.log ("hint:" +hint);
            //$('#img_div').html('<img src="data:image/png;base64,' + qrimg + '" />');
            //$('#img_div').html('<img src="/qr" />');
            //generateQR("some text");
            //document.getElementById("myImage").src = "images/myqr.png";
            //document.getElementById("demo").innerHTML = qrimg;
            //document.write(Object.values(JSON.stringify(qrimg)));
            //console.log("type of the image is " +typeof(qrimg));
            // QRimg = resp.qrImg;
            // document.getElementById("bannerImage").src = QRimg;
            //console.log ("iteration:"+i);            
            //console.log ("qrStartToken:"+qrStartToken); 
            /*$.get("../myqr.svg", function(data){
                print(data)
              })*/
        });
    }
 

    //console.log("iteration is %d", i);
},3000);