async function dataURItoBlob(dataURI) {
  try {
    const base64String = dataURI.split(',')[1];
    const byteString = atob(base64String);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: 'image/png' });
  } catch (error) {
    console.error('Error decoding Base64:', error.message);
    return null;
  }
}

async function getImageDataUrl(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');

  const localImage = new Image();
  localImage.crossOrigin = "Anonymous";
  localImage.src = img.src;

  try {
    await new Promise((resolve, reject) => {
      localImage.onload = resolve;
      localImage.onerror = () => reject(new Error("Image failed to load."));
    });

    // Draw the loaded image onto the canvas
    ctx.drawImage(localImage, 0, 0, img.width, img.height);

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error("Error creating image data URL:", error.message);
    return null;
  }
}

async function translateImageTextAndSetAlt(imgElement, srcLanguage) {
  try {
    const imageDataUrl = await getImageDataUrl(imgElement);
    if (!imageDataUrl) {
      throw new Error("Failed to get image data URL.");
    }

    const imageBlob = await dataURItoBlob(imageDataUrl);
    if (!imageBlob) {
      throw new Error("Failed to convert image data URL to Blob.");
    }

    const translatedText = await extractTextFromImageUsingApi(imageBlob, srcLanguage);
    if (translatedText) {
      imgElement.alt = translatedText;
    } else {
      console.warn("No text extracted for image:", imgElement);
    }
  } catch (error) {
    console.error("Error during image translation:", error.message);
  }
}

async function extractTextFromImageUsingApi(imageBlob, language) {
  const apiUrl = "http://localhost:8000/api/extract-text-from-image";

  const formData = new FormData();
  formData.append("lang", language);
  formData.append("image", imageBlob, "image.png");

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`);
    }

    const data = await response.json();
    if (data.extractedText) {
      return data.extractedText;
    } else {
      throw new Error("No text extracted from the image.");
    }
  } catch (error) {
    console.error("Error extracting text from image:", error.message);
    return null;
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "translate") {
    const elementsToTranslate = `
      p, h1, h2, h3, h4, h5, h6, span, a, strong, em, blockquote, q, abbr, cite, pre, address,
      li, label, button, option, optgroup, textarea, td, summary, figcaption, legend, img`;

    const elements = document.querySelectorAll(elementsToTranslate.split(', '));
    const srcLanguage = request.srcLanguage;
    const destLanguage = request.destLanguage;
    const promises = [];

    elements.forEach((element) => {
      const tag = element.tagName.toLowerCase();

      if (tag === "img") {
        const promise = translateImageTextAndSetAlt(element, srcLanguage);
        promises.push(promise);
      } else {
        const originalText = element.innerText;
        if (!originalText || originalText.trim() === "") return;

        const promise = chrome.runtime.sendMessage(
          { action: "translateText", text: originalText, src: srcLanguage, dest: destLanguage }
        ).then(response => {
          const translatedText = response.translatedText;
          if (translatedText) {
            element.innerText = translatedText;
          } else {
            console.warn("No translated text received for:", originalText);
          }
        });
        promises.push(promise);
      }
    });

    Promise.all(promises)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Error during translation:", error.message);
        sendResponse({ error: "Error during translation." });
      });

    return true; // Keeps the message channel open for asynchronous response
  }
});
