// Variables globales
let scene, camera, renderer, diceMesh = null, isRolling = false, isPlaying = false, currentPlayer = 1;
let playerPositions = [0, 0];  // Player 1 and Player 2 positions
let totalPlayers = 2;  // Default number of players
let players = [];
let boardMesh = null;  // Tablero cargado

// Cargar escena de Three.js
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 20); 

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('boardContainer').appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff, 1); // Luz blanca
    scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10).normalize();
    scene.add(directionalLight);

    // Cargar tablero 3D y jugadores
    loadBoard();
    loadPlayers();

    animate();
}

// Animar la escena
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}


// Cargar tablero 3D
function loadBoard() {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./src/modelos/mapa.mtl', function (materials) {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load('./src/modelos/mapa.obj', function (object) {
            object.scale.set(100, 100, 100);  // Ajustar el tamaño del tablero
            object.position.set(0, 0, 0);  // Colocar el tablero en la posición deseada
            scene.add(object);
            boardMesh = object;
        });
    });
}

// Cargar los modelos de los jugadores
let playersLoaded = 0;

function loadPlayers() {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./src/modelos/PlayerBBVA.mtl', function (materials) {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load('./src/modelos/PlayerBBVA.obj', function (object) {
            object.scale.set(0.5, 0.5, 0.5);
            object.position.set(-5, -5, 1);
            scene.add(object);
            players.push(object);
            playersLoaded++;
        });
    });

    const mtlLoader2 = new MTLLoader();
    mtlLoader2.load('./src/modelos/PlayerCar.mtl', function (materials) {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load('./src/modelos/PlayerCar.obj', function (object) {
            object.scale.set(0.5, 0.5, 0.5);
            object.position.set(-5, -6, 1);
            scene.add(object);
            players.push(object);
            playersLoaded++;
        });
    });
}


// Iniciar el juego con un número de jugadores
function startGame(playersCount) {
    totalPlayers = playersCount;
    document.getElementById('menu').style.display = 'none';
    document.getElementById('rollButton').style.display = 'inline-block';
    isPlaying = true;
}

document.getElementById("rollButton").addEventListener("click", async () => {
    if (!isPlaying || isRolling) return;

    isRolling = true;

    const roll = Math.floor(Math.random() * 6) + 1;
    alert(`Jugador ${currentPlayerIndex + 1} tiró un ${roll}`);

    const player = players[currentPlayerIndex];
    let newIndex = player.position + roll;

    if (newIndex >= 100) {
        alert(`¡${player.name} ha ganado!`);
        isRolling = false;
        isPlaying = false;
        return;
    }

    await movePlayerTo(player, newIndex);

    // Revisar serpiente o escalera
    if (snakesAndLadders[newIndex]) {
        const finalIndex = snakesAndLadders[newIndex];
        alert((finalIndex > newIndex ? "⬆️ Escalera" : "⬇️ Serpiente") + `: ${player.name} va a la casilla ${finalIndex}`);
        await movePlayerTo(player, finalIndex);
        player.position = finalIndex;
    } else {
        player.position = newIndex;
    }

    // Actualizar marcador de score visual
    document.getElementById(`score${currentPlayerIndex + 1}`).textContent = player.position;

    // Siguiente jugador
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    isRolling = false;
});


// Resetear el juego
function resetGame() {
    playerPositions = [0, 0];
    document.getElementById('score1').textContent = '0';
    document.getElementById('score2').textContent = '0';
    currentPlayer = 1;
    isPlaying = false;
    document.getElementById('menu').style.display = 'flex';
}

window.onload = init;

        (() => {
            // Constants
            const BOARD_SIZE = 10;
            const SQUARE_SIZE = 5; // size of one square in 3D units
            // Board position start in 3D space
            const BOARD_ORIGIN = { x: 0, y: 0, z: 0 };

            // Snakes and ladders positions - Map start->end
            // Positions from 1 to 100: if key is start, value is where it goes.
            // example:
            // ladder: 3 to 22
            // snake: 17 to 7
     
            const snakesAndLadders = {
                4: 14,  // Ladder from 4 to 14
                9: 31,
                20: 38,
                28: 84,
                40: 59,
                51: 67,
                63: 81,
                71: 91,
                17: 7,  // Snake from 17 to 7
                54: 34,
                62: 19,
                64: 60,
                87: 24,
                99: 78
            };

            // Player info
            let players = [
                { name: 'Player 1', color: 0xff2200, position: 1, mesh: null },
                { name: 'Player 2', color: 0x00aaff, position: 1, mesh: null }
            ];
            let currentPlayerIndex = 0;
            let isRolling = false;

            // Three.js scene variables
            let scene, camera, renderer;
            let boardGroup;
            let diceResultElem = null;
            let statusElem = null;
            let rollButton = null;

            // For loading .obj/.mtl files of dice and pieces - placeholders used
            // Because user requests .obj/.mtl usage, we will simulate loading a simple cube with .obj/.mtl content inline.
            // Since we cannot upload files here, we'll create basic geometries for pieces as placeholders.
            // Board squares will be flat colored checkerboard.

            // Initialize the three.js scene
            function initThree() {
                const container = document.getElementById('gameCanvas');

                scene = new THREE.Scene();
                scene.background = new THREE.Color(0x1e1e1e);

                const aspect = container.clientWidth / container.clientHeight;
                camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
                camera.position.set(25, 80, 10);
                camera.lookAt(new THREE.Vector3(BOARD_SIZE * SQUARE_SIZE / 2, 0, BOARD_SIZE * SQUARE_SIZE / 2));

                renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
                renderer.setSize(container.clientWidth, container.clientHeight);
                container.appendChild(renderer.domElement);

                // Resize handling
                window.addEventListener("resize", onWindowResize, false);

                // Lighting
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
                scene.add(ambientLight);
                const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
                dirLight.position.set(10, 30, 10);
                scene.add(dirLight);

                // Board group (board squares + snakes/ladders)
                boardGroup = new THREE.Group();
                scene.add(boardGroup);
            }

            function onWindowResize() {
                const container = document.getElementById('gameCanvas');
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            }

            // Create board square mesh
            function createSquare(x, z, color) {
                const geometry = new THREE.PlaneGeometry(SQUARE_SIZE, SQUARE_SIZE);
                const material = new THREE.MeshStandardMaterial({ color: color, side: THREE.DoubleSide });
                const plane = new THREE.Mesh(geometry, material);
                plane.rotation.x = -Math.PI / 2;
                plane.position.set(x, 0, z);
                return plane;
            }

            // Create board 10x10 checkerboard pattern
            function createBoard() {
                for (let row = 0; row < BOARD_SIZE; row++) {
                    for (let col = 0; col < BOARD_SIZE; col++) {
                        const isLight = (row + col) % 2 === 0;
                        const color = isLight ? 0xf5f5dc : 0x7c8c68;
                        const x = col * SQUARE_SIZE + SQUARE_SIZE / 2;
                        const z = row * SQUARE_SIZE + SQUARE_SIZE / 2;
                        const square = createSquare(x, z, color);
                        boardGroup.add(square);
                    }
                }
            }

            // Calculate 3D position for a board square given a position 1-100
            // Board numbering snakes back and forth starting bottom-left corner
            function positionToCoordinates(pos) {
                if (pos < 1) pos = 1;
                if (pos > 100) pos = 100;
                const zeroIndex = pos - 1;
                const row = Math.floor(zeroIndex / BOARD_SIZE);
                let col = zeroIndex % BOARD_SIZE;
                if (row % 2 === 1) {
                    // Reverse column for odd rows (snaking)
                    col = BOARD_SIZE - 1 - col;
                }
                const x = col * SQUARE_SIZE + SQUARE_SIZE / 2;
                const z = row * SQUARE_SIZE + SQUARE_SIZE / 2;
                return new THREE.Vector3(x, 0.2, z); // 0.2 height to stand above board
            }

            // Create player piece mesh
            function createPlayerPiece(color) {
                // Simple 3D geometry representing each player piece
                // Sphere on top of cylinder for a pawn-like piece
                const group = new THREE.Group();

                const material = new THREE.MeshStandardMaterial({ color: color });
                // Cylinder base
                const baseGeom = new THREE.CylinderGeometry(SQUARE_SIZE * 0.15, SQUARE_SIZE * 0.25, SQUARE_SIZE * 0.4, 16);
                const base = new THREE.Mesh(baseGeom, material);
                base.position.y = SQUARE_SIZE * 0.2;
                group.add(base);
                // Sphere top
                const sphereGeom = new THREE.SphereGeometry(SQUARE_SIZE * 0.15, 16, 16);
                const sphere = new THREE.Mesh(sphereGeom, material);
                sphere.position.y = SQUARE_SIZE * 0.5 + SQUARE_SIZE * 0.2; // on top of base
                group.add(sphere);

                return group;
            }

            // Create ladder shape between two points
  function createLadder(startPos, endPos) {
    const ladderGroup = new THREE.Group();

    const ladderMaterial = new THREE.MeshStandardMaterial({ color: 0x27ae60 }); // green

    // Compute direction vector and length
    const direction = new THREE.Vector3().subVectors(endPos, startPos);
    const length = direction.length();
    const stepsCount = Math.floor(length / (SQUARE_SIZE * 0.4)); // number of rungs
    const stepSpacing = length / (stepsCount + 1);

    // Calculate orthogonal vectors for rails
    const up = new THREE.Vector3(0, 1, 0);
    const railDirection = direction.clone().normalize();

    // Find a vector perpendicular to railDirection for rails offset
    const railOffset = new THREE.Vector3().crossVectors(up, railDirection).normalize().multiplyScalar(SQUARE_SIZE * 0.15);

    // Create two rails
    // Rails are thin cylinders from start to end offset left and right
    for (let side = -1; side <= 1; side += 2) {
      const railGeom = new THREE.CylinderGeometry(SQUARE_SIZE * 0.05, SQUARE_SIZE * 0.05, length, 8);
      const rail = new THREE.Mesh(railGeom, ladderMaterial);
      // Position rail at midpoint offset to side
      const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
      midPoint.add(railOffset.clone().multiplyScalar(side));
      rail.position.copy(midPoint);
      // Align rail to direction vector
      rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
      ladderGroup.add(rail);
    }

    // Create rungs - horizontal steps connecting rails
    for (let i = 1; i <= stepsCount; i++) {
      // Position along the ladder
      const posRatio = i / (stepsCount + 1);
      const centerPoint = new THREE.Vector3().lerpVectors(startPos, endPos, posRatio);
      // Rung is box geometry (thin rectangular)
      const rungLength = railOffset.length() * 2;
      const rungThickness = SQUARE_SIZE * 0.05;
      const rungHeight = SQUARE_SIZE * 0.02;

      const rungGeom = new THREE.BoxGeometry(rungLength, rungHeight, rungThickness);
      const rung = new THREE.Mesh(rungGeom, ladderMaterial);

      rung.position.copy(centerPoint);
      rung.position.y += SQUARE_SIZE * 0.1; // raise slightly above ground

      // Align rung perpendicular to railDirection
      const rungAngle = railDirection.angleTo(new THREE.Vector3(1, 0, 0));
      // We want rung perpendicular to rails direction - since rails go along direction, rungs perpendicular to that
      // We rotate it around y-axis by 90 degrees relative to rails
      const yAxis = new THREE.Vector3(0, 1, 0);
      const axis = yAxis;
      const perpQuaternion = new THREE.Quaternion().setFromAxisAngle(axis, Math.PI / 2);
      rung.quaternion.copy(perpQuaternion);

      ladderGroup.add(rung);
    }

    return ladderGroup;
  }

  // Create snake shape: a sinuous tube-shaped snake between two points
  function createSnake(startPos, endPos) {
    const snakeMaterial = new THREE.MeshStandardMaterial({ color: 0xd32f2f }); // red

    // Direction vector and distance
    const direction = new THREE.Vector3().subVectors(endPos, startPos);
    const length = direction.length();

    // Sinuous path with sinusoidal offsets perpendicular to the snake direction
    const pointsCount = 40;
    const points = [];

    // Get normalized direction
    const dirNorm = direction.clone().normalize();

    // Find a vector perpendicular to dirNorm on XZ plane for sine offset
    const up = new THREE.Vector3(0, 1, 0);
    let perp = new THREE.Vector3().crossVectors(dirNorm, up);
    if (perp.length() < 0.1) {
      perp = new THREE.Vector3(1, 0, 0); // fallback
    }
    perp.normalize();

    for (let i = 0; i <= pointsCount; i++) {
      const t = i / pointsCount;
      // Base point along line
      const basePoint = new THREE.Vector3().lerpVectors(startPos, endPos, t);
      // Sinusoidal offset perpendicular with decreasing amplitude towards ends
      const amplitude = SQUARE_SIZE * 0.5 * (1 - Math.abs(t - 0.5) * 2);
      const sineOffset = Math.sin(t * Math.PI * 4) * amplitude;
      const offset = perp.clone().multiplyScalar(sineOffset);
      // Add vertical slight oscillation for 3D effect
      const verticalOffset = Math.sin(t * Math.PI * 8) * SQUARE_SIZE * 0.1;
      const point = basePoint.clone().add(offset);
      point.y += verticalOffset;
      points.push(point);
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 60, SQUARE_SIZE * 0.15, 8, false);
    const snakeMesh = new THREE.Mesh(tubeGeometry, snakeMaterial);

    return snakeMesh;
  }

  // Create board and add snakes and ladders in proper shape
  function createSnakesAndLadders() {
    for (const [startStr, end] of Object.entries(snakesAndLadders)) {
      const start = parseInt(startStr);
      const startPos3D = positionToCoordinates(start);
      const endPos3D = positionToCoordinates(end);
      if (start < end) {
        // Ladder - create ladder shape
        const ladder = createLadder(startPos3D, endPos3D);
        boardGroup.add(ladder);
      } else {
        // Snake - create sinuous snake shape
        const snake = createSnake(startPos3D, endPos3D);
        boardGroup.add(snake);
      }
    }
  }


            // Move a player piece smoothly to a position
            const moveDuration = 600; // ms

            function movePlayerTo(player, targetPos, onComplete) {
                const startPos = player.mesh.position.clone();
                const endPos = positionToCoordinates(targetPos);
                const startTime = performance.now();

                function animateMove(time) {
                    const elapsed = time - startTime;
                    let t = elapsed / moveDuration;
                    t = t > 1 ? 1 : t;

                    player.mesh.position.lerpVectors(startPos, endPos, t);

                    if (t < 1) {
                        requestAnimationFrame(animateMove);
                    } else {
                        player.position = targetPos;
                        if (onComplete) onComplete();
                    }
                }
                requestAnimationFrame(animateMove);
            }

            // Game logic
            function rollDice() {
                if (isRolling) return;
                isRolling = true;
                rollButton.disabled = true;
                diceResultElem.textContent = '-';

                // Simulate isRolling animation and delay
                let rollsLeft = 10;
                let lastRoll = 0;

                const roller = () => {
                    if (rollsLeft > 0) {
                        lastRoll = Math.floor(Math.random() * 6) + 1;
                        diceResultElem.textContent = lastRoll;
                        rollsLeft--;
                        setTimeout(roller, 100);
                    } else {
                        // Move player
                        moveCurrentPlayerBy(lastRoll);
                    }
                };
                roller();
            }

            function moveCurrentPlayerBy(steps) {
                const player = players[currentPlayerIndex];
                let nextPos = player.position + steps;

                if (nextPos > 100) {
                    nextPos = player.position; // cannot move beyond 100
                }

                // Move player step by step for animation clarity
                function moveStepByStep(current, target, callback) {
                    if (current === target) {
                        callback();
                        return;
                    }
                    const next = current + 1;
                    movePlayerTo(player, next, () => {
                        moveStepByStep(next, target, callback);
                    });
                }
                moveStepByStep(player.position, nextPos, () => {
                    // Check for snake or ladder
                    if (snakesAndLadders[nextPos]) {
                        const finalPos = snakesAndLadders[nextPos];
                        statusElem.textContent = `${player.name} hit a ${finalPos > nextPos ? 'ladder! Climb up to ' : 'snake! Slide down to '}${finalPos}`;
                        movePlayerTo(player, finalPos, () => {
                            player.position = finalPos;
                            postMoveCheck();
                        });
                    } else {
                        postMoveCheck();
                    }
                });
            }

            // After player move checks and turn swapping
            function postMoveCheck() {
                const player = players[currentPlayerIndex];
                // Check win condition
                if (player.position === 100) {
                    statusElem.textContent = `${player.name} wins! 🏆`;
                    rollButton.disabled = true;
                    diceResultElem.textContent = '-';
                    isRolling = false;
                    return;
                }

                // Next turn
                currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
                statusElem.textContent = `${players[currentPlayerIndex].name}'s turn`;
                diceResultElem.textContent = '-';
                isRolling = false;
                rollButton.disabled = false;
            }

            // Initialize player pieces and add to scene
            function addPlayersToScene() {
                players.forEach((player) => {
                    const mesh = createPlayerPiece(player.color);
                    mesh.position.copy(positionToCoordinates(1));
                    scene.add(mesh);
                    player.mesh = mesh;
                });
            }

            // Animate loop
            function animate() {
                requestAnimationFrame(animate);
                renderer.render(scene, camera);
            }

            // Init all UI and three.js stuff
            function init() {
                initThree();
                createBoard();
                createSnakesAndLadders();
                addPlayersToScene();

                diceResultElem = document.getElementById('diceResult');
                statusElem = document.getElementById('status');
                rollButton = document.getElementById('rollButton');

                rollButton.addEventListener('click', rollDice);

                animate();
            }

            init();
        })();

