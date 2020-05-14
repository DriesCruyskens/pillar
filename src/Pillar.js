import * as dat from "dat-gui";
import { makeNoise3D } from "open-simplex-noise";
import * as paper from "paper";
import { saveAs } from "file-saver";

export default class Pillar {
  constructor(canvas_id) {
    this.params = {
      // style
      strokeWidth: 1.0,
      drawFabric: false,

      // noise
      seed: Math.random() * 2000,
      smoothing: 20,
      ampX: 1,
      ampY: 1,

      // river
      riverEnable: false,
      riverAmp: 100,
      riverSmooth: 500,

      // shape
      height: 0.9,
      width: 0.3,
      n_lines: 450,
      n_vertices: 5,
      straightEdges: true,

      // exponential center amplitude
      enableExpCenterAmp: true,
      expWidth: 1,
      exponent: 0.8,
      base: 20,
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

    let x, y, noise, marginX, marginY, path, expAmp;

    for (let i = 0; i < this.params.n_lines; i++) {
      path = new paper.Path();

      marginX = (viewWidth - viewWidth * this.params.width) / 2;
      marginY = (viewHeight - viewHeight * this.params.height) / 2;

      // j needs to be smaller or equal to n_vertices
      // for the sketch to be centered.
      for (let j = 0; j <= n_vertices; j++) {
        x = marginX + ((viewWidth * this.params.width) / n_vertices) * j;
        y = marginY + ((viewHeight * this.params.height) / n_lines) * i;

        noise = this.noise3D(
          x / this.params.smoothing,
          y / this.params.smoothing,
          this.params.seed
        );

        // Initialise exponential amplitude to one so it doesn't break later.
        expAmp = 1;
        // If exponential center amplitude is enabled:
        if (this.params.enableExpCenterAmp) {
          // Get amplitude (closer to center = higher)
          expAmp = this.expCenterAmp(
            x,
            y,
            this.params.width * paper.view.bounds.width * this.params.expWidth
          );
          // Magic
          expAmp = Math.pow(expAmp.map(0, this.params.base, 0, 5), 3);
          // Clamp at 0.
          expAmp = Math.max(0, expAmp);
        }

        // Don't change x-value if straight edges are enabled.
        if (!this.params.straightEdges) {
          x += noise * this.params.ampX * expAmp;
        }

        // 
        if (this.params.riverEnable) {
          let riverNoise = this.noise3D(
            x / this.params.riverSmooth,
            y / this.params.riverSmooth,
            this.params.seed * 10
          );
          x += riverNoise * this.params.riverAmp;
        }

        // Add noise times amplitudes to y-value.
        y += noise * this.params.ampY * expAmp;

        path.add([x, y]);
      }

      path.smooth();
    }

    // Vertically connects vertices.
    if (this.params.drawFabric) {
      // Got to make a copy otherwise the forEach includes new paths.
      const children = [...paper.project.activeLayer.children];
      for (let i = 0; i < n_vertices; i++) {
        let p = new paper.Path();
        children.forEach((x) => {
          p.add(x._segments[i]._point);
        });
        p.smooth();
      }
    }
  }

  // Noise amplitudes are higher towards the center using exponentiation.
  expCenterAmp(x, y, width) {
    // Calculate distance between center and vertex.
    let dist = this.center.getDistance([x, y]);

    // Reverse map it so closer to center yields higher value.
    let base = dist.map(0, width, this.params.base, 0);
    // Clamp at 0.
    base = Math.max(0, base);
    // Calculate exponentiation with reverse distance as base.
    let amp = Math.pow(base, this.params.exponent);
    // Clamp at 0.
    amp = Math.max(0, amp);

    return amp;
  }

  init_gui() {
    this.gui.add(this, "randomize").name("Randomize");

    let shape = this.gui.addFolder("shape");

    shape
      .add(this.params, "n_lines", 0, 500)
      .step(1)
      .listen()
      .onChange((value) => {
        this.reset();
      });

    shape
      .add(this.params, "n_vertices", 1, 50)
      .step(1)
      .listen()
      .onChange((value) => {
        this.reset();
      });

    shape
      .add(this.params, "straightEdges")
      .listen()
      .onChange((value) => {
        this.reset();
      });

    shape
      .add(this.params, "width", 0, 1)
      .step(0.001)
      .listen()
      .onChange((value) => {
        this.reset();
      });

    shape
      .add(this.params, "height", 0, 1)
      .step(0.001)
      .listen()
      .onChange((value) => {
        this.reset();
      });

    let exp = this.gui.addFolder("exp center amp");

    exp
      .add(this.params, "enableExpCenterAmp")
      .name("enable")
      .listen()
      .onChange((value) => {
        this.reset();
      });

      exp
      .add(this.params, "expWidth", 0, 1)
      .step(.01)
      .listen()
      .onChange((value) => {
        this.reset();
      });

    exp
      .add(this.params, "exponent", 0.7, 1.2)
      .step(0.0001)
      .listen()
      .onChange((value) => {
        this.reset();
      });

    exp
      .add(this.params, "base")
      .min(0)
      .step(0.1)
      .listen()
      .onChange((value) => {
        this.reset();
      });

    let river = this.gui.addFolder("river");

    river
      .add(this.params, "riverEnable")
      .name("enable river")
      .listen()
      .onChange((value) => {
        this.reset();
      });

    river
      .add(this.params, "riverAmp", 0, 100)
      .name("river amplitude")
      .listen()
      .onChange((value) => {
        this.reset();
      });

    river
      .add(this.params, "riverSmooth", 0, 1000)
      .name("river smoothness")
      .listen()
      .onChange((value) => {
        this.reset();
      });

    let noise = this.gui.addFolder("noise");

    noise
      .add(this.params, "seed", 0, 2000)
      .step(0.001)
      .listen()
      .onChange((value) => {
        this.reset();
      });

    noise
      .add(this.params, "smoothing", 0, 200)
      .step(0.001)
      .listen()
      .onChange((value) => {
        this.reset();
      });

    noise
      .add(this.params, "ampX", 0, 50)
      .step(0.001)
      .listen()
      .onChange((value) => {
        this.reset();
      });

    noise
      .add(this.params, "ampY", 0, 50)
      .step(0.001)
      .listen()
      .onChange((value) => {
        this.reset();
      });

    let style = this.gui.addFolder("style");

    style
      .add(this.params, "strokeWidth", 0, 5)
      .step(0.001)
      .listen()
      .onChange((value) => {
        this.reset();
      });

    style
      .add(this.params, "drawFabric")
      .listen()
      .onChange((value) => {
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
