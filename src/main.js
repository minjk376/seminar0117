const button = document.getElementById("danger-button");

button.addEventListener("click", () => {
  Swal.fire({
    title: "⚠️ Warning",
    text: "I Said Do Not Click This Button",
    icon: "error",
    confirmButtonText: "Sorry...",
    background: "#0f2747",
    color: "#e6ecf5",
    confirmButtonColor: "#1e4c7a",
    backdrop: "rgba(10, 26, 47, 0.85)",
  });
});