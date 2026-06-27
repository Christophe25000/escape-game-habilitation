/****************************************************
 * VARIABLES GLOBALES
 ****************************************************/
let playerName = "";
let scoreTableau1 = 0;
let scoreTableau2 = 0;

let timerInterval;
let totalSeconds = 0;

let pauseUsed = false;   // Pause unique pour tout le jeu
let resumeUsed = false;

let currentQuestion = 1;
let codeFinal = ["_", "_", "_", "_", "_", "_", "_", "_", "_", "_"];

let tableau1Termine = false;
let cadenasOuvert = false;
let tableau2Commence = false;
let tableau2Termine = false;

/****************************************************
 * SAUVEGARDE AUTOMATIQUE
 ****************************************************/
function saveGame() {
    const save = {
        playerName,
        scoreTableau1,
        scoreTableau2,
        totalSeconds,
        pauseUsed,
        resumeUsed,
        currentQuestion,
        codeFinal,
        tableau1Termine,
        cadenasOuvert,
        tableau2Commence,
        tableau2Termine,
        crossword: getCrosswordState()
    };

    localStorage.setItem("escapeGameSave", JSON.stringify(save));
}

function loadGame() {
    const data = localStorage.getItem("escapeGameSave");
    if (!data) return false;

    const save = JSON.parse(data);

    playerName = save.playerName;
    scoreTableau1 = save.scoreTableau1;
    scoreTableau2 = save.scoreTableau2;
    totalSeconds = save.totalSeconds;
    pauseUsed = save.pauseUsed;
    resumeUsed = save.resumeUsed;
    currentQuestion = save.currentQuestion;
    codeFinal = save.codeFinal;
    tableau1Termine = save.tableau1Termine;
    cadenasOuvert = save.cadenasOuvert;
    tableau2Commence = save.tableau2Commence;
    tableau2Termine = save.tableau2Termine;

    return save;
}

function getCrosswordState() {
    const inputs = document.querySelectorAll("#crossword input");
    if (!inputs.length) return null;

    return Array.from(inputs).map(i => i.value || "");
}

function restoreCrosswordState(state) {
    if (!state) return;

    const inputs = document.querySelectorAll("#crossword input");
    inputs.forEach((cell, i) => {
        if (!cell.disabled) cell.value = state[i] || "";
    });
}

/****************************************************
 * POPUP AFFICHAGE CHIFFRE + POSITION
 ****************************************************/
function showPopup(chiffre, position) {
    const popup = document.createElement("div");
    popup.id = "popup-info";

    popup.innerHTML = `
        <div class="popup-box">
            <h3>Bonne réponse !</h3>
            <p>Chiffre obtenu : <strong>${chiffre}</strong></p>
            <p>Position : <strong>${position}</strong></p>

            <button id="close-popup-btn">Question suivante</button>
        </div>
    `;

    document.body.appendChild(popup);

    document.getElementById("close-popup-btn").onclick = () => {
        popup.remove();
        nextQuestion();
        saveGame();
    };
}
function showErrorPopup() {
    const popup = document.getElementById("popupErreur");
    const popupImg = document.getElementById("popupErreurImg");
    const popupText = document.getElementById("popupErreurText");

    popupImg.src = "images/erreur.png";   // ton image d’erreur
    popupText.textContent = "Mauvaise réponse";

    popup.style.display = "block";

    setTimeout(() => {
        popup.style.display = "none";
    }, 4000);
}

/****************************************************
 * VALIDATION DU NOM
 ****************************************************/
function validateName() {
    const name = document.getElementById("player-name").value.trim();
    const session = document.getElementById("session-code").value.trim();

    if (name === "") {
        alert("Veuillez entrer votre nom et prénom.");
        return;
    }

    if (session === "") {
        alert("Veuillez entrer le code de session.");
        return;
    }

    // On stocke les infos
    playerName = name;
    window.currentSessionCode = session;

    // On ferme le popup
    document.getElementById("popup-name").style.display = "none";

    // On lance l’intro
    document.getElementById("intro-page").classList.remove("hidden");
}

/****************************************************
 * CHRONOMÈTRE
 ****************************************************/
function startTimer() {
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        totalSeconds++;
        document.getElementById("timer").innerText =
            "⏱ Temps : " +
            String(Math.floor(totalSeconds / 60)).padStart(2, "0") +
            ":" +
            String(totalSeconds % 60).padStart(2, "0");

        saveGame();
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function pauseGame() {
    if (pauseUsed) return;

    stopTimer();
    pauseUsed = true;

    const pauseBtn = document.getElementById("pause-btn");
    if (pauseBtn) pauseBtn.remove();

    // Bloquer la saisie dans la grille si on est sur le tableau 2
    const crossword = document.getElementById("crossword");
    if (crossword) {
        crossword.style.pointerEvents = "none";
    }

    // 1) Si on est dans le tableau 2 → bouton dans side-controls
    const side = document.getElementById("side-controls");
    if (side) {
        const resumeBtn = document.createElement("button");
        resumeBtn.id = "resume-btn";
        resumeBtn.textContent = "Poursuivre";
        resumeBtn.onclick = resumeGame;
        side.appendChild(resumeBtn);
    }

    // 2) Si on est dans le tableau 1 → bouton dans game-container
    else {
        const container = document.getElementById("game-container");
        const resumeBtn = document.createElement("button");
        resumeBtn.id = "resume-btn";
        resumeBtn.textContent = "Poursuivre";
        resumeBtn.onclick = resumeGame;
        container.appendChild(resumeBtn);
    }

    saveGame();
}

function resumeGame() {
    if (resumeUsed) return;

    resumeUsed = true;
    startTimer();

    const resumeBtn = document.getElementById("resume-btn");
    if (resumeBtn) resumeBtn.remove();

    const crossword = document.getElementById("crossword");
    if (crossword) {
        crossword.style.pointerEvents = "auto";
    }

    saveGame();
}

/****************************************************
 * DÉMARRAGE DU JEU
 ****************************************************/
function startGame() {
    // Affiche le nom du joueur dans le header
    document.getElementById("player-name-display").innerText =
        "Joueur : " + playerName;

    // Masque la page d’intro
    document.getElementById("intro-page").classList.add("hidden");

    // Lance le tableau 1
    loadTableau1();

    // Démarre le chrono
    startTimer();

    saveGame();
}

/****************************************************
 * TABLEAU 1 – QUESTIONS
 ****************************************************/
const questions = [
    {
        img: "images/q1_gants.jpg",
        text: "Quelle est la norme des gants d’électricien ?",
        answer: "EN60903",
        chiffre: 7,
        position: 5
    },
    {
        img: "images/q2_norme_nf_c_18510.jpg",
        text: "Quelle est la norme de référence pour l’habilitation électrique ?",
        answer: "NF C 18-510",
        chiffre: 3,
        position: 7
    },
    {
        img: "images/q3_habilitation_bs.jpg",
        text: "Quel symbole correspond au chargé d’intervention élémentaire ?",
        answer: "BS",
        chiffre: 9,
        position: 9
    },
    {
        img: "images/q4_habilitation_br.jpg",
        text: "Quel symbole correspond au chargé d’intervention générale ?",
        answer: "BR",
        chiffre: 1,
        position: 2
    },
    {
        img: "images/q5_habilitation_bc.jpg",
        text: "Quel symbole correspond au chargé de consignation BT ?",
        answer: "BC",
        chiffre: 4,
        position: 8
    },
    {
        img: "images/q6_canalisation.jpeg",
        text: "En présence de canalisation électrique 20kV, une zone d’approche prudente apparaît. Combien mesure la DLAP (Distance Limite d’Approche Prudente) ? (en cm)",
        answer: "50",
        chiffre: 8,
        position: 10
    },
    {
        img: "images/q7_canalisation.jpeg",
        text: "Quelle est la couleur du grillage avertisseur présent au-dessus d’une canalisation électrique enterrée ?",
        answer: "rouge",
        chiffre: 2,
        position: 3
    },
    {
        img: "images/q8_zone2.jpeg",
        text: "Zone d’environnement électrique : Si la tension présente dans mes cellules HT correspond à 20kV, combien mesure la DMA (Distance Minimale d’Approche) ? (en cm)",
        answer: "60",
        chiffre: 6,
        position: 6,
        large: true
    },
    {
        img: "images/q9_zone4.jpeg",
        text: "Zone d’environnement électrique : Si la tension présente dans mon armoire électrique correspond à 400V, combien mesure la DLVR (Distance Limite de Voisinage Renforcée) ? (en cm)",
        answer: "30",
        chiffre: 5,
        position: 1,
        large: true
    },
    {
        img: "images/q10_zone4.png",
        text: "Effet du courant sur le corps humain : Quel est le seuil de tétanisation musculaire en courant alternatif (en mA) ?",
        answer: "10",
        chiffre: 0,
        position: 4
    }
];

function loadTableau1() {
    if (tableau1Termine) {
        finishTableau1();
        return;
    }

    showQuestion();
}

function showQuestion() {
    const q = questions[currentQuestion - 1];

    document.getElementById("game-container").innerHTML = `
        <h2>Tableau 1 – Question ${currentQuestion}/10</h2>

        ${!pauseUsed ? `<button onclick="pauseGame()" id="pause-btn">⏸ Pause</button>` : ""}

        <img src="${q.img}" class="question-img ${q.large ? "large-question" : ""}">

        <p>${q.text}</p>

        <input type="text" id="answer-input" placeholder="Votre réponse">
        <br>
        <button onclick="validateAnswer()">Valider</button>
    `;

    saveGame();
}

function validateAnswer() {
    const q = questions[currentQuestion - 1];
    let userAnswer = document.getElementById("answer-input").value;

// Normalisation : majuscules + suppression espaces + tirets + caractères spéciaux
userAnswer = userAnswer.toUpperCase().replace(/[^A-Z0-9]/g, "");

let correctAnswer = q.answer.toUpperCase().replace(/[^A-Z0-9]/g, "");

if (userAnswer !== correctAnswer) {
    showErrorPopup();   // 🔥 popup visuel
    return;             // On reste sur la même question
}

    scoreTableau1++;
    codeFinal[q.position - 1] = q.chiffre;

	showPopup(q.chiffre, q.position);
    saveGame();
}

function nextQuestion() {
    currentQuestion++;

    if (currentQuestion > 10) {
        tableau1Termine = true;
        saveGame();
        finishTableau1();
        return;
    }

    showQuestion();
}

/****************************************************
 * FIN TABLEAU 1 – CADENAS + ANIMATION
 ****************************************************/
function finishTableau1() {
    stopTimer(); // arrêt chrono dès fin du tableau 1

    const code = codeFinal.join("");

    if (cadenasOuvert) {
        showTableau2Intro();
        return;
    }

    document.getElementById("game-container").innerHTML = `
        <h2>Tableau 1 terminé !</h2>

        <div class="lock-container">
            <img id="lock-img" src="images/cadenas_ferme.png" class="lock-img">
        </div>

        <p><strong>Entrer le code de déverrouillage :</strong></p>

        <input type="text" id="lock-code" placeholder="Code à 10 chiffres">
        <br>
        <button onclick="checkLockCode('${code}')">Valider le code</button>
	<button onclick="returnToQuestion1()" style="margin-left:10px;">Je n’ai pas le code complet</button>

    `;

    saveGame();
}

function returnToQuestion1() {
    document.getElementById("game-container").innerHTML = `
        <h2>Retour à la question 1...</h2>
        <p>Merci d’attendre 5 secondes.</p>
    `;

    setTimeout(() => {
        currentQuestion = 1;
        showQuestion();
        startTimer();   // 🔥 Le chrono repart !
    }, 5000);
}

function checkLockCode(expectedCode) {
    const val = document.getElementById("lock-code").value.trim();

    if (val !== expectedCode) {

        // 🔴 Popup erreur identique aux mauvaises réponses du tableau 1
        showErrorPopup();

        // 🔄 Attendre 4 secondes puis revenir à l’écran du cadenas
        setTimeout(() => {
            finishTableau1(); // recharge l’écran du cadenas SANS rien casser
        }, 4000);

        return;
    }

    // 🟢 Code correct → ouverture du cadenas
    cadenasOuvert = true;
    saveGame();

    document.getElementById("game-container").innerHTML = `
        <h2>Code correct !</h2>

        <div class="lock-container">
            <img id="lock-img" src="images/cadenas_ferme.jpeg" class="lock-img">
        </div>

        <p>Ouverture du cadenas...</p>
    `;

    setTimeout(() => {
        const lock = document.getElementById("lock-img");
        lock.classList.add("lock-open");

        setTimeout(() => {
            lock.classList.add("lock-fadeout");
        }, 800);

    }, 200);

    setTimeout(() => {
        document.getElementById("game-container").innerHTML = `
            <h2>🔓 Cadenas ouvert</h2>
            <p>Ouverture du tableau 2 dans 5 secondes...</p>
        `;
    }, 2000);

    setTimeout(showTableau2Intro, 7000);
}

/****************************************************
 * INTRO TABLEAU 2 – RÈGLES
 ****************************************************/
function showTableau2Intro() {
    if (tableau2Termine) {
        showTableau2End();
        return;
    }

    document.getElementById("game-container").innerHTML = `
        <h2>Tableau 2 – Mot croisé électrique</h2>
        <p>
            Complétez le mot croisé selon les définitions.<br>
            Toutes les lettres doivent être correctes pour valider le mot final.
        </p>
        <button onclick="startTableau2()">Démarrer</button>
    `;

    saveGame();
}

function startTableau2() {
    tableau2Commence = true;
    saveGame();

    startTimer(); // reprise chrono au début du tableau 2

    loadTableau2();
}

/****************************************************
 * TABLEAU 2 – GRILLE
 ****************************************************/
const crosswordRows = [
    "_______M____________",
    "_ATTESTATION_B______",
    "_______S_____A__I___",
    "_______S_____L__N_C__",      
    "_______ELECTRISATION",
    "__________O__S__E_N__",      
    "________ZONE_A__R_D_",
    "__________S__G__V_A_",
    "__________I__E__E_M_",
    "__________G_____N_N_",
    "__________N__C__T_A_",
    "_________VAT_O__I_T_",
    "__________T__N__O_I_",
    "_____HABILITATION_O_",
    "__________O__A____N_",
    "______ECRAN__C________",     
    "_____________T________"      
];

function loadTableau2() {
    const COLS = Math.max(...crosswordRows.map(r => r.length));

    document.getElementById("game-container").innerHTML = `
        <h2>Tableau 2 – Mot croisé électrique</h2>

        <p id="definitions" style="max-width:700px;margin:0 auto;text-align:left;font-size:18px;">
            <strong>Définitions :</strong><br><br>

            <u>HORIZONTALEMENT :</u><br>
            2. Délivrée par le chargé de consignation.<br>
            6. Choc électrique.<br>
            8. De voisinage simple, renforcé, ...<br>
            10. Vérifie l'absence de tension.<br>
            11. Délivrée par l'employeur.<br>
            12. Protège le visage.<br><br>

            <u>VERTICALEMENT :</u><br>
            1. Partie d’un matériel reliée à la terre.<br>
            3. Délimite et signale une zone.<br>
            4. Opération de dépannage en BT.<br>
            5. Immobilisation mécanique.<br>
            7. Procédure pour protéger les personnes.<br>
            9. Direct ou indirect.<br>
        </p>

        <div style="display:flex; justify-content:center; align-items:flex-start; gap:20px; margin-top:20px;">
            <div id="crossword"
                 style="display:grid; grid-template-columns: repeat(${COLS}, 30px); gap:3px; justify-content:center;">
            </div>
            <div id="side-controls">
                ${!pauseUsed ? `<button onclick="pauseGame()" id="pause-btn">⏸ Pause</button>` : ""}
            </div>
        </div>

        <button onclick="validateCrossword()">Valider le mot final</button>

        <div id="secret-panel"></div>
    `;

    renderCrossword();

    const save = loadGame();
    if (save && save.crossword) restoreCrosswordState(save.crossword);

    saveGame();
}

function renderCrossword() {
    const container = document.getElementById("crossword");
    container.innerHTML = "";

    const ROWS = crosswordRows.length;
    const COLS = Math.max(...crosswordRows.map(r => r.length));

    const horizontalNumbers = [2, 6, 8, 10, 11, 12];
    const verticalNumbers = [1, 3, 4, 5, 7, 9];
    let hIndex = 0;
    let vIndex = 0;

    for (let r = 0; r < ROWS; r++) {
        const row = crosswordRows[r];
        for (let c = 0; c < COLS; c++) {

            const wrapper = document.createElement("div");
            wrapper.style.position = "relative";
            wrapper.style.width = "28px";
            wrapper.style.height = "28px";

            const cell = document.createElement("input");
            cell.maxLength = 1;
            cell.style.textTransform = "uppercase";
            cell.style.textAlign = "center";
            cell.style.fontSize = "18px";

            const ch = c < row.length ? row[c] : "_";

            if (ch === "_" || ch === " ") {
                cell.disabled = true;
                cell.style.background = "#eee";
                cell.style.border = "1px solid #ddd";
            } else {
                cell.dataset.solution = ch.toUpperCase();
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.addEventListener("input", saveGame);

                const leftChar = c > 0 && c - 1 < row.length ? row[c - 1] : "_";
                const aboveChar = r > 0 && c < crosswordRows[r - 1].length ? crosswordRows[r - 1][c] : "_";

                const isHorizontalStart =
                    (leftChar === "_" || leftChar === " ") &&
                    (c + 1 < row.length && row[c + 1] !== "_" && row[c + 1] !== " ");

                const isVerticalStart =
                    (aboveChar === "_" || aboveChar === " ") &&
                    (r + 1 < ROWS && c < crosswordRows[r + 1].length &&
                     crosswordRows[r + 1][c] !== "_" && crosswordRows[r + 1][c] !== " ");

                if (isHorizontalStart && hIndex < horizontalNumbers.length) {
                    const bulle = document.createElement("div");
                    bulle.className = "bulle-num";
                    bulle.textContent = horizontalNumbers[hIndex++];
                    bulle.style.left = "-10px";
                    bulle.style.top = "5px";
                    wrapper.appendChild(bulle);
                }

                if (isVerticalStart && vIndex < verticalNumbers.length) {
                    const bulle = document.createElement("div");
                    bulle.className = "bulle-num";
                    bulle.textContent = verticalNumbers[vIndex++];
                    bulle.style.top = "-10px";
                    bulle.style.left = "5px";
                    wrapper.appendChild(bulle);
                }
            }

            wrapper.appendChild(cell);
            container.appendChild(wrapper);
        }
    }
}

/****************************************************
 * COLORATION DES LETTRES ROUGES (SECURITE)
 ****************************************************/
function highlightSecretLetters() {
    const cells = document.querySelectorAll("#crossword input");

    function mark(row, col) {
        for (const cell of cells) {
            if (parseInt(cell.dataset.row) === row && parseInt(cell.dataset.col) === col) {
                cell.classList.add("highlight-red");
            }
        }
    }

    // Réponse 2 : ATTESTATION → 5ème lettre = S
    // Ligne 1, colonne 5
    mark(1, 5);

    // Réponse 1 : MASSE → 5ème lettre = E
    // Vertical MASSE : M (0,7) A (1,7) S (2,7) S (3,7) E (4,7)
    mark(4, 7);

    // Réponse 5 : CONSIGNATION → 1ère lettre = C
    // Vertical CONSIGNATION : C (4,10) O (5,10) N (6,10) S (7,10) ...
    mark(4, 10);

    // Réponse 12 : ECRAN → 3ème lettre = R
    // Ligne 15 : "______ECRAN__C________" → E(6) C(7) R(8) A(9) N(10)
    mark(15, 8);

    // Réponse 7 : CONSIGNATION → 5ème lettre = I
    // Même mot vertical que réponse 5 : I = 5ème lettre → (8,10)
    mark(8, 10);

    // Réponse 9 : CONTACT → 7ème lettre = T
    // Vertical CONTACT en colonne 13 : C(10,13) O(11,13) N(12,13) T(13,13) A(14,13) C(15,13) T(16,13)
    mark(16, 13);

    // Réponse 8 : ZONE → 4ème lettre = E
    // Ligne 6 : "________ZONE_A__R_D_" → Z(8) O(9) N(10) E(11)
    mark(6, 11);
}

/****************************************************
 * VALIDATION GRILLE + MOT DE PASSE
 ****************************************************/
function validateCrossword() {
    const cells = document.querySelectorAll("#crossword input");
    let errors = 0;

    for (const cell of cells) {
        if (cell.dataset.solution && cell.value.toUpperCase() !== cell.dataset.solution) {
            errors++;
        }
    }

   if (errors > 0) {

    // 🔴 Popup erreur identique au tableau 1
    showErrorPopup();

    // 🔄 Attendre 4 secondes puis reprendre le jeu
    setTimeout(() => {
        // On ne réinitialise pas tout : on laisse la grille telle quelle
        // Le joueur peut corriger ses erreurs sans perdre son travail
    }, 4000);

    return;
}

    tableau2Termine = true;
    scoreTableau2 = 10;
    saveGame();

    // Colorer les lettres en rouge
    highlightSecretLetters();

    // Effacer les définitions, garder uniquement la grille
    const defs = document.getElementById("definitions");
    if (defs) defs.remove();

    // Panneau sous la grille pour saisir SECURITE
    const panel = document.getElementById("secret-panel");
    panel.innerHTML = `
        <p>
            A l'aide des lettres en rouge, trouver le mot de passe permettant de sortir du tableau !<br>
            Petit cadeau, nous vous offrons la lettre U !
        </p>
        <input type="text" id="secret-word" placeholder="Mot de passe">
        <button id="secret-validate">Valider le mot de passe</button>
    `;

   document.getElementById("secret-validate").onclick = () => {
    const val = document.getElementById("secret-word").value.trim().toUpperCase();

    if (val !== "SECURITE") {

        // Désactiver temporairement les champs pour éviter le spam
        document.getElementById("secret-word").disabled = true;
        document.getElementById("secret-validate").disabled = true;

        // 🔴 Afficher la popup d’erreur (comme Tableau 1)
        showErrorPopup();

        // 🔄 Attendre 4 secondes puis redonner la possibilité de retaper
        setTimeout(() => {
            document.getElementById("secret-word").value = "";
            document.getElementById("secret-word").disabled = false;
            document.getElementById("secret-validate").disabled = false;
        }, 4000);

        return;
    }

    // 🟢 Mot correct → transition vers Tableau 3
    stopTimer(); // STOP chrono pendant les 5 secondes
    document.getElementById("game-container").innerHTML = `
        <h2>Bien joué !!</h2>
        <p>Passons au tableau suivant, merci d'attendre 5 secondes.</p>
    `;

    setTimeout(() => {
        showTableau3Intro();
    }, 5000);
};


}

function showTableau2End() {
    stopTimer();
    localStorage.removeItem("escapeGameSave");

    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    const popup = document.createElement("div");
    popup.id = "popup-end";
    popup.className = "popup";

    popup.innerHTML = `
        <div class="popup-content">
            <h2>Partie terminée</h2>
            <p>Joueur : <strong>${playerName}</strong></p>
            <p>Durée du jeu : <strong>${minutes}:${seconds}</strong></p>
            <button id="end-close">Fermer</button>
        </div>
    `;

    document.body.appendChild(popup);

    document.getElementById("end-close").onclick = () => {
        showTableau3Intro();
    };
}

/****************************************************
 * REPRISE / RÉINITIALISATION AU CHARGEMENT
 ****************************************************/
function resetGameState() {
    playerName = "";
    scoreTableau1 = 0;
    scoreTableau2 = 0;
    totalSeconds = 0;
    pauseUsed = false;
    resumeUsed = false;
    currentQuestion = 1;
    codeFinal = ["_", "_", "_", "_", "_", "_", "_", "_", "_", "_"];
    tableau1Termine = false;
    cadenasOuvert = false;
    tableau2Commence = false;
    tableau2Termine = false;

    stopTimer();

    document.getElementById("timer").innerText = "⏱ Temps : 00:00";
    document.getElementById("player-name-display").innerText = "";
    document.getElementById("game-container").innerHTML = "";

    document.getElementById("popup-name").style.display = "flex";
    document.getElementById("intro-page").classList.add("hidden");
}

window.onload = () => {
    const save = loadGame();

    if (save && !tableau2Termine) {
        localStorage.removeItem("escapeGameSave");
        resetGameState();
        return;
    }

    if (!save) {
        return;
    }

    localStorage.removeItem("escapeGameSave");
    resetGameState();
};

/****************************************************
 * SUPPRESSION SAUVEGARDE SI FERMETURE AVANT LA FIN
 ****************************************************/
window.addEventListener("beforeunload", () => {
    if (!tableau2Termine) {
        localStorage.removeItem("escapeGameSave");
    }
});

/****************************************************
 * TABLEAU 3 – INTRO
 ****************************************************/
function showTableau3Intro() {
    document.getElementById("game-container").innerHTML = `
        <h2>Tableau 3 – Associations INRS</h2>
        <p>
            Associez chaque pictogramme INRS avec sa définition.<br>
            Faites glisser chaque image vers la bonne description.
        </p>
        <button onclick="startTableau3()">Démarrer</button>
    `;
}

/****************************************************
 * TABLEAU 3 – DÉMARRAGE
 ****************************************************/
function startTableau3() {
    startTimer(); // 🔥 Le chrono repart ici
    loadTableau3();
}

/****************************************************
 * TABLEAU 3 – DONNÉES
 ****************************************************/
const tableau3Items = [
    {
        img: "images/tableau3/epi_obligatoire.png",
        text: "Obligation de porter un équipement de protection individuelle"
    },
    {
        img: "images/tableau3/gants_isolants.png",
        text: "Protection contre les risques électriques"
    },
    {
        img: "images/tableau3/danger_electrique.png",
        text: "Présence d’une tension dangereuse"
    },
    {
        img: "images/tableau3/interdiction_toucher.png",
        text: "Interdiction d’accéder ou de manipuler"
    },
    {
        img: "images/tableau3/consignation.png",
        text: "Installation sécurisée et immobilisée"
    },
    {
        img: "images/tableau3/vat.png",
        text: "Contrôle obligatoire avant intervention"
    }
];

/****************************************************
 * TABLEAU 3 – AFFICHAGE
 ****************************************************/
function loadTableau3() {
    const shuffled = [...tableau3Items].sort(() => Math.random() - 0.5);

    const leftImages = shuffled.slice(0, 3);
    const rightImages = shuffled.slice(3, 6);

    document.getElementById("game-container").innerHTML = `
        <h2>Tableau 3 – Associations INRS</h2>

        <div style="display:flex; justify-content:center; gap:40px; margin-top:20px;">

            <!-- COLONNE GAUCHE -->
            <div id="t3-images-left" style="display:flex; flex-direction:column; gap:20px;">
                ${leftImages.map(item => `
                    <img src="${item.img}" 
                         class="t3-picto"
                         data-id="${item.text}"
                         style="width:120px; cursor:pointer;">
                `).join("")}
            </div>

            <!-- DÉFINITIONS -->
            <div id="t3-targets" style="display:flex; flex-direction:column; gap:20px; max-width:350px;">
                ${tableau3Items.map(item => `
                    <div class="t3-slot" 
                         data-expected="${item.text}"
                         style="border:2px dashed #003366; padding:15px; min-height:60px; background:white;">
                        ${item.text}
                    </div>
                `).join("")}
            </div>

            <!-- COLONNE DROITE -->
            <div id="t3-images-right" style="display:flex; flex-direction:column; gap:20px;">
                ${rightImages.map(item => `
                    <img src="${item.img}" 
                         class="t3-picto"
                         data-id="${item.text}"
                         style="width:120px; cursor:pointer;">
                `).join("")}
            </div>

        </div>

       <div style="text-align:center; margin-top:20px;">

    <!-- 🔥 Bouton INITIALISER -->
    <button onclick="loadTableau3()" style="
        padding:10px 20px;
        font-size:16px;
        background:#888;
        color:white;
        border:none;
        border-radius:8px;
        cursor:pointer;
        margin-right:15px;
    ">Initialiser</button>

    <!-- 🔥 Bouton VALIDER -->
    <button onclick="validateAssociations()" style="
        padding:10px 20px;
        font-size:16px;
        background:#003366;
        color:white;
        border:none;
        border-radius:8px;
        cursor:pointer;
    ">Valider</button>

</div>
    `;

    // 🔥 Activation du système TAP‑TO‑SELECT
    initTableau3();
}

/****************************************************
 * TABLEAU 3 – TAP TO SELECT (PC + MOBILE)
 ****************************************************/
let selectedPicto = null;

function initTableau3() {
    const pictos = document.querySelectorAll(".t3-picto");
    const slots = document.querySelectorAll(".t3-slot");

    // Sélection d'un pictogramme
    pictos.forEach(picto => {
        picto.addEventListener("click", () => {

            // Si le picto est dans une slot → libérer la slot
            const parent = picto.parentElement;
            if (parent.classList.contains("t3-slot")) {
                parent.dataset.filled = "false";
                parent.dataset.current = "";
                parent.innerHTML = parent.dataset.originalLabel;
            }

            // Sélection visuelle
            document.querySelectorAll(".t3-picto").forEach(p => p.classList.remove("selected"));
            selectedPicto = picto;
            picto.classList.add("selected");
        });
    });

    // Placement dans une slot
    slots.forEach(slot => {

        // Sauvegarde du texte original (définition)
        slot.dataset.originalLabel = slot.innerHTML;

        slot.addEventListener("click", () => {
            if (!selectedPicto) return;

            // Si une image est déjà dans la slot → la renvoyer à gauche
            if (slot.dataset.filled === "true") {
                const oldPicto = slot.querySelector(".t3-picto");
                if (oldPicto) {
                    oldPicto.classList.remove("selected");
                    document.getElementById("t3-images-left").appendChild(oldPicto);
                }
            }

            // Placer le nouveau pictogramme
            slot.innerHTML = "";
            slot.appendChild(selectedPicto.cloneNode(true));
            slot.dataset.filled = "true";

            // 🔥 ENREGISTRER LE PICTO PLACÉ POUR LA VALIDATION
            slot.dataset.current = selectedPicto.dataset.id;

            // Désélectionner
            selectedPicto.classList.remove("selected");
            selectedPicto = null;
        });
    });
}

/****************************************************
 * VALIDATION
 ****************************************************/
function validateAssociations() {
    const zones = document.querySelectorAll(".t3-slot");
    let errors = 0;

    zones.forEach(zone => {
        if (zone.dataset.current !== zone.dataset.expected) {
            errors++;
        }
    });

    if (errors > 0) {

        // 🔴 Popup erreur identique à Tableau 1
        showErrorPopup();

        // 🔄 Retour au début du tableau après 4 sec
        setTimeout(() => {
            startTableau3(); // recharge le tableau 3 depuis le début
        }, 4000);

        return;
    }

    // 🟢 Si correct → transition vers Tableau 4
    stopTimer();
    document.getElementById("game-container").innerHTML = `
        <h2>Bravo !</h2>
        <p>Passons au tableau suivant dans 5 secondes…</p>
    `;

    setTimeout(() => {
        showTableau4Intro();
    }, 5000);
}

/****************************************************
 * FIN TABLEAU 3
 ****************************************************/
function showTableau3End() {
    stopTimer();

    // Écran de transition sans popup
    document.getElementById("game-container").innerHTML = `
        <h2>Poursuivons par un dernier tableau</h2>
        <p>Démarrage dans 5 secondes...</p>
    `;

    // Lancer le tableau 4 après 5 secondes
    setTimeout(() => {
        showTableau4Intro();
    }, 5000);
}

/****************************************************
 * TABLEAU 4 – INTRO
 ****************************************************/
function showTableau4Intro() {
    document.getElementById("game-container").innerHTML = `
        <h2>Tableau 4 – Procédure de consignation</h2>

        <p style="max-width:700px;margin:auto;text-align:left;">
            Remettez les étapes de la procédure de consignation dans le bon ordre.<br>
            Faites glisser chaque carte dans la colonne de droite.<br>
            Une fois toutes les cartes placées, cliquez sur "Valider".
        </p>

        <button onclick="startTableau4()" style="margin-top:20px;">Démarrer</button>
    `;
}
function startTableau4() {
    startTimer(); // 🔥 Le chrono repart

    loadTableau4();
}
const tableau4Steps = [
    "Pré-identifier la source d’énergie",
    "Séparer l’appareil de sa source",
    "Condamner l’appareil (cadenas + pancarte)",
    "Identifier",
    "Vérifier l’absence de tension (VAT)",
    "Mettre à la terre et en court-circuit",
    "Protéger la zone (balisage)",
    "Consignation validée"
];
/****************************************************
 * TABLEAU 4 – AFFICHAGE
 ****************************************************/
function loadTableau4() {
    const shuffled = [...tableau4Steps].sort(() => Math.random() - 0.5);

    document.getElementById("game-container").innerHTML = `
    <h2 style="margin-bottom:10px;">Tableau 4 – Procédure de consignation</h2>

    <div style="
        max-width:900px;
        margin:auto;
        background:#f9f9f9;
        padding:25px 30px;
        border-radius:12px;
        box-shadow:0 0 10px rgba(0,0,0,0.1);
    ">

        <p style="
            max-width:700px;
            margin:auto;
            text-align:left;
            font-size:18px;
            line-height:1.5;
        ">
            Remettez les étapes de la procédure de consignation dans le bon ordre.<br>
            Cliquez sur une carte puis sur une case pour la placer.
        </p>

        <div style="
            display:flex;
            justify-content:center;
            gap:50px;
            margin-top:30px;
        ">

            <!-- COLONNE GAUCHE -->
            <div id="t4-left" style="
                display:flex;
                flex-direction:column;
                gap:15px;
                width:40%;
            ">
                ${shuffled.map(step => `
                    <div class="t4-picto" data-step="${step}"
                         style="
                            padding:12px;
                            border:2px solid #003366;
                            background:white;
                            border-radius:8px;
                            cursor:pointer;
                            font-size:16px;
                            box-shadow:0 2px 4px rgba(0,0,0,0.1);
                         ">
                        ${step}
                    </div>
                `).join("")}
            </div>

            <!-- COLONNE DROITE -->
            <div id="t4-right" style="
                display:flex;
                flex-direction:column;
                gap:15px;
                width:40%;
            ">
                ${tableau4Steps.map((_, i) => `
                    <div class="t4-slot"
                         data-step-index="${i}"
                         style="
                            border:2px dashed #003366;
                            padding:15px;
                            min-height:50px;
                            background:white;
                            border-radius:8px;
                            font-size:16px;
                            text-align:center;
                            color:#003366;
                            font-weight:bold;
                         ">
                         Étape ${i + 1}
                    </div>
                `).join("")}
            </div>
        </div>

  <div style="text-align:center; margin-top:30px;">

    <!-- 🔥 Bouton INITIALISER -->
    <button onclick="loadTableau4()" style="
        padding:12px 25px;
        font-size:18px;
        background:#888;
        color:white;
        border:none;
        border-radius:8px;
        cursor:pointer;
        margin-right:15px;
    ">Initialiser</button>

    <!-- 🔥 Bouton VALIDER -->
    <button onclick="validateTableau4()" style="
        padding:12px 25px;
        font-size:18px;
        background:#003366;
        color:white;
        border:none;
        border-radius:8px;
        cursor:pointer;
    ">Valider</button>

</div>

`;

    // 🔥 Activation du système TAP‑TO‑SELECT
    initTableau4();
}

/****************************************************
 * TABLEAU 4 – TAP TO SELECT (PC + MOBILE)
 ****************************************************/
let selectedPictoT4 = null;

function initTableau4() {
    const pictos = document.querySelectorAll(".t4-picto");
    const slots = document.querySelectorAll(".t4-slot");

    // Sélection d'une carte
    pictos.forEach(picto => {
        picto.addEventListener("click", () => {

            // Si la carte est dans une slot → libérer la slot
            const parent = picto.parentElement;
            if (parent.classList.contains("t4-slot")) {
                parent.dataset.filled = "false";
                parent.innerHTML = parent.dataset.originalLabel;
            }

            // Sélection visuelle
            document.querySelectorAll(".t4-picto").forEach(p => p.classList.remove("selected"));
            selectedPictoT4 = picto;
            picto.classList.add("selected");
        });
    });

    // Placement dans une slot
    slots.forEach(slot => {

        // Sauvegarde du texte "Étape X"
        slot.dataset.originalLabel = slot.innerHTML;

        slot.addEventListener("click", () => {
            if (!selectedPictoT4) return;

            // Si une carte est déjà dans la slot → la renvoyer à gauche
            if (slot.dataset.filled === "true") {
                const oldPicto = slot.querySelector(".t4-picto");
                if (oldPicto) {
                    oldPicto.classList.remove("selected");
                    document.getElementById("t4-left").appendChild(oldPicto);
                }
            }

            // Placer la nouvelle carte
            slot.innerHTML = "";
            slot.appendChild(selectedPictoT4.cloneNode(true));
            slot.dataset.filled = "true";

            // Désélectionner
            selectedPictoT4.classList.remove("selected");
            selectedPictoT4 = null;
        });
    });
}
/****************************************************
 * TABLEAU 4 – VALIDATION
 ****************************************************/
function validateTableau4() {
    const slots = document.querySelectorAll(".t4-slot");
    let errors = 0;

    slots.forEach(slot => {
        const expectedIndex = slot.dataset.stepIndex;
        const expectedText = tableau4Steps[expectedIndex]; // ton texte exact
        const receivedText = slot.querySelector(".t4-picto")?.dataset.step; // ton texte exact

        if (receivedText !== expectedText) {
            errors++;
        }
    });

    if (errors > 0) {
        showErrorPopup();

        setTimeout(() => {
            startTableau4(); // 🔄 retour au début du tableau
        }, 4000);

        return;
    }

  // 🟢 Si correct → fin du jeu
stopTimer();

const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
const seconds = String(totalSeconds % 60).padStart(2, "0");

// 🔥 Envoi vers Google Sheets (compatible iPhone + PC)
const url = "https://script.google.com/macros/s/AKfycbw_fWghIw2LCw6NAo7XbsU8sZbF1fkAmGSs1mITMTFBZC8ilv_RZwysqmsA1sHAtxuF8g/exec"
    + "?name=" + encodeURIComponent(playerName)
    + "&time=" + encodeURIComponent(`${minutes}:${seconds}`)
    + "&success=OK"
    + "&session=" + encodeURIComponent(window.currentSessionCode);

fetch(url);

// 🔥 Popup 1 : Jeu terminé
const popup1 = document.createElement("div");
popup1.className = "popup";
popup1.innerHTML = `
    <div class="popup-content">
        <h2>🎉 Jeu terminé !</h2>
        <p>Vous avez réussi les 4 tableaux.</p>
    </div>
`;
document.body.appendChild(popup1);

// ⏳ Attendre 1 seconde → afficher popup score
setTimeout(() => {

    popup1.remove();

    // 🔥 Popup 2 : Score final
    const popup2 = document.createElement("div");
    popup2.className = "popup";
    popup2.innerHTML = `
        <div class="popup-content">
            <h2>Résultat final</h2>
            <p>Joueur : <strong>${playerName}</strong></p>
            <p>Temps total : <strong>${minutes}:${seconds}</strong></p>
        </div>
    `;
    document.body.appendChild(popup2);

    // ⏳ Attendre 5 secondes → sortie du jeu
    setTimeout(() => {
        popup2.remove();
        window.location.reload(); // 🔥 Sortie du jeu
    }, 5000);

}, 1000);

}