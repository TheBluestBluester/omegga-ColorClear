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
			if(args.includes('-sel') && args.includes('-reg')) {
				this.omegga.whisper(name, pref+'You cannot use the selection to select colors to clear and use it to clear a specific region at the same time.');
				return;
			}
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
			const tcs = args.includes('-shp') && args.includes('-sel');
			if(args.includes('-sel')) {
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
					mats.push(sbrs.materials[brick.material_index]);
					if(tcs) {
						shapes.push(sbrs.brick_assets[brick.asset_name_index]);
					}
				}
			}
			else {
				const paint = await player.getPaint();
				let clr = paint.color;
				//clr.push(255);
				colors.push(clr);
				mats.push(paint.material);
			}
			this.omegga.whisper(name, pref+'Getting save data...');
			let brs = 0;
			if(args.includes('-reg')) {
				brs = await player.getTemplateBoundsData();
			}
			else {
				brs = await this.omegga.getSaveData();
			}
			if(brs == null) {
				this.omegga.whisper(name, pref + 'Failed to get save data.');
				return;
			}
			let brsbrick = brs.bricks;
			this.omegga.whisper(name, pref+'Clearing bricks...');
			let count = 0;
			const colorl = brs.colors;
			if(!args.includes('-sel')) {
				let ind = -1;
				for(var c in colorl) {
					const clr = colorl[c];
					if(clr[0] == colors[0][0] && clr[1] == colors[0][1] && clr[2] == colors[0][2]) {
						ind = c;
						break;
					}
				}
				colors[0] = Number(ind);
			}
			const matl = brs.materials;
			// bruh
			const bricl = brs.brick_assets;
			const first = brsbrick.findIndex(br => colors.includes(br.color) && (!tcs || shapes.includes(bricl[br.asset_name_index])));
			const last = brsbrick.length - brsbrick.slice().reverse().findIndex(br => colors.includes(br.color) && (!tcs || shapes.includes(brs.brick_assets[br.asset_name_index])));
			for(var b=first;b<last;b++) {
				let brick = brsbrick[b];
				if(brick == null) {
					continue;
				}
				const col = brick.color;
				if(colors.includes(col) && mats.includes(matl[brick.material_index]) && (!tcs || shapes.includes(bricl[brick.asset_name_index]))) {
					const pos = brick.position;
					const t = await OMEGGA_UTIL.brick.getBounds({bricks: [brick], brick_assets: bricl});
					const c = t.center;
					const m = t.maxBound;
					const size = [m[0] - c[0],m[1] - c[1],m[2] - c[2]];
					count++;
					if(args.includes('-clp') || args.includes('-wsv')) {
						brsbrick[b] = null;
						continue;
					}
					this.omegga.clearRegion({center: pos, extent: size});
				}
			}
			if(args.includes('-clp')) {
				brsbrick = brsbrick.filter(b => b);
				const toload = {...brs, bricks: brsbrick};
				player.loadSaveData(toload);
			}
			else if(args.includes('-wsv')) {
				brsbrick = brsbrick.filter(b => b);
				const toload = {...brs, bricks: brsbrick};
				const time = new Date();
				const timetext = time.getFullYear() + '-' + time.getMonth() + '-' + time.getDay() + '-' + time.getHours() + '-' + time.getMinutes() + '-' + time.getSeconds();
				try{await this.omegga.writeSaveData('Colorclear-' + timetext, toload)}catch{};
				this.omegga.whisper(name, pref+'Exported the save as: Colorclear-' + timetext)
			}
			this.omegga.whisper(name, pref+'Cleared ' + count + ' bricks!');
		});
		return { registeredCommands: ['colorclear'] };
	}
	async stop() {
		
	}
}
module.exports = ColorClear;