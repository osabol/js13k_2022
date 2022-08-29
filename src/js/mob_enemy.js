/** @format */

class Enemy extends Mob {
	constructor(pos, size, tileIndex) {
		super(pos, size, tileIndex);

		this.enemyThinkPause = 0;
		this.enemyThinkMin = 20;
		this.enemyThinkMax = 100;
		this.enemyMoveSpeed = 0.1;
		this.enemyJitterForce = 0.01;
		this.enemyDrag = 1.5;
		this.enemyMaxSpeed = 0.5;
		this.enemyToTarget = undefined;

		this.soundGroan = new Sound([
			1, 0.5, 329.6276, 0.16, 0.62, 0.33, 0, 0.5, 0, 0, -50, 0.14, 0.13, 2.5, 28, 0, 0, 0.9, 0.07, 0.12,
		]);
	}

	update() {
		if (rand(0, 100) < 0.1) {
			pushers.push(new Pusher(this.pos.copy(), 0.1, 0, 1, rand(2, 4)));
		}

		// think and look
		if (this.enemyThinkPause-- <= 0) {
			this.enemyToTarget = g_game.player.pos.subtract(this.pos);
			this.enemyThinkPause = rand(this.enemyThinkMin, this.enemyThinkMax);
			this.groan(0.3, rand(0.8, 1.2));
		}

		// take a step
		if (rand(0, 100) < 10) {
			let force = vec2(0);
			if (this.enemyToTarget) force = this.enemyToTarget.normalize(this.enemyMoveSpeed);

			let jitter = randInCircle(this.enemyJitterForce);
			force = force.add(jitter);

			this.applyForce(force);
		}

		this.applyDrag(this.enemyDrag);
		this.velocity = this.velocity.clampLength(this.enemyMaxSpeed);

		super.update();
	}
}
