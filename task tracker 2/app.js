const API_URL = 'http://localhost:3000';

let tasks = [];
let currentFilter = 'semua';
let searchQuery = '';

const form = document.getElementById('task-form');
const inputJudul = document.getElementById('judul');
const selectMatkul = document.getElementById('matkul');
const inputDeadline = document.getElementById('deadline');
const btnTambah = document.getElementById('btn-tambah');
const formErrorMsg = document.getElementById('error-message');

const searchInput = document.getElementById('search-input');
const taskList = document.getElementById('task-list');
const filtersContainer = document.getElementById('filters');
const counterText = document.getElementById('counter');

const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorStateMsg = document.getElementById('error-state-msg');
const btnRetry = document.getElementById('btn-retry');
const emptyMessage = document.getElementById('empty-message');

async function api(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            let errorMessage = `HTTP Error: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.message) errorMessage = errorData.message;
            } catch (e) {}
            throw new Error(errorMessage);
        }

        if (response.status === 204) return null;
        return await response.json();
    } catch (error) {
        throw error;
    }
}

async function loadData() {
    showState('loading');
    try {
        const [tasksData, matkulData] = await Promise.all([
            api(`${API_URL}/tugas`),
            api(`${API_URL}/matkul`)
        ]);

        tasks = tasksData;

        selectMatkul.innerHTML = '<option value="" disabled selected>Pilih Mata Kuliah...</option>';
        matkulData.forEach(mk => {
            const option = document.createElement('option');
            option.value = mk.nama;
            option.textContent = mk.nama;
            selectMatkul.appendChild(option);
        });

        render();
    } catch (error) {
        showState('error', error.message);
        console.error("Gagal memuat data awal:", error);
    }
}

function showState(state, message = '') {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    taskList.classList.add('hidden');
    emptyMessage.classList.add('hidden');

    if (state === 'loading') {
        loadingState.classList.remove('hidden');
    } else if (state === 'error') {
        errorState.classList.remove('hidden');
        errorStateMsg.textContent = message;
    } else if (state === 'ready') {
        taskList.classList.remove('hidden');
    }
}

function render() {
    showState('ready');
    taskList.innerHTML = '';

    let filteredTasks = tasks;

    filteredTasks = filteredTasks.filter(task => {
        if (currentFilter === 'aktif') return !task.selesai;
        if (currentFilter === 'selesai') return task.selesai;
        return true;
    });

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredTasks = filteredTasks.filter(task =>
            task.judul.toLowerCase().includes(query)
        );
    }

    filteredTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    const activeCount = tasks.filter(task => !task.selesai).length;
    counterText.textContent = `${activeCount} tugas aktif`;

    if (filteredTasks.length === 0) {
        emptyMessage.classList.remove('hidden');
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

form.addEventListener('submit', async(e) => {
    e.preventDefault();

    const judul = inputJudul.value.trim();
    const matkul = selectMatkul.value;
    const deadline = inputDeadline.value;

    if (judul.length < 3 || !matkul || !deadline) {
        formErrorMsg.textContent = "Data tidak lengkap atau judul kurang dari 3 karakter!";
        formErrorMsg.classList.remove('hidden');
        return;
    }

    formErrorMsg.classList.add('hidden');
    btnTambah.disabled = true;

    const newTaskPayload = {
        id: String(Date.now()),
        judul,
        matkul,
        deadline,
        selesai: false
    };

    try {
        const createdTask = await api(`${API_URL}/tugas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTaskPayload)
        });

        tasks.push(createdTask);
        render();

        inputJudul.value = '';
        inputDeadline.value = '';
        selectMatkul.selectedIndex = 0;
    } catch (error) {
        formErrorMsg.textContent = `Gagal menambah tugas: ${error.message}`;
        formErrorMsg.classList.remove('hidden');
    } finally {
        btnTambah.disabled = false;
    }
});

taskList.addEventListener('click', async(e) => {
    const li = e.target.closest('li');
    if (!li) return;

    const taskId = li.dataset.id;
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const originalTask = {...tasks[taskIndex] };

    if (e.target.classList.contains('toggle-checkbox')) {
        const newStatus = !originalTask.selesai;

        tasks[taskIndex].selesai = newStatus;
        render();

        try {
            const updatedTaskFromDb = await api(`${API_URL}/tugas/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selesai: newStatus })
            });
            tasks[taskIndex] = updatedTaskFromDb;
        } catch (error) {
            console.error("Gagal update status:", error);
            alert(`Gagal mengubah status: ${error.message}`);
            tasks[taskIndex].selesai = originalTask.selesai;
            render();
        }
    }

    if (e.target.classList.contains('delete-btn')) {
        tasks.splice(taskIndex, 1);
        render();

        try {
            await api(`${API_URL}/tugas/${taskId}`, { method: 'DELETE' });
        } catch (error) {
            console.error("Gagal menghapus:", error);
            alert(`Gagal menghapus tugas: ${error.message}`);
            tasks.splice(taskIndex, 0, originalTask);
            render();
        }
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

let debounceTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        searchQuery = e.target.value;
        render();
    }, 300);
});

btnRetry.addEventListener('click', loadData);

document.addEventListener('DOMContentLoaded', loadData);