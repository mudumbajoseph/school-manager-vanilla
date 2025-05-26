let db;
let SQL;
const LOCAL_STORAGE_KEY = "school-database";

(async function init() {
  SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });

  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    const uInt8Array = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
    db = new SQL.Database(uInt8Array);
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE
      );
    `);
    saveToLocal();
  }

  renderClasses();
})();

function addClass() {
  const name = prompt("Enter new class name");
  if (!name) return;

  try {
    db.run(`INSERT INTO classes (name) VALUES (?)`, [name]);
    saveToLocal();
    renderClasses();
  } catch (e) {
    alert("Class already exists or invalid input.");
  }
}

function renderClasses() {
  const container = document.getElementById("classCards");
  container.innerHTML = "";

  const result = db.exec("SELECT * FROM classes");
  const classes = result[0]?.values || [];

  classes.forEach(([id, name]) => {
    const div = document.createElement("div");
    div.className = "col-12 col-md-6 col-lg-4 col-xl-3";
    // div.className = "col-3 col-md-4 col-sm-6";
    div.innerHTML = `
      <div class="card p-2 shadow-sm">
        <div class="card-body text-center">
          <h6>${name}</h6>
          <div class="mt-2">
            <button class="btn btn-sm btn-danger" onclick="removeClass(${id},'${name}')">Remove</button>
            <a class="btn btn-sm btn-success ms-2" href="/class.html?id=${id}">Go</a>
          </div>
        </div>
      </div>`;
    container.appendChild(div);
  });
}

function removeClass(id, name) {
  const answer = confirm(`Are you sure you want to delete ${name} class?`);
  if (answer) {
    db.run(`DELETE FROM classes WHERE id = ?`, [id]);
    saveToLocal();
    renderClasses();
  }
}

function backup() {
  const data = db.export();
  const blob = new Blob([data], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "school-backup.sqlite";
  a.click();
  URL.revokeObjectURL(url);
}

function saveToLocal() {
  const binary = db.export();
  const base64 = btoa(String.fromCharCode(...binary));
  localStorage.setItem(LOCAL_STORAGE_KEY, base64);
}



async function clearAppCache() {
  if (!confirm("Are you sure you want to clear the app cache and local data?")) return;

  // Clear Service Worker cache
  if ('caches' in window) {
    const keys = await caches.keys();
    for (const key of keys) {
      await caches.delete(key);
    }
  }

  // Clear localStorage (SQL.js database)
  localStorage.removeItem("school-database");

  // Optionally, unregister service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }
  }

  alert("Cache and local data cleared. Reloading...");
  location.reload();
}


function installApp(){
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }
}