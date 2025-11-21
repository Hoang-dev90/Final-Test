class PuzzleGame {
  constructor() {
    this.gridSize = { rows: 4, cols: 3 }; // 4 hàng x 3 cột
    this.totalPieces = this.gridSize.rows * this.gridSize.cols;
    this.emptyPosition = null; // Sẽ được đặt khi bắt đầu game
    this.selectedPiece = null;
    this.gameStarted = false;
    this.startTime = null;
    this.timerInterval = null;
    this.moves = 0;
    this.completedGames = []; // Lưu các lượt chơi đã hoàn thành
    this.removedPiece = null; // Mảnh được di chuyển ra ngoài

    this.setupEventListeners();

    // Đảm bảo đồng hồ hiển thị 00:00 ban đầu
    document.addEventListener("DOMContentLoaded", () => {
      document.getElementById("timer").textContent = "00:00";
    });

    this.updateTimer();
  }

  async startGame() {
    const btn = document.getElementById("start-btn");

    // Nếu game đang chơi, dừng game
    if (this.gameStarted) {
      this.endGame();
      return;
    }

    // Dừng đồng hồ cũ nếu có
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    // Reset tất cả trạng thái game
    this.gameStarted = false;
    this.startTime = null;
    this.moves = 0;
    this.selectedPiece = null;

    // Hiển thị 00:00 trước khi bắt đầu
    document.getElementById("timer").textContent = "00:00";

    // Clear selection nếu có
    this.clearSelection();

    // Xóa mảnh cũ khỏi khu vực bên ngoài
    const removedArea = document.getElementById("removed-piece-area");
    removedArea.innerHTML = "";

    // Di chuyển mảnh ngẫu nhiên ra ngoài
    this.removePiece12();

    // Hiển thị đang trộn
    btn.textContent = "Đang trộn...";
    btn.disabled = true;

    // Trộn các mảnh 100 lần với delay
    await this.shufflePuzzleMultipleTimes(100);

    // Bắt đầu game và đồng hồ
    this.gameStarted = true;
    this.startTime = Date.now();

    // Khởi động đồng hồ mới
    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, 1000);

    btn.textContent = "Kết thúc";
    btn.disabled = false;
  }

  endGame() {
    // Dừng đồng hồ
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    // Dừng game
    this.gameStarted = false;

    // Đổi nút về Bắt đầu
    const btn = document.getElementById("start-btn");
    btn.textContent = "Bắt đầu";

    // Clear selection
    this.clearSelection();
  }

  removePiece12() {
    const pieces = document.querySelectorAll(".puzzle-piece");
    let piece12Position = -1;
    let piece12Content = "";

    // Tìm vị trí của piece-12.jpg
    for (let i = 0; i < pieces.length; i++) {
      const img = pieces[i].querySelector("img");
      if (img && img.src.includes("piece-12.jpg")) {
        piece12Position = i;
        piece12Content = pieces[i].innerHTML;
        break;
      }
    }

    // Nếu không tìm thấy piece-12, lấy ô cuối cùng
    if (piece12Position === -1) {
      piece12Position = this.totalPieces - 1;
      piece12Content = pieces[piece12Position].innerHTML;
    }

    // Tạo ô trống tại vị trí piece-12
    pieces[piece12Position].innerHTML = "";
    pieces[piece12Position].classList.add("empty-piece");
    this.emptyPosition = piece12Position;

    // Di chuyển piece-12 ra khu vực bên ngoài
    const removedArea = document.getElementById("removed-piece-area");
    const removedPieceDiv = document.createElement("div");
    removedPieceDiv.className = "removed-piece";
    removedPieceDiv.innerHTML = piece12Content;
    removedArea.appendChild(removedPieceDiv);

    this.removedPiece = removedPieceDiv;
    this.removedPieceOriginalPosition = piece12Position;
  }

  shufflePuzzle() {
    const pieces = document.querySelectorAll(".puzzle-piece");
    const pieceContents = [];

    // Lưu nội dung của 11 mảnh (trừ ô trống)
    for (let i = 0; i < this.totalPieces; i++) {
      if (
        i !== this.emptyPosition &&
        !pieces[i].classList.contains("empty-piece")
      ) {
        pieceContents.push(pieces[i].innerHTML);
      }
    }

    // Trộn mảng nội dung
    for (let i = pieceContents.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieceContents[i], pieceContents[j]] = [
        pieceContents[j],
        pieceContents[i],
      ];
    }

    // Áp dụng nội dung đã trộn vào các ô (trừ ô trống)
    let contentIndex = 0;
    for (let i = 0; i < this.totalPieces; i++) {
      if (i !== this.emptyPosition) {
        pieces[i].innerHTML = pieceContents[contentIndex];
        pieces[i].classList.remove("empty-piece");
        pieces[i].dataset.position = i;
        contentIndex++;
      }
    }
  }

  async shufflePuzzleMultipleTimes(times) {
    // Thực hiện các bước di chuyển ngẫu nhiên hợp lệ với delay
    for (let i = 0; i < times; i++) {
      const emptyRow = Math.floor(this.emptyPosition / this.gridSize.cols);
      const emptyCol = this.emptyPosition % this.gridSize.cols;
      const validMoves = [];

      // Kiểm tra các hướng di chuyển hợp lệ
      if (emptyRow > 0) {
        validMoves.push(this.emptyPosition - this.gridSize.cols); // Lên
      }
      if (emptyRow < this.gridSize.rows - 1) {
        validMoves.push(this.emptyPosition + this.gridSize.cols); // Xuống
      }
      if (emptyCol > 0) {
        validMoves.push(this.emptyPosition - 1); // Trái
      }
      if (emptyCol < this.gridSize.cols - 1) {
        validMoves.push(this.emptyPosition + 1); // Phải
      }

      // Chọn ngẫu nhiên một bước di chuyển hợp lệ
      if (validMoves.length > 0) {
        const randomMove =
          validMoves[Math.floor(Math.random() * validMoves.length)];
        this.swapPieces(this.emptyPosition, randomMove);

        // Thêm delay để nhìn thấy sự di chuyển (30ms mỗi lần)
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
    }
  }

  handlePieceClick(clickedIndex) {
    if (!this.gameStarted) return;

    const pieces = document.querySelectorAll(".puzzle-piece");
    const clickedPiece = pieces[clickedIndex];

    // Nếu click vào ô trống, bỏ chọn piece hiện tại
    if (clickedPiece.classList.contains("empty-piece")) {
      this.clearSelection();
      return;
    }

    // Nếu đã có piece được chọn
    if (this.selectedPiece !== null) {
      if (this.selectedPiece === clickedIndex) {
        this.clearSelection();
      } else {
        this.tryMovePiece(this.selectedPiece, clickedIndex);
      }
    } else {
      this.selectPiece(clickedIndex);
    }
  }

  selectPiece(index) {
    this.clearSelection();
    this.selectedPiece = index;
    const pieces = document.querySelectorAll(".puzzle-piece");
    pieces[index].classList.add("selected");
  }

  clearSelection() {
    if (this.selectedPiece !== null) {
      const pieces = document.querySelectorAll(".puzzle-piece");
      pieces[this.selectedPiece].classList.remove("selected");
      this.selectedPiece = null;
    }
  }

  tryMovePiece(fromIndex, toIndex) {
    if (this.canMovePiece(fromIndex, toIndex)) {
      this.swapPieces(fromIndex, toIndex);
      this.moves++;
      this.clearSelection();

      if (this.checkWin()) {
        this.gameWon();
      }
    }
  }

  canMovePiece(fromIndex, toIndex) {
    // Chỉ có thể di chuyển nếu một trong hai là ô trống
    const pieces = document.querySelectorAll(".puzzle-piece");
    return (
      pieces[fromIndex].classList.contains("empty-piece") ||
      pieces[toIndex].classList.contains("empty-piece")
    );
  }

  swapPieces(index1, index2) {
    const pieces = document.querySelectorAll(".puzzle-piece");
    const piece1 = pieces[index1];
    const piece2 = pieces[index2];

    // Hoán đổi nội dung
    const tempHTML = piece1.innerHTML;
    const tempClasses = piece1.className;

    piece1.innerHTML = piece2.innerHTML;
    piece1.className = piece2.className;
    piece1.dataset.position = index1;

    piece2.innerHTML = tempHTML;
    piece2.className = tempClasses;
    piece2.dataset.position = index2;

    // Cập nhật vị trí ô trống
    if (piece1.classList.contains("empty-piece")) {
      this.emptyPosition = index1;
    } else if (piece2.classList.contains("empty-piece")) {
      this.emptyPosition = index2;
    }
  }

  checkWin() {
    // Kiểm tra xem các mảnh có đúng thứ tự không
    const pieces = document.querySelectorAll(".puzzle-piece");
    for (let i = 0; i < this.totalPieces - 1; i++) {
      const img = pieces[i].querySelector("img");
      if (!img) return false;

      const expectedPiece = `piece-${i + 1}.jpg`;
      if (!img.src.includes(expectedPiece)) {
        return false;
      }
    }
    return pieces[this.totalPieces - 1].classList.contains("empty-piece");
  }

  gameWon() {
    this.gameStarted = false;
    clearInterval(this.timerInterval);

    // Trả mảnh thứ 12 về vị trí ô trống hiện tại
    const pieces = document.querySelectorAll(".puzzle-piece");
    const emptyPiece = pieces[this.emptyPosition];
    emptyPiece.innerHTML = this.removedPiece.innerHTML;
    emptyPiece.classList.remove("empty-piece");

    // Xóa mảnh khỏi khu vực bên ngoài
    const removedArea = document.getElementById("removed-piece-area");
    removedArea.innerHTML = "";

    const time = this.formatTime((Date.now() - this.startTime) / 1000);

    // Lưu lượt chơi vào lịch sử
    this.completedGames.push({
      gameNumber: this.completedGames.length + 1,
      moves: this.moves,
      time: time,
    });

    // Cập nhật hiển thị lịch sử
    this.updateHistoryDisplay();

    // Hiển thị overlay thắng với hiệu ứng pháo hoa
    setTimeout(() => {
      this.showWinOverlay(time, this.moves);
    }, 500);

    // Reset nút và cho phép chơi lại
    document.getElementById("start-btn").textContent = "Bắt đầu";

    // Reset các trạng thái
    this.emptyPosition = null;
    this.removedPiece = null;
    this.selectedPiece = null;
  }

  updateTimer() {
    if (!this.gameStarted) {
      document.getElementById("timer").textContent = "00:00";
      return;
    }

    const elapsed = (Date.now() - this.startTime) / 1000;
    document.getElementById("timer").textContent = this.formatTime(elapsed);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  showWinOverlay(time, moves) {
    const overlay = document.getElementById("win-overlay");
    document.getElementById("final-time").textContent = time;
    document.getElementById("final-moves").textContent = moves;
    overlay.classList.add("show");

    // Bắt đầu hiệu ứng pháo hoa
    this.startFireworks();
  }

  startFireworks() {
    const canvas = document.getElementById("fireworks-canvas");
    const ctx = canvas.getContext("2d");
    const puzzleArea = canvas.parentElement;
    canvas.width = puzzleArea.offsetWidth;
    canvas.height = puzzleArea.offsetHeight;

    const particles = [];

    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = {
          x: (Math.random() - 0.5) * 8,
          y: (Math.random() - 0.5) * 8,
        };
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.01;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      update() {
        this.velocity.y += 0.1;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= this.decay;
      }
    }

    function createFirework() {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.5;
      const colors = [
        "#ff0000",
        "#00ff00",
        "#0000ff",
        "#ffff00",
        "#ff00ff",
        "#00ffff",
        "#ff8800",
        "#ff0088",
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];

      for (let i = 0; i < 80; i++) {
        particles.push(new Particle(x, y, color));
      }
    }

    function animate() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
          particles.splice(index, 1);
        } else {
          particle.update();
          particle.draw();
        }
      });

      if (Math.random() < 0.1) {
        createFirework();
      }

      requestAnimationFrame(animate);
    }

    animate();
  }

  updateHistoryDisplay() {
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = "";

    this.completedGames.forEach((game) => {
      const historyItem = document.createElement("div");
      historyItem.className = "history-item";
      historyItem.innerHTML = `
        <span>${game.gameNumber}</span>
        <span>${game.moves} bước</span>
        <span>${game.time}</span>
      `;
      historyList.appendChild(historyItem);
    });
  }

  setupEventListeners() {
    document.getElementById("start-btn").addEventListener("click", () => {
      this.startGame();
    });

    // Đóng overlay thắng
    document.getElementById("close-win").addEventListener("click", () => {
      document.getElementById("win-overlay").classList.remove("show");
    });

    // Thêm event listeners cho các ô puzzle
    document.addEventListener("DOMContentLoaded", () => {
      const pieces = document.querySelectorAll(".puzzle-piece");
      pieces.forEach((piece, index) => {
        piece.addEventListener("click", () => this.handlePieceClick(index));
      });
    });

    // Keyboard controls - Di chuyển ô đen (ô trống)
    document.addEventListener("keydown", (e) => {
      if (!this.gameStarted || this.emptyPosition === null) return;

      const emptyRow = Math.floor(this.emptyPosition / this.gridSize.cols);
      const emptyCol = this.emptyPosition % this.gridSize.cols;
      let targetIndex = -1;

      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          // Bấm W/↑: Di chuyển ô đen lên => hoán đổi với ô phía trên
          if (emptyRow > 0) {
            targetIndex = this.emptyPosition - this.gridSize.cols;
          }
          break;
        case "s":
        case "arrowdown":
          // Bấm S/↓: Di chuyển ô đen xuống => hoán đổi với ô phía dưới
          if (emptyRow < this.gridSize.rows - 1) {
            targetIndex = this.emptyPosition + this.gridSize.cols;
          }
          break;
        case "a":
        case "arrowleft":
          // Bấm A/←: Di chuyển ô đen sang trái => hoán đổi với ô bên trái
          if (emptyCol > 0) {
            targetIndex = this.emptyPosition - 1;
          }
          break;
        case "d":
        case "arrowright":
          // Bấm D/→: Di chuyển ô đen sang phải => hoán đổi với ô bên phải
          if (emptyCol < this.gridSize.cols - 1) {
            targetIndex = this.emptyPosition + 1;
          }
          break;
      }

      if (targetIndex >= 0 && targetIndex < this.totalPieces) {
        e.preventDefault();
        // Hoán đổi ô đen với ô mục tiêu
        this.swapPieces(this.emptyPosition, targetIndex);
        this.moves++;

        if (this.checkWin()) {
          this.gameWon();
        }
      }
    });
  }
}

// Khởi tạo game khi trang web load
document.addEventListener("DOMContentLoaded", () => {
  const game = new PuzzleGame();

  // Thêm event listeners cho các ô puzzle
  const pieces = document.querySelectorAll(".puzzle-piece");
  pieces.forEach((piece, index) => {
    piece.addEventListener("click", () => game.handlePieceClick(index));
  });
});
