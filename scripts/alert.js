const randomNum = Math.floor(Math.random() * 120) + 1;
const imgPath = `../assets/images/${randomNum}.jpg`;
const imgElement = document.getElementById("alert-image");
imgElement.src = imgPath;