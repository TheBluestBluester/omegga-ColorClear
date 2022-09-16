const fs = require('fs');
const { brs } = OMEGGA_UTIL;
const pref = '<b>[ColorClear]</> ';
let troles = [];

class ColorClear {
	
	constructor(omegga, config, store) {
		this.omegga = omegga;
		this.config = config;
		this.store = store
		troles = config.TrustedRoles;
	}
	
	async init() {
		this.omegga.on('cmd:colorclear', async (name, ...args) => {
			const player = await this.omegga.getPlayer(name);
			const proles = player.getRoles();
			if(troles.length > 0 && !await player.isHost()) {
				let hasrole = false;
				for(var r in proles) {
					const role = proles[r];
					if(troles.includes(role)) {
						hasrole = true;
						break;
					}
				}
				if(!hasrole) {
					this.omegga.whisper(name, pref+'You\'re not trusted enough to use this plugin!');
					return;
				}
			}
			this.omegga.whisper(name, pref+'Getting sava data in the selection...');
			let colors = [];
			let mats = [];
			let shapes = [];
			const tcs = args.includes('shape');
			const sbrs = await this.omegga.getPlayer(name).getTemplateBoundsData();
			if(sbrs == null) {
				this.omegga.whisper(name, pref+'Selection not found. Try copying the selection first.');
				return;
			}
			const bricks = sbrs.bricks;
			for(var b in bricks) {
				const brick = bricks[b];
				if(brick == null) {
					continue;
				}
				colors.push(brick.color);
				mats.push(brick.material_index);
				if(tcs) {
					shapes.push(sbrs.brick_assets[brick.asset_name_index]);
				}
			}
			this.omegga.whisper(name, pref+'Getting save data...');
			const brs = await this.omegga.getSaveData();
			this.omegga.whisper(name, pref+'Clearing bricks...');
			const brsbrick = brs.bricks;
			let count = 0;
			const first = brsbrick.findIndex(br => colors.includes(br.color));
			const last = brsbrick.length - 1 - brsbrick.slice().reverse().findIndex(br => colors.includes(br.color) && mats.includes(br.material_index) && (!tcs || shapes.includes(brs.brick_assets[br.asset_name_index])));
			for(var b=first;b<last;b++) {
				let brick = brsbrick[b];
				if(brick == null) {
					continue;
				}
				if(colors.includes(brick.color) && mats.includes(brick.material_index) && (!tcs || shapes.includes(brs.brick_assets[brick.asset_name_index]))) {
					const pos = brick.position;
					const t = await OMEGGA_UTIL.brick.getBounds({bricks: [brick], brick_assets: brs.brick_assets});
					const c = t.center;
					const m = t.maxBound;
					const size = [m[0] - c[0],m[1] - c[1],m[2] - c[2]];
					this.omegga.clearRegion({center: pos, extent: size});
					count++;
				}
			}
			this.omegga.whisper(name, pref+'Cleared ' + count + ' bricks!');
		});
		return { registeredCommands: ['colorclear'] };
	}
	async stop() {
		
	}
}
module.exports = ColorClear;