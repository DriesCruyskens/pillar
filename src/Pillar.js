import * as dat from 'dat-gui';
import { makeNoise3D } from "open-simplex-noise";
import * as paper from 'paper';
import { saveAs } from 'file-saver';

export default class Pillar {

    constructor(canvas_id) {
        this.params = {
            strokeWidth: 1.0,

            seed: Math.random() * 2000,
            smoothing: 100,
            ampX: 40,
            ampY: 40,

            height: .7,
            width: .3,
            n_lines: 300,
        }

        Number.prototype.map = function (in_min, in_max, out_min, out_max) {
            return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
        }

        // Initialise dat.gui, paperjs and opensimplex noise
        this.gui = new dat.GUI();
        this.canvas = document.getElementById(canvas_id);
        paper.setup(this.canvas);
        this.noise3D = makeNoise3D(Date.now());

        // For ease of use
        this.center = paper.view.center;

        this.init_gui();
        this.reset();
    }

    randomize() {
        this.params.seed = Math.random() * 2000;
        this.reset()
    }

    reset() {
        paper.project.currentStyle = {
            strokeColor: 'black',
            strokeWidth: this.params.strokeWidth,
            //fillColor: '#0000FF01'
        };
        // Clear paperjs project.
        paper.project.clear();
        // Generate vector in paperjs
        this.draw();
        // Instruct paperjs to draw current generated state.
        paper.view.draw();
    }

    draw() {
        let x1, y1, x2, y2, marginX, marginY, path;
        for (let i = 0; i < this.params.n_lines; i++ ) {
            path = new paper.Path()

            marginX = (paper.view.bounds.width - (paper.view.bounds.width * this.params.width)) / 2;
            marginY = (paper.view.bounds.height - (paper.view.bounds.height * this.params.height)) / 2;
            
            x1 = marginX;
            y1 = marginY + ((paper.view.bounds.height - 2 * marginY) / this.params.n_lines) * i;

            x2 = marginX + paper.view.bounds.width * this.params.width;
            y2 = marginY + ((paper.view.bounds.height - 2 * marginY) / this.params.n_lines) * i;

            let noise1 = this.noise3D(x1/this.params.smoothing, y1/this.params.smoothing, this.params.seed)
            let noise2 = this.noise3D(x2/this.params.smoothing, y2/this.params.smoothing, this.params.seed)

            x1 += noise1 * this.params.ampX;
            y1 += noise1 * this.params.ampY;

            x2 += noise2 * this.params.ampX;
            y2 += noise2 * this.params.ampY;

            path.add([x1, y1])
            path.add([x2, y2])
        }
    }

    init_gui() {
        this.gui.add(this, 'randomize').name('Randomize');

        let shape = this.gui.addFolder('shape');

        shape.add(this.params, 'n_lines', 0, 500).step(0.001).onChange((value) => {
            this.params.n_lines = value;
            this.reset();
        });

        shape.add(this.params, 'width', 0, 1).step(0.001).onChange((value) => {
            this.params.width = value;
            this.reset();
        });

        shape.add(this.params, 'height', 0, 1).step(0.001).onChange((value) => {
            this.params.height = value;
            this.reset();
        });

        let noise = this.gui.addFolder('noise');

        noise.add(this.params, 'seed', 0, 2000).step(0.001).onChange((value) => {
            this.params.seed = value;
            this.reset();
        });
        
        noise.add(this.params, 'smoothing', 0, 200).step(0.001).onChange((value) => {
            this.params.smoothing = value;
            this.reset();
        });

        noise.add(this.params, 'ampX', 0, 200).step(0.001).onChange((value) => {
            this.params.ampX = value;
            this.reset();
        });

        noise.add(this.params, 'ampY', 0, 200).step(0.001).onChange((value) => {
            this.params.ampY = value;
            this.reset();
        });

        let style = this.gui.addFolder("style");

        style.add(this.params, 'strokeWidth', 0, 5).step(0.001).onChange((value) => {
            this.params.strokeWidth = value;
            this.reset();
        })

        this.gui.add(this, 'exportSVG').name('Export SVG');
    }

    exportSVG() {
        var svg = paper.project.exportSVG({asString: true});
        var blob = new Blob([svg], {type: "image/svg+xml;charset=utf-8"});
        saveAs(blob, 'pillar' + JSON.stringify(this.params) + '.svg');
    }
}