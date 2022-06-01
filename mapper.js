(function __MAIN__() {
	const GUI = new GUIFuncs();
	const PF = new ProcessFuncs();
	GUI.ProccessFuncs = PF;
	PF.GUIFuncs = GUI;

	document.body.addEventListener('dragover', GUI.dragover);
	document.body.addEventListener('dragend', PF.imagegot);

	function ProcessFuncs() {
		const PF = this;
		const PF.images = [];

		PF.imagegot = function(file) {
			const url = URL.createObjectURL(file);
			const img = new Image();
			img.src = url;
			PF.images.push(img);
		}

		PF.process = function() {
			for (const img of PF.images) {
				//
			}
		}
	}

	function GUIFuncs() {
		const GUI = this;

		GUI.dragover = function() {}

		GUI.dragend = function(e) {
			for (const file of e.dataTransfer.files) {
				GUI.ProccessFuncs.imagegot(file);
			}
		}
	}
}) ();
