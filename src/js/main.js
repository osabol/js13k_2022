/** @format */

var mapMan;

function init() {
	if (!document.body) {
		// html document is not ready yet (safari mobile)
		return setTimeout(init, 100);
	}

	// generate new maps
	generateMapFromLevel(0);
	generateMapFromLevel(1);

	// startup LittleJS with your game functions after the tile image is loaded
	engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, "t.png");
}

function gameInit() {
	scaleCameraToScreenSize();
	document.body.style.cursor = "crosshair";

	touchGamepadEnable = 1;
	touchGamepadAnalog = 1;
	//vibrateEnable = 1;
	startNewGame();
}

function scaleCameraToScreenSize() {
	// try to fit same tiles on a screen
	let tiles = TILES_PER_SCREEN;

	// smaller on mobile
	//if (isTouchDevice) tiles = tiles - 3;

	cameraScale = min(window.innerWidth, window.innerHeight) / tiles;

	touchGamepadSize = (80 * cameraScale) / 32;
}

function startNewGame() {
	g_score = 0;
	g_level = 0;
	g_player = null;
}

function startNextLevel() {

	console.log("Start playing")
	reset();


	// save gun and ammo
	let ammoPistol = g_player ? g_player.ammoBullets : 12;
	let ammoShotgun = g_player ? g_player.ammoShells : 0;
	let ammoRifle = g_player ? g_player.ammoRifle : 0;
	let currentGun = g_player ? g_player.gun.tileIndex : tileNumbers_pistol; // default
	let gunAmmo = g_player ? g_player.gun.ammo : 6;

	///////////////////
	// Clean up

	clearPushers();

	g_player = undefined;

	g_moss = [];
	g_shadows = {};
	g_enemies = [];

	g_splatter = [];
	g_holes = [];
	// g_sparks = [];
	g_corpses = [];
	g_shells = [];

	enemiesSpawned = 0;

	engineObjectsDestroy(); // destroy all objects handled by the engine

	/////////////////////
	// Setup new level

	g_levelDef = levelDefs[g_level % levelDefs.length];

	mapMan = new MapManager();

	g_player = new MobPlayer(playerSpawn);
	cameraPos = playerSpawn.copy();

	if (g_level >= 5 && g_level % 5 == 0) {
		new MachinePistol(g_player.pos.add(vec2(1, 1)));
	}

	// give player saved equipment
	g_player.ammoBullets = ammoPistol;
	g_player.ammoShells = ammoShotgun;
	g_player.ammoRifle = ammoRifle;
	let theGun;
	if (currentGun == tileNumbers_smg) {
		theGun = new MachinePistol(g_player.pos);
	} else if (currentGun == tileNumbers_rifle) {
		theGun = new Rifle(g_player.pos);
	} else if (currentGun == tileNumbers_shotgun) {
		theGun = new Shotgun(g_player.pos);
	} else {
		theGun = new Pistol(g_player.pos);
	}
	theGun.ammo = gunAmmo;

	levelCleared = false;

	musicStart();
}

function findFreePos(minDistToPlayer) {
	let pos, dist2player, inTileCol;

	do {
		pos = vec2(rand(mapData[g_levelDef.map].w), rand(mapData[g_levelDef.map].h));
		pos.x = Math.floor(pos.x) + 0.5;
		pos.y = Math.floor(pos.y) + 0.5;

		dist2player = pos.distance(g_player.pos);
		inTileCol = tileCollisionTest(pos, vec2(1));
	} while (dist2player < minDistToPlayer || inTileCol);

	return pos;
}

var enemiesSpawned = 0;
function spawnEnemy() {
	var p = findFreePos(5);
	let enemyClass = getNextEnemySpawnClass();

	let enemy;
	if (enemyClass == "v") {
		enemy = new Vampire(p);
	} else if (enemyClass == "g") {
		enemy = new Ghost(p);
	} else {
		enemy = new Zombie(p);
	}
	g_enemies.push(enemy);
	enemiesSpawned++;
}

function gameUpdate() {
	uiFading();

	if (g_state == STATE_CLICK_TO_START) {
		updateStateClickToStart();
	} else if (g_state == STATE_PLAYING) {
		updateStatePlaying();
	} else if (g_state == STATE_DEAD) {
		updateStateDead();
	} else if (g_state == STATE_CLEARED) {
		updateStateCleared();
	}

	// CAN BE REMOVED
	//mouseWasPressed(2) && toggleFullscreen();
}

function uiSound(f = 5) {
	for (let i = 0; i < f; i++) {
		soundRifle.play(cameraPos.add(vec2(10, 0)), 1, 0.5 + i / 10);
		setTimeout(() => soundEnemyGroan.play(cameraPos.add(vec2(-10, 0)), 0.5, 2 + i / 5, 0.5), 300 + i * 50);
	}
}

function updateStateClickToStart() {
	drawTile(
		cameraPos,
		vec2(4),
		tileNumbers_faceZombie,
		TILE_SIZE,
		new Color(1, 1, 1, max(0, 0.2 * Math.sin((frame * PI) / 1000)))
	);

	textTitle = "DEAD AGAIN";

	if (g_score) {
		textMiddle = "Score: " + g_score + "  Top: " + localStorage.da_t;
	}

	textBottom = "Click to start";

	if (mouseWasReleased(0) || gamepadWasPressed(0)) {
		uiSound();
		if (isTouchDevice && !isFullscreen()) toggleFullscreen();
		uiFadeOutAndCall(() => {
			startNewGame();
			startNextLevel();
			changeState(STATE_PLAYING);
		});
	}
}

function updateStateDead() {
	textMiddle = "YOU DIED";

	if (getMsSinceStateChange() > 4000) {
		changeState(STATE_CLICK_TO_START);
	}
}

function updateStateCleared() {
	textMiddle = "Level " + (g_level + 1) + " cleared";
	if(localStorage["level_" + g_level] == null || compareTime(gameTime,JSON.parse(localStorage.getItem("level_" + g_level))) > 0)
		localStorage.setItem("level_" + g_level,JSON.stringify(gameTime))
		
	
	textTopTime = "Best Time: " + getTimeString( JSON.parse(localStorage.getItem("level_" + g_level)))

	if (getMsSinceStateChange() > 2000) {
		textBottom = "Click to continue";

		if (mouseWasPressed(0) || gamepadWasPressed(0)) {
			uiSound(3);
			uiFadeOutAndCall(() => {
				g_level++;
				startNextLevel();
				changeState(STATE_PLAYING);
			});
		}
	}
}

var stateChangedTime = new Date().getTime();
function changeState(newState) {
	textsClear();
	stateChangedTime = new Date().getTime();
	g_state = newState;
}

function getMsSinceStateChange() {
	return new Date().getTime() - stateChangedTime;
}

var ticsToSpawn = 0;
var ammoSpawned;

var levelCleared = false;

function updateStatePlaying() {
	// game gets more difficult as you play
	g_difficulty = 1 + ((g_level / levelDefs.length) | 0);

	// enemies are a tiny bit repulsed by each other ... and thus try to spread out
	for (const e of g_enemies) {
		pushers.push(new Pusher(e.pos, 0.002, 1, 3, 2 / 60, PushTo.ENEMIES));
	}

	// player leaves foot prints that attracts monsters
	if (rand() < 0.1) pushers.push(new Pusher(g_player.pos, -0.001, 0, 5, rand(5), PushTo.ENEMIES));

	updatePushers();
	updateStopwatch();

	textMiddle = getMsSinceStateChange() > 3000 ? "" : "Level " + (g_level + 1);

	ticsToSpawn--;

	// let enemiesToSpawn = (g_levelDef.enemiesToSpawn * (1 + g_difficulty)) / 2;
	let enemiesToSpawn = 1;
	let enemiesMaxAlive = g_levelDef.enemiesMaxAlive * g_difficulty;

	let enemiesLeft = enemiesToSpawn - enemiesSpawned + g_enemies.length;
	//console.log("enemiesLeft", enemiesLeft);

	if (enemiesLeft <= 3) textBottom = enemiesLeft + " left";

	if (enemiesLeft <= 0) levelCleared = true;

	if (levelCleared) {
		changeState(STATE_CLEARED);
		g_player.gun.reload();
		//g_level++;
		soundPlayExtra(soundLevelCleared, cameraPos, 2, 0.8, 0, 1000);
		return;
	}

	if (!levelCleared && g_enemies.length < enemiesMaxAlive && enemiesSpawned < enemiesToSpawn && ticsToSpawn <= 0) {
		spawnEnemy();
		ticsToSpawn = rand(120);
	}

	if (g_player.hp <= 0) {
		changeState(STATE_DEAD);
		localStorage.da_t = max(g_score, localStorage.da_t || 0);
		return;
	}

	if (g_player.gun && frame % 150 == 0) {
		if (!ammoSpawned && g_player.getAmmoForCurrentGun() == 0) {
			// spawn more ammo
			if (AmmoBox.getCount() < 4) {
				let newAmmo = new AmmoBox(findFreePos(7), g_player.gun.tileIndex);
				soundLevelCleared.play(newAmmo.pos, 0.5, 3);
				ammoSpawned = true;
			}
		} else if (g_player.getAmmoForCurrentGun() != 0) {
			// allow ammo to spawn again when player is empty
			ammoSpawned = false;
		}
	}

	let newPoint = mousePos;
	if (isTouchDevice && g_player.gun) {
		// halfway from player to screen
		newPoint = g_player.pos.add(
			vec2(0)
				.setAngle(g_player.gun.angle + PI / 2)
				.normalize(TILES_PER_SCREEN - 7)
		);
	}
	// camera goes halfway between player and mouse
	cameraPos = cameraPos.lerp(g_player.pos.add(newPoint.subtract(g_player.pos).scale(0.5)), 0.03);

	fx_updateScreenShake();

	cameraPos = cameraPos.add(g_screenShake);

	if (g_CHEATMODE && mouseWasPressed(1)) {
		g_level++;
		startNextLevel();
		changeState(STATE_PLAYING);
		soundPlayExtra(soundLevelCleared, cameraPos, 2, 0.8, 0, 1000);
	}
}

function gameUpdatePost() {
	// called after physics and objects are updated
	// setup camera and prepare for render
}

var textTitle;
var textMiddle;
var textBottom;
var textStopwach;
var textTopTime

function textsClear() {
	textTitle = undefined;
	textMiddle = undefined;
	textBottom = undefined;
	textTopTime = undefined;
}

function drawTextWithOutline(text, pos, size, textColor, outlineColor = colorBlack) {
	drawTextScreen(text, pos, size, textColor, size / 15, outlineColor);
}

function testForMiscount() {
	let e = 0;
	for (const o of engineObjects) {
		if (o instanceof Enemy) e++;
	}

	if (e != g_enemies.length) {
		debugger;
	}
}

function textsDraw() {
	debug && testForMiscount();
	if (g_CHEATMODE) {
		drawTextScreen("CHEAT MODE ON ", vec2(100, 25), 20, colorWhite, 0, undefined, "left");
		drawTextScreen("enemies: " + g_enemies.length, vec2(100, 50), 20, colorWhite, 0, undefined, "left");
	}

	if (textTitle) {
		let flicker = (1.5 + Math.sin(frame / 50)) * 0.007;

		for (let i = 0; i < 10; i++) {
			drawTextScreen(
				textTitle,
				vec2(
					(rand(1 - flicker, 1 + flicker) * mainCanvas.width) / 2,
					(rand(1 - flicker, 1 + flicker) * mainCanvas.height) / 3
				),
				mainCanvas.width / 10,
				colorBlack.lerp(colorBlood, i / 10)
			);
		}
	}

	if (textMiddle) {
		drawTextWithOutline(
			textMiddle,
			vec2(mainCanvas.width / 2, mainCanvas.height / 2),
			mainCanvas.width / 20,
			colorBlood
		);
	}

	if(textStopwach)
	{
		drawTextScreen(
				textStopwach,
				vec2(
					mainCanvas.width * 0.1,
					mainCanvas.height * 0.2
				),
				mainCanvas.width * .03,
				colorBlood
			);
	}

	
	if(textTopTime)
	{
		// drawTextScreen(
		// 		textTopTime,
		// 		vec2(
		// 			mainCanvas.width * 0.5,
		// 			mainCanvas.height * 0.33
		// 		),
		// 		mainCanvas.width * .04,
		// 		colorBlood
		// 	);
		let flicker = (1 + Math.sin(frame / 50)) * 0.007;

		for (let i = 0; i < 10; i++) {
			drawTextScreen(
				textTopTime,
				vec2(
					(rand(1 - flicker, 1 + flicker) * mainCanvas.width) * .5,
					(rand(1 - flicker, 1 + flicker) * mainCanvas.height) * .33
				),
				mainCanvas.width * .04,
				colorBlack.lerp(colorBlood, i / 10)
			);
		}
	}

	if (textBottom) {
		let amt = 0.5 + Math.sin(frame / 10) / 2;

		if (g_state == STATE_PLAYING) amt = 1;

		//let col = new Color((amt * 172) / 255, (amt * 50) / 255, (amt * 50) / 255);

		let col = colorBlood.scale(amt);

		drawTextWithOutline(
			textBottom,
			vec2(mainCanvas.width / 2, (4 * mainCanvas.height) / 5),
			mainCanvas.width / 30,
			col
		);
	}
}

function gameRender() {
	mapMan?.render();

	// called before objects are rendered
	// draw any background effects that appear behind objects

	for (let i = 0; i < g_corpses.length; i++) {
		g_corpses[i].renderNow();
	}

	// if (g_shells.length > 32) {
	// 	// clean up old casings
	// 	g_shells.splice(0, 1);
	// }
	for (let i = 0; i < g_shells.length; i++) {
		let shell = g_shells[i];
		drawRect(shell.pos, vec2(1 / 12, 2 / 12), shell.color, shell.angle);
		if (shell.life > 0) {
			shell.pos = shell.pos.add(shell.velocity);
			shell.velocity.y -= 1 / 144;
			shell.angle += shell.angularVelocity;
			shell.life--;
		}
	}

	// if (g_splatter.length > 1024) {
	// 	// clean up old splatter
	// 	g_splatter.splice(0, 1);
	// }
	for (let i = 0; i < g_splatter.length; i++) {
		for (let j = 0; j < g_splatter[i].pattern.length; j++) {
			if (g_splatter[i].pattern[j]) {
				let x = g_splatter[i].pos.x - (2 + (j % 4)) / 12;
				let y = g_splatter[i].pos.y - (2 + Math.floor(j / 4)) / 12;
				drawRect(vec2(x, y), vec2(1.1 / 12), g_splatter[i].color);
			}
		}
	}

	// moss
	for (let i = 0; i < g_moss.length; i++) {
		let moss = g_moss[i];
		drawTile(moss.pos, vec2(1 / 3), moss.tileIndex, MINI_TILE_SIZE, colorWhite, moss.angle);
	}

	// bullet holes
	for (let i = 0; i < g_holes.length; i++) {
		let hole = g_holes[i];
		drawRect(hole.pos, vec2(hole.size / 12), hole.color);
	}

	// // sparks
	// for (let i = 0; i < g_sparks.length; i++) {
	// 	let spark = g_sparks[i];
	// 	spark.pos.x += Math.cos(spark.angle) / 32;
	// 	spark.pos.y += Math.sin(spark.angle) / 32;
	// 	drawRect(spark.pos, vec2(1 / 24), colorSpark);
	// 	if (--spark.life <= 0) {
	// 		g_sparks.splice(i, 1);
	// 	}
	// }

	//textsDraw();
}
