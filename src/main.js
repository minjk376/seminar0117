const button = document.getElementById("danger-button");
const message = document.getElementById("warning-message");

button.addEventListener("click", () => {
  message.classList.remove("hidden");
});