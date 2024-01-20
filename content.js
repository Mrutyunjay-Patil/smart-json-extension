// Store the original JSON object globally to access it across different functions
let originalJsonObject = null;

// Immediately-Invoked Function Expression (IIFE) to encapsulate and run initial setup
(function () {
    // Check if the current document is of content type JSON
    if (document.contentType === "application/json") {
        // Access the document's body and its text content
        const body = document.body;
        const textContent = body.innerText;

        // Try to format the JSON and set up the page
        try {
            // Format the JSON text to HTML
            const formattedJSON = prettyFormatJSON(textContent);
            // Replace the body's content with the formatted JSON
            body.innerHTML = '<pre id="json-container">' + formattedJSON + '</pre>';
            // Add custom styles to the page
            addStyles();
            // Add control buttons like 'Expand All', 'Collapse All', etc.
            addControlButtons();
            // Attach event listeners to copy buttons
            attachCopyEventListeners();
            // Attach event listeners to toggle buttons for collapsing and expanding JSON nodes
            attachToggleEventListeners();
        } catch (e) {
            // If an error occurs, log it to the console (optional, could also ignore)
            console.error("Error formatting JSON: ", e);
        }
    }
})();

// Function to pretty format the JSON text
function prettyFormatJSON(json, isSubElement = false) {
    try {
        // Parse the JSON text to an object
        var obj = JSON.parse(json);
        // Store the original JSON object for later use
        originalJsonObject = obj;
        // Format the object to HTML
        var formatted = recursiveFormat(obj);
        // Return the formatted HTML, adding a class if it's a sub-element for styling
        return `<div class="${isSubElement ? 'collapsible-content' : ''}">${insertCopyButtons(formatted)}</div>`;
    } catch (e) {
        // If parsing fails, return an invalid JSON message
        return 'Invalid JSON: ' + e.message;
    }
}

// Recursive function to format each level of the JSON object
function recursiveFormat(obj, depth = 0) {
    // Base case: if the object is not actually an object or is null, return the stringified version
    if (typeof obj !== 'object' || obj === null) {
        return JSON.stringify(obj);
    }

    // Determine if the object is an array for proper formatting
    let isArray = Array.isArray(obj);
    // Initialize the results string with the opening bracket or brace
    let results = isArray ? '[' : '{';
    // Get the keys of the object for iteration
    let keys = Object.keys(obj);

    // If there are keys, format each key-value pair
    if (keys.length) {
        // SVG icons for the collapse/expand buttons
        const expandIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#FFD43B" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg>`;
        const collapseIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#FFD43B" d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"/></svg>`;

        // Choose the appropriate icon for the current depth level
        const collapseIcon = depth === 0 ? collapseIconSvg : expandIconSvg;
        // Append the toggle button and start a new collapsible content div
        results += `<span class="toggle-button">${collapseIcon}</span><div class="collapsible-content" ${depth === 0 ? '' : 'style="display: none;"'}>`;

        // Iterate over keys to build the formatted string for each key-value pair
        keys.forEach((key, index) => {
            let value = recursiveFormat(obj[key], depth + 1);
            results += `\n${' '.repeat(depth * 2)}${isArray ? '' : `"${key}": `}${value}${index < keys.length - 1 ? ',' : ''}`;
        });

        // Append closing tags for the collapsible content and the current object or array
        results += '\n' + ' '.repeat(depth * 2);
        results += '</div>';
    }

    // Append the closing bracket or brace for the object or array
    results += isArray ? ']' : '}';
    return results;
}

// Function to attach toggle event listeners to each toggle button
function attachToggleEventListeners() {
    // Select all toggle buttons and attach a click event listener to each
    document.querySelectorAll('.toggle-button').forEach(button => {
        button.addEventListener('click', function(event) {
            // Get the next element which is the collapsible content associated with the toggle button
            const content = this.nextElementSibling;
            // Determine if the content is currently expanded
            const isExpanded = content.style.display !== 'none';

            // If the Ctrl key is pressed during the click, toggle all nested levels
            if (event.ctrlKey) {
                if (isExpanded) {
                    // Collapse all nested levels
                    collapseAll(content);
                } else {
                    // Expand all nested levels
                    expandAllNested(content);
                    this.innerHTML = collapseIconSvg;
                }
            } else {
                // If Ctrl key is not pressed, simply toggle the current level
                content.style.display = isExpanded ? 'none' : 'block';
                // Update the button's icon accordingly
                this.innerHTML = isExpanded ? expandIconSvg : collapseIconSvg;
            }
        });
    });
}

// Function to add control buttons to the page
function addControlButtons() {
    // Create a new div for the control panel
    const controlPanel = document.createElement('div');
    controlPanel.id = 'control-panel';
    // Set the inner HTML of the control panel with buttons for different actions
    controlPanel.innerHTML = `
        <button id="expand-all">Expand All</button>
        <button id="collapse-all">Collapse All</button>
        <button id="copy-visible">Copy Visible</button>
        <button id="copy-all">Copy Full JSON</button>
        <button id="shortcuts-toggle" class="shortcuts-toggle">Shortcuts</button>
    `;
    // Insert the control panel at the beginning of the body
    document.body.insertBefore(controlPanel, document.body.firstChild);

    // Attach event listeners to each button for their respective functionality
    document.getElementById('expand-all').addEventListener('click', expandAll);
    document.getElementById('collapse-all').addEventListener('click', () => collapseAll(document.body));
    document.getElementById('copy-visible').addEventListener('click', copyVisible);
    document.getElementById('copy-all').addEventListener('click', copyAll);

    // Create and insert the shortcuts content
    const shortcutsContent = document.createElement('div');
    shortcutsContent.id = 'shortcuts-content';
    shortcutsContent.className = 'shortcuts-content';
    shortcutsContent.style.display = 'none'; // Start hidden
    shortcutsContent.innerHTML = `
        <ul>
            <li><kbd>Ctrl</kbd> + <kbd>-</kbd>: Collapse all nested JSON</li>
            <li><kbd>Ctrl</kbd> + <kbd>+</kbd>: Expand all nested JSON</li>
        </ul>
    `;
    controlPanel.appendChild(shortcutsContent); // Append as a child of controlPanel

    // Attach event listener for the toggle button
    document.getElementById('shortcuts-toggle').addEventListener('click', function() {
        const content = document.getElementById('shortcuts-content');
        const isVisible = content.style.display !== 'none';
        content.style.display = isVisible ? 'none' : 'block';
        this.classList.toggle('active', !isVisible);
    });
}

// Function to copy the currently visible JSON to the clipboard
function copyVisible() {
    const jsonContainer = document.getElementById('json-container');
    // Extract the visible JSON text from the container
    const visibleJSON = extractVisibleJSONText(jsonContainer);
    // Format the extracted JSON and copy it to the clipboard
    const formattedJSON = formatVisibleJSON(visibleJSON);
    copyToClipboard(formattedJSON);
}

// Function to extract the text from visible JSON nodes
function extractVisibleJSONText(element) {
    let text = '';
    // Skip elements that are not currently displayed (hidden)
    if (element.style.display === 'none') {
        return '';
    }
    // Include only the text from JSON keys and values
    if (element.classList.contains('json-key') || element.classList.contains('json-value')) {
        return element.textContent;
    }
    // Recursively extract text from child nodes
    Array.from(element.childNodes).forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
            text += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            text += extractVisibleJSONText(child);
        }
    });
    return text;
}

// Function to format the visible JSON text into a valid JSON string
function formatVisibleJSON(json) {
    try {
        // Attempt to parse the JSON text and then stringify it with indentation
        var obj = JSON.parse(json);
        return JSON.stringify(obj, null, 2);
    } catch (e) {
        // Return an error message if JSON parsing fails
        return 'Invalid JSON: ' + e.message;
    }
}

// Function to copy the entire formatted JSON to the clipboard
function copyAll() {
    // Retrieve the original JSON object and stringify it with indentation
    const jsonString = JSON.stringify(originalJsonObject, null, 2);
    copyToClipboard(jsonString);
}

// Function to expand all collapsible JSON nodes
function expandAll() {
    // Select all collapsible content elements and set their display to 'block'
    document.querySelectorAll('.collapsible-content').forEach(content => {
        content.style.display = 'block';
    });
    // Update all toggle buttons to show the collapse icon
    document.querySelectorAll('.toggle-button').forEach(button => {
        button.innerHTML = collapseIconSvg;
    });
}

// Function to collapse all collapsible JSON nodes starting from a given element
function collapseAll(startingElement) {
    // Select and hide all collapsible content elements within the starting element
    startingElement.querySelectorAll('.collapsible-content').forEach(content => {
        content.style.display = 'none';
    });
    // Update the corresponding toggle buttons to show the expand icon
    startingElement.querySelectorAll('.toggle-button').forEach(button => {
        if (button && button.classList.contains('toggle-button')) {
            button.innerHTML = expandIconSvg;
        }
    });
}

// Function to expand a specific element and all its nested collapsible children
function expandAllNested(element, button) {
    // Show the content of the element
    element.style.display = 'block';
    // Set the corresponding button to show the collapse icon
    if (button) {
        button.innerHTML = collapseIconSvg;
    }
    // Recursively expand all child elements
    let children = element.querySelectorAll('.collapsible-content');
    children.forEach(child => {
        expandAllNested(child, child.previousElementSibling);
    });
}

// SVG icons for the expand and collapse actions
const expandIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#FFD43B" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg>`;
const collapseIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#FFD43B" d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"/></svg>`;

// Function to insert copy buttons alongside each JSON key and value
function insertCopyButtons(formattedJSON) {
    // Define the SVG content for the copy icon
    const copyIconSvg = `<svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M384 336H192c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16l140.1 0L400 115.9V320c0 8.8-7.2 16-16 16zM192 384H384c35.3 0 64-28.7 64-64V115.9c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1H192c-35.3 0-64 28.7-64 64V320c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H256c35.3 0 64-28.7 64-64V416H272v32c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192c0-8.8 7.2-16 16-16H96V128H64z"/></svg>`;
    // Process each line of formatted JSON to add copy buttons
    return formattedJSON.split('\n').map(line => {
        const regex = /(".*?")(\s*:\s*)(".*?"|[\[\]{},]|\d+|true|false|null)/g;
        // Replace each key and value with HTML that includes a copy button
        return line.replace(regex, (match, key, separator, value) => {
            const keyButtonHTML = `<button class="copy-btn" data-text="${escapeHtml(key.replace(/"/g, ''))}">${copyIconSvg}</button>`;
            const valueButtonHTML = value.startsWith('"') ? `<button class="copy-btn" data-text="${escapeHtml(value.slice(1, -1))}">${copyIconSvg}</button>` : '';
            return `${keyButtonHTML}<span class="json-key">${key}</span>${separator}${valueButtonHTML}<span class="json-value">${value}</span>`;
        });
    }).join('\n');
}

// Function to copy a given text to the clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Log success to the console
        console.log("Text copied to clipboard");
    }).catch(err => {
        // Log any errors to the console
        console.error('Error in copying text: ', err);
    });
}

// Function to escape HTML characters in a given text
function escapeHtml(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    // Replace each character with its corresponding HTML entity
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}

// Function to attach event listeners to copy buttons
function attachCopyEventListeners() {
    // Select all copy buttons and attach a click event listener to each
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', function () {
            // Get the text associated with the button and copy it to the clipboard
            const textToCopy = this.getAttribute('data-text');
            copyToClipboard(textToCopy);
        });
    });
}

function addStyles() {
    const style = document.createElement('style');
    style.textContent += `
        body {
            margin: 0;
            font-family: 'Courier New', Courier, monospace;
            background: #fefefe;
        }
        #json-container {
            font-size: 1em;
            color: #333;
            line-height: 1.5;
            white-space: pre-wrap;
            word-wrap: break-word;
            padding: 20px;
            margin-top: 60px;
            background: #fff;
            border: 0px;
            border-radius: 4px;
            // box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        #control-panel {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        #control-panel button {
            background-color: #0084ff;
            border: none;
            border-radius: 4px;
            padding: 10px 15px;
            color: white;
            text-transform: uppercase;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        #control-panel button:hover {
            background-color: #0056b3;
        }
        #control-panel button:active {
            background-color: #003d82;
        }
        .shortcuts-content {
            display: none;
            background: white;
            color: #333; // Ensure text is visible
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 10px;
            margin-top: 120px;
            position: absolute;
            right: 10px; // Adjusted to align with control panel
            top: 40px; // Adjusted to dropdown below the button
            z-index: 1000;
            width: max-content;
        }
        .shortcuts-content ul {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        .shortcuts-content li {
            margin-bottom: 5px;
        }
        .shortcuts-content kbd {
            background: #eee;
            border-radius: 3px;
            box-shadow: 0 1px 1px rgba(0,0,0,0.2);
            padding: 2px 4px;
            font-size: 0.85em;
            font-family: monospace;
        }
        .copy-btn, .toggle-button {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-right: 4px;
            color: inherit;
            outline: none;
        }
        .copy-icon, .toggle-button svg {
            width: 14px;
            height: 14px;
            fill: #74C0FC;
            transition: fill 0.2s;
        }
        .copy-btn:hover .copy-icon, .toggle-button:hover svg {
            fill: #ff8c00;
        }
        .json-key {
            color: red;
        }
        .json-value {
            color: #32cd32;
        }
        .collapsible-content {
            margin-left: 20px;
        }
    `;
    document.head.appendChild(style);
}