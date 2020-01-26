/* Remaining Tasks:
1) Treat div[background-image] the same as an IMG tag. Hopefully that improves the experience on HBO Go, for example.
2) Get addToTextDictionaryOrJustProcess to start treating checkboxes by editing adjacent text. Treat checkboxes with labels in the obvious way (label as clicakble text. If there's no associated label, add hover text to the box.)
3) Refactor the available permutation index finder as its own function.
4) Make a good sorting funciton of visibleTargets.
*/

deactivate();

var visibleTargets =[];
var keysCurrentlyActive = false;
var keysWasActive = false;
var upSinceDeactivation = true;
var searchText = "";
var DataFrame = [];
var TextDictionary = {};
var ExistingKeys=[];
var homeRow = ["f", "d", "j", "k", "s", "l", "m", "n", "c", "v", "e", "r", "t", "u", "i", "o", "a"];
var idealLength;
var inputelement;
var permutationIndex = 0;
var permutations;
var scrollPositionWhenActivated;
var preferredActivationKey;

$(document).ready(function() {
    $(":focus").blur();
    safari.extension.dispatchMessage("pageLoaded")
});

window.addEventListener('load', (event) => {
    $(":focus").blur();
});

$("html").on('keypress', function (activationEvent) {
    if (!keysCurrentlyActive && upSinceDeactivation && activationEvent.key.toUpperCase() == preferredActivationKey  && activationEvent.target.nodeName != "INPUT" && activationEvent.target.nodeName != "TEXTAREA" && !activationEvent.target.isContentEditable) {
        deactivate();
        keysCurrentlyActive = true;
        upSinceDeactivation = false;
        $("html").attr("key_commands_were_activated", "true");
        priorSiteSpecificModifications();
        var targets = document.querySelectorAll("a, a i, a img, a svg, input, button, button i, button img, button svg, [role='button'], [role='button'] i, [role='button'] img, [role='button'] svg, [role='link'], [role='link'] i, [role='link'] img, [role='link'] svg, [role='tab'], [role='menuitem'] [role='option'], .Keys-Should-Generate-Floating-Text");
        var theNumberOfTargets = targets.length;
        var targetsObserved = 0;
        var visible =(target)=> {
            const io = new IntersectionObserver((entries,observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting){
                        visibleTargets.push(target)
                        observer.disconnect();
                        targetsObserved++;
                        if (targetsObserved == theNumberOfTargets){
                                idealLength = Math.ceil(Math.log(visibleTargets.length)/Math.log(homeRow.length));
                                permutations = getPermutations(homeRow, idealLength);
                                asynchronousIterator().then(colorTextKeys).then(siteSpecificModifications);
                        }
                    }
                    else {
                        observer.disconnect();
                        targetsObserved++;
                        if (targetsObserved == theNumberOfTargets){
                            idealLength = Math.ceil(Math.log(visibleTargets.length)/Math.log(homeRow.length));
                            permutations = getPermutations(homeRow, idealLength);
                            asynchronousIterator().then(colorTextKeys).then(siteSpecificModifications);
                        }
                    }
                });
            }, {rootMargin: "200px"});
        io.observe(target)
        };

        function run () {
            console.time('visible')
            for (var target of targets) {
                visible(target);
            }
            console.timeEnd('visible')
        }

        run();

        generateInputBox();
        $("html").on('keydown', "#Keys-Input-Box", function (secondarykeys) {recordKeystrokes(secondarykeys)})
        $("html").on('keyup', "#Keys-Input-Box", function () {$("#Keys-Input-Box").val($("#Keys-Input-Box").val().replace(/[^0-9a-z]/gi, '')); })
        
        scrollPositionWhenActivated = $(window).scrollTop();
    }
});

function generateInputBox() {
    $(":focus").blur();
    if (!document.getElementById("Keys-Input-Box")) {
    inputelement = document.createElement('input');
    inputelement.setAttribute("id", "Keys-Input-Box");
    inputelement.setAttribute("type", "text")
    document.body.appendChild(inputelement);
    inputelement.focus();
    }
}

function tryPrefixes(innerText, preferred_width){
    var found;
    var words = innerText.split(/[^A-Za-z0-9]/).map(word => word.split(/(?=[A-Z][a-z])/)).flat();
    var first_words = words.slice(0,3);
    var prefixes = first_words.map(word => word.substring(0, preferred_width))
    for (i =0; i<prefixes.length; i++) {
        if (isLeftAbsent(prefixes[i]) && prefixes[i].length>=preferred_width){
            found = prefixes[i];
            return found;
        }
        else if (i == prefixes.length - 1) {
            return getContiguousUniqueSubsequence(words, preferred_width);
        }
        else {continue}
    }
}

function getContiguousUniqueSubsequence(words, preferred_width){
    for (let innerText of words) {
    loop1:
        for (let width = preferred_width; width<=innerText.length; width++){
        loop2:
            for (let position = 0; position<=innerText.length-width; position++){
                if (isLeftAbsent(innerText.substring(position, position+width))){
                    found = innerText.substring(position, position+width);
                    return found;
                    }
                else {
                    continue
                }
            }
        }
    }
    return ""; /* delete maybe? */
}

function isAbsent (string, length){
    return !ExistingKeys.includes(string.toLowerCase())
}

function isLeftAbsent(possibleKey){
    return leftSubsequencesOf(possibleKey).every(isAbsent)
}

function leftSubsequencesOf(string){
    var subsequences = [];
    for (let i = 0; i<=string.length-1; i++){
        subsequences[i]=string.substring(0,i+1)
    }
    return subsequences
}

async function colorTextKeys(TextDictionary){
    for (var key in TextDictionary) {
      var element = TextDictionary[key];
        if (key && element && !element.classList.contains("Keys-Hidden-Originals")) {
            DataFrame.push([element, key, $(element).text()/*, $(element).closest("a, button").attr("href")*/])
            var splitkey = key.split("").map(character =>"<span class='Keys-Character Keys-Initial-Character'>"+character+"</span>").join("");
            $(element).before(element.outerHTML);
            $(element.previousSibling).html($(element).text().replace(new RegExp('(' + key + ')'), `<span id=$1 class='Keys-Clickable-Text-Key'>${splitkey}</span>`))
            $(element.previousSibling).addClass("faux");
            $(element).addClass("Keys-Hidden-Originals");
        }
    }
}

function pairexists(table, text, url) {
    for (let i=0; i<table.length; i++) {
        if (table[i][2]==text && table[i][3]==url && url!='#'){
            return table[i][1]
        }
        else{continue}
    }
}

function getTextBoxText(box){
    if (box.getAttribute("placeholder")){
        return box.getAttribute("placeholder")
    }
    else if (box.getAttribute("aria-label")){
        return box.getAttribute("aria-label");
    }
    else if (box.getAttribute("title")){
        return box.getAttribute("title");
    }
    else if (box.getAttribute("name")){
        return box.getAttribute("name");
    }
    else if (box.getAttribute("id")){
        return box.getAttribute("id");
    }
    else return "textbox"
}

function createFloatingText(image, key){
    var wrapper = document.createElement("span");
    wrapper.setAttribute("class", "Keys-Floating-Key");
    key.split("").forEach(function(character) {
        var a = document.createElement("span");
        $(a).addClass("Keys-Character");
        var b = document.createTextNode(character)
        a.appendChild(b)
        wrapper.appendChild(a)
    });
    if (image.getBoundingClientRect().width<30 || image.getBoundingClientRect().height < 30){
        wrapper.classList.add("Keys-Small-Image-Key")
    }
    else if (image.getBoundingClientRect().width<150){
        wrapper.classList.add("Keys-Medium-Image-Key")
    }
    else {
        wrapper.classList.add("Keys-Large-Image-Key")
    }
    document.body.appendChild(wrapper);
    ExistingKeys.push(key)
    DataFrame.push([image, key, wrapper, $(image).closest("a, button, [role='button'], [role='link'], [role='tab'], [role='menuitem'] [role='option']").attr("href")])
    return wrapper;
}

function tether(label, element) {
    $(element).addClass(`Keys-${$(label).text()}`)
    new Tether({element: label, target: element, attachment: 'middle center', targetAttachment: 'middle center'})
}

// assembles the TextDictionary asynchronously.
async function asynchronousIterator() {
    idealLength = Math.ceil(Math.log(visibleTargets.length)/Math.log(homeRow.length));
    visibleTargets.sort();
    for (var target of visibleTargets) {
        await addToTextDictionaryOrJustProcess(target);
    }
    return Promise.resolve(TextDictionary)
}

// creates the element-key TextDictionary that colorTextKeys will iterate over.
async function addToTextDictionaryOrJustProcess(element) {
    if (element.classList.contains("Keys-Should-Generate-Floating-Text")) {
        for (permutationIndex; permutationIndex<permutations.length; permutationIndex++) {
            if (!isLeftAbsent(permutations[permutationIndex])) {
                continue;
            }
            var label = createFloatingText(element, permutations[permutationIndex]);
            $(label).addClass("Keys-Clickable-Text")
            permutationIndex++;
            tether(label, element);
            break;
        }
    }
    if (element.tagName == 'A' || element.tagName == 'BUTTON' || String($(element).attr("role")).toLowerCase() == 'button' || String($(element).attr("role")).toLowerCase() == 'link' || String($(element).attr("role")).toLowerCase() == 'tab' || String($(element).attr("role")).toLowerCase() == 'option') {
        if ($(element).text()) {
            var responsibleNode = await earmarkText(element);
            var label = await AssignTextKey(responsibleNode)
            if (label) {
            ExistingKeys.push(String(label).toLowerCase());
            TextDictionary[label] = responsibleNode;
            return label;
            }
        }
        else if ($(element).find("img, svg, i").length == 0) {
            for (permutationIndex; permutationIndex<permutations.length; permutationIndex++) {
                if (!isLeftAbsent(permutations[permutationIndex])) {
                    continue;
                }
                var label = createFloatingText(element, permutations[permutationIndex]);
                $(label).addClass("Keys-Clickable-Text")
                permutationIndex++;
                tether(label, $(element).closest("a, button, [role='button'], [role='link'], [role='tab'], [role='option']"));
                break;
            }
        }
    }
    else if (element.tagName == 'IMG' || element.tagName == 'svg' || element.tagName == 'I'){
        for (permutationIndex; permutationIndex<permutations.length; permutationIndex++) {
            if (!isLeftAbsent(permutations[permutationIndex])) {
                continue;
            }
            if ((element.getBoundingClientRect().width<30 || element.getBoundingClientRect().height < 30) && $(element).closest("a, button, [role='button'], [role='link'], [role='tab']").text().trim()) { break;}
            var label = createFloatingText(element, permutations[permutationIndex]);
            permutationIndex++;
            tether(label, element);
            if (element.tagName == 'IMG') {
                if (element.getBoundingClientRect().width<30 || element.getBoundingClientRect().height < 30){
                    element.classList.add("Keys-Small-Clickable-Image")
                }
                else if (element.getBoundingClientRect().width<150){
                    element.classList.add("Keys-Medium-Clickable-Image")
                    element.parentElement.classList.add("Keys-Container-of-Large-Image")
                }
                else {
                    element.classList.add("Keys-Large-Clickable-Image")
                    element.parentElement.classList.add("Keys-Container-of-Large-Image")
                }
            }
            if (element.tagName == 'svg' || element.tagName == 'I') {
                element.classList.add("Keys-Clickable-Icon")
            }
            break;
        }
            return "";
    }
    else if (element.tagName == 'INPUT') {
        createAndSwapSearchBarPlaceholder(element);
    }
    else {
        return "";
    }
}

// adds the class "clickableText" to whichever node or element is responsible for that text displaying.
async function earmarkText(anchor) {
    var first_line = "";
    $(anchor).find("*").each(function() {
        return (first_line=this, ($(first_line).immediateText())==false || $(first_line).contents().length>1 || AssignTextKey(first_line) == null)});
    if ($(first_line).immediateText()!="" && $(first_line).parent().prop("className")!="Keys-Clickable-Text" && $(first_line).prop("className")!="Keys-Clickable-Text"){
        $(first_line).addClass("Keys-Clickable-Text");
    }
    else {
        first_line = nodeFind(anchor)
        
    }
    return first_line;
}
// replaces earmarkText for elements that have naked text nodes i.e. nodes that aren't wrapped in an element.
function nodeFind(anchor) {
    var textNodes = $(anchor).contents().filter(function() {
      return (this.nodeType === 3 && this.textContent.trim().match(/[a-zA-Z0-9-_ ]/));
    })
    textNodes = textNodes.sort((a,b) => b.textContent.trim().length - a.textContent.trim().length)
    first_node = textNodes[0];
    $(first_node).wrap("<span class = 'Keys-Clickable-Text clickableTextWrapped'>");
    first_line = $(anchor).find(".Keys-Clickable-Text")[0];
    return first_line;
}

$.prototype.immediateText = function() {
    return this.contents().not(this.children()).text().trim();
};

function AssignTextKey(element) {
    var key;
    var text = $(element).text().trim();
    var href = $(element).closest("a, button, [role='button'], [role='link'], [role='tab'], [role='option']").attr("href");
    if (pairexists(DataFrame, text, href)){key = pairexists(DataFrame, text, href);}
    else if (tryPrefixes(text, idealLength)) {
        key = tryPrefixes(text, idealLength);
    }
    else if (element) {
        for (permutationIndex; permutationIndex<permutations.length; permutationIndex++) {
            if (!isLeftAbsent(permutations[permutationIndex])) {
                continue;
            }
            var label = createFloatingText(element, permutations[permutationIndex]);
            $(label).addClass("Keys-Clickable-Text")
            permutationIndex++;
            tether(label, element);
            break;
        }
    }
    return key;
}

createAndSwapSearchBarPlaceholder =async(element)=> {
    if (!element.getAttribute("original_placeholder")){
        element.setAttribute("original_placeholder", element.getAttribute("placeholder"))
    }
    if ($(element).attr("type") == "text" || $(element).attr("type") == "search") {
        $(element).attr("original_value", String($(element).val()))
        $(element).val("")
    }
    if (element.getAttribute("type") != null && (element.getAttribute("type").toLowerCase() == "submit" || element.getAttribute("type").toLowerCase() == "button") && element.getAttribute("value")) {
        for (permutationIndex; permutationIndex<permutations.length; permutationIndex++) {
            if (!isLeftAbsent(permutations[permutationIndex])) {
                continue;
            }
            var label = createFloatingText(element, permutations[permutationIndex]);
            $(label).addClass("Keys-Clickable-Text")
            permutationIndex++;
            tether(label, element);
            break;
        }
        return permutations[permutationIndex-1];
    }
    element.setAttribute("placeholder", tryPrefixes(getTextBoxText(element), idealLength));
    var inputKey = tryPrefixes(getTextBoxText(element), idealLength)
    DataFrame.push([element, inputKey]);
    ExistingKeys.push(tryPrefixes(getTextBoxText(element), idealLength).toLowerCase())
}

function recordKeystrokes(keypress) {
    if (keysCurrentlyActive) {
        $(".Keys-Initial-Character").removeClass("Keys-Initial-Character");
        if (/[a-zA-Z0-9-_ ]/.test(keypress.key) && keypress.key.length == 1) {
            searchText = $("#Keys-Input-Box").val().slice(1).concat(String.fromCharCode(keypress.which).toLowerCase());
        }
        else if (keypress.key == "Backspace") {
            searchText = $("#Keys-Input-Box").val().slice(1, -1);
            if (searchText.length < 1) {
                deactivate();
                $("html").one('keyup', function(){
                    upSinceDeactivation=true;
                })
            }
        }
        DataFrame = DataFrame.filter(function(element) {
            return typeof element[0] !== 'undefined' && element[0];
        });
        for (var keyTriplet of DataFrame) {
            if (keyTriplet[0].tagName == 'INPUT' && (keyTriplet[0].getAttribute("type") == "submit" || keyTriplet[0].getAttribute("type") == "button")) {
                recolorMatchingKeys(keyTriplet[0], $(keyTriplet[2]), keyTriplet[1].toLowerCase(), false)
                if (keyTriplet[1].toLowerCase() == searchText.toLowerCase()) {
                    $(keyTriplet[0]).click();
                    $(keyTriplet[0]).submit();
                    keyTriplet[0].focus()
                    deactivate();
                    $("html").one('keyup', function(){
                        upSinceDeactivation=true;
                    })
                }
            }
            else if (keyTriplet[2] instanceof Element && keyTriplet[2].classList.contains("Keys-Floating-Key")) {
                recolorMatchingKeys(keyTriplet[0], $(keyTriplet[2]), keyTriplet[1].toLowerCase(), true)
            }
            else if (keyTriplet[0].classList.contains('Keys-Clickable-Text')){
                recolorMatchingKeys(keyTriplet[0], $(keyTriplet[0]).prev(), keyTriplet[1].toLowerCase(), true)
            }
            else if (keyTriplet[0].tagName == 'INPUT') {
                if (keyTriplet[1].toLowerCase() == searchText.toLowerCase()) {
                    keypress.preventDefault();
                    $(keyTriplet[0]).val($(keyTriplet[0]).attr("original_value"));
                    deactivate();
                    keyTriplet[0].focus()
                    $("html").one('keyup', function(){
                        upSinceDeactivation=true;
                    })
                }
            }
            else {}
        }
        // keypress.preventDefault();
    }
    else {return}
}

var getPermutations = function(homeRow, maxLen) {
    var perm = homeRow.map(function(val) {
        return [val];
    });
    var generate = function(perm, maxLen, currLen) {
        if (currLen === maxLen) {
            return perm;
        }
        for (var i = 0, len = perm.length; i < len; i++) {
            var currPerm = perm.shift();
            for (var k = 0; k < homeRow.length; k++) {
                perm.push(currPerm.concat(homeRow[k]));
            }
        }
        return generate(perm, maxLen, currLen + 1);
    };
    return generate(perm, maxLen, 1).map(a => a.join(""));
};

function deactivate() {
    permutationIndex = 0;
    $("#Keys-Input-Box").val("");
    TextDictionary= {};
    ExistingKeys = [];
    targets = [];
    visibleTargets = [];
    searchText = "";
    keysCurrentlyActive = false;
    $(".Keys-Clickable-Text-Key").removeClass("Keys-Clickable-Text-Key");
    $(".Keys-Clickable-Text").removeClass("Keys-Clickable-Text");
    $(".imagekeycontainer").contents().unwrap();
    $(".imagewithinanchor").contents().unwrap();
    $( ".Keys-Floating-Key" ).remove();
    document.querySelectorAll("input[original_placeholder]").forEach(
        input => {
            if (input.getAttribute("original_placeholder")!="null") {
                input.placeholder = input.getAttribute("original_placeholder");
            }
            else {input.placeholder = "";}
        }
    )
    resetAllInputValues();
    $(".Keys-Small-Clickable-Image").removeClass("Keys-Small-Clickable-Image");
    $(".Keys-Medium-Clickable-Image").removeClass("Keys-Medium-Clickable-Image");
    $(".Keys-Large-Clickable-Image").removeClass("Keys-Large-Clickable-Image");
    $(".Keys-Clickable-Icon").removeClass("Keys-Clickable-Icon");
    $(".Keys-Hidden-Originals").removeClass("Keys-Hidden-Originals");
    $(".faux").remove();
    $(".clickableTextWrapped").contents().unwrap();
    DataFrame = [];
    keysCurrentlyActive = false;
    $("#Keys-Input-Box").remove();
    $(".Keys-Show-While-Active").removeClass("Keys-Show-While-Active")
    $(".Keys-Container-of-Large-Image").removeClass("Keys-Container-of-Large-Image")
    $("#uh-search-box").off() // site-specific mod for Yahoo Spanish. Ugly solution but will change later.
}

$(window).on('scroll', function() {
    if (keysCurrentlyActive && Math.abs($(this).scrollTop() - scrollPositionWhenActivated) >= 190) {
        deactivate();
        upSinceDeactivation=true;
    }
});

$("html").mouseup(clickAwayEvent => {
    if (keysCurrentlyActive) {
        deactivate();
        upSinceDeactivation=true;
    }
})

$(document).keydown(escapeEvent => {
    if (keysCurrentlyActive && escapeEvent.key == "Escape") {
        deactivate();
        upSinceDeactivation=true;
    }
})

// modifications that will occur after keys adds elements to the page.
function siteSpecificModifications() {
    Tether.position(); // important to update every tether's position for websites e.g. StackExchange.
    if (window.location.hostname == "twitter.com") {
        $(".Keys-Large-Clickable-Image").parent().addClass("Keys-Large-Clickable-Image");
        $(".Keys-Medium-Clickable-Image").parent().addClass("Keys-Medium-Clickable-Image");
        $(".Keys-Small-Clickable-Image").parent().addClass("Keys-Small-Clickable-Image");
    }
    if (window.location.hostname.includes("facebook")) {
        $("#u_0_9 input._5eay").css({'opacity':'0'});
    }
    if (window.location.hostname == "www.apple.com") {
        $(".localnav-title.faux").css({'font-size':'inherit'});
        $(".localnav-title.faux").css({'color':'blue'});
    }
    if (window.location.hostname == "www.youtube.com") {
        $("ytd-topbar-menu-button-renderer yt-img-shadow").addClass("Keys-Container-of-Large-Image");
        $(".ytp-chrome-bottom").addClass("Keys-Show-While-Active");
        $("ytd-menu-renderer").addClass("Keys-Show-While-Active");
        $(".yt-img-shadow").addClass("Keys-Container-of-Large-Image");
    }
    if (window.location.hostname === "www.msn.com" || $("html").hasClass("gr__msn_com")) {
        $("li.popularnow li .faux, li.popularnow li .faux .Keys-Character").css("font-size", "12px");
        $("li.popularnow .faux, li.popularnow .faux .Keys-Character").css("font-weight", "lighter");
    }
    if (window.location.hostname === "www.netflix.com") {
        $(".profile-button span").css("border", "none")
        $(".profile-button span").css("display", "contents")
    }
    if (window.location.hostname === "samharris.org") {
        $(".home-content-listing__post-media").addClass("Keys-Container-of-Large-Image")
    }
    if (window.location.hostname === "edition.cnn.com") {
        $(".Keys-Floating-Key").insertAfter("head")
    }
}

// modifications that occur on initial G keypress (before Keys are assigned or rendered)
function priorSiteSpecificModifications() {
    if (window.location.hostname.includes("wikipedia.org")) {
        $("span.toctext").css("display", "contents");
        $(".tocnumber").css("display", "contents");
    }
    if (window.location.hostname == "www.youtube.com") {
        $(".ytp-videowall-still-info-content").addClass("Keys-Show-While-Active");
        $(".ytp-videowall-still-info-content.faux").addClass("Keys-Show-While-Active");
        $("paper-ripple").remove();
    }
    if (window.location.hostname == "www.github.com") {
        $("summary.btn-link").addClass("Keys-Show-While-Active");
    }
    if (window.location.hostname.includes("craigslist.org")) {
        $("sup.c").remove();
    }
    if (window.location.hostname.includes("www.ebay")) {
        $("a.hl-popular-destinations-link noscript").remove();
    }
    if (window.location.hostname == "www.apple.com") {
        $("ul.ac-gn-list a").not("#ac-gn-link-search").addClass("Keys-Should-Generate-Floating-Text");
    }
    if (window.location.hostname.includes("yahoo")) {
        $("#header-search-input").attr("aria-label", "search");
    }
}

//stop focus stealing on bing
if (window.location.hostname == "www.bing.com") {
    $("html").on("keydown", function(focusStealingEvent){
        if (focusStealingEvent.target.nodeName != "INPUT" || keysWasActive || keysCurrentlyActive) {
            $("#sb_form_q").one("focus", function(){
                $("#sb_form_q").blur()
                $("#Keys-Input-Box").focus();
            })
        }
    })
}

document.addEventListener('focusin', function() {
  console.log('focused: ', document.activeElement)
}, true);

if (window.location.hostname.includes("yahoo")) {
    $("html").on("keydown", function(focusStealingEvent) {
        console.log(focusStealingEvent.target.nodeName)
        if (focusStealingEvent.target.nodeName != "INPUT" || keysWasActive || keysCurrentlyActive) {
            $("#header-search-input").one("focus", function(){
                $("#header-search-input").blur()
                $("#Keys-Input-Box").focus();
            })
            $("#uh-search-box").on("focus", function(){
                console.log("yolo")
                $("#uh-search-box").blur()
                $("#Keys-Input-Box").focus();
            })
        }
    })
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

const mouseClickEvents = ['mousedown', 'click', 'mouseup', 'focus'];

function simulateMouseClick(element){
    resetAllInputValues();
    var closest = $(element).closest("a, button, [role='button'], [role='link'], [role='tab'], [role='option'], [role='menuitem'], input")[0];
    mouseClickEvents.forEach(mouseEventType =>
        element.dispatchEvent(
          new MouseEvent(mouseEventType, {
              view: window,
              bubbles: true,
              cancelable: true,
              buttons: 1
          })
        )
    );
    $("html").one('keyup', function(){
        upSinceDeactivation=true;
    })
}

function recolorMatchingKeys(element, label, key, shouldSimulateClick) {
    label.find(".Keys-Matching-Character").removeClass("Keys-Matching-Character");
    label.find(".Keys-Mismatched-Character").removeClass("Keys-Mismatched-Character");
    if (key == searchText.toLowerCase()) {
        label.find(".Keys-Character").slice(0, searchText.length).addClass("Keys-Matching-Character")
        if (shouldSimulateClick == true) {
            simulateMouseClick(element)
            deactivate();
        }
    }
    else if (key.startsWith(searchText.toLowerCase())) {
        label.find(".Keys-Character").slice(0, searchText.length).addClass("Keys-Matching-Character")
    }
    else {
        label.find(".Keys-Character").addClass("Keys-Mismatched-Character")
    }
}

$("html").on("keyup", function(){
    keysWasActive = keysCurrentlyActive;
})

safari.self.addEventListener("message", handleMessage);

function handleMessage(event) {
    if (event.name == "keyIsCurrently" && event.message.currentKey != "Default key couldn't be read") {
        preferredActivationKey = event.message.currentKey;
    }
}

function resetAllInputValues() {
    document.querySelectorAll("input[original_value]").forEach(
    input => {
        $(input).val(String($(input).attr("original_value")));
        $(input).removeAttr("original_value");
        }
    )
}
