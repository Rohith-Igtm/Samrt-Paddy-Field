async function uploadImage() {
  const fileInput = document.getElementById("fileInput");
  const resultDiv = document.getElementById("result");

  if (!fileInput.files[0]) {
    resultDiv.textContent = "Please select an image.";
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  resultDiv.textContent = "Predicting...";

  try {
    const response = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      body: formData
    });

    console.log("Fetch response:", response);
    const text = await response.text();
    console.log("Raw response text:", text);

    if (!response.ok) {
      resultDiv.textContent = `Error ${response.status}: ${text}`;
      return;
    }

    const data = JSON.parse(text);
    console.log("Parsed JSON:", data);

    resultDiv.innerHTML = `
      🌱 <strong>${data.class}</strong><br>
      🔬 Confidence: ${data.confidence}
    `;
  } 
  catch (err) {
    console.error("Fetch threw error:", err);
    resultDiv.textContent = "Prediction failed: see console for details.";
  }
}
