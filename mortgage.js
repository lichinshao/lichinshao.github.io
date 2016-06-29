var zwsId = "X1-ZWz19ot589x91n_3xvfc";
var housePrice = 0;
var mortgageRates = {};

var defaultMortgageScenario = {
	percentage: 20,
	term: 30 
}

function start() {
	show(false);
}

function setup(homeXml,ratesXml) {
	setupHomeInformation(homeXml);
	setupMortgageRates(ratesXml);
	setupMortgageScenerio();
	show(true);
}

function getHome() {
	var address = document.getElementById("address").value;
	var addrSplit = address.split(",");

	var street = addrSplit[0];
	var city = addrSplit[1];
	var statezip = addrSplit[2];

	var homeUrl = "https://www.zillow.com/webservice/GetDeepSearchResults.htm?zws-id="+zwsId+"&address="+escape(street)+"&citystatezip="+escape(city)+"%2C" +escape(statezip);
	
	loadXMLDoc(homeUrl, function(homeXML) {
		var state = homeXML.getElementsByTagName("state")[0].childNodes[0].nodeValue;
		var rateUrl = "https://www.zillow.com/webservice/GetRateSummary.htm?zws-id="+zwsId+"&state=" + state;
    	
    	loadXMLDoc(rateUrl, function(rateXML) {
			setup(homeXML,rateXML);
    	});
	});
}

function loadXMLDoc(url, cb){
   var xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			if( typeof cb === 'function' )
				cb(xmlhttp.responseXML);
		}
	}

	xmlhttp.open("GET",url,true);
	xmlhttp.send();
}

function show(isShowing) {
	var toShow = 'none';

	if(isShowing === true) {
		toShow = 'block';
	}

	document.getElementById("information").style.display = toShow;
	document.getElementById("rates").style.display = toShow;
	document.getElementById("calculator").style.display = toShow;
}

function setupHomeInformation(xml) {
	var xmlDoc = xml;

	var street = xmlDoc.getElementsByTagName("street")[0].childNodes[0].nodeValue;
	var city = xmlDoc.getElementsByTagName("city")[0].childNodes[0].nodeValue;
	var state = xmlDoc.getElementsByTagName("state")[0].childNodes[0].nodeValue;
	var zip = xmlDoc.getElementsByTagName("zipcode")[0].childNodes[0].nodeValue;
	var amount = xmlDoc.getElementsByTagName("amount")[0].childNodes[0].nodeValue;
	
	document.getElementById('street').innerHTML = street;
	document.getElementById('location').innerHTML = city + ", " + state + " " + zip;
	document.getElementById('estimate').innerHTML = "$" + Number(amount).toLocaleString();

	document.getElementById("housePrice").setAttribute("value", amount);

	housePrice = amount;
}

function setupMortgageRates(xml) {
	var xmlDoc = xml;

	var todayRates = xmlDoc.getElementsByTagName("today")[0];

	mortgageRates.thirtyYearFixed = todayRates.querySelector('rate[loanType="thirtyYearFixed"]').innerHTML;
	mortgageRates.fifteenYearFixed = todayRates.querySelector('rate[loanType="fifteenYearFixed"]').innerHTML;
    mortgageRates.fiveOneARM = todayRates.querySelector('rate[loanType="fiveOneARM"]').innerHTML;

    document.getElementById('thirtyYearFixed').innerHTML = mortgageRates.thirtyYearFixed + "%";
	document.getElementById('fifteenYearFixed').innerHTML = mortgageRates.fifteenYearFixed + "%";
	document.getElementById('fiveOneARM').innerHTML = mortgageRates.fiveOneARM + "%";
}

function setupMortgageScenerio() {
	defaultDownpayment = housePrice * (defaultMortgageScenario.percentage/100);
	addMortgageScenerio(defaultDownpayment,defaultMortgageScenario.term,mortgageRates.thirtyYearFixed);
}

function addMortgageScenerio(downpayment,term,interest) {
	var scenarios = document.getElementById('scenarios');
	var li = document.createElement("li");
	var slen = scenarios.getElementsByTagName("li").length;

	li.innerHTML = '<h2>Scenario ' + (slen+1) + '</h2>' +
		'<form id="form' + slen + '"><label>Down payment</label>' +
		'<input type="text" value="' + downpayment + '" name="downpayment" onInput="updatePayment(' + slen + ')"><label>Terms</label>' +
		'<input type="text" value="' + term + '" name="term" onInput="updatePayment(' + slen + ')"><label>Interest</label>' +
		'<input type="text" value="' + interest + '" name="rate" onInput="updatePayment(' + slen + ')"></form>' + 
		'<h3>Your Payment</h3>' +
		'<span id="payment' + slen + '"></span>';

	scenarios.appendChild(li);
	
	updatePayment(slen);
}

function removeAllMortgageScenarios() {
	var scenarios = document.getElementById('scenarios');

	while( scenarios.firstChild ){
		scenarios.removeChild( scenarios.firstChild );
	}
}

function updateAllPayment() {
	var price = document.getElementById("housePrice").value;
	var slen = document.getElementById('scenarios').getElementsByTagName("li").length;

	for (i = 0; i < slen ;i++) {
		updatePayment(i);
	}
}

function updatePayment(index) {
	var form = document.getElementById('form' + index);
	var down = form.downpayment.value;
	var term = form.term.value;
	var rate = form.rate.value;

	var price = document.getElementById("housePrice").value;
	var loanAmount = Math.max(0,(price-down));

	document.getElementById("payment"+index).innerHTML = payment(rate,term,loanAmount);
}

function calculateAmortizationSchedule() {

}

function resetMortgageScenerio() {
	removeAllMortgageScenarios();
}

function resetEverything() {
	removeAllMortgageScenarios();
	show(false);
}

function payment(rate,years,present) {
	var rper = (rate/100)/12;
	var nper = years*12;
	present = -present;
	var pmt = (rper * present * Math.pow((1 + rper), nper) )/ (1 - Math.pow((1 + rper), nper));
	
	return pmt.toFixed(2);
}