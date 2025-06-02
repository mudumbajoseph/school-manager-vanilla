let classId;
let className;
let db, SQL;
let nameL = "";

(async function init() {
  try {
    SQL = await initSqlJs({ locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${f}` });
    const saved = localStorage.getItem("school-database");
    const uInt8Array = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
    db = new SQL.Database(uInt8Array);

    // Create tables if not exist
    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        dob TEXT NOT NULL,
        class_id INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        for_what TEXT default 'fees',
        date TEXT NOT NULL
      );
    `);

      const urlParams = new URLSearchParams(window.location.search);
      classId = urlParams.get("id");
      const studentIdParam = urlParams.get("student");

      if (!classId) return alert("Class ID missing.");

      const result = db.exec("SELECT name FROM classes WHERE id = ?", [classId]);
      className = result[0]?.values?.[0]?.[0];
      document.getElementById("className").textContent = `Class: ${className}`;

      if (studentIdParam) {
        renderStudentById(studentIdParam);
      } else {
        renderStudents();
      }

  } catch (e) {
    alert("Error: " + e.message);
  }
})();

// function renderStudents() {
//   const studentList = document.getElementById("studentList");
//   studentList.innerHTML = "";

//   const result = db.exec("SELECT * FROM students WHERE class_id = ? ORDER BY name ASC", [classId]);
//   const students = result[0]?.values || [];

//   students.forEach(([id, name, dob]) => {
//     const div = document.createElement("div");
//     div.className = "col-12 col-md-6 col-lg-4 col-xl-3";
//     div.innerHTML = `
//       <div class="card p-2 shadow-sm">
//         <div class="card-body text-center">
//           <strong>${name}</strong><br>
//           DOB: ${dob}<br>
//           <button class="btn btn-sm btn-outline-primary mt-2 ms-1" onclick="viewPaymentHistory(${id},'${name}')">Payments</button>
//         </div>
//       </div>`;
//           // <button class="btn btn-sm btn-outline-success mt-2" onclick="openPaymentModal(${id})">+ Payment</button>

//     studentList.appendChild(div);
//   });
// }

function renderStudentById(studentId) {
  const studentList = document.getElementById("studentList");
  studentList.innerHTML = "";

  const result = db.exec("SELECT id, name, dob FROM students WHERE id = ? AND class_id = ?", [studentId, classId]);
  const student = result[0]?.values?.[0];

  if (!student) {
    studentList.innerHTML = "<tr><td colspan='3'>Student not found in this class.</td></tr>";
    return;
  }

  const [id, name, dob] = student;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${name}</td>
    <td>${dob}</td>
    <td>
      <button class="btn btn-sm btn-outline-primary" onclick="viewPaymentHistory(${id}, '${name}')">Payments</button>
    </td>
  `;
  studentList.appendChild(tr);
}


function renderStudents(filter = "") {
  const studentList = document.getElementById("studentList");
  studentList.innerHTML = "";

  let query = "SELECT * FROM students WHERE class_id = ?";
  let params = [classId];

  if (filter) {
    query += " AND name LIKE ?";
    params.push(`%${filter}%`);
  }

  query += " ORDER BY name ASC";
  const result = db.exec(query, params);
  const students = result[0]?.values || [];

  students.forEach(([id, name, dob]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${name}</td>
      <td>${dob}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="viewPaymentHistory(${id}, '${name}')">Payments</button>
      </td>
    `;
    studentList.appendChild(tr);
  });
}


function showAddStudentModal() {
  new bootstrap.Modal(document.getElementById("addStudentModal")).show();
}

function submitNewStudent(event) {
  event.preventDefault();
  const name = document.getElementById("studentName").value.trim();
  const dob = document.getElementById("studentDob").value;

  if (!name || !dob) {
    alert("Please fill all fields.");
    return;
  }

  db.run(`INSERT INTO students (name, dob, class_id) VALUES (?, ?, ?)`, [name, dob, classId]);
  saveToLocal();
  bootstrap.Modal.getInstance(document.getElementById("addStudentModal")).hide();
  event.target.reset();
  renderStudents();
}

function openPaymentModal(studentId) {
  document.getElementById("paymentStudentId").value = studentId;
  document.getElementById("paymentDate").value = new Date().toISOString().split("T")[0];
  new bootstrap.Modal(document.getElementById("paymentModal")).show();
}

function submitPayment(event) {
  event.preventDefault();
  const studentId = document.getElementById("paymentStudentId").value;
  const amount = parseInt(document.getElementById("paymentAmount").value);
  const date = document.getElementById("paymentDate").value;
  const forWhat = document.querySelector('input[name="for_what"]:checked').value;

  if (!studentId || !amount || !date) {
    alert("Please fill all fields.");
    return;
  }

  db.run(`INSERT INTO payments (student_id, amount, date, for_what) VALUES (?, ?, ?, ?)`, [studentId, amount, date, forWhat]);
  saveToLocal();
  event.target.reset();
  bootstrap.Modal.getInstance(document.getElementById("paymentModal")).hide();
  viewPaymentHistory(studentId, nameL);
}

function saveToLocal() {
  const binary = db.export();
  const base64 = btoa(String.fromCharCode(...binary));
  localStorage.setItem("school-database", base64);
}

function viewPaymentHistory(studentId, name) {
  console.log(studentId, name);
  const historyList = document.getElementById("historyList");
  historyList.innerHTML = "";

  const result = db.exec(`
    SELECT amount, date, for_what
    FROM payments
    WHERE student_id = ?
    ORDER BY date ASC
  `, [studentId]);

  const rows = result[0]?.values || [];

  if (rows.length === 0) {
    historyList.innerHTML = `<li class="list-group-item">No payments made yet for ${name}</li>
    <br>
    <button class="btn btn-sm btn-outline-success mt-2" onclick="openPaymentModal(${studentId});hideHistoryModal();setName('${name}');">+ Payment</button>
    `;
  } else {
    historyList.innerHTML = `<h3>For ${name}</h3>
    <button class="btn btn-sm btn-outline-success mt-2" onclick="openPaymentModal(${studentId});hideHistoryModal();setName('${name}');">+ Payment</button>`;
    rows.forEach(([amount, date, for_what]) => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between";
      li.innerHTML = `<span>${date}</span><strong>Ugx${amount}</strong><span>for ${for_what}</span>`;
      historyList.appendChild(li);
    });
  }

  new bootstrap.Modal(document.getElementById("historyModal")).show();
}


function hideHistoryModal() {
  const modalEl = document.getElementById("historyModal");
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
}

function setName(name) {
  nameL = name;
}

function filterStudentTable() {
  const input = document.getElementById("classSearchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#studentList tr");
  let visibleCount = 0;

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const matches = text.includes(input);
    row.style.display = matches ? "" : "none";
    if (matches) visibleCount++;
  });

  // Check if "no result" row exists
  let noRow = document.getElementById("no-students-row");
  if (visibleCount === 0) {
    if (!noRow) {
      noRow = document.createElement("tr");
      noRow.id = "no-students-row";
      noRow.innerHTML = `<td colspan="3" class="text-center text-muted">No students found</td>`;
      document.getElementById("studentList").appendChild(noRow);
    }
  } else if (noRow) {
    noRow.remove();
  }
}
