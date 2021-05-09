const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const url = "https://accounts.practo.com/login?next=%2Fcheckid_request&intent=fabric";
const id = "stormbreaker0288@gmail.com";
const password = "Yourp@ssword0288";
const Disease = "Ayurveda";
const location = "Raja Garden";
const numberOfDoctor = 5;
const homeLocation = "145/RZ, Block B, Janta Colony, Tagore Garden Extension, New Delhi, Delhi";

let finalData = [];
async function main() {

    let browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ["--start-maximized", "--disable-notifications",],
        slowMo: 5
    });

    let tabs = await browser.pages();

    let tab1 = tabs[0];

    await tab1.goto(url);

    // signing in on the website
    await signin(tab1);

    await enterLocationAndDisease(tab1);

    // to get doctors Info
    await DoctorsInfo(tab1, browser);

    await tab1.close();
    await browser.close();
}

async function signin(tab){

     // signing in on practo
     await tab.waitForSelector("input[name='username']", {visible : true});
     await tab.type("input[name='username']", id);
     await tab.type("input[name='password']", password);
     await tab.click("button[type='submit']");
}

async function enterLocationAndDisease(tab) {

    // fetching input field to write Location and Disease 
    await tab.waitForSelector(".c-omni-searchbox.c-omni-searchbox--small", { visible: true });
    let locationAndDisease = await tab.$$(".c-omni-searchbox.c-omni-searchbox--small");

    // Entering location
    await locationAndDisease[0].click();
    await tab.waitForSelector("i[class='icon-ic_cross_solid']", { visible: true });
    await tab.click("i[class='icon-ic_cross_solid']");
    await locationAndDisease[0].type(location, { delay: 100 });
 
    await tab.waitForSelector("div[data-qa-id='omni-suggestion-locality']", { visible: true });
    await tab.click("div[data-qa-id='omni-suggestion-locality']");
    // console.log(locationAndSpecility.length);

    // Entering Speciality ( Disease )
    await tab.waitForSelector(".c-omni-searchbox.c-omni-searchbox--small", { visible: true });
    await locationAndDisease[1].type(Disease);
    await tab.keyboard.press("Enter");

}

async function DoctorsInfo(tab, browser) {

    let dirPath = path.join("files");
    dirCreater(dirPath);

    await tab.waitForSelector(".info-section", { visible: true });
    let allDoctorInfoSection = await tab.$$(".info-section");
    let eachDoctorProfileUrl = [];
    for (let i = 0; i < 5; i++) {
        let eachDoctorInfoSection = await allDoctorInfoSection[i].$$("a");
        // console.log(eachDoctorInfoSection.length);
        eachDoctorProfileUrl[i] = await tab.evaluate(function (ele) {
            return ele.getAttribute("href");
        }, eachDoctorInfoSection[0]);
    }

    let i = 0;
    for (i = 0; i < numberOfDoctor; i++) {
        let a = position(i + 1);
        let doctorDetails = `${i + 1} ${a} Doctor Details`
        let obj = {};
        obj[doctorDetails] = [];
        finalData.push(obj);
        let profileUrl = "https://www.practo.com" + eachDoctorProfileUrl[i];

        // to get all details of the doctors 
        await fetchingDoctorData(profileUrl, browser, i, doctorDetails);
    }

    if (i == numberOfDoctor){
        let dirPath = path.join("files/AllDoctorsDetails.json");
        fileCreater(dirPath, "");

        fs.writeFileSync(dirPath, JSON.stringify(finalData));
    }
}

function position(i) {
    if (i == 1)
        return "st";
    if (i == 2)
        return "nd";
    if (i == 3)
        return "rd";
    if (i >= 4)
        return "th";
}

async function fetchingDoctorData(url, browser, finalDataIdx, doctorDetails) {

    let tab = await browser.newPage();
    await tab.goto(url);

    // getting name of the Doctor
    await tab.waitForSelector(".c-profile__title.u-bold.u-d-inlineblock");
    let nameSelector = await tab.$(".c-profile__title.u-bold.u-d-inlineblock");

    let name = await tab.evaluate(function (ele) {
        return ele.textContent;
    }, nameSelector);
    // console.log(name);

    // getting qualification of the Doctor
    let qualificationSelector = await tab.$("p[data-qa-id='doctor-qualifications']");
    let qualification = await tab.evaluate(function (ele) {
        return ele.textContent;
    }, qualificationSelector);
    // console.log(qualification);

    // getting doctor specializations
    let specializations = "";
    let specializationsSelector = await tab.$$(".u-d-inlineblock.u-spacer--right-v-thin.c-profile__details");
    for (let i = 0; i < specializationsSelector.length; i++) {
        let str = await tab.evaluate(function (ele) {
            return ele.textContent;
        }, specializationsSelector[i]);

        if (i == specializationsSelector.length - 1)
            specializations += str;

        else
            specializations += str + ', ';
    }
    // console.log(specializations);

    // getting doctor experince
    let profileDetailsArray = await tab.$$(".c-profile__details");
    let experinceSelector = await profileDetailsArray[1].$$("h2");
    let experince = await tab.evaluate(function (ele) {
        return ele.textContent;
    }, experinceSelector[experinceSelector.length - 1]);
    // console.log(experince);

    // getting doctor votes percentage
    let votesPercentageSelector = await tab.$(".c-profile__details .u-green-text.u-bold.u-large-font");
    let votesPercentage = await tab.evaluate(function (ele) {
        return ele.textContent;
    }, votesPercentageSelector);
    // console.log(votesPercentage);

    // getting doctor number of votes
    let numberOfvotesSelector = await tab.$(".c-profile__details .u-smallest-font.u-grey_3-text");
    let numberOfvotes = await tab.evaluate(function (ele) {
        return ele.textContent;
    }, numberOfvotesSelector);
    // console.log(numberOfvotes);

    // combining doctor votes percentage and number of votes
    let votesPercentageAndnumberOfVotes = votesPercentage + " " + numberOfvotes;

    // getting clinc address
    let clinicAddressSelector = await tab.$(".c-profile--clinic__address");
    let clinicAddress = await tab.evaluate(function (ele) {
        return ele.textContent;
    }, clinicAddressSelector);
    // console.log(clinicAddress);

    // getting consultant fee for visiting to clinic
    let consultantionFeeSelector = await tab.$("span[data-qa-id='consultation_fee']");
    let consultantionFee = await tab.evaluate(function (ele) {
        return ele.textContent;
    }, consultantionFeeSelector);
    // console.log(consultantionFee);

    // getting google map link for clinic
    let ClinicDirectionUrlSelector = await tab.$(".c-profile--clinic__name.u-x-base-font");
    let ClinicDirectionUrl = await tab.evaluate(function (ele) {
        return ele.getAttribute("href");
    }, ClinicDirectionUrlSelector);
    // console.log(ClinicDirectionUrl);

    finalData[finalDataIdx][doctorDetails].push({
        Name: name,
        Qualifications: qualification,
        Specializations: specializations,
        Experince: experince,
        Votes: votesPercentageAndnumberOfVotes,
        "Profile Url": url,
        "Consultantion Fee": consultantionFee,
        "Clinic Address": clinicAddress,
        "Clinic Address Google Map Link": ClinicDirectionUrl
    });

    // doing google map work
    await googleMap(ClinicDirectionUrl, browser, name);
    await tab.close();
}

function dirCreater(pathOfFile) {
    if (!fs.existsSync(pathOfFile)) {
        fs.mkdirSync(pathOfFile);
        console.log(pathOfFile + "-> Created");
    }
}

function fileCreater(pathOfFile, content) {
    fs.writeFileSync(pathOfFile, content);
    console.log(pathOfFile + "-> Created");
}

async function googleMap(url, browser, name) {

    let tab = await browser.newPage();
    await tab.goto(url, {
        waitUntil: "networkidle2"
    });

    // click on direction button
    await tab.waitForSelector("div[data-value='Directions']", { visible: true });
    await tab.click("div[data-value='Directions']");

    await tab.keyboard.down("Control");
    await tab.keyboard.press("A");
    await tab.keyboard.up("Control");

    // entering home location
    await tab.waitForSelector("#sb_ifc50 input");
    await tab.type("#sb_ifc50 input", homeLocation);
    await tab.keyboard.press("Enter");

    // to get GOOGLE MAP DIRECTION SCREENSHOT
    await googleMapTakeScreenShot(tab, name);

    await tab.waitForSelector("input[class='section-copy-link-input']", { visible: true });
    let mapDirectionLinkSelector = await tab.$("input[class='section-copy-link-input']");
    let mapDirectionLink = await tab.evaluate(function (ele) {
        return ele.getAttribute("value");
    }, mapDirectionLinkSelector);
    // console.log(mapDirectionLink);

    // clicking on embed a map in share
    await tab.click("button[aria-label='Embed a map']", { visible: true });
    await tab.waitForSelector("input[class='section-embed-map-input']", { visible: true });
    let embedHTMLSelector = await tab.$("input[class='section-embed-map-input']");
    let embedHTMLOfGoogleMap = await tab.evaluate(function (ele) {
        return ele.getAttribute("value");
    }, embedHTMLSelector);
    // console.log(embedHTMLOfGoogleMap);

    // close button
    await tab.click("button[aria-label='Close']");

    // getting google map pdf
    await googleMapTakePdf(mapDirectionLink, name);

    await tab.close();
}

async function googleMapTakeScreenShot(tab, name){

    let dirPath = path.join('files/' + name);
    dirCreater(dirPath);

    let dirPath1 = path.join('./files/' + name + '/' + 'Clinic Route.jpg');
    fileCreater(dirPath1, "");

    // taking screenshoot
    await tab.waitForNavigation({ waitUntil: "networkidle0" });
    await tab.waitFor(4000);
    await tab.screenshot({
        path: dirPath1,
        type: 'jpeg',
        quality: 80,
        clip: {
            x: 410,
            y: 0,
            width: 940,
            height: 600
        }
    });

    await tab.waitForSelector("#section-directions-trip-0", { visible: true });
    // await tab.waitForNavigation({ waitUntil: "networkidle0" });
    await tab.click("#section-directions-trip-0", { waitUntil: "networkidle0" });

    // clicking on share link button
    await tab.waitForSelector("button[vet='14906']", { visible: true });
    await tab.click("button[vet='14906']");
}

async function googleMapTakePdf(url, name) {

    const browser = await puppeteer.launch();
    const tab = await browser.newPage();
    await tab.goto(url);

    // clicking on print button
    await tab.waitForSelector(".mapsConsumerUiIconsCssSettings__maps-sprite-settings-print.mapsTactileClientSubviewSectionActionDirectionsdetailsaction__section-directions-details-action-button", { visible: true });
    await tab.click(".mapsConsumerUiIconsCssSettings__maps-sprite-settings-print.mapsTactileClientSubviewSectionActionDirectionsdetailsaction__section-directions-details-action-button");

    // print text only button
    await tab.waitForSelector("button[vet='7974']", { visible: true });
    await tab.click("button[vet='7974']");

    // fs.mkdirSync('files/' + name);
    await tab.waitForNavigation({ waitUntil: 'networkidle2' });

    let dirPath = path.join('./files/' + name + '/Clinc Direction.pdf');
    fileCreater(dirPath, "");

    // await tab.pdf({ path: dirPath, format: "Letter" });
    // creating pdf
    await tab.pdf({
        printBackground: true,
        path: dirPath,
        format: "A4",
        margin: {
            top: "20px",
            bottom: "20px",
            left: "20px",
            right: "20px"
        }
    });
    await browser.close();
 }

main();

// node script.js

