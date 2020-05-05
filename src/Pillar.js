import * as dat from "dat-gui";
import { makeNoise3D } from "open-simplex-noise";
import * as paper from "paper";
import { saveAs } from "file-saver";

export default class Pillar {
  constructor(canvas_id) {
    this.params = {
      strokeWidth: 1.0,

      seed: Math.random() * 2000,
      smoothing: 100,
      ampX: 40,
      ampY: 40,

      height: 0.7,
      width: 0.3,
      n_lines: 300,
      n_vertices: 1,
    };

    Number.prototype.map = function (in_min, in_max, out_min, out_max) {
      return (
        ((this - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
      );
    };

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
    this.reset();
  }

  reset() {
    paper.project.currentStyle = {
      strokeColor: "black",
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
    // For ease of use.
    const viewWidth = paper.view.bounds.width;
    const viewHeight = paper.view.bounds.height;
    const n_vertices = this.params.n_vertices;
    const n_lines = this.params.n_lines;

    let x1, y1, noise, marginX, marginY, path;

    for (let i = 0; i < this.params.n_lines; i++) {
      path = new paper.Path();

      marginX = (viewWidth - viewWidth * this.params.width) / 2;
      marginY = (viewHeight - viewHeight * this.params.height) / 2;

      // j needs to be smaller or equal to n_vertices
      // for the sketch to be centered. 
      for (let j = 0; j <= n_vertices; j++) {
        x1 = marginX + ((viewWidth * this.params.width) / n_vertices) * j;
        y1 = marginY + ((viewHeight * this.params.height) / n_lines) * i;

        noise = this.noise3D(
          x1 / this.params.smoothing,
          y1 / this.params.smoothing,
          this.params.seed
        );

        x1 += noise * this.params.ampX;
        y1 += noise * this.params.ampY;

        path.add([x1, y1]);
      }

      path.smooth();
    }
  }

  init_gui() {
    this.gui.add(this, "randomize").name("Randomize");

    let shape = this.gui.addFolder("shape");

    shape
      .add(this.params, "n_lines", 0, 500)
      .step(1)
      .onChange((value) => {
        this.params.n_lines = value;
        this.reset();
      });

    shape
      .add(this.params, "n_vertices", 1, 20)
      .step(1)
      .onChange((value) => {
        this.params.n_vertices = value;
        this.reset();
      });

    shape
      .add(this.params, "width", 0, 1)
      .step(0.001)
      .onChange((value) => {
        this.params.width = value;
        this.reset();
      });

    shape
      .add(this.params, "height", 0, 1)
      .step(0.001)
      .onChange((value) => {
        this.params.height = value;
        this.reset();
      });

    let noise = this.gui.addFolder("noise");

    noise
      .add(this.params, "seed", 0, 2000)
      .step(0.001)
      .onChange((value) => {
        this.params.seed = value;
        this.reset();
      });

    noise
      .add(this.params, "smoothing", 0, 2000)
      .step(0.001)
      .onChange((value) => {
        this.params.smoothing = value;
        this.reset();
      });

    noise
      .add(this.params, "ampX", 0, 200)
      .step(0.001)
      .onChange((value) => {
        this.params.ampX = value;
        this.reset();
      });

    noise
      .add(this.params, "ampY", 0, 200)
      .step(0.001)
      .onChange((value) => {
        this.params.ampY = value;
        this.reset();
      });

    let style = this.gui.addFolder("style");

    style
      .add(this.params, "strokeWidth", 0, 5)
      .step(0.001)
      .onChange((value) => {
        this.params.strokeWidth = value;
        this.reset();
      });

    this.gui.add(this, "exportSVG").name("Export SVG");
  }

  exportSVG() {
    var svg = paper.project.exportSVG({ asString: true });
    var blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    saveAs(blob, "pillar" + JSON.stringify(this.params) + ".svg");
  }
}
