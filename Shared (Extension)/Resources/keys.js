console.log('KEYS IS RUNNING');

// MARK: - Detect Environment
let isTestEnvironment = false;
if (typeof browser === 'undefined') {
  console.log('🚧 Running unit tests 🚧');

  isTestEnvironment = true;
  if (typeof module !== 'undefined') {
    module.exports = { sum, product };
  }
}

// MARK: - Constants
const ElementTypes = {
  stringlike: 'stringlike',
  imagelike: 'imagelike',
  fieldlike: 'fieldlike',
};
const homeRow = ['f', 'd', 'j', 'k', 's', 'l', 'm', 'n', 'c', 'v', 'e', 'r', 't', 'u', 'i', 'o', 'a'];
const viewPortPadding = 200;

// MARK: - Global Variables
keysIsCurrentlyActive = false;
model = [/* {key: HO, element: <a>...</a>, type: , responsibleNode: } */];
scrollPositionWhenActivated = 0;

// MARK: - Preferences
let modifierEnabled = false;
let blacklist = [];
let shouldStealFocus = true;
let preferredActivationKey = 'G';
let originalEventUsedMetaKey;

// MARK: - Refresh Preferences
if (!isTestEnvironment) {
  browser.runtime.sendMessage({ message: 'refreshPreferences' }).then(handleResponse, handleError);
}

function handleResponse(message) {
  shouldStealFocus = message.updatedPreferences.shouldStealFocus;
  modifierEnabled = message.updatedPreferences.enableModifier;
  preferredActivationKey = message.updatedPreferences.currentKey;
  blacklist = message.updatedPreferences.blacklist;

  if (shouldStealFocus) { $(':focus').blur(); }
}

function handleError(error) {
  console.log(`Error: ${error}`);
}

// a couple different ways to time focus stealing.
$(document).ready(() => {
  if (shouldStealFocus) {
    $(':focus').blur();
  }
});

window.addEventListener('load', (event) => {
  if (shouldStealFocus) {
    $(':focus').blur();
  }
});

// MARK: - Main App

$('html').on('keydown', async (e) => {
  if (
    !keysIsCurrentlyActive
        && !eventOccurredInEditableField(e)
        && !eventCoincidesWithUnexpectedModifierKey(e)
        && !currentSiteIsBlacklisted()
        && e.key.toUpperCase() == preferredActivationKey
  ) {
    keysIsCurrentlyActive = true;
    scrollPositionWhenActivated = $(this).scrollTop();
    e.preventDefault();
    originalEventUsedMetaKey = e.metaKey;
    // priorSiteSpecificModifications()

    // MARK: - Gather clickables.
    targets = [...document.querySelectorAll("a, button, input, [role='link'], [role='button'], [role='tab'], [role='menuitem'], [role='option'], .Keys-Should-Generate-Floating-Text, input, textarea, label")];
    visibility = await Promise.all(targets.map((t) => isVisible(t)));
    targets = targets.filter((t, i) => visibility[i]);

    stringLikeTargets = targets.filter((t) => isTextLike(t));

    imageLikeTargets = targets.filter((t) => t.querySelector('img, svg, i') || t.classList.contains('Keys-Should-Generate-Floating-Text') || (t.nodeName == 'INPUT' && t.type != 'text' && t.type != 'search') || containsOrIsImage(t));
    fieldLikeTargets = targets.filter((t) => t.nodeName == 'TEXTAREA' || (t.nodeName == 'INPUT' && (t.type == 'text' || t.type == 'search')));

    minLengthRequired = Math.ceil(Math.log(stringLikeTargets.length + imageLikeTargets.length) / Math.log(homeRow.length));
    combos = getCombinations(minLengthRequired);

    // MARK: - Populate 'model'
    stringLikeTargets.forEach((target) => {
      responsibleNode = elementResponsible(target);
      // If a responsible node cannot be found, we need to treat this like an image.
      if (!responsibleNode) {
        if (!imageLikeTargets.includes(target)) {
          imageLikeTargets.push(target);
        }
        return;
      }
      keyString = assignTextKey(responsibleNode, minLengthRequired);
      // If no key can be assigned, we need to treat the text like an image.
      if (!keyString) {
        if (!imageLikeTargets.includes(target)) {
          imageLikeTargets.push(target);
        }
        return;
      }
      modelMember = {
        key: keyString, element: target, type: ElementTypes.stringlike, responsibleNode,
      };
      model.push(modelMember);
    });
    imageLikeTargets.filter((t) => !elementIsHiddenViaStyles(t)).forEach((target) => {
      keyString = combos.find(isAbsent); // TODO: Optimize
      modelMember = {
        key: keyString, element: target, type: ElementTypes.imagelike, responsibleNode: target.querySelector('img, svg, i, .Keys-isEssentiallyAnImage') || target,
      };
      model.push(modelMember);
    });
    fieldLikeTargets.forEach((target) => {
      keyString = tryPrefixes(target.placeholder, minLengthRequired) || combos.find(isAbsent);
      modelMember = { key: keyString, element: target, type: ElementTypes.fieldlike };
      model.push(modelMember);
    });
    // MARK: - Initialize blurbs

    model.forEach((m) => {
      if (m.type == ElementTypes.stringlike) {
        const splitkey = m.key.split('').map((character) => `<span class='Keys-Character'>${character}</span>`).join('');
        $(m.responsibleNode).before(m.responsibleNode.outerHTML);
        $(m.responsibleNode.previousSibling).html($(m.responsibleNode).text().replace(new RegExp(`(${m.key})`), splitkey));
        $(m.responsibleNode.previousSibling).addClass('faux');
        m.faux = m.responsibleNode.previousSibling;
        $(m.responsibleNode).addClass('Keys-Hidden-Originals');
      } else if (m.type == ElementTypes.imagelike) {
        const label = createFloatingText(m.element, m.key);
        tether(label, m.responsibleNode);
        m.faux = label;
      } else if (m.type == ElementTypes.fieldlike) {
        // store original values
        m.original_placeholder = m.element.placeholder || '';
        m.original_value = m.element.value || '';

        // show key
        m.element.placeholder = m.key;
        m.element.value = '';
      }
    });

    // MARK: - Recolor and Click
    generateInputBox();
    input = document.querySelector('#Keys-Input-Box');
    input.focus();
    input.addEventListener('input', reactToSubsequentKeypresses);

    input.addEventListener('keyup', deactivateIfBackspaceAndInputIsEmpty);

    postSiteSpecificModifications();

    Tether.position();
  }
});

reactToSubsequentKeypresses = (e) => {
  e.target.value = input.value.replace(/\W/g, '');
  query = e.target.value.toLowerCase();

  $('.Keys-Matching-Character').removeClass('Keys-Matching-Character');
  $('.Keys-Mismatched-Character').removeClass('Keys-Mismatched-Character');

  model.forEach((m) => {
    if (m.type == ElementTypes.stringlike || m.type == ElementTypes.imagelike) {
      label = m.faux;
      if (m.key.toLowerCase() == query) {
        click(m.element, originalEventUsedMetaKey);
        deactivate();
      } else if (m.key.toLowerCase().startsWith(query)) {
        $(label).find('.Keys-Character').slice(0, query.length).addClass('Keys-Matching-Character');
      } else {
        $(label).find('.Keys-Character').addClass('Keys-Mismatched-Character');
      }
    } else if (m.type == ElementTypes.fieldlike) {
      if (m.key.toLowerCase() == query) {
        m.element.focus();
        deactivate();
      }
    }
  });
};

// MARK: - Deactivation

deactivate = () => {
  model.forEach((m) => {
    $(m.faux).remove();
    $(m.responsibleNode).removeClass('Keys-Hidden-Originals');

    if (m.type == 'fieldlike') {
      m.element.placeholder = m.original_placeholder;
      m.element.value = m.original_value;
    }
  });

  model = [];
  keysIsCurrentlyActive = false;

  // remove blur & darkening effect from images
  $('.Keys-Small-Clickable-Image').removeClass('Keys-Small-Clickable-Image');
  $('.Keys-Medium-Clickable-Image').removeClass('Keys-Medium-Clickable-Image');
  $('.Keys-Large-Clickable-Image').removeClass('Keys-Large-Clickable-Image');

  // reset input box
  $('#Keys-Input-Box').blur();
  $('#Keys-Input-Box').remove();
};

$(window).on('scroll', () => {
  currentScrollPosition = $(this).scrollTop();
  scrollAmountSinceActivation = Math.abs(currentScrollPosition - scrollPositionWhenActivated);

  if (scrollAmountSinceActivation >= viewPortPadding) {
    deactivate();
  }
});

$(window).on('mousedown', () => {
  deactivate();
});

$(window).on('keypress', (e) => {
  if (e.key == 'Escape') {
    deactivate();
  } else if (e.key == 'Backspace' && document.querySelector('#Keys-Input-Box').value == '') {
    deactivate();
  }
});

deactivateIfBackspaceAndInputIsEmpty = (e) => {
  if (e.key == 'Backspace' && e.target.value == '') {
    deactivate();
  }
};

// MARK: - Helpers

isVisible = (element) => {
  promise = new Promise((resolve, reject) => {
    io = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    }, { rootMargin: `${viewPortPadding}px` });

    io.observe(element);
  });
  return promise;
};

eventOccurredInEditableField = (e) => {
  const { nodeName } = e.target;
  return e.target.isContentEditable || nodeName == 'INPUT' || nodeName == 'TEXTAREA';
};

eventCoincidesWithUnexpectedModifierKey = (e) => e.ctrlKey || e.altKey || e.altGraphKey || (e.metaKey && !modifierEnabled);

currentSiteIsBlacklisted = () => {
  currentHost = window.location.hostname;
  return blacklist.some((blacklistedSiteString) => currentHost.includes(blacklistedSiteString));
};

const immediateText = (a) => a.contents().not(a.children()).text().trim();

assignTextKey = (e, minLengthRequired) => {
  text = $(e).text().trim();

  for (a of model) {
    if (a.element.href == e.href && $(a.element).text().trim() == $(e).text().trim()) {
      return a.key;
    }
  }

  if (tryPrefixes(text, minLengthRequired)) {
    return tryPrefixes(text, minLengthRequired);
  }
};

tryPrefixes = (innerText, width) => {
  // TODO: I'm feeling lucky bug.
  const words = innerText.split(/[^A-Za-z0-9]/).filter((word) => (word != ''));
  const first_words = words.slice(0, 3);
  const prefixes = first_words.map((word) => word.substring(0, width)).filter((p) => p.length == width);
  for (prefix of prefixes) {
    if (isAbsent(prefix)) {
      return prefix;
    }
  }
  return getContiguousUniqueSubsequence(words, width);
};

getContiguousUniqueSubsequence = (words, width) => {
  for (const innerText of words) {
    for (let position = 0; position <= innerText.length - width; position++) {
      if (isAbsent(innerText.substring(position, position + width))) {
        found = innerText.substring(position, position + width);
        return found;
      }
      continue;
    }
  }
};

isAbsent = (string) => {
  const existingKeys = model.map((e) => e.key?.toLowerCase());
  return !existingKeys.includes(string.toLowerCase());
};

generateInputBox = () => {
  $(':focus').blur();
  if (!document.getElementById('Keys-Input-Box')) {
    inputelement = document.createElement('input');
    inputelement.setAttribute('id', 'Keys-Input-Box');
    inputelement.setAttribute('type', 'text');
    inputelement.setAttribute('autocomplete', 'off');
    inputelement.setAttribute('style', 'ime-mode:disabled');
    document.body.appendChild(inputelement);
    // inputelement.focus()
  }
  // $("#Keys-Input-Box").focus()
};

elementResponsible = (e) => {
  if (e.nodeName == 'I') {
    return null;
  }

  if (immediateText($(e)) && !textIsHiddenViaStyles(e)) {
    if ($(e).contents().length == 1) {
      return e;
    }
    return nodeWrap(e);
  }

  // recursive case
  for (const child of e.children) {
    found = elementResponsible(child);
    if (found) {
      return found;
    }
  }

  return null;
};

elementIsHiddenViaStyles = (e) => {
  styles = window.getComputedStyle(e);

  opacity = styles.opacity;
  visibility = styles.visibility;
  width = parseInt(styles.width);
  height = parseInt(styles.height);

  return opacity == '0' || visibility == 'hidden' || height == 0 || width == 0;
};

textIsHiddenViaStyles = (e) => {
  styles = window.getComputedStyle(e);

  opacityFromColor = styles.color.replace(/^rgba.*,(.+)\)/, '$1').trim();

  return opacityFromColor == '0' || elementIsHiddenViaStyles(e);
};

nodeWrap = (anchor) => {
  let textNodes = $(anchor).contents().filter(function () {
    return (this.nodeType === 3 && this.textContent.trim()/* .match(/[a-zA-Z0-9-_ ]/) */);
  });

  textNodes = textNodes.sort((a, b) => b.textContent.trim().length - a.textContent.trim().length);

  longestNode = textNodes[0];

  $(longestNode).wrap("<span class = 'clickableTextWrapped'>");
  wrapped = longestNode.parentElement;
  return wrapped;
};

// modifications that will occur after keys adds elements to the page.
postSiteSpecificModifications = () => {
  if (window.location.hostname == 'www.youtube.com') {
    $('.faux').removeAttr('is-empty');
  }
};

getCombinations = (length, curr = ['']) => {
  // base case
  if (length == 0) {
    return curr;
  }

  // set up
  newCurr = curr.flatMap((combo) => homeRow.flatMap((letter) => combo + letter));

  // iterate
  return getCombinations(length - 1, newCurr);
};

// TODO: Revisit this and rewrite
createFloatingText = (el, key) => {
  const wrapper = document.createElement('span');
  wrapper.setAttribute('class', 'Keys-Floating-Key');

  key.split('').forEach((character) => {
    const a = document.createElement('span');
    $(a).addClass('Keys-Character');
    const b = document.createTextNode(character);
    a.appendChild(b);
    wrapper.appendChild(a);
  });

  img = el.querySelector('img, svg, i, .Keys-isEssentiallyAnImage') || el; // When text is treaded like images, there will be no img, svg, or i, so just use el.

  if (img.getBoundingClientRect().width < 30 || img.getBoundingClientRect().height < 30) {
    img.classList.add('Keys-Small-Clickable-Image');
    wrapper.classList.add('Keys-Small-Image-Key');
  } else if (img.getBoundingClientRect().width < 150) {
    img.classList.add('Keys-Medium-Clickable-Image');
    wrapper.classList.add('Keys-Medium-Image-Key');
  } else {
    img.classList.add('Keys-Large-Clickable-Image');
    wrapper.classList.add('Keys-Large-Image-Key');
  }

  document.body.appendChild(wrapper);
  return wrapper;
};

tether = (label, element) => {
  new Tether({
    element: label, target: element, attachment: 'middle center', targetAttachment: 'middle center',
  });
};

click = (element, shouldOpenInBackgroundTab) => {
  url = $(element).closest('[href]').prop('href');
  if (shouldOpenInBackgroundTab && url) {
    browser.runtime.sendMessage({ message: 'metaOpen', options: { url } });
  } else {
    element.click();
  }
};

containsOrIsImage = (element) => {
  wasFound = false;

  if (elementHasBackgroundImage(element)) {
    $(element).addClass('Keys-isEssentiallyAnImage');
    return true;
  }

  $(element).find('*').each((i, el) => {
    if (elementHasBackgroundImage(el)) {
      $(el).addClass('Keys-isEssentiallyAnImage');
      wasFound = true;
      return false; // return false to stop loop. See jQuery docs.
    }
  });

  return wasFound;
};

elementHasBackgroundImage = (el) => window.getComputedStyle(el).getPropertyValue('background-image') !== 'none';

isTextLike = (t) => {
  // text areas have text nodes in them but they should be treated like inputs.
  const isNotATextArea = t.nodeName != 'TEXTAREA';
  const hasText = $(t).text();
  const hasSubstantiveText = $(t).text().trim() != '';

  return hasText && hasSubstantiveText && isNotATextArea;
};

function sum(a, b) {
  return a + b;
}

function product(a, b) {
  return a * b;
}
