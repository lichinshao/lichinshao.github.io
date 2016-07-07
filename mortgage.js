//Zillow api key
var zwsId = "X1-ZWz19ot589x91n_3xvfc";

var housePrice = 0;
var mortgageRates = {};

var defaultMortgageScenario = {
	percentage: 20,
	term: 30 
}

//function to only have address search box displayed and other info hidden
function start() {
	show(false);
}
//function that shows info on the rest of the page after address is searched
function setup(homeXml,ratesXml) {
	setupHomeInformation(homeXml);
	setupMortgageRates(ratesXml);
	setupMortgageScenerio();
	setupProjectedMortgagePayment();
	show(true);
}

//function to split address to load url
//higher order function to also load interest rates
function getHome() {
	var address = document.getElementById("address").value;
	var addrSplit = address.split(",");

	var street = addrSplit[0];
	var city = addrSplit[1];
	var statezip = addrSplit[2];

	var homeUrl = "https://www.zillow.com/webservice/GetDeepSearchResults.htm?zws-id="+zwsId+"&address="+escape(street)+"&citystatezip="+escape(city)+"%2C"+escape(statezip);
	
	loadXMLDoc(homeUrl, function(homeXML) {
		var state = homeXML.getElementsByTagName("state")[0].childNodes[0].nodeValue;
		var rateUrl = "https://www.zillow.com/webservice/GetRateSummary.htm?zws-id="+zwsId+"&state="+state;
    	
    	loadXMLDoc(rateUrl, function(rateXML) {
			setup(homeXML,rateXML);
    	});
	});
}

//function to send request for api
function loadXMLDoc(url, callbackFunction){
   var xmlhttp = new XMLHttpRequest();
   
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			if( typeof callbackFunction === 'function' )
				callbackFunction(xmlhttp.responseXML);
		}
	}

	xmlhttp.open("GET",url,true);
	
	xmlhttp.setRequestHeader('Access-Control-Allow-Origin', '*');

	xmlhttp.send();
}

//function that decides what shows and when
function show(isShowing) {
	var toShow = 'none';

	if(isShowing === true) {
		toShow = 'block';
	}

	document.getElementById("information").style.display = toShow;
	document.getElementById("rates").style.display = toShow;
	document.getElementById("calculator").style.display = toShow;
	document.getElementById("projected").style.display = toShow;
}

//function that pulls certain info from xml and labels the display on page
function setupHomeInformation(xml) {
	var street = xml.getElementsByTagName("street")[0].childNodes[0].nodeValue;
	var city = xml.getElementsByTagName("city")[0].childNodes[0].nodeValue;
	var state = xml.getElementsByTagName("state")[0].childNodes[0].nodeValue;
	var zip = xml.getElementsByTagName("zipcode")[0].childNodes[0].nodeValue;
	var amount = xml.getElementsByTagName("amount")[0].childNodes[0].nodeValue;
	var yearBuilt = xml.getElementsByTagName("yearBuilt")[0].childNodes[0].nodeValue;
	var lotSizeSqFt = xml.getElementsByTagName("lotSizeSqFt")[0].childNodes[0].nodeValue;
	var bathrooms = xml.getElementsByTagName("bathrooms")[0].childNodes[0].nodeValue;
	var bedrooms = xml.getElementsByTagName("bedrooms")[0].childNodes[0].nodeValue;
	
	document.getElementById('street').innerHTML = street;
	document.getElementById('location').innerHTML = city + ", " + state + " " + zip;
	document.getElementById('yearBuilt').innerHTML = "Year Built:" + yearBuilt;
	document.getElementById('lotSizeSqFt').innerHTML = "Lot Size (Sq.Ft):" + Number(lotSizeSqFt).toLocaleString();
	document.getElementById('bedrooms').innerHTML = "No. of Bedrooms:" + bedrooms;
	document.getElementById('bathrooms').innerHTML = "No. of Bathrooms:" + bathrooms;
	document.getElementById('estimate').innerHTML = "Price: $" + Number(amount).toLocaleString();
	document.getElementById("housePrice").setAttribute("value", amount);

	this.housePrice = amount;
}

//function that assigns appropriate listed interest rates and what will be displayed
function setupMortgageRates(xml) {
	var todayRates = xml.getElementsByTagName("today")[0];

	mortgageRates.thirtyYearFixed = todayRates.querySelector('rate[loanType="thirtyYearFixed"]').innerHTML;
	mortgageRates.fifteenYearFixed = todayRates.querySelector('rate[loanType="fifteenYearFixed"]').innerHTML;
    mortgageRates.fiveOneARM = todayRates.querySelector('rate[loanType="fiveOneARM"]').innerHTML;

    document.getElementById('thirtyYearFixed').innerHTML = mortgageRates.thirtyYearFixed + "%";
	document.getElementById('fifteenYearFixed').innerHTML = mortgageRates.fifteenYearFixed + "%";
	document.getElementById('fiveOneARM').innerHTML = mortgageRates.fiveOneARM + "%";
}

//function that sets up the mortgage calculator
function setupMortgageScenerio() {
	defaultDownpayment = housePrice * (defaultMortgageScenario.percentage/100);
	addMortgageScenerio(defaultDownpayment,defaultMortgageScenario.term,mortgageRates.thirtyYearFixed);
}

//function to add another mortgage scenario to calculate to compare with previous scenarios
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

//function to clear scenarios
function removeAllMortgageScenarios() {
	var scenarios = document.getElementById('scenarios');

	while( scenarios.firstChild ){
		scenarios.removeChild( scenarios.firstChild );
	}
}

//function to have default input values assigned to certain variables. Will call functions to calculate monthly mortgage
//payments and/or projected house price
function setupProjectedMortgagePayment() {
	defaultDownpayment = housePrice * (defaultMortgageScenario.percentage/100);
	var present = housePrice - defaultDownpayment;

	var defaultMonthly = payment(mortgageRates.thirtyYearFixed,defaultMortgageScenario.term,present);

	document.getElementById('pDown').value = defaultDownpayment;
	document.getElementById('pLengthTerm').value = defaultMortgageScenario.term;
	document.getElementById('pMonthly').value = defaultMonthly;
	document.getElementById('pIntRate').value = mortgageRates.thirtyYearFixed;
	var m = projectedHousePrice(defaultDownpayment,defaultMonthly,defaultMortgageScenario.term,mortgageRates.thirtyYearFixed);
	m = Number(m).toLocaleString();
	document.getElementById('pHousePrice').innerHTML = "$" + m;
}

//function that will calculate new projected house price if values are changed by user in input fields
function projectedMortgagePayment(){
	var down = document.getElementById('pDown').value;
	var length = document.getElementById('pLengthTerm').value;
	var monthly = document.getElementById('pMonthly').value;
	var rate = document.getElementById('pIntRate').value;
	var p = projectedHousePrice(down, monthly, length, rate);
	p = Number(p).toLocaleString();
	document.getElementById('pHousePrice').innerHTML = "$" + p;

}

//function to go through all mortgage scenarios to update payment
function updateAllPayment() {
	var price = document.getElementById("housePrice").value;
	var slen = document.getElementById('scenarios').getElementsByTagName("li").length;

	for (i = 0; i < slen ;i++) {
		updatePayment(i);
	}
}

//Update payment at one of the mortage scenarios by index
function updatePayment(index) {
	var form = document.getElementById('form' + index);
	var down = form.downpayment.value;
	var term = form.term.value;
	var rate = form.rate.value;

	var price = document.getElementById("housePrice").value;
	var loanAmount = Math.max(0,(price-down));

	document.getElementById("payment"+index).innerHTML = "$"+Number(payment(rate,term,loanAmount)).toLocaleString();
}

//function to remove all mortgge scenarios
function resetMortgageScenerio() {
	removeAllMortgageScenarios();
}


//function to reset values for mortgage scenario
function resetEverything() {
	removeAllMortgageScenarios();
	show(false);
}

//function that calculates monthly payment amt based off of house price, down payment, length, and rate
function payment(rate,years,present) {
	var rper = (rate/100)/12;
	var nper = years*12;
	present = -present;
	var pmt = (rper * present * Math.pow((1 + rper), nper) )/ (1 - Math.pow((1 + rper), nper));
	
	return pmt.toFixed(2);
}


//function to calculate a target house price or see what price range the person can afford
function projectedHousePrice(down,monthly,length,interest) {
	var targetPrice = 0;
	var lengthTerm = length*12;
	var rate = (interest/100)/12;
	var q=Math.pow((1+rate),lengthTerm);
	targetPrice=Number(down)+(Number(monthly)/((rate*q)/(q-1)));
	return targetPrice.toFixed(2);	
}
