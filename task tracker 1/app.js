let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'semua';

const form = document.getElementById('task-form');
const inputJudul = document.getElementById('judul');
const selectMatkul = document.getElementById('matkul');
const inputDeadline = document.getElementById('deadline');
const errorMsg = document.getElementById('error-message');
const taskList = document.getElementById('task-list');
const filtersContainer = document.getElementById('filters');
const counterText = document.getElementById('counter');
const emptyMessage = document.getElementById('empty-message');

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function render() {
    taskList.innerHTML = '';

    const sortedTasks = [...tasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    const filteredTasks = sortedTasks.filter(task => {
        if (currentFilter === 'aktif') return !task.selesai;
        if (currentFilter === 'selesai') return task.selesai;
        return true;
    });

    const activeCount = tasks.filter(task => !task.selesai).length;
    counterText.textContent = `${activeCount} tugas aktif`;

    if (filteredTasks.length === 0) {
        emptyMessage.classList.remove('hidden');
    } else {
        emptyMessage.classList.add('hidden');
    }

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        if (task.selesai) li.classList.add('completed');
        li.dataset.id = task.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'toggle-checkbox';
        checkbox.checked = task.selesai;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'task-info';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'task-title';
        titleSpan.textContent = task.judul;
        const metaSpan = document.createElement('span');
        metaSpan.className = 'task-meta';
        metaSpan.textContent = `${task.matkul} · deadline ${task.deadline}`;

        infoDiv.appendChild(titleSpan);
        infoDiv.appendChild(metaSpan);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '✕';

        li.appendChild(checkbox);
        li.appendChild(infoDiv);
        li.appendChild(deleteBtn);

        taskList.appendChild(li);
    });
}

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const judul = inputJudul.value.trim();
    const matkul = selectMatkul.value;
    const deadline = inputDeadline.value;

    if (judul.length < 3) {
        errorMsg.textContent = "Judul tugas minimal 3 karakter!";
        errorMsg.classList.remove('hidden');
        return;
    }
    if (!deadline) {
        errorMsg.textContent = "Tanggal deadline wajib diisi!";
        errorMsg.classList.remove('hidden');
        return;
    }

    errorMsg.classList.add('hidden');

    const newTask = {
        id: Date.now(),
        judul,
        matkul,
        deadline,
        selesai: false
    };

    tasks.push(newTask);
    saveTasks();
    render();

    inputJudul.value = '';
    inputDeadline.value = '';
});

taskList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const taskId = parseInt(li.dataset.id);

    if (e.target.classList.contains('toggle-checkbox')) {
        tasks = tasks.map(task =>
            task.id === taskId ? {...task, selesai: !task.selesai } : task
        );
        saveTasks();
        render();
    }

    if (e.target.classList.contains('delete-btn')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        render();
    }
});

filtersContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('on'));

        e.target.classList.add('on');

        currentFilter = e.target.dataset.filter;
        render();
    }
});

// Render awal saat aplikasi dimuat
render();