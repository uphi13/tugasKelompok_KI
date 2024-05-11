// Fungsi untuk mengonversi teks menjadi array bit
function convertTextToBits(text) {
  const bits = [];
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    const charBits = char.toString(2).padStart(8, "0");
    for (let j = 0; j < charBits.length; j++) {
      bits.push(parseInt(charBits[j], 10));
    }
  }
  return bits;
}

// Fungsi untuk mengonversi array bit menjadi teks
function convertBitsToText(bits) {
  let text = "";
  const bitsCount = bits.length;
  for (let i = 0; i < bitsCount; i += 8) {
    const charBits = bits.slice(i, i + 8);
    const char = String.fromCharCode(parseInt(charBits.join(""), 2));
    text += char;
  }
  return text;
}

// Implementasi algoritma LSB untuk encoding pesan ke dalam gambar
function encodeMessage(imageData, message) {
  const messageBits = convertTextToBits(message);
  let bitIndex = 0;

  for (let i = 0; i < imageData.data.length; i += 4) {
    // Mengakses setiap piksel (RGBA)
    const pixel = [
      imageData.data[i], // Red
      imageData.data[i + 1], // Green
      imageData.data[i + 2], // Blue
      imageData.data[i + 3], // Alpha
    ];

    // Memodifikasi least significant bit dari setiap komponen warna
    for (let j = 0; j < 3; j++) {
      if (bitIndex < messageBits.length) {
        const lsb = pixel[j] & 1; // Mendapatkan least significant bit
        pixel[j] = (pixel[j] & 0xfe) | messageBits[bitIndex]; // Mengubah least significant bit
        bitIndex++;
      } else {
        // Jika tidak ada lagi bit pesan, sisipkan null terminator (\u0000)
        pixel[j] = (pixel[j] & 0xfe) | 0;
      }
    }

    // Mengembalikan nilai piksel yang dimodifikasi ke dalam imageData
    imageData.data[i] = pixel[0];
    imageData.data[i + 1] = pixel[1];
    imageData.data[i + 2] = pixel[2];
    imageData.data[i + 3] = pixel[3];
  }

  return imageData;
}

// Implementasi algoritma LSB untuk decoding pesan dari gambar
function decodeMessage(imageData) {
  const bits = [];

  for (let i = 0; i < imageData.data.length; i += 4) {
    const pixel = [
      imageData.data[i], // Red
      imageData.data[i + 1], // Green
      imageData.data[i + 2], // Blue
      imageData.data[i + 3], // Alpha
    ];

    for (let j = 0; j < 3; j++) {
      const lsb = pixel[j] & 1;
      bits.push(lsb);
    }

    // Jika panjang bits sudah mencapai kelipatan 8, berarti ditemukan null terminator
    if (bits.length % 8 === 0) {
      const decodedMessage = convertBitsToText(bits);
      if (decodedMessage.includes("\u0000")) {
        // Jika pesan terdekode mengandung null terminator (\u0000), kembalikan string dari awal hingga null terminator
        return decodedMessage.split("\u0000")[0];
      }
    }
  }

  // Jika tidak ditemukan null terminator, kembalikan seluruh pesan terdekode
  return convertBitsToText(bits);
}

// Event listeners untuk halaman encode
const encodeImageInput = document.getElementById("image-input");
const encodeMessageInput = document.getElementById("message-input");
const encodeBtn = document.getElementById("encode-btn");
const encodedImageContainer = document.getElementById(
  "encoded-image-container"
);
const encodeFileNameSpan = document.getElementById("file-name");

if (
  encodeImageInput &&
  encodeMessageInput &&
  encodeBtn &&
  encodedImageContainer &&
  encodeFileNameSpan
) {
  encodeImageInput.addEventListener("change", () => {
    const file = encodeImageInput.files[0];
    if (file) {
      encodeFileNameSpan.textContent = file.name;
    } else {
      encodeFileNameSpan.textContent = "Pilih Gambar";
    }
  });

  encodeBtn.addEventListener("click", () => {
    const file = encodeImageInput.files[0];
    const message = encodeMessageInput.value;

    if (!file) {
      alert("Harap pilih gambar terlebih dahulu.");
      return;
    }

    if (!message) {
      alert("Harap masukkan pesan yang ingin dienkode.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, image.width, image.height);
        const encodedImageData = encodeMessage(imageData, message);
        context.putImageData(encodedImageData, 0, 0);
        encodedImageContainer.innerHTML = "";
        const encodedImage = document.createElement("img");
        encodedImage.src = canvas.toDataURL();
        encodedImageContainer.appendChild(encodedImage);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const saveImageBtn = document.getElementById("save-image-btn");

if (saveImageBtn) {
  saveImageBtn.addEventListener("click", () => {
    const encodedImage = encodedImageContainer.querySelector("img");
    if (encodedImage) {
      const link = document.createElement("a");
      link.download = "gambar-terenkode.png";
      link.href = encodedImage.src;
      link.click();
    }
    if (!encodedImage) {
      alert("Tidak ada gambar terenkode yang dapat disimpan.");
      return;
    }
  });
}

// Event listener untuk tombol "Reset" pada halaman encode
const resetBtnEncode = document.getElementById("reset-btn");

if (resetBtnEncode) {
  resetBtnEncode.addEventListener("click", () => {
    encodeImageInput.value = ""; // Menghapus nilai input file
    encodeMessageInput.value = ""; // Menghapus nilai textarea
    encodedImageContainer.innerHTML = ""; // Menghapus gambar terenkode
    encodeFileNameSpan.textContent = "Pilih Gambar"; // Mengembalikan teks label input file
  });
}

// Event listeners untuk halaman decode
const decodeImageInput = document.getElementById("image-input");
const decodeBtn = document.getElementById("decode-btn");
const decodedMessageContainer = document.getElementById(
  "decoded-message-container"
);
const decodeFileNameSpan = document.getElementById("file-name");

if (
  decodeImageInput &&
  decodeBtn &&
  decodedMessageContainer &&
  decodeFileNameSpan
) {
  decodeImageInput.addEventListener("change", () => {
    const file = decodeImageInput.files[0];
    if (file) {
      decodeFileNameSpan.textContent = file.name;
    } else {
      decodeFileNameSpan.textContent = "Pilih Gambar";
    }
  });

  decodeBtn.addEventListener("click", () => {
    const file = decodeImageInput.files[0];

    if (!file) {
      alert("Harap pilih gambar terlebih dahulu.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, image.width, image.height);
        const decodedMessage = decodeMessage(imageData);
        decodedMessageContainer.innerHTML = "";
        const messageElement = document.createElement("p");
        messageElement.textContent = decodedMessage;
        decodedMessageContainer.appendChild(messageElement);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Event listener untuk tombol "Reset" pada halaman decode
const resetBtnDecode = document.getElementById("reset-btn");

if (resetBtnDecode) {
  resetBtnDecode.addEventListener("click", () => {
    decodeImageInput.value = ""; // Menghapus nilai input file
    decodedMessageContainer.innerHTML = ""; // Menghapus pesan terdekode
    decodeFileNameSpan.textContent = "Pilih Gambar"; // Mengembalikan teks label input file
  });
}
