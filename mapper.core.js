(function __MAIN__() {
	const CONST = {
		ImageBasePath: './img/',
		Images: [
			'红教堂',
			'里奥的回忆',
			'月亮河公园',
			'军工厂',
			'唐人街',
			'永眠镇',
			'圣心医院',
			'湖景村',
			'白沙街疯人院',
			'闪金石窟-第1层',
			'闪金石窟-第-1层',
			'闪金石窟-第-2层',
			'不归林'
		],
		ImageCount: [6,9,7,6,6,7,6,7,5,8,8,1,5]
	};

	// Get & Process images
	for (let i = 0; i < CONST.Images.length; i++) {
		const name = CONST.Images[i];
		console.log('Dealing N...'.replace('N', name));
		const path = CONST.ImageBasePath + name + '/';
		const PF = new ProcessFuncs();
		for (let j = 1; j <= CONST.ImageCount[i]; j++) {
			PF.addImage(path + j.toString() + '.jpg');
		}
		PF.setBackground(path+'bg.jpg');
		PF.process(name);
	}

	function ProcessFuncs() {
		const PF = this;
		const AM = PF.AM = new AsyncManager();
		PF.images = [];
		PF.background = null;
		const cvs = PF.cvs = document.createElement('canvas');
		const ctx = PF.ctx = PF.cvs.getContext('2d');

		PF.getImage = function(src) {
			const img = new Image();
			img.src = src;
			return img;
		}

		PF.addImage = function(src) {
			const img = PF.getImage(src);
			img.onload = function() {AM.finish();}
			AM.add();
			PF.images.push(img);
		}

		PF.setBackground = function(src) {
			const img = PF.getImage(src);
			img.onload = function() {AM.finish();}
			AM.add();
			PF.background = img;

		}

		PF.process = function(name) {
			AM.onfinish = _process.bind(null, name);
			AM.finishEvent = true;
		}

		function _process(name) {
			console.log('processing...');

			// Get image data
			console.log('getting image data...');
			const images = [];
			for (const img of PF.images) {
				images.push(getImageData(img));
			}
			const bg = getImageData(PF.background);

			// Diff image data
			console.log('diffing images...');
			const diffs = [];
			for (const data of images) {
				diffs.push(compare(bg, data));
			}

			// Merge diffs into bg then download as file
			console.log('merging...');
			merge(PF.background, diffs, function(result) {
				download(result, name + '.png');
			});

			function resetCanvas(w, h) {
				cvs.width = w;
				cvs.height = h;
				ctx.clearRect(0, 0, w, h);
			}

			function getImageData(img) {
				resetCanvas(img.width, img.height);
				ctx.drawImage(img, 0, 0);
				return ctx.getImageData(0, 0, img.width, img.height);
			}

			function compare(imagedata1, imagedata2) {
				const data1 = imagedata1.data;
				const data2 = imagedata2.data;
				if (imagedata1.width !== imagedata2.width || imagedata1.height !== imagedata2.height) {
					console.log(data1, data2);
					throw new Error('Compared image data are not same size.');
				}
				const len = data1.length;
				const width = imagedata1.width;
				const height = imagedata1.height;
				if (len % 4 !== 0) {
					console.log(data1, data2);
					throw new Error('Given Uint8ClampedArray does\'nt in image data format.');
				}

				const diffs = [];
				for (let i = 0; i < len; i = i + 4) {
					const rgba1 = data1.slice(i, i + 4);
					const rgba2 = data2.slice(i, i + 4);
					const x = (i/4) % width;
					const y = Math.floor((i/4) / width);

					if (!isSameColor(rgba1, rgba2)) {
						debugger;
						diffs.push({
							rgba1: rgba1,
							rgba2: rgba2,
							x: x,
							y: y
						});
					}
				}

				return diffs;

				function isSameColor(rgba1, rgba2) {
					return rgba1.filter((e,i,a)=>(Math.abs(e-rgba2[i]) > 30)).length === 0;
				}
			}

			function merge(bg, diffs, callback) {
				resetCanvas(bg.width, bg.height);
				ctx.drawImage(bg, 0, 0);
				for (const diff of diffs) {
					for (const px of diff) {
						ctx.fillStyle = 'rgba(R,G,B,A)'.replace('R', px.rgba2[0]).replace('G', px.rgba2[1]).replace('B', px.rgba2[2]).replace('A', px.rgba2[3]);
						ctx.fillRect(px.x, px.y, 1, 1);
					}
				}
				cvs.toBlob(callback);
			}

			function download(blob, filename) {
				const url = URL.createObjectURL(blob);
				saveFile(url, filename);

				// Save dataURL to file
				function saveFile(dataURL, filename) {
					const a = $CrE('a');
					a.href = dataURL;
					a.download = filename;
					a.click();
				}
			}
		}

		function AsyncManager() {
			const AM = this;

			// Ongoing task count
			this.taskCount = 0;

			// Whether generate finish events
			let finishEvent = false;
			Object.defineProperty(this, 'finishEvent', {
				configurable: true,
				enumerable: true,
				get: () => (finishEvent),
				set: (b) => {
					finishEvent = b;
					b && AM.taskCount === 0 && AM.onfinish && AM.onfinish();
				}
			});

			// Add one task
			this.add = () => (++AM.taskCount);

			// Finish one task
			this.finish = () => ((--AM.taskCount === 0 && AM.finishEvent && AM.onfinish && AM.onfinish(), AM.taskCount));
		}

		// Basic functions
		// querySelector
		function $() {
			switch(arguments.length) {
				case 2:
					return arguments[0].querySelector(arguments[1]);
					break;
				default:
					return document.querySelector(arguments[0]);
			}
		}
		// querySelectorAll
		function $All() {
			switch(arguments.length) {
				case 2:
					return arguments[0].querySelectorAll(arguments[1]);
					break;
				default:
					return document.querySelectorAll(arguments[0]);
			}
		}
		// createElement
		function $CrE() {
			switch(arguments.length) {
				case 2:
					return arguments[0].createElement(arguments[1]);
					break;
				default:
					return document.createElement(arguments[0]);
			}
		}
		// Object1[prop] ==> Object2[prop]
		function copyProp(obj1, obj2, prop) {obj1[prop] !== undefined && (obj2[prop] = obj1[prop]);}
		function copyProps(obj1, obj2, props) {props.forEach((prop) => (copyProp(obj1, obj2, prop)));}
	}

	function getimage(src, callback) {
		const img = new Image();
		img.src = src;
		img.onload = callback;
		return img;
	}
}) ();
