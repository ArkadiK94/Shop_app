// adding menu nav in mobile
const backdrop = document.querySelector(".backdrop");
const sideDrawer = document.querySelector(".mobile-nav");
const menuToggle = document.querySelector("#side-menu-toggle");

function backdropClickHandler() {
  backdrop.style.display = "none";
  sideDrawer.classList.remove("open");
}

function menuToggleClickHandler() {
  backdrop.style.display = "block";
  sideDrawer.classList.add("open");
}

backdrop.addEventListener("click", backdropClickHandler);
menuToggle.addEventListener("click", menuToggleClickHandler);

// delete product in admin products and cart products
const deleteBtns = document.querySelectorAll("[data-delete]");
deleteBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const target = e.target;
    const csrf = target.parentElement.querySelector(
      "input[name='_csrf']"
    ).value;
    const productId = target.parentElement.querySelector(
      "input[name='productId']"
    ).value;
    const deleteRoute = target.getAttribute("data-delete");

    fetch(deleteRoute + productId, {
      method: "DELETE",
      headers: {
        "csrf-token": csrf,
      },
    })
      .then((result) => {
        if (deleteRoute === "/cart/") {
          if (target.closest("ul").querySelectorAll("li").length > 1) {
            target.closest("li").remove();
          } else {
            const noProd = document.createElement("main");
            noProd.innerHTML = `
            <h1>No Products In The Cart</h1>
          `;
            target.closest("main").after(noProd);
            target.closest("main").remove();
          }
        } else if (deleteRoute === "/admin/product/") {
          if (
            target.closest("div.grid").querySelectorAll("article").length > 1
          ) {
            target.closest("article").remove();
          } else {
            const noProd = target.closest("main");
            noProd.innerHTML = `
            <h1>No Products Found!</h1>
          `;
            target.closest("div.grid").remove();
          }
        }
        return result.json();
      })
      .then((data) => {
        console.log(data);
      })
      .catch((err) => {
        console.log(err);
      });
  });
});
