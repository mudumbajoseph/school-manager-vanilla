let classes = ['Baby', 'Middle', 'Top', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7']

function renderClasses() {
  const container = document.getElementById('classCards')
  container.innerHTML = ''
  classes.forEach(cls => {
    const div = document.createElement('div')
    div.className = 'col-6 col-md-3'
    div.innerHTML = `<div class="card text-center p-3 shadow-sm" onclick="openClass('${cls}')">${cls}</div>`
    container.appendChild(div)
  })
}

function addClass() {
  const name = prompt('Enter new class name')
  if (name) {
    classes.push(name)
    renderClasses()
  }
}

function backup() {
  fetch('/backup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ classes })
  }).then(res => {
    if (res.ok) alert('Backup successful!')
    else alert('Backup failed')
  })
}

function openClass(cls) {
  alert('This would navigate to class page for: ' + cls)
}

renderClasses()
