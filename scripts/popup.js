document.addEventListener("DOMContentLoaded", function () {
  const translateButton = document.getElementById("translateButton");

  // Set up click event for the translate button
  translateButton.addEventListener("click", function () {
    const srcLanguage = document.getElementById("srcLanguage").value;
    const destLanguage = document.getElementById("destLanguage").value;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "translate",
        srcLanguage: srcLanguage,
        destLanguage: destLanguage,
      });
    });
  });
});
