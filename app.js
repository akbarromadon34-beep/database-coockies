const API_URL = "https://script.google.com/macros/s/AKfycbyIl8rJIFl4S19zMXcoUGb6BIIGIySoPnPmnymFbL1UREJUDgNPBCelyrkvTAsdIxk-WQ/exec";

let allData = [];

async function loadData() {
  const res = await fetch(API_URL);
  const data = await res.json();
  allData = data;
  render(data);
}

function render(data) {
  const container = document.getElementById("grid");
  container.innerHTML = "";

  data.forEach(item => {
    container.innerHTML += `
      <div class="card">
        <div class="badge">${item.category}</div>
        <h3>${item.title}</h3>
        <small>${item.upload_date}</small>
        <p>${item.content.slice(0,100)}...</p>
      </div>
    `;
  });
}

function liveSearch() {
  const value = document.getElementById("searchInput").value.toLowerCase();

  const filtered = allData.filter(item =>
    item.title.toLowerCase().includes(value) ||
    item.category.toLowerCase().includes(value) ||
    item.content.toLowerCase().includes(value)
  );

  render(filtered);
}

function handleUpload(event) {
  const files = event.target.files;

  for (let file of files) {
    const reader = new FileReader();

    reader.onload = async function(e) {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          title: file.name,
          category: "General",
          content: e.target.result
        })
      });
    };

    reader.readAsText(file);
  }
}

loadData();
