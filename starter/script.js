const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const userMessage = input.value.trim();
    if (!userMessage) return;

    // 1. Tampilkan pesan user
    appendMessage('user', userMessage);
    input.value = '';

    // 2. Tampilkan indikator loading (bubble bot sementara)
    const loadingId = appendMessage('bot', '...');

    try {
        const response = await fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Gagal menghubungi server");
        }

        // 3. Ubah isi bubble loading tadi dengan jawaban asli dari bot
        updateMessage(loadingId, data.reply);

    } catch (error) {
        updateMessage(loadingId, "Error: " + error.message);
    }
});

function appendMessage(sender, text) {
    const msg = document.createElement('div');
    msg.classList.add('message', sender);
    msg.innerText = text;

    // PERBAIKAN: Tambahkan angka acak agar ID tidak mungkin kembar
    const id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    msg.setAttribute('data-id', id);

    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;

    return id;
}

function updateMessage(id, newText) {
    const msg = document.querySelector(`.message[data-id="${id}"]`);
    if (msg) {
        msg.innerText = newText;
    }
}
