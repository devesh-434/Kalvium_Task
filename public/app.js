let pdfDoc = null;
let pageNum = 1;
let isAdmin = false;
let socket = new WebSocket('ws://localhost:8080');

socket.onopen = () => {
  isAdmin = confirm("Are you the presenter?");
  socket.send(JSON.stringify({ type: 'join', role: isAdmin ? 'admin' : 'viewer' }));
};

socket.onmessage = (e) => {
  const data = JSON.parse(e.data);

  if (data.type === 'updatePage') {
    pageNum = data.page;
    renderPage(pageNum);
  } else if (data.type === 'loadPdf') {
    loadPdf(data.pdfUrl);
  }
};

pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';

function loadPdf(url) {
  pdfjsLib.getDocument(url).promise.then((doc) => {
    pdfDoc = doc;
    pageNum = 1;
    renderPage(pageNum);
    document.getElementById('prevPage').disabled = false;
    document.getElementById('nextPage').disabled = false;
  });
}

function renderPage(num) {
  pdfDoc.getPage(num).then((page) => {
    const canvas = document.getElementById('pdf-render');
    const context = canvas.getContext('2d');
    const viewport = page.getViewport({ scale: 1.5 });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    page.render({
      canvasContext: context,
      viewport: viewport
    });
  });
}

document.getElementById('load-pdf').addEventListener('click', () => {
  const fileInput = document.getElementById('pdf-file');
  const urlInput = document.getElementById('pdf-url');
  let pdfUrl = '';

  if (fileInput.files[0]) {
    // Use FileReader to load the uploaded file as a URL
    const reader = new FileReader();
    reader.onload = () => {
      pdfUrl = reader.result;
      if (isAdmin) {
        socket.send(JSON.stringify({ type: 'loadPdf', pdfUrl }));
      }
      loadPdf(pdfUrl);
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else if (urlInput.value) {
    pdfUrl = urlInput.value;
    if (isAdmin) {
      socket.send(JSON.stringify({ type: 'loadPdf', pdfUrl }));
    }
    loadPdf(pdfUrl);
  }
});

document.getElementById('prevPage').addEventListener('click', () => {
  if (isAdmin && pageNum > 1) {
    pageNum--;
    renderPage(pageNum);
    socket.send(JSON.stringify({ type: 'changePage', page: pageNum }));
  }
});

document.getElementById('nextPage').addEventListener('click', () => {
  if (isAdmin && pageNum < pdfDoc.numPages) {
    pageNum++;
    renderPage(pageNum);
    socket.send(JSON.stringify({ type: 'changePage', page: pageNum }));
  }
});
