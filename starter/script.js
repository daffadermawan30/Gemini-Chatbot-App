const form = document.getElementById('chat-form');
const input = document.getElementById('user-input'); // Textarea
const chatBox = document.getElementById('chat-box');
const fileInput = document.getElementById('file-input');
const attachBtn = document.getElementById('attach-btn');
const sendBtn = document.getElementById('send-btn');
const filePreview = document.getElementById('file-preview-container');
const fileNameDisplay = document.getElementById('file-name');
const removeFileBtn = document.getElementById('remove-file');

let selectedFile = null;

// Fungsi Helper: Scroll ke Bawah
function scrollToBottom() {
    chatBox.scrollTo({
        top: chatBox.scrollHeight,
        behavior: 'smooth'
    });
}

// 1. Auto-resize Textarea
input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    sendBtn.disabled = this.value.trim() === '' && !selectedFile;
});

// 2. Logic Tombol Enter
input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) form.dispatchEvent(new Event('submit'));
    }
});

// 3. File Handling
attachBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', function() {
    if (this.files[0]) {
        selectedFile = this.files[0];
        fileNameDisplay.innerText = selectedFile.name;
        filePreview.classList.remove('hidden');
        sendBtn.disabled = false;
    }
});
removeFileBtn.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    filePreview.classList.add('hidden');
    sendBtn.disabled = input.value.trim() === '';
});

// 4. Submit Form
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const userMessage = input.value.trim();
    if (!userMessage && !selectedFile) return;

    // Tampilkan pesan User
    const displayContent = selectedFile
        ? `📁 <b>${selectedFile.name}</b><br>${userMessage}`
        : userMessage;
    appendMessage('user', displayContent);

    // Reset Input
    input.value = '';
    input.style.height = 'auto';
    const fileToSend = selectedFile;
    selectedFile = null;
    fileInput.value = '';
    filePreview.classList.add('hidden');
    sendBtn.disabled = true;

    // Loading Indicator
    const loadingId = appendMessage('bot', '<span class="typing-dots">Sedang berpikir...</span>');

    try {
        const formData = new FormData();
        formData.append('prompt', userMessage);
        if (fileToSend) formData.append('file', fileToSend);

        const response = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Server Error");

        // Tampilkan Jawaban dengan Format Rapih
        updateMessage(loadingId, formatText(data.response));

    } catch (error) {
        updateMessage(loadingId, "⚠️ Error: " + error.message);
    }
});

// --- FUNGSI TAMPILAN ---

function appendMessage(sender, htmlContent) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);

    // Ikon Avatar (Robot untuk Bot, Orang untuk User)
    const iconName = sender === 'user' ? 'person' : 'smart_toy';

    msgDiv.innerHTML = `
    <div class="avatar">
      <span class="material-symbols-rounded">${iconName}</span>
    </div>
    <div class="bubble">${htmlContent}</div>
  `;

    const id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    msgDiv.setAttribute('data-id', id);

    chatBox.appendChild(msgDiv);
    scrollToBottom(); // Auto scroll saat pesan baru muncul
    return id;
}

function updateMessage(id, newHtmlContent) {
    const msgDiv = document.querySelector(`.message[data-id="${id}"]`);
    if (msgDiv) {
        const bubble = msgDiv.querySelector('.bubble');
        bubble.innerHTML = newHtmlContent;

        // --- FITUR AUTO SCROLL ---
        // Setiap kali pesan diupdate (balasan AI muncul), scroll ke bawah
        scrollToBottom();
    }
}

// Formatting Markdown Simple
function formatText(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}
