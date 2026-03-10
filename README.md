<div align="center">

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║        ∞   M A T H V E R S E   —   I N T E R A C T I V E                   ║
║            M A T H E M A T I C S   L A B O R A T O R Y                      ║
║                                                                              ║
║        Where the Language of the Universe becomes Visible                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

# ∞ MathVerse

### *A CERN-grade visualization engine for pure mathematics*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-MathVerse-00c8ff?style=for-the-badge&logoColor=white)](https://sumit6258.github.io/MathVerse/)
[![GitHub](https://img.shields.io/badge/GitHub-Sumit6258-bf5af2?style=for-the-badge&logo=github)](https://github.com/Sumit6258/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sumit-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/thesumitsuman)
[![WebGL](https://img.shields.io/badge/WebGL-GPU_Accelerated-ffd700?style=for-the-badge)](https://www.khronos.org/webgl/)
[![Three.js](https://img.shields.io/badge/Three.js-r128-white?style=for-the-badge&logo=three.js&logoColor=black)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-MIT-00ff9d?style=for-the-badge)](LICENSE)

---

$$\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi} \qquad \sum_{n=1}^{\infty}\frac{1}{n^2} = \frac{\pi^2}{6} \qquad e^{i\pi} + 1 = 0$$

> *"Mathematics is the language in which God has written the universe."*  
> — **Galileo Galilei**

</div>

---

## 🌌 What is MathVerse?

**MathVerse** is a high-fidelity, browser-native mathematical visualization laboratory — an interactive universe housing **30+ live simulations** spanning fractal geometry, quantum mechanics, differential geometry, chaos theory, and cellular automata.

Built entirely on **WebGL, GLSL shaders, Three.js, Canvas 2D, and D3.js**, every animation runs at **60 FPS** in your browser — no installation, no plugins, no backend. Pure mathematics rendered in real-time on your GPU.

Think **Wolfram Demonstrations** × **3Blue1Brown** × **CERN visualization lab**.

---

## 🏗️ Architecture & Tech Stack

```
∞ MathVerse
├── index.html              — Single-page app, 30+ sections
├── css/
│   └── styles.css          — Dark cosmic design system
└── js/
    ├── Core Modules        — fractals, graphs, animations, surfaces ...
    └── Advanced Modules    — adv01–adv15 (15 research-grade visualizations)
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **GPU Rendering** | WebGL 1/2 + GLSL | Mandelbulb, Quaternion Julia ray-marching |
| **3D Engine** | [Three.js r128](https://threejs.org) | Minimal surfaces, Hopf fibration, geodesics |
| **Animation** | [GSAP 3.12](https://greensock.com/gsap/) | Smooth scroll, transitions |
| **Scientific Plots** | [Plotly 2.26](https://plotly.com/javascript/) | 3D surfaces, contour maps |
| **Data Visualization** | [D3.js 7.8](https://d3js.org) | Network graphs, custom SVG |
| **Mathematics** | [KaTeX 0.16](https://katex.org) | LaTeX formula rendering |
| **Typography** | Cinzel Decorative · JetBrains Mono · Cormorant Garamond | |
| **Design** | Custom CSS — Dark Cosmic Theme | `#030307` · `#00c8ff` · `#bf5af2` · `#ffd700` |

---

## 🎭 The Full Visualization Library

### ✦ Core Visualizations

<details>
<summary><b>🌀 Fractals & Complex Systems</b></summary>

#### Mandelbrot & Julia Sets
The classic entry point to complex dynamics.

$$z_{n+1} = z_n^2 + c, \quad z,c \in \mathbb{C}$$

- **Mandelbrot Set** — boundary of connected Julia sets in parameter space
- **Julia Sets** — fixed-$c$ iteration portraits with custom color palettes
- **Burning Ship** — $z_{n+1} = (|\text{Re}(z_n)| + i|\text{Im}(z_n)|)^2 + c$
- **Newton Fractal** — basins of attraction for $z^n - 1 = 0$ via Newton's method

🔗 Reference: [Mandelbrot (1975)](https://www.math.utah.edu/~pa/math/mandelbrot/mandelbrot.html) · [Fractal Geometry of Nature](https://en.wikipedia.org/wiki/The_Fractal_Geometry_of_Nature)

</details>

<details>
<summary><b>📈 Function Graph Explorer</b></summary>

Interactive Cartesian and parametric function plotter:
- Parse arbitrary math expressions: `sin(x)*exp(-x^2)`, `x^3 - 3x`
- Polar, parametric, and implicit curve modes
- Live derivative and integral visualization

$$f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}$$

🔗 Reference: [Desmos API](https://www.desmos.com/api/v1.7/docs/index.html) · [GeoGebra](https://www.geogebra.org)

</details>

<details>
<summary><b>🎵 Fourier & Signal Animations</b></summary>

Eight live animated systems:

| Animation | Equation | Description |
|-----------|----------|-------------|
| **Lorenz Attractor** | $\dot{x}=\sigma(y-x),\;\dot{y}=x(\rho-z)-y$ | Butterfly chaos |
| **Lissajous Figures** | $x=A\sin(at+\delta),\;y=B\sin(bt)$ | Frequency ratios |
| **Harmonograph** | Compound pendulum oscillations | Decaying spirals |
| **Rössler Attractor** | $\dot{x}=-y-z,\;\dot{y}=x+ay$ | Scroll chaos |
| **Hénon Map** | $x_{n+1}=1-ax_n^2+y_n$ | 2D discrete chaos |
| **Double Pendulum** | RK4 Lagrangian mechanics | Chaotic motion |

🔗 Reference: [Lorenz (1963)](https://journals.ametsoc.org/view/journals/atsc/20/2/1520-0469_1963_020_0130_dnf_2_0_co_2.xml) · [Strogatz — Nonlinear Dynamics](https://www.stevenstrogatz.com/books/nonlinear-dynamics-and-chaos)

</details>

<details>
<summary><b>🏔️ 3D Parametric Surfaces</b></summary>

Fully interactive 3D surface gallery rendered via Three.js:

$$\vec{r}(u,v) \in \mathbb{R}^3, \quad (u,v) \in [0,1]^2$$

Includes: Torus, Klein Bottle, Boy's Surface, Möbius strip, Breather surface, and more.

🔗 Reference: [MathWorld Surfaces](https://mathworld.wolfram.com/topics/Surfaces.html)

</details>

<details>
<summary><b>🔢 Number Theory Explorer</b></summary>

- **Ulam Spiral** — primes arrange on diagonal lines; mysterious order in randomness
- **Collatz Conjecture** — $3n+1$ trees, visual convergence
- **Sieve of Eratosthenes** — animated prime detection
- **Goldbach visualization** — even numbers as sums of two primes

$$\text{Ulam: } p \text{ is prime} \iff p > 1 \text{ and } \forall k \in [2,\sqrt{p}]: k \nmid p$$

🔗 Reference: [Prime Pages](https://primes.utm.edu) · [OEIS](https://oeis.org)

</details>

---

### ✦ Advanced Research-Grade Visualizations

> *These 15 modules represent frontier-level mathematics — the kind shown at research seminars, CERN dashboards, and Wolfram Demonstrations.*

---

#### 🌑 ADV 01 — Mandelbulb: 3D Fractal Sculpture

$$|z_{n+1}| = |z_n|^n + c, \quad z,c \in \mathbb{R}^3$$

GPU-accelerated **ray marching** using **distance estimation (DE)** — the Mandelbulb is the attempt to extend Mandelbrot's iteration to 3D space by Rudy Rucker and Daniel White (2009).

```glsl
// Distance Estimator (GLSL Fragment Shader)
float DE(vec3 p) {
    vec3 z = p; float dr = 1.0;
    for (int i = 0; i < MAX_ITER; i++) {
        float r = length(z);
        if (r > bailout) break;
        float theta = acos(z.z/r) * power;
        float phi   = atan(z.y, z.x) * power;
        float zr    = pow(r, power);
        dr = pow(r, power-1.0) * power * dr + 1.0;
        z  = zr*vec3(sin(theta)*cos(phi), sin(theta)*sin(phi), cos(theta)) + p;
    }
    return 0.5 * log(r) * r / dr;  // Hubbard-Douady potential
}
```

**Controls:** Power $n$ (2–12) · Iterations · Bailout radius · Light angle · 4 color palettes · Drag-to-rotate · Scroll-to-zoom

🔗 [Fractal Forums — Mandelbulb origin](https://www.fractalforums.com/3d-fractal-generation/true-3d-mandlebrot-type-fractal/) · [Wikipedia](https://en.wikipedia.org/wiki/Mandelbulb) · [Inigo Quilez — Ray Marching](https://iquilezles.org/articles/raymarchingdf/)

---

#### 💎 ADV 02 — Quaternion Julia Set

$$q_{n+1} = q_n^2 + c, \quad q, c \in \mathbb{H} = \{a + bi + cj + dk\}$$

A **4D fractal** rendered as a 3D cross-section via GPU ray marching. The quaternion multiplication is computed entirely in the GLSL fragment shader.

$$q_1 q_2 = (a_1a_2 - b_1b_2 - c_1c_2 - d_1d_2) + (a_1b_2 + b_1a_2 + c_1d_2 - d_1c_2)i + \ldots$$

**Controls:** $c = (c_r, c_i, c_j, c_k)$ · Slice W through 4D space · Iterations · Fire/Ice/Alien palettes

🔗 [Inigo Quilez — Quaternion Julia](https://iquilezles.org/articles/quatjulia/) · [Hart, Sandin, Kauffman (1989) — Ray Tracing Deterministic 3-D Fractals](https://dl.acm.org/doi/10.1145/74334.74363)

---

#### 🫧 ADV 03 — Minimal Surfaces

$$H = \frac{\kappa_1 + \kappa_2}{2} = 0$$

Surfaces of **zero mean curvature** — nature's most efficient geometries, found in soap films, lipid bilayers, and butterfly wings.

| Surface | Discovery | Key Property |
|---------|-----------|-------------|
| **Gyroid** | Alan Schoen, 1970 | Triply periodic, chiral — found in butterfly wings |
| **Costa Surface** | Celso Costa, 1982 | First new complete embedded minimal surface since 1800s |
| **Enneper Surface** | Alfred Enneper, 1863 | Self-intersecting, full rotational symmetry |
| **Schwarz P** | H. A. Schwarz, 1865 | Triply periodic, cubic lattice symmetry |
| **Catenoid** | Euler, 1744 | First non-planar minimal surface ever found |

🔗 [Minimal Surface Archive](https://minimal.sitehost.iu.edu) · [GANG Gallery UMass](https://www.gang.umass.edu) · [Wikipedia — Minimal Surface](https://en.wikipedia.org/wiki/Minimal_surface)

---

#### 🔗 ADV 04 — Hopf Fibration

$$\pi: S^3 \longrightarrow S^2, \quad \pi^{-1}(p) \cong S^1$$

Heinz Hopf's 1931 discovery: the 3-sphere $S^3$ can be decomposed into great circles $S^1$, one for each point on $S^2$. Every pair of fibers is **linked exactly once**.

$$z_1 = \cos\tfrac{\theta}{2}\, e^{i(\psi+\phi)/2}, \quad z_2 = \sin\tfrac{\theta}{2}\, e^{i(\psi-\phi)/2}$$

**Stereographic projection** $S^3 \to \mathbb{R}^3$ maps each fiber circle to a circle in 3D — the resulting torus structure is animated with hue encoding fiber identity.

🔗 [Hopf (1931)](https://doi.org/10.1007/BF01454779) · [nLab — Hopf fibration](https://ncatlab.org/nlab/show/Hopf+fibration) · [3Blue1Brown — Visualizing Quaternions](https://www.youtube.com/watch?v=d4EgbgTm0Bg)

---

#### 📐 ADV 05 — Geodesic Flow

$$\ddot{\gamma}^k + \Gamma^k_{ij}\,\dot{\gamma}^i\dot{\gamma}^j = 0$$

**Geodesics** are shortest paths on curved surfaces, governed by the **Christoffel symbols** $\Gamma^k_{ij}$ of the metric. Numerically integrated on three surfaces:

| Surface | Metric | Geodesic Behavior |
|---------|--------|-------------------|
| **Sphere** | $ds^2 = d\theta^2 + \sin^2\theta\, d\phi^2$ | Great circles — always close |
| **Torus** | $(R+r\cos\theta)^2 d\phi^2 + r^2 d\theta^2$ | Wind around — some never close |
| **Saddle** | $z = x^2 - y^2$ — negative curvature | Diverge, do not return |

🔗 [do Carmo — Riemannian Geometry](https://www.amazon.com/Riemannian-Geometry-Mathematics-Manfredo-Carmo/dp/0817634908) · [Carroll — Spacetime and Geometry](https://www.preposterousuniverse.com/spacetimeandgeometry/)

---

#### 📄 ADV 06 — Riemann Surface Visualizer

$$w = f(z), \quad z \in \mathbb{C}$$

Multi-sheeted complex surfaces that **resolve branch cuts** of multi-valued functions. Each sheet is a copy of $\mathbb{C}$ connected at the branch points, the full picture being a **smooth Riemann surface**.

| Function | Sheets | Branch Point | Monodromy |
|----------|--------|-------------|-----------|
| $w = \sqrt{z}$ | 2 | $z = 0$ | $\mathbb{Z}/2\mathbb{Z}$ |
| $w = \log(z)$ | $\infty$ | $z = 0$ | $\mathbb{Z}$ |
| $w = z^{1/3}$ | 3 | $z = 0$ | $\mathbb{Z}/3\mathbb{Z}$ |
| $w = \cosh^{-1}(z)$ | 2 | $z = \pm 1$ | $\mathbb{Z}/2\mathbb{Z}$ |

Color encodes the **complex argument** (phase) of $w$ via domain coloring.

🔗 [Needham — Visual Complex Analysis](https://www.amazon.com/Visual-Complex-Analysis-Tristan-Needham/dp/0198534469) · [Wikipedia — Riemann surface](https://en.wikipedia.org/wiki/Riemann_surface)

---

#### 🌀 ADV 07 — Calabi-Yau Manifold

$$\Omega_{i\bar{j}} = \frac{\partial^2 K}{\partial z^i \partial \bar{z}^j}, \qquad z_1^n + z_2^n = 1$$

**Compact Kähler manifolds** with vanishing first Chern class — proposed as the "extra dimensions" of **string theory**, curled up at Planck scale.

The 2D cross-sections are parametrized:

$$z_1 = e^{2\pi i k_1/n} \cdot \cos^{2/n}\!\left(\tfrac{\pi\alpha}{2}\right), \quad z_2 = e^{2\pi i k_2/n} \cdot \sin^{2/n}\!\left(\tfrac{\pi\alpha}{2}\right)$$

Projected to $\mathbb{R}^3$ and animated with continuous morphing across the $n$ parameter.

🔗 [Calabi (1954)](https://doi.org/10.2307/2372430) · [Yau (1977)](https://en.wikipedia.org/wiki/Calabi%E2%80%93Yau_manifold) · [Greene — The Elegant Universe](https://www.amazon.com/Elegant-Universe-Superstrings-Dimensions-Ultimate/dp/0393338102)

---

#### ⚛️ ADV 08 — Schrödinger Wave Function

$$i\hbar\frac{\partial\psi}{\partial t} = -\frac{\hbar^2}{2m}\frac{\partial^2\psi}{\partial x^2} + V(x)\psi$$

Evolved via the **split-step finite-difference method** — a Gaussian wave packet $\psi(x,0) = e^{ip_0 x/\hbar}\,e^{-x^2/4\sigma^2}$ propagating under five potential landscapes:

| Potential | Physics |
|-----------|---------|
| **Free Particle** | Dispersion — packet spreads as $\sigma(t) \propto \sqrt{1 + (t/2m\sigma^2)^2}$ |
| **Infinite Square Box** | Standing wave eigenstates — discrete energy levels $E_n = n^2\pi^2\hbar^2/2mL^2$ |
| **Tunneling Barrier** | Classically forbidden transmission — $T \sim e^{-2\kappa d}$ |
| **Harmonic Oscillator** | Coherent states, Hermite-Gauss eigenfunctions |
| **Double Well** | Superposition, probability tunneling between wells |

Displays: $|\psi|^2$ (blue) · $\text{Re}(\psi)$ (gold) · $\text{Im}(\psi)$ (purple)

🔗 [Griffiths — Introduction to QM](https://www.amazon.com/Introduction-Quantum-Mechanics-David-Griffiths/dp/1107189632) · [Tannor — Introduction to Quantum Mechanics](https://uscibooks.aip.org/books/introduction-to-quantum-mechanics-a-time-dependent-perspective/)

---

#### 🔮 ADV 09 — Spherical Harmonics

$$Y_l^m(\theta,\phi) = \sqrt{\frac{(2l+1)(l-|m|)!}{4\pi(l+|m|)!}}\,P_l^m(\cos\theta)\,e^{im\phi}$$

The **eigenfunctions of the angular Laplacian** — atomic orbital shapes in quantum chemistry, gravitational multipole expansion, and the CMB power spectrum.

Rendered as $r(\theta,\phi) = |Y_l^m(\theta,\phi)|$, colored by the sign of the real part. Supports **superposition** $Y_l^m + Y_l^{-m}$ to visualize real orbital shapes.

| $l$ | $m$ | Orbital | Shape |
|-----|-----|---------|-------|
| 0 | 0 | $1s$ | Perfect sphere |
| 1 | 0 | $2p_z$ | Dumbbell along z |
| 2 | ±1 | $3d_{xz}$ | Four-lobed cloverleaf |
| 3 | 0 | $4f_{z^3}$ | Complex multi-lobe |

🔗 [NIST DLMF — Legendre Polynomials](https://dlmf.nist.gov/14) · [Wikipedia — Spherical Harmonics](https://en.wikipedia.org/wiki/Spherical_harmonics)

---

#### 🎲 ADV 10 — Monte Carlo π Estimation

$$\pi \approx 4 \cdot \frac{\#\text{points inside circle}}{\text{total points}} \xrightarrow{N\to\infty} \pi$$

Random points in $[0,1]^2$ are tested against $x^2+y^2 \le 1$ — by the **Strong Law of Large Numbers**, the estimate converges almost surely. Live convergence chart shows $\hat{\pi}(N)$ in real time.

$$\text{Error: } |\hat{\pi}_N - \pi| = O\!\left(\frac{1}{\sqrt{N}}\right) \quad \text{(CLT)}$$

🔗 [Metropolis & Ulam (1949)](https://doi.org/10.2307/2280232) · [Wikipedia — Monte Carlo method](https://en.wikipedia.org/wiki/Monte_Carlo_method)

---

#### 🌡️ ADV 11 — Lyapunov Fractal

$$\lambda = \lim_{N\to\infty}\frac{1}{N}\sum_{n=0}^{N-1}\ln\left|\frac{d}{dx}[r_n x(1-x)]\right| = \lim_{N\to\infty}\frac{1}{N}\sum_{n=0}^{N-1}\ln\left|r_n(1-2x_n)\right|$$

A sequence of $A$s and $B$s alternates growth rates $a$ and $b$ of the logistic map. The Lyapunov exponent $\lambda$ is plotted across the $(a,b)$ parameter plane:

- $\lambda < 0$ → **stable attractor** (blue-green)
- $\lambda > 0$ → **chaos** (red-orange)
- $\lambda = 0$ → **phase boundary** → intricate fractal curves

🔗 [Markus & Hess (1990)](https://www.sciencedirect.com/science/article/pii/016727899090157L) · [Wikipedia — Lyapunov fractal](https://en.wikipedia.org/wiki/Lyapunov_fractal)

---

#### 🌐 ADV 12 — Kuramoto Oscillator Network

$$\dot{\theta}_i = \omega_i + \frac{K}{N}\sum_{j=1}^{N}\sin(\theta_j - \theta_i), \quad i=1,\ldots,N$$

The canonical model of **spontaneous synchronization** — explaining fireflies flashing in unison, cardiac pacemaker cells, power grid stability, and Josephson junction arrays.

The **order parameter** $r(t)$ measures global synchrony:

$$r e^{i\psi} = \frac{1}{N}\sum_{j=1}^N e^{i\theta_j}, \qquad K_c = \frac{2}{\pi g(0)} \text{ (critical coupling)}$$

Live order parameter plot reveals the continuous **phase transition** at $K = K_c$.

🔗 [Kuramoto (1975)](https://doi.org/10.1007/BFb0013365) · [Strogatz (2000) — From Kuramoto to Crawford](https://www.sciencedirect.com/science/article/pii/S0167278900000944) · [Acebrón et al. (2005) Reviews of Modern Physics](https://doi.org/10.1103/RevModPhys.77.137)

---

#### 🐦 ADV 13 — Boids + Chaotic Attractors

$$\mathbf{v}_i \leftarrow \mathbf{v}_i + \alpha\mathbf{s}_i + \beta\mathbf{a}_i + \gamma\mathbf{c}_i + \delta\,\mathbf{f}_{\text{attractor}}$$

Craig Reynolds' **Boids** (1986) — emergent flocking from three purely local rules (separation, alignment, cohesion) — extended with coupling to strange attractors:

| Attractor | System | Character |
|-----------|--------|-----------|
| **Lorenz** | $\dot{x}=10(y-x),\;\dot{y}=28x-y-xz,\;\dot{z}=xy-\tfrac{8}{3}z$ | Butterfly, hypersensitive |
| **Rössler** | $\dot{x}=-y-z,\;\dot{y}=x+0.2y,\;\dot{z}=0.2+z(x-5.7)$ | Scroll attractor |
| **Thomas** | $\dot{x}=\sin y - bx,\;\dot{y}=\sin z - by,\;\dot{z}=\sin x - bz$ | Labyrinthine, symmetric |

🔗 [Reynolds (1987) SIGGRAPH](https://dl.acm.org/doi/10.1145/37401.37406) · [Lorenz (1963)](https://journals.ametsoc.org/view/journals/atsc/20/2/1520-0469_1963_020_0130_dnf_2_0_co_2.xml)

---

#### 🧬 ADV 14 — Cellular Automata Universe

> *"The universe is a computer. Cellular automata are its instruction set."* — Stephen Wolfram

| Rule | Type | Discovery | Class |
|------|------|-----------|-------|
| **Conway's Game of Life** | 2D, 2-state | John Conway, 1970 | Turing-complete |
| **Brian's Brain** | 2D, 3-state | Brian Silverman | Glider-rich oscillators |
| **Langton's Ant** | 2D Turing machine | Christopher Langton, 1986 | Universal computation |
| **Wireworld** | 2D, 4-state | Brian Silverman, 1987 | Digital logic circuits |
| **Rule 110** | 1D, 2-state | Wolfram/Cook (2004) | Proven Turing-complete |

Life birth/survival: **B3/S23** — born with exactly 3 neighbors, survives with 2 or 3. Draw directly on the grid with mouse or touch.

🔗 [Wolfram — A New Kind of Science](https://www.wolframscience.com) · [LifeWiki](https://conwaylife.com/wiki/) · [Langton (1986)](https://doi.org/10.1016/0167-2789(86)90237-X)

---

#### 🫀 ADV 15 — Mean Curvature Flow

$$\frac{\partial X}{\partial t} = H\,\mathbf{n}, \qquad H = \frac{\kappa_1 + \kappa_2}{2} = -\nabla \cdot \hat{n}$$

The **geometric heat equation** — curves evolve in the direction of their mean curvature normal. Huisken's Theorem (1984): *any smooth convex hypersurface contracts to a round point in finite time.*

Implemented via discrete curvature + **arc-length reparametrization** for stability:

$$\kappa_i \approx \frac{2((\mathbf{p}_{i-1}-\mathbf{p}_i)\times(\mathbf{p}_{i+1}-\mathbf{p}_i))}{|\mathbf{p}_{i+1}-\mathbf{p}_{i-1}|\cdot|\mathbf{p}_i-\mathbf{p}_{i-1}|\cdot|\mathbf{p}_{i+1}-\mathbf{p}_i|}$$

Initial shapes: **Star polygon** · **Ellipse** · **Gear** · **Random blob** — all converge to circles.

🔗 [Huisken (1984)](https://doi.org/10.1007/BF01394542) · [Mantegazza — Lecture Notes on MCF](https://link.springer.com/book/10.1007/978-3-0348-0145-4) · [Hamilton — Ricci Flow (1982)](https://projecteuclid.org/euclid.jdg/1214436922)

---

### ✦ Classic Demonstrations

| Module | Mathematics | Key Paper / Reference |
|--------|-------------|----------------------|
| **Riemann Hypothesis** | $\zeta(s) = \sum n^{-s}$, zeros on $\text{Re}(s)=\frac{1}{2}$ | [Clay Millennium Problem](https://www.claymath.org/millennium/riemann-hypothesis/) |
| **Complex Plotter** | Domain coloring of $f: \mathbb{C}\to\mathbb{C}$ | [Needham — Visual Complex Analysis](https://www.amazon.com/Visual-Complex-Analysis-Tristan-Needham/dp/0198534469) |
| **Gray-Scott Reaction-Diffusion** | $\partial_t u = D_u\nabla^2 u - uv^2 + F(1-u)$ | [Pearson, Science (1993)](https://doi.org/10.1126/science.261.5118.189) |
| **Navier-Stokes Fluid** | $\rho(\partial_t\mathbf{u}+\mathbf{u}\cdot\nabla\mathbf{u})=-\nabla p + \mu\nabla^2\mathbf{u}$ | [Stam (1999) — Stable Fluids](https://dl.acm.org/doi/10.1145/311535.311548) |
| **Hyperbolic Geometry** | Poincaré disk model, $K=-1$ | [Poincaré (1882)](https://en.wikipedia.org/wiki/Poincar%C3%A9_disk_model) |
| **4D Polytopes** | Tesseract, 24-cell, 120-cell projections | [Coxeter — Regular Polytopes](https://www.amazon.com/Regular-Polytopes-H-S-Coxeter/dp/0486614808) |
| **Sound & Math** | Fourier synthesis, standing waves | [Fourier (1822)](https://en.wikipedia.org/wiki/Fourier_series) |
| **Mathematical Universe** | 3D formula galaxy flythrough | [Tegmark — Our Mathematical Universe](https://www.amazon.com/Our-Mathematical-Universe-Ultimate-Reality/dp/0307599809) |

---

### ✦ Mathematical Icons Gallery

Interactive pop-out modals for 8 famous results — each with a dedicated HD animated canvas:

$$e^{i\pi} + 1 = 0 \quad \phi = \frac{1+\sqrt{5}}{2} \quad \sum_{n=1}^{\infty}\frac{1}{n^2} = \frac{\pi^2}{6} \quad a^2 + b^2 = c^2$$

$$\mathcal{N}(\mu,\sigma) = \frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{(x-\mu)^2}{2\sigma^2}} \quad z_{n+1}=z_n^2+c \quad F_n = F_{n-1}+F_{n-2}$$

---

## ✨ Platform Features

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ⚡  60 FPS animations via requestAnimationFrame + WebGL                    │
│  🖥️  GPU ray-marching for Mandelbulb & Quaternion Julia (GLSL shaders)      │
│  📐  Mathematically rigorous — every equation implemented from first       │
│      principles, not approximations                                        │
│  🎛️  Interactive sliders, selectors, toggles — real-time parameter control  │
│  🔭  Discovery Mode — teleport to a random visualization instantly          │
│  💾  Save as PNG — Mandelbulb & Lyapunov fractals                           │
│  🖱️  Draw on cellular automata grids — mouse and touch support              │
│  📱  Responsive layout — desktop and tablet                                 │
│  🌌  Dark cosmic theme — deep-focus immersive design                        │
│  📚  KaTeX LaTeX formulas rendered throughout — educational at every step   │
│  🔇  IntersectionObserver lazy init — renders only when visible             │
│  🎨  8 Mathematical Icon modals with 700×420px HD animated previews         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Option 1 — Visit Live (Recommended)

```
🌐  https://sumit6258.github.io/MathVerse/
```
Zero setup. Open in any modern browser and explore.

### Option 2 — Run Locally

```bash
# Clone
git clone https://github.com/Sumit6258/MathVerse.git
cd MathVerse

# Serve with any static server
npx serve .
# or
python3 -m http.server 8080
```

Open `http://localhost:8080` in your browser.

> **Browser Requirements:** Chrome 90+ · Firefox 88+ · Safari 15+ · Edge 90+  
> WebGL must be hardware-accelerated. Disable GPU blocklisting if needed.

---

## 📁 Project Structure

```
MathVerse/
├── 📄 index.html                    — Main SPA (1,170+ lines)
│
├── 📁 css/
│   └── styles.css                   — Design system (520+ lines)
│
└── 📁 js/
    │
    ├── ── Core Modules ──────────────────────────────────────────────────
    ├── main.js                      — App initialization, nav, scroll
    ├── fractals.js                  — Mandelbrot, Julia, Newton, Burning Ship
    ├── graphs.js                    — Function plotter, parametric curves
    ├── animations.js                — 8 animated systems (Lorenz, Pendulum...)
    ├── surfaces.js                  — 3D parametric surface gallery
    ├── gallery.js                   — Mathematical Icons + modal system
    ├── riemann.js                   — Zeta function, zeros on critical line
    ├── complex.js                   — Domain coloring, conformal maps
    ├── reaction.js                  — Gray-Scott CPU reaction-diffusion
    ├── fluid.js                     — Jos Stam stable Navier-Stokes
    ├── hyperbolic.js                — Poincaré disk, tessellations
    ├── fourd.js                     — 4D polytope projections
    ├── numtheory.js                 — Ulam spiral, Collatz, sieves
    ├── sound.js                     — Fourier synthesis, musical math
    ├── universe.js                  — 3D mathematical universe explorer
    ├── global.js                    — Cross-module utilities
    │
    └── ── Advanced Modules (ADV 01–15) ──────────────────────────────────
        ├── adv01_mandelbulb.js      — WebGL GLSL ray-marching, DE shader
        ├── adv02_quatjulia.js       — Quaternion Julia Set WebGL shader
        ├── adv03_minimal.js         — Minimal surfaces Three.js PBR
        ├── adv04_hopf.js            — Hopf fibration S¹→S³→S²
        ├── adv05_geodesic.js        — Geodesic flow, Christoffel ODE
        ├── adv06_riemannsurf.js     — Multi-sheet Riemann surfaces
        ├── adv07_calabiyau.js       — Calabi-Yau manifold projection
        ├── adv08_schrodinger.js     — Quantum wave packet, Schrödinger PDE
        ├── adv09_sharmonics.js      — Spherical harmonics Y_lm(θ,φ)
        ├── adv10_montecarlo.js      — Monte Carlo π with convergence plot
        ├── adv11_lyapunov.js        — Lyapunov exponent fractal heatmap
        ├── adv12_kuramoto.js        — Kuramoto synchronization network
        ├── adv13_boids.js           — Boids + Lorenz/Rössler/Thomas attractors
        ├── adv14_cellautomata.js    — Life, Langton's Ant, Wireworld, Rule 110
        └── adv15_curvflow.js        — Mean curvature flow PDE
```

**Totals:** ~6,500 lines of code · 31 JS modules · 1,170+ HTML lines · 520+ CSS lines

---

## 🧮 Mathematics Reference Index

| Topic | Branch of Math | Essential Reading |
|-------|---------------|------------------|
| Mandelbrot / Julia | Complex Dynamics | Milnor — *Dynamics in One Complex Variable* |
| Fractal Dimension | Fractal Geometry | Mandelbrot — *Fractal Geometry of Nature* (1982) |
| Lorenz / Rössler | Dynamical Systems | Strogatz — *Nonlinear Dynamics and Chaos* |
| Minimal Surfaces | Differential Geometry | Osserman — *A Survey of Minimal Surfaces* |
| Hopf Fibration | Algebraic Topology | Hatcher — *Algebraic Topology* ([free PDF](https://pi.math.cornell.edu/~hatcher/AT/ATpage.html)) |
| Geodesics | Riemannian Geometry | do Carmo — *Riemannian Geometry* |
| Riemann Surfaces | Complex Analysis | Miranda — *Algebraic Curves and Riemann Surfaces* |
| Calabi-Yau | Algebraic Geometry | Hübsch — *Calabi-Yau Manifolds: A Bestiary* |
| Schrödinger Eq. | Quantum Mechanics | Griffiths — *Introduction to Quantum Mechanics* |
| Spherical Harmonics | Mathematical Physics | Jackson — *Classical Electrodynamics* |
| Monte Carlo | Probability / Statistics | Metropolis & Ulam, *JASA* (1949) |
| Lyapunov Exponents | Ergodic Theory | Eckmann & Ruelle — *Rev. Mod. Phys.* 57 (1985) |
| Kuramoto Model | Statistical Physics | Strogatz — *Physica D* 143 (2000) |
| Boids | Artificial Life | Reynolds — *SIGGRAPH* (1987) |
| Cellular Automata | Computation Theory | Wolfram — *A New Kind of Science* (2002) |
| Curvature Flow | Geometric Analysis | Huisken — *J. Diff. Geom.* 20 (1984) |
| Navier-Stokes Fluids | Fluid Mechanics | Stam — *Stable Fluids, SIGGRAPH* (1999) |
| Reaction-Diffusion | Mathematical Biology | Turing — *Phil. Trans. Roy. Soc.* (1952) |
| Fourier Analysis | Harmonic Analysis | Körner — *Fourier Analysis* |
| Number Theory | Pure Mathematics | Hardy & Wright — *An Introduction to the Theory of Numbers* |

---

## 🛠️ Performance Profile

| Visualization | Renderer | Typical FPS | Primary Load |
|---------------|----------|-------------|-------------|
| Mandelbulb 3D | WebGL GLSL | 60 | GPU High |
| Quaternion Julia | WebGL GLSL | 60 | GPU High |
| Minimal Surfaces | Three.js PBR | 60 | GPU Medium |
| Hopf Fibration | Three.js | 60 | GPU Medium |
| Calabi-Yau | Three.js | 60 | GPU Medium |
| Spherical Harmonics | Three.js | 60 | GPU Low |
| Schrödinger Wave | Canvas 2D | 60 | CPU Medium |
| Cellular Automata | Canvas ImageData | 60 | CPU Medium |
| Fluid Dynamics | Canvas Stam | 30–60 | CPU High |
| Reaction-Diffusion | Canvas Gray-Scott | 60 | CPU High |
| Boids (N=200) | Canvas 2D | 60 | CPU Medium |
| Monte Carlo | Canvas 2D | 60 | CPU Low |
| Lyapunov Fractal | Canvas ImageData | On-demand | CPU Burst |

---

## 🌟 Inspiration & Acknowledgements

MathVerse stands on the shoulders of giants:

| Inspiration | Contribution |
|-------------|-------------|
| [**Inigo Quilez**](https://iquilezles.org) | Ray marching, distance fields, GLSL art |
| [**3Blue1Brown**](https://www.3blue1brown.com) | Mathematical beauty in animation |
| [**Wolfram Demonstrations**](https://demonstrations.wolfram.com) | Interactive math encyclopedia |
| [**Paul Bourke**](http://paulbourke.net) | Minimal surfaces, fractals, geometry |
| [**Jos Stam**](https://www.josstam.com) | Stable fluid simulation paper (1999) |
| [**Daniel Shiffman**](https://shiffman.net) | Nature of Code, Boids, p5.js |
| [**Shadertoy Community**](https://www.shadertoy.com) | GLSL shader art and techniques |

---

## 📊 Project Statistics

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   📦  Total Files         :  33 (JS + HTML + CSS)     ║
║   📏  Lines of Code       :  ~6,500                   ║
║   🧮  Visualizations      :  30+                      ║
║   ⚡  Render Pipeline     :  WebGL + Canvas 2D         ║
║   🎯  Target Frame Rate   :  60 FPS                   ║
║   📐  Math Branches       :  12+                      ║
║   🔢  Equations Rendered  :  50+ (KaTeX)              ║
║   📚  Academic References :  30+                      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🤝 Contributing

Contributions are warmly welcome! Especially:

- 🧮 **New visualizations** — suggest or implement new mathematical systems
- ⚡ **Performance** — WebWorkers for heavy CPU computations
- 📱 **Mobile** — touch gesture improvements
- ♿ **Accessibility** — keyboard navigation, screen reader support
- 📖 **Mathematics** — correctness reviews, deeper educational annotations

```bash
# Fork → Create branch → Submit PR
git checkout -b feat/your-visualization
git commit -m "Add: [Visualization Name] — [brief math description]"
git push origin feat/your-visualization
```

---

## 📜 License

```
MIT License — Copyright (c) 2024 Sumit

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software.
```

---

<div align="center">

## 👨‍💻 Author

**Sumit**

*Builder of mathematical universes*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/thesumitsuman)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github)](https://github.com/Sumit6258/)
[![MathVerse](https://img.shields.io/badge/🌐-Visit_MathVerse-00c8ff?style=for-the-badge)](https://sumit6258.github.io/MathVerse/)

---

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   "Mathematics is not about numbers, equations, computations, or    ║
║    algorithms: it is about understanding."                          ║
║                                                                      ║
║                                     — William Paul Thurston          ║
║                                                                      ║
║          ∫∫∫  Made with ♥  and  lim  passion(n) = ∞                ║
║                                  n→∞                                ║
╚══════════════════════════════════════════════════════════════════════╝
```

*∞ MathVerse — Where Mathematics Becomes Visible*

</div>