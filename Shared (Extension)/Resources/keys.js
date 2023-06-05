/* eslint-disable no-param-reassign, no-restricted-syntax, no-continue, consistent-return */
console.log('KEYS IS RUNNING');

// MARK: - Detect Environment
let isTestEnvironment = false;
if (typeof browser === 'undefined') {
  console.log('🚧 Running unit tests 🚧');
  isTestEnvironment = true;
}

// MARK: - Constants

/**
 * Types of elements which can be handled by Keys
 * @readonly
 * @enum {string}
 */
const ElementTypes = {
  stringlike: 'stringlike',
  imagelike: 'imagelike',
  fieldlike: 'fieldlike',
};

/**
 * An array of easily-accessible keys.
 *
 * Order matters for this list & more easily accessibly keys should come first. Only these
 * keys will be used to generate random floating blurbs.
 * @type {string[]}
 */
const homeRow = ['f', 'd', 'j', 'k', 's', 'l', 'm', 'n', 'c', 'v', 'e', 'r', 't', 'u', 'i', 'o', 'a'];
const viewPortPadding = 200;

// MARK: - Global Variables
let keysIsCurrentlyActive = false;

/**
 * @typedef ModelObject
 * @type {object}
 * @property {string} key - the key assigned to this object, which when typed, clicks element.
 * @property {HTMLElement} element - the element which clicked when the key is typed.
 * @property {ElementTypes} type - the identified type of the element.
 * @property {?Element} responsibleNode - the first element identified which is directly
 * responsible for the some rendered content in the element.
 * @property {?HTMLElement} faux - To avoid editing elements directly, Keys duplicates elements,
 * hides the originals, and only edits the duplicate. faux stores a reference to this duplicate.
 * @property {?string} original_placeholder - Since Keys edits the placeholder of text fields to
 * render keys, we need to store a reference to what the placeholder was before we changed it.
 * @property {?string} original_value - Since Keys uses a placeholder to show blurbs, the field
 * value must be emptied for the placeholder to show. This property stores a reference to that
 * value, so that it can be restored on deactivation.
 */

/**
 * @type {ModelObject[]}
 */
const model = [];
let scrollPositionWhenActivated = 0;
/**
 * @type {HTMLInputElement}
 */
let input;

// MARK: - Preferences
let modifierEnabled = false;
let blacklist = [];
let shouldStealFocus = true;

/**
 * The uppercase character which is pressed to use Keys.
 * @type {string}
 */
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

window.addEventListener('load', () => {
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
        && e.key.toUpperCase() === preferredActivationKey
  ) {
    keysIsCurrentlyActive = true;
    scrollPositionWhenActivated = document.documentElement.scrollTop;
    e.preventDefault();
    originalEventUsedMetaKey = e.metaKey;
    // priorSiteSpecificModifications()

    // MARK: - Gather clickables.
    let targets = [...document.querySelectorAll("a, button, input, [role='link'], [role='button'], [role='tab'], [role='menuitem'], [role='option'], .Keys-Should-Generate-Floating-Text, input, textarea, label")];
    const visibility = await Promise.all(targets.map((t) => isVisible(t)));
    targets = targets.filter((t, i) => visibility[i]);

    const stringLikeTargets = targets.filter((t) => isTextLike(t));
    const imageLikeTargets = targets.filter((t) => t.querySelector('img, svg, i') || t.classList.contains('Keys-Should-Generate-Floating-Text') || (t.nodeName === 'INPUT' && t.type !== 'text' && t.type !== 'search') || containsOrIsImage(t));
    const fieldLikeTargets = targets.filter((t) => t.nodeName === 'TEXTAREA' || (t.nodeName === 'INPUT' && (t.type === 'text' || t.type === 'search')));

    // eslint-disable-next-line max-len
    const allTargetsLength = [...stringLikeTargets, ...imageLikeTargets, ...fieldLikeTargets].length;
    const minLengthRequired = Math.ceil(Math.log(allTargetsLength) / Math.log(homeRow.length));
    const combos = getCombinations(minLengthRequired);

    // MARK: - Populate 'model'
    stringLikeTargets.forEach((target) => {
      const responsibleNode = elementResponsible(target);
      // If a responsible node cannot be found, we need to treat this like an image.
      if (!responsibleNode) {
        if (!imageLikeTargets.includes(target)) {
          imageLikeTargets.push(target);
        }
        return;
      }
      const keyString = assignTextKey(responsibleNode, minLengthRequired);
      // If no key can be assigned, we need to treat the text like an image.
      if (!keyString) {
        if (!imageLikeTargets.includes(target)) {
          imageLikeTargets.push(target);
        }
        return;
      }
      /** @type {ModelObject} */
      const modelMember = {
        key: keyString, element: target, type: ElementTypes.stringlike, responsibleNode,
      };
      model.push(modelMember);
    });
    imageLikeTargets.filter((t) => !elementIsHiddenViaStyles(t)).forEach((target) => {
      const keyString = combos.find((c) => isAbsent(c)); // TODO: Optimize
      /** @type {ModelObject} */
      const modelMember = {
        key: keyString, element: target, type: ElementTypes.imagelike, responsibleNode: target.querySelector('img, svg, i, .Keys-isEssentiallyAnImage') || target,
      };
      model.push(modelMember);
    });
    fieldLikeTargets.forEach((target) => {
      const keyString = tryPrefixes(target.placeholder, minLengthRequired)
       || combos.find((c) => isAbsent(c));
      /** @type {ModelObject} */
      const modelMember = { key: keyString, element: target, type: ElementTypes.fieldlike };
      model.push(modelMember);
    });
    // MARK: - Initialize blurbs

    model.forEach((m) => {
      if (m.type === ElementTypes.stringlike) {
        const splitkey = m.key.split('').map((character) => `<span class='Keys-Character'>${character}</span>`).join('');
        $(m.responsibleNode).before(m.responsibleNode.outerHTML);
        $(m.responsibleNode.previousSibling).html($(m.responsibleNode).text().replace(new RegExp(`(${m.key})`), splitkey));
        $(m.responsibleNode.previousSibling).addClass('faux');
        m.faux = m.responsibleNode.previousSibling;
        $(m.responsibleNode).addClass('Keys-Hidden-Originals');
      } else if (m.type === ElementTypes.imagelike) {
        const label = createFloatingText(m.element, m.key);
        tether(label, m.responsibleNode);
        m.faux = label;
      } else if (m.type === ElementTypes.fieldlike) {
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
    input.focus();
    input.addEventListener('input', reactToSubsequentKeypresses);

    input.addEventListener('keyup', deactivateIfBackspaceAndInputIsEmpty);

    postSiteSpecificModifications();

    // eslint-disable-next-line no-undef
    Tether.position();
  }
});

const reactToSubsequentKeypresses = (e) => {
  e.target.value = input.value.replace(/\W/g, '');
  const query = e.target.value.toLowerCase();

  $('.Keys-Matching-Character').removeClass('Keys-Matching-Character');
  $('.Keys-Mismatched-Character').removeClass('Keys-Mismatched-Character');

  model.forEach((m) => {
    if (m.type === ElementTypes.stringlike || m.type === ElementTypes.imagelike) {
      const label = m.faux;
      if (m.key.toLowerCase() === query) {
        click(m.element, originalEventUsedMetaKey);
        deactivate();
      } else if (m.key.toLowerCase().startsWith(query)) {
        $(label).find('.Keys-Character').slice(0, query.length).addClass('Keys-Matching-Character');
      } else {
        $(label).find('.Keys-Character').addClass('Keys-Mismatched-Character');
      }
    } else if (m.type === ElementTypes.fieldlike) {
      if (m.key.toLowerCase() === query) {
        m.element.focus();
        deactivate();
      }
    }
  });
};

// MARK: - Deactivation

const deactivate = () => {
  model.forEach((m) => {
    $(m.faux).remove();
    $(m.responsibleNode).removeClass('Keys-Hidden-Originals');

    if (m.type === 'fieldlike') {
      m.element.placeholder = m.original_placeholder;
      m.element.value = m.original_value;
    }
  });

  model.length = 0;
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
  const currentScrollPosition = document.documentElement.scrollTop;
  const scrollAmountSinceActivation = Math.abs(currentScrollPosition - scrollPositionWhenActivated);

  if (scrollAmountSinceActivation >= viewPortPadding) {
    deactivate();
  }
});

$(window).on('mousedown', () => {
  deactivate();
});

$(window).on('keypress', (e) => {
  if (e.key === 'Escape') {
    deactivate();
  } else if (e.key === 'Backspace' && document.querySelector('#Keys-Input-Box').value === '') {
    deactivate();
  }
});

/**
 * @param {KeyboardEvent} e
 */
const deactivateIfBackspaceAndInputIsEmpty = (e) => {
  if (e.key === 'Backspace' && e.target.value === '') {
    deactivate();
  }
};

// MARK: - Helpers

/**
 * Uses intersection observers to determine whether an elements position is intersecting
 * the current viewport.
 *
 * Note that the element may be hidden via other means, and this function would still return true.
 * @see {@link elementIsHiddenViaStyles}
 * @see {@link textIsHiddenViaStyles}
 *
 * @param {Element} element
 * @returns {Promise<boolean>}
 */
const isVisible = (element) => {
  const promise = new Promise((resolve) => {
    const io = new IntersectionObserver((entries) => {
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

/**
 * Uses a heuristic to determine whether the keypress corresponded to the user typing in some
 * field (and should hence be ignored) or whether it is likely to have corresponded to an
 * intentional activation of Keys.
 * @param {JQuery.KeyDownEvent} e
 * @returns {boolean}
 */
const eventOccurredInEditableField = (e) => {
  const { nodeName } = e.target;
  return e.target.isContentEditable || nodeName === 'INPUT' || nodeName === 'TEXTAREA';
};

/**
 * Determines whether an undexpected modifier key coincided with the event. This was added since
 * if the user types Ctrl+G or Alt+G, they're likely not trying to use Keys since we don't support
 * those modifier Keys. Moreover, even for the "metaKey" a.k.a. the command key, we have the option
 * for customers to disable it's use via the containing app. If a customer hasn't enabled the option
 * then her typing Cmd+G is also likely not an intentional activation of Keys.
 * @param {JQuery.KeyDownEvent} e
 * @returns {boolean}
 */
const eventCoincidesWithUnexpectedModifierKey = (e) => {
  const doesCoincide = e.ctrlKey || e.altKey || e.altGraphKey || (e.metaKey && !modifierEnabled);
  return doesCoincide;
};

const currentSiteIsBlacklisted = () => {
  const currentHost = window.location.hostname;
  return blacklist.some((blacklistedSiteString) => currentHost.includes(blacklistedSiteString));
};

/**
 * Gets the text content immediately contained by an element.
 *
 * @example
 * // returns Hello Wod
 * e = $.parseHTML("Hello, Wo<b>rl</b>d"); immediateText($(e));
 * @param {JQuery} a
 * @returns {string}
 */
const immediateText = (a) => a.contents().not(a.children()).text().trim();

const assignTextKey = (e, minLengthRequired) => {
  const text = $(e).text().trim();

  for (const a of model) {
    if (a.element.href === e.href && $(a.element).text().trim() === $(e).text().trim()) {
      return a.key;
    }
  }

  if (tryPrefixes(text, minLengthRequired)) {
    return tryPrefixes(text, minLengthRequired);
  }
};

const tryPrefixes = (innerText, width, m = model) => {
  const words = innerText.split(/[^A-Za-z0-9]/).filter((word) => (word !== ''));
  const firstWords = words.slice(0, 3);
  const prefixes = firstWords
    .map((word) => word.substring(0, width))
    .filter((p) => p.length === width);
  for (const prefix of prefixes) {
    if (isAbsent(prefix, m)) {
      return prefix;
    }
  }
  return getContiguousUniqueSubsequence(words, width, m);
};

const getContiguousUniqueSubsequence = (words, width, m = model) => {
  for (const innerText of words) {
    for (let position = 0; position <= innerText.length - width; position += 1) {
      if (isAbsent(innerText.substring(position, position + width), m)) {
        const found = innerText.substring(position, position + width);
        return found;
      }
      continue;
    }
  }
};

/**
 * Determines whether a particular key exists in `m`.
 * @param {string} string
 * @param {ModelObject[]} m
 * @returns {boolean}
 */
const isAbsent = (string, m = model) => {
  if (typeof string !== 'string') {
    throw new TypeError();
  }

  if (typeof m === 'number') {
    throw new TypeError('Did you write something like `.find(isAbsent)`?');
  }

  if (typeof m !== 'object' || !Array.isArray(m)) {
    throw new TypeError();
  }

  const existingKeys = m.map((e) => e.key?.toLowerCase());
  return !existingKeys.includes(string.toLowerCase());
};

/**
 * creates the (invisible) input box which users type in to activate a key.
 */
const generateInputBox = () => {
  $(':focus').blur();
  if (!document.getElementById('Keys-Input-Box')) {
    const inputelement = document.createElement('input');
    inputelement.setAttribute('id', 'Keys-Input-Box');
    inputelement.setAttribute('type', 'text');
    inputelement.setAttribute('autocomplete', 'off');
    inputelement.setAttribute('style', 'ime-mode:disabled');
    document.body.appendChild(inputelement);
    input = inputelement;
  }
};

const elementResponsible = (e) => {
  if (e.nodeName === 'I') {
    return null;
  }

  if (immediateText($(e)) && !textIsHiddenViaStyles(e)) {
    if ($(e).contents().length === 1) {
      return e;
    }
    return nodeWrap(e);
  }

  // recursive case
  for (const child of e.children) {
    const found = elementResponsible(child);
    if (found) {
      return found;
    }
  }

  return null;
};

const elementIsHiddenViaStyles = (e) => {
  const styles = window.getComputedStyle(e);

  const { opacity } = styles;
  const { visibility } = styles;
  const width = parseInt(styles.width, 10);
  const height = parseInt(styles.height, 10);

  return opacity === '0' || visibility === 'hidden' || height === 0 || width === 0;
};

const textIsHiddenViaStyles = (e) => {
  const styles = window.getComputedStyle(e);
  const opacityFromColor = styles.color.replace(/^rgba.*,(.+)\)/, '$1').trim();

  return opacityFromColor === '0' || elementIsHiddenViaStyles(e);
};

/**
 * takes in an element and wraps whichever text node it has with the most text.
 * @param {HTMLElement} anchor - the parent element
 * @returns {HTMLElement} - the text node which was wrapped
 */
const nodeWrap = (anchor) => {
  /** @type {Text[]} */
  let textNodes = $(anchor)
    .contents()
    .filter(function () {
      return (this.nodeType === 3
            && this.textContent != null
            && this.textContent.trim() !== '');
    })
    .toArray();

  textNodes = textNodes
    .sort((a, b) => b.textContent.trim().length - a.textContent.trim().length);

  const longestNode = textNodes[0];

  $(longestNode).wrap("<span class = 'clickableTextWrapped'>");
  const wrapped = longestNode.parentElement;
  return wrapped;
};

// TODO: refactor this to use a dictionary.
const postSiteSpecificModifications = () => {
  if (window.location.hostname === 'www.youtube.com') {
    $('.faux').removeAttr('is-empty');
  }
};

/**
 * A recursive function which generates all combinations of a particulat array of letters of a given
 * length.
 * @param {number} length - the length of each combination
 * @param {string[]} curr - a helper parameter used for recursion
 * @param {string[]} letters - the letters from which to create each combination.
 * @returns {string[]} - all `length`-size combinations of `letters`.
 */
const getCombinations = (length, curr = [''], letters = homeRow) => {
  if (length === 0) {
    return curr;
  }
  const newCurr = curr.flatMap((combo) => letters.flatMap((letter) => combo + letter));
  return getCombinations(length - 1, newCurr, letters);
};

// TODO: refactor `createFloatingText` so it accepts just the size as a parameter & create
// helper function to determine element size.
/**
 * creates the html for the floating blurb which, when typed, clicks an element.
 * @param {HTMLElement} el - the element this floating text corresponds to; passing this in lets us
 * size the floating blurb appropiately.
 * @param {string} key - the blurb which this floating text displays
 * @returns
 */
const createFloatingText = (el, key) => {
  const wrapper = document.createElement('span');
  wrapper.setAttribute('class', 'Keys-Floating-Key');

  key.split('').forEach((character) => {
    const a = document.createElement('span');
    $(a).addClass('Keys-Character');
    const b = document.createTextNode(character);
    a.appendChild(b);
    wrapper.appendChild(a);
  });

  // When text is treaded like images, there will be no img, svg, or i, so just use el.
  const img = el.querySelector('img, svg, i, .Keys-isEssentiallyAnImage') || el;

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

/**
 * Use the Tether library to pin a label to an element.
 * @param {HTMLElement} label
 * @param {HTMLElement} element
 * @see {@link https://github.com/shipshapecode/tether}
 */
const tether = (label, element) => {
  // eslint-disable-next-line no-new, no-undef
  new Tether({
    element: label, target: element, attachment: 'middle center', targetAttachment: 'middle center',
  });
};

/**
 * Either simulates a click of the element via vanilla JS or uses the background script
 * to open the element's associated url page in a background tab. This mimics the behavior
 * users get when they "command click an element".
 * @param {HTMLElement} element
 * @param {boolean} shouldOpenInBackgroundTab
 * @see {@link https://github.com/Appccessibility-Shox/Keys/issues/8}
 */
const click = (element, shouldOpenInBackgroundTab) => {
  const url = $(element).closest('[href]').prop('href');
  if (shouldOpenInBackgroundTab && url) {
    browser.runtime.sendMessage({ message: 'metaOpen', options: { url } });
  } else {
    element.click();
  }
};

/**
 * inspects the css of an element to see if it is an image or contains an image.
 *
 * this function is necessary because not all images are <img> tags. Sometimes divs present as
 * images merely because they have a 'background-image: url('.../some-image.png')' set.
 * @param {HTMLElement} element
 * @returns {boolean}
 */
const containsOrIsImage = (element) => {
  let wasFound = false;

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

const elementHasBackgroundImage = (el) => window.getComputedStyle(el).getPropertyValue('background-image') !== 'none';

/**
 * Uses a heuristic to determine whether an element is "text-like".
 * A "text-like" element is one which should have an in-line key generated.
 * @param {HTMLElement} t
 * @returns {boolean}
 */
const isTextLike = (t) => {
  // text areas have text nodes in them but they should be treated like inputs.
  const isNotATextArea = t.nodeName !== 'TEXTAREA';
  const hasText = !!$(t).text();
  const hasSubstantiveText = $(t).text().trim() !== '';

  return hasText && hasSubstantiveText && isNotATextArea;
};

if (isTestEnvironment) {
  if (typeof module !== 'undefined') {
    // eslint-disable-next-line object-curly-newline
    module.exports = {
      getCombinations,
      homeRow,
      isAbsent,
      getContiguousUniqueSubsequence,
      tryPrefixes,
    };
  }
}
