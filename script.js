
"use strict";

// ==========================================
// EDUPLAY - MAIN GAME SCRIPT
// ==========================================


// ==========================================
// GAME STATE
// ==========================================

let selectedTeam = "A";

let players = [];

let currentRound = 0;
let currentQuestion = 0;

let totalScore = 0;
let totalCorrect = 0;
let totalWrong = 0;

let roundScore = 0;
let roundCorrect = 0;
let roundWrong = 0;

let timerInterval = null;
let remainingTime = 0;

let timerEnabled = true;
let timerDuration = 30;

let gameStartedAt = null;
let roundStartedAt = null;

let isAnswered = false;
let gameActive = false;


// ==========================================
// CAMERA STATE
// ==========================================

let cameraStream = null;

let activePlayerIndex = null;

let capturedPhoto = null;


// ==========================================
// GET ELEMENTS
// ==========================================

const $ = (id) => document.getElementById(id);


const setupScreen = $("setupScreen");
const gameScreen = $("gameScreen");
const roundResultScreen = $("roundResultScreen");
const finalScreen = $("finalScreen");

const playerList = $("playerList");

const timerToggle = $("timerToggle");
const timerSetting = $("timerSetting");
const timerDurationSelect = $("timerDuration");

const roundLabel = $("roundLabel");
const roundTitle = $("roundTitle");

const gameTeamName = $("gameTeamName");
const gameScore = $("gameScore");
const gamePlayers = $("gamePlayers");

const questionCounter = $("questionCounter");
const progressPercent = $("progressPercent");
const progressBar = $("progressBar");

const questionNumber = $("questionNumber");
const questionText = $("questionText");

const optionsContainer = $("optionsContainer");

const timerDisplay = $("timerDisplay");
const timerText = $("timerText");

const answerFeedback = $("answerFeedback");
const nextButton = $("nextButton");

const continueButton = $("continueButton");
const restartButton = $("restartButton");

const cameraModal = $("cameraModal");

const cameraVideo = $("cameraVideo");
const cameraCanvas = $("cameraCanvas");

const cameraError = $("cameraError");

const capturePhotoButton = $("capturePhoto");
const retakePhotoButton = $("retakePhoto");
const savePhotoButton = $("savePhoto");

const closeCameraButton = $("closeCamera");


// ==========================================
// CREATE PLAYER FORMS
// ==========================================

function createPlayerForms() {

    playerList.innerHTML = "";

    players = Array.from({ length: 5 }, () => ({
        name: "",
        photo: null
    }));


    for (let i = 0; i < 5; i++) {

        const item = document.createElement("div");

        item.className = "player-item";

        item.innerHTML = `
            <div class="player-avatar" id="avatar-${i}">
                ${i + 1}
            </div>

            <div class="player-fields">

                <label>PEMAIN ${i + 1}</label>

                <input
                    type="text"
                    id="player-name-${i}"
                    placeholder="Masukkan nama pemain"
                    maxlength="35"
                    autocomplete="off"
                >

                <button
                    type="button"
                    class="camera-trigger"
                    data-player="${i}"
                >
                    📷 Ambil Foto
                </button>

            </div>
        `;

        playerList.appendChild(item);

    }


    // EVENT KAMERA PEMAIN

    document.querySelectorAll(".camera-trigger").forEach(button => {

        button.addEventListener("click", function () {

            const index = Number(this.dataset.player);

            openCamera(index);

        });

    });

}


// ==========================================
// SELECT TEAM
// ==========================================

document.querySelectorAll(".team-option").forEach(button => {

    button.addEventListener("click", function () {

        document.querySelectorAll(".team-option").forEach(item => {

            item.classList.remove("selected");

        });

        this.classList.add("selected");

        selectedTeam = this.dataset.team;

    });

});


// ==========================================
// TIMER SETTINGS
// ==========================================

timerToggle.addEventListener("change", function () {

    timerEnabled = this.checked;

    timerSetting.style.display = timerEnabled ? "flex" : "none";

});


timerDurationSelect.addEventListener("change", function () {

    timerDuration = Number(this.value);

});


// ==========================================
// CAMERA - OPEN
// ==========================================

async function openCamera(playerIndex) {

    if (cameraStream) {

        stopCamera();

    }


    activePlayerIndex = playerIndex;

    capturedPhoto = null;


    cameraError.classList.add("hidden");

    cameraCanvas.classList.add("hidden");

    cameraVideo.classList.remove("hidden");


    capturePhotoButton.classList.remove("hidden");

    retakePhotoButton.classList.add("hidden");

    savePhotoButton.classList.add("hidden");


    cameraModal.classList.remove("hidden");


    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        showCameraError(
            "Browser tidak mendukung kamera. Gunakan Chrome terbaru melalui HTTPS atau localhost."
        );

        return;

    }


    try {

        cameraStream = await navigator.mediaDevices.getUserMedia({

            video: {
                facingMode: "user",

                width: {
                    ideal: 1280
                },

                height: {
                    ideal: 960
                }

            },

            audio: false

        });


        cameraVideo.srcObject = cameraStream;

        await cameraVideo.play();


    } catch (error) {

        console.error("Camera error:", error);

        let message = "Kamera tidak dapat dibuka.";


        if (error.name === "NotAllowedError") {

            message =
                "Izin kamera ditolak. Izinkan akses kamera melalui pengaturan browser.";

        } else if (error.name === "NotFoundError") {

            message =
                "Kamera tidak ditemukan. Pastikan laptop memiliki webcam.";

        } else if (error.name === "NotReadableError") {

            message =
                "Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut.";

        } else if (error.name === "OverconstrainedError") {

            message =
                "Pengaturan kamera tidak didukung perangkat ini. Coba gunakan kamera standar.";

        }


        showCameraError(message);

    }

}


// ==========================================
// CAMERA - ERROR
// ==========================================

function showCameraError(message) {

    cameraError.textContent = message;

    cameraError.classList.remove("hidden");

}


// ==========================================
// CAMERA - CAPTURE PHOTO
// ==========================================

capturePhotoButton.addEventListener("click", function () {

    if (
        !cameraStream ||
        !cameraVideo.videoWidth ||
        !cameraVideo.videoHeight
    ) {

        showCameraError(
            "Kamera belum siap. Tunggu beberapa saat lalu coba lagi."
        );

        return;

    }


    const context = cameraCanvas.getContext("2d");


    cameraCanvas.width = cameraVideo.videoWidth;

    cameraCanvas.height = cameraVideo.videoHeight;


    // Mirror preview agar seperti bercermin.

    context.save();

    context.translate(cameraCanvas.width, 0);

    context.scale(-1, 1);


    context.drawImage(

        cameraVideo,

        0,
        0,

        cameraCanvas.width,
        cameraCanvas.height

    );


    context.restore();


    capturedPhoto = cameraCanvas.toDataURL(
        "image/jpeg",
        0.8
    );


    cameraVideo.classList.add("hidden");

    cameraCanvas.classList.remove("hidden");


    capturePhotoButton.classList.add("hidden");

    retakePhotoButton.classList.remove("hidden");

    savePhotoButton.classList.remove("hidden");

});


// ==========================================
// CAMERA - RETAKE
// ==========================================

retakePhotoButton.addEventListener("click", function () {

    capturedPhoto = null;


    cameraCanvas.classList.add("hidden");

    cameraVideo.classList.remove("hidden");


    capturePhotoButton.classList.remove("hidden");

    retakePhotoButton.classList.add("hidden");

    savePhotoButton.classList.add("hidden");

});


// ==========================================
// CAMERA - SAVE PHOTO
// ==========================================

savePhotoButton.addEventListener("click", function () {

    if (
        !capturedPhoto ||
        activePlayerIndex === null
    ) {

        return;

    }


    const index = activePlayerIndex;


    players[index].photo = capturedPhoto;


    const avatar = $(`avatar-${index}`);

    avatar.innerHTML = "";


    const image = document.createElement("img");

    image.src = capturedPhoto;

    image.alt = `Foto pemain ${index + 1}`;


    avatar.appendChild(image);


    closeCamera();

});


// ==========================================
// CAMERA - STOP
// ==========================================

function stopCamera() {

    if (cameraStream) {

        cameraStream.getTracks().forEach(track => {

            track.stop();

        });

        cameraStream = null;

    }


    cameraVideo.srcObject = null;

}


// ==========================================
// CAMERA - CLOSE
// ==========================================

function closeCamera() {

    stopCamera();


    cameraModal.classList.add("hidden");


    activePlayerIndex = null;

    capturedPhoto = null;

}


closeCameraButton.addEventListener("click", closeCamera);


cameraModal.addEventListener("click", function (event) {

    if (event.target === cameraModal) {

        closeCamera();

    }

});


// ==========================================
// STOP CAMERA WHEN PAGE IS HIDDEN
// ==========================================

document.addEventListener("visibilitychange", function () {

    if (document.hidden && cameraStream) {

        closeCamera();

    }

});


// ==========================================
// SHOW SCREEN
// ==========================================

function showScreen(screen) {

    document.querySelectorAll(".screen").forEach(item => {

        item.classList.remove("active");

    });


    screen.classList.add("active");


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// ==========================================
// START GAME
// ==========================================

$("startButton").addEventListener("click", startGame);


function startGame() {

    if (
        typeof QUESTION_ROUNDS === "undefined" ||
        !Array.isArray(QUESTION_ROUNDS) ||
        QUESTION_ROUNDS.length === 0
    ) {

        alert("Data soal tidak ditemukan. Periksa file questions.js.");

        return;

    }


    if (
        QUESTION_ROUNDS.some(round =>
            !Array.isArray(round.questions) ||
            round.questions.length === 0
        )
    ) {

        alert("Data soal tidak lengkap.");

        return;

    }


    const names = [];


    // VALIDASI NAMA PEMAIN

    for (let i = 0; i < 5; i++) {

        const input = $(`player-name-${i}`);

        const name = input.value.trim();


        if (!name) {

            alert(`Nama pemain ${i + 1} belum diisi.`);

            input.focus();

            return;

        }


        names.push(name);

    }


    // VALIDASI FOTO TIDAK WAJIB

    players = players.map((player, index) => ({

        name: names[index],

        photo: player.photo || null

    }));


    // PENGATURAN GAME

    timerEnabled = timerToggle.checked;

    timerDuration = Number(timerDurationSelect.value);


    // RESET SCORE

    currentRound = 0;

    currentQuestion = 0;


    totalScore = 0;

    totalCorrect = 0;

    totalWrong = 0;


    gameStartedAt = Date.now();

    gameActive = true;


    renderGamePlayers();

    startRound();

}


// ==========================================
// RENDER GAME PLAYERS
// ==========================================

function renderGamePlayers() {

    gamePlayers.innerHTML = "";


    players.forEach((player, index) => {

        const item = document.createElement("div");

        item.className = "game-player";


        if (player.photo) {

            const image = document.createElement("img");

            image.src = player.photo;

            image.alt = player.name;

            item.appendChild(image);

        } else {

            const avatar = document.createElement("span");

            avatar.className = "mini-avatar";

            avatar.textContent = index + 1;

            item.appendChild(avatar);

        }


        const name = document.createElement("span");

        name.textContent = player.name;


        item.appendChild(name);

        gamePlayers.appendChild(item);

    });

}


// ==========================================
// START ROUND
// ==========================================

function startRound() {

    clearTimer();


    currentQuestion = 0;


    roundScore = 0;

    roundCorrect = 0;

    roundWrong = 0;


    roundStartedAt = Date.now();


    gameTeamName.textContent = `TIM ${selectedTeam}`;


    showScreen(gameScreen);


    renderQuestion();

}


// ==========================================
// RENDER QUESTION
// ==========================================

function renderQuestion() {

    clearTimer();


    isAnswered = false;


    const round = QUESTION_ROUNDS[currentRound];

    const question = round.questions[currentQuestion];


    const totalQuestions = round.questions.length;

    const questionPosition = currentQuestion + 1;

    const progress =
        (questionPosition / totalQuestions) * 100;


    // INFORMASI BABAK

    roundLabel.textContent = `BABAK ${currentRound + 1}`;

    roundTitle.textContent = round.title;


    // SKOR

    gameScore.innerHTML = `${totalScore} <span>PTS</span>`;


    // PROGRESS

    questionCounter.textContent =
        `Pertanyaan ${questionPosition} dari ${totalQuestions}`;

    questionNumber.textContent =
        `SOAL ${String(questionPosition).padStart(2, "0")}`;

    progressPercent.textContent =
        `${Math.round(progress)}%`;

    progressBar.style.width =
        `${progress}%`;


    // SOAL

    questionText.textContent = question.question;


    // RESET PILIHAN

    optionsContainer.innerHTML = "";


    answerFeedback.textContent = "";

    answerFeedback.className =
        "answer-feedback hidden";


    nextButton.classList.add("hidden");


    // RENDER OPTIONS

    question.options.forEach((option, index) => {

        const button = document.createElement("button");

        button.type = "button";

        button.className = "option-button";


        const letter = String.fromCharCode(65 + index);


        const letterElement = document.createElement("span");

        letterElement.className = "option-letter";

        letterElement.textContent = letter;


        const textElement = document.createElement("span");

        textElement.textContent = option;


        button.appendChild(letterElement);

        button.appendChild(textElement);


        button.addEventListener("click", function () {

            selectAnswer(index);

        });


        optionsContainer.appendChild(button);

    });


    // TIMER

    if (timerEnabled) {

        timerDisplay.classList.remove("hidden");

        startTimer();

    } else {

        timerDisplay.classList.add("hidden");

    }

}


// ==========================================
// TIMER
// ==========================================

function startTimer() {

    remainingTime = timerDuration;


    updateTimerDisplay();


    timerInterval = setInterval(() => {

        remainingTime--;


        updateTimerDisplay();


        if (remainingTime <= 0) {

            clearTimer();

            timeIsUp();

        }

    }, 1000);

}


function updateTimerDisplay() {

    timerText.textContent = remainingTime;


    if (remainingTime <= 10) {

        timerDisplay.classList.add("warning");

    } else {

        timerDisplay.classList.remove("warning");

    }

}


function clearTimer() {

    if (timerInterval !== null) {

        clearInterval(timerInterval);

        timerInterval = null;

    }

}


// ==========================================
// SELECT ANSWER
// ==========================================

function selectAnswer(selectedIndex) {

    if (isAnswered || !gameActive) {

        return;

    }


    const question = QUESTION_ROUNDS[currentRound]
        .questions[currentQuestion];


    const isCorrect =
        selectedIndex === question.answer;


    processAnswer(isCorrect, selectedIndex);

}


// ==========================================
// TIME IS UP
// ==========================================

function timeIsUp() {

    if (isAnswered || !gameActive) {

        return;

    }


    processAnswer(false, null, true);

}


// ==========================================
// PROCESS ANSWER
// ==========================================

function processAnswer(
    isCorrect,
    selectedIndex,
    timeout = false
) {

    if (isAnswered || !gameActive) {

        return;

    }


    isAnswered = true;


    clearTimer();


    const question = QUESTION_ROUNDS[currentRound]
        .questions[currentQuestion];


    const optionButtons =
        optionsContainer.querySelectorAll(".option-button");


    // KUNCI SEMUA JAWABAN

    optionButtons.forEach((button, index) => {

        button.disabled = true;


        // JAWABAN BENAR

        if (index === question.answer) {

            button.classList.add("correct");

        }


        // JAWABAN YANG DIPILIH TAPI SALAH

        if (
            selectedIndex !== null &&
            index === selectedIndex &&
            !isCorrect
        ) {

            button.classList.add("wrong");

        }

    });


    // HITUNG SKOR

    if (isCorrect) {

        totalScore += 10;

        roundScore += 10;


        totalCorrect++;

        roundCorrect++;


        answerFeedback.textContent =
            "Benar! Tim kalian mendapatkan 10 poin.";


        answerFeedback.className =
            "answer-feedback success";

    } else {

        totalWrong++;

        roundWrong++;


        if (timeout) {

            answerFeedback.textContent =
                "⏰ Waktu habis! Jawaban yang benar sudah ditampilkan.";

        } else {

            answerFeedback.textContent =
                "Belum tepat. Yuk, pelajari jawaban yang benar!";

        }


        answerFeedback.className =
            "answer-feedback error";

    }


    // UPDATE SKOR

    gameScore.innerHTML =
        `${totalScore} <span>PTS</span>`;


    // TOMBOL LANJUT

    nextButton.classList.remove("hidden");


    const totalQuestions =
        QUESTION_ROUNDS[currentRound].questions.length;


    const isLastQuestion =
        currentQuestion === totalQuestions - 1;


    nextButton.innerHTML = isLastQuestion
        ? "Selesaikan Babak <span>✓</span>"
        : "Pertanyaan Berikutnya <span>→</span>";

}


// ==========================================
// NEXT QUESTION
// ==========================================

nextButton.addEventListener("click", nextQuestion);


function nextQuestion() {

    if (!isAnswered || !gameActive) {

        return;

    }


    const totalQuestions =
        QUESTION_ROUNDS[currentRound].questions.length;


    if (currentQuestion < totalQuestions - 1) {

        currentQuestion++;

        renderQuestion();

    } else {

        showRoundResult();

    }

}


// ==========================================
// ROUND RESULT
// ==========================================

function showRoundResult() {

    clearTimer();


    const elapsed = Math.floor(

        (Date.now() - roundStartedAt) / 1000

    );


    $("roundResultLabel").textContent =
        `BABAK ${currentRound + 1} SELESAI`;


    $("roundResultDescription").textContent =
        `Tim ${selectedTeam} berhasil menyelesaikan ${QUESTION_ROUNDS[currentRound].questions.length} pertanyaan.`;


    $("roundScore").textContent = roundScore;

    $("roundCorrect").textContent = roundCorrect;

    $("roundWrong").textContent = roundWrong;


    $("roundTime").textContent =
        formatTime(elapsed);


    if (currentRound < QUESTION_ROUNDS.length - 1) {

        continueButton.innerHTML =
            "Lanjut ke Babak Berikutnya <span>→</span>";

    } else {

        continueButton.innerHTML =
            "Lihat Hasil Akhir <span>🏆</span>";

    }


    showScreen(roundResultScreen);

}


// ==========================================
// CONTINUE ROUND
// ==========================================

continueButton.addEventListener("click", function () {

    if (!gameActive) {

        return;

    }


    if (currentRound < QUESTION_ROUNDS.length - 1) {

        currentRound++;

        startRound();

    } else {

        showFinalResult();

    }

});


// ==========================================
// FINAL RESULT
// ==========================================

function showFinalResult() {

    clearTimer();


    gameActive = false;


    const totalElapsed = Math.floor(

        (Date.now() - gameStartedAt) / 1000

    );


    $("finalScore").textContent = totalScore;

    $("finalCorrect").textContent = totalCorrect;

    $("finalWrong").textContent = totalWrong;


    $("finalTime").textContent =
        formatTime(totalElapsed);


    showScreen(finalScreen);

}


// ==========================================
// FORMAT TIME
// ==========================================

function formatTime(seconds) {

    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds % 60;


    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;

}


// ==========================================
// RESTART GAME
// ==========================================

restartButton.addEventListener("click", function () {

    clearTimer();

    closeCamera();


    gameActive = false;


    currentRound = 0;

    currentQuestion = 0;


    totalScore = 0;

    totalCorrect = 0;

    totalWrong = 0;


    roundScore = 0;

    roundCorrect = 0;

    roundWrong = 0;


    // RESET TIMERS

    timerToggle.checked = true;

    timerEnabled = true;


    timerSetting.style.display = "flex";


    timerDurationSelect.value = "30";

    timerDuration = 30;


    // RESET TIM

    selectedTeam = "A";


    document.querySelectorAll(".team-option").forEach(button => {

        button.classList.toggle(
            "selected",
            button.dataset.team === "A"
        );

    });


    // RESET FORM PEMAIN

    createPlayerForms();


    showScreen(setupScreen);

});


// ==========================================
// INITIALIZATION
// ==========================================

function initializeGame() {

    if (
        typeof QUESTION_ROUNDS === "undefined" ||
        !Array.isArray(QUESTION_ROUNDS)
    ) {

        alert(
            "File questions.js tidak ditemukan atau memiliki kesalahan."
        );

        return;

    }


    createPlayerForms();


    timerEnabled = timerToggle.checked;

    timerDuration = Number(timerDurationSelect.value);


    timerSetting.style.display =
        timerEnabled ? "flex" : "none";

}


initializeGame();

