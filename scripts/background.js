chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "translateText") {
    const { text, src, dest } = request; // Destructure for clarity
    const apiUrl = "http://127.0.0.1:8000/api/translate-text"; // Replace with your actual API URL

    // Perform the API call
    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, src, dest }),
    })
      .then((response) => {
        if (!response.ok) {
          // Handle HTTP errors
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.translatedText) {
          sendResponse({ translatedText: data.translatedText });
        } else {
          throw new Error("No translated text received from API.");
        }
      })
      .catch((error) => {
        console.error("Error translating text:", error.message);
        sendResponse({ error: `Error translating text: ${error.message}` });
      });

    // Return true to allow asynchronous response
    return true;
  }
});
