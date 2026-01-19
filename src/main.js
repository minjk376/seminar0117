const button = document.getElementById("danger-button");

button.addEventListener("click", () => {
  Swal.fire({
    title: "I Said Do Not Click This Button",
    text: "Why did you do that?",
    icon: "warning",
    confirmButtonText: "Sorry 😓",
    background: "#0f2a4d",
    color: "#ffffff",
    confirmButtonColor: "#1b3f7a",
  });
});
