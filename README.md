# Abishek Tamilarasan &mdash; Engineering Portfolio

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-abishektamilarasan-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/abishektamilarasan)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-abishek--tamilarasan-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/abishek-tamilarasan-189bb6334/)
[![Hugging Face](https://img.shields.io/badge/Hugging%20Face-abishektamilarasan-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/abishektamilarasan)
[![HackerRank](https://img.shields.io/badge/HackerRank-abishek00tamila1-2EC866?style=for-the-badge&logo=hackerrank&logoColor=white)](https://www.hackerrank.com/profile/abishek00tamila1)

<br/>

**Hardware &times; Software &times; Intelligence**  
*Electronics & Communication Engineering student at VIT Chennai building systems at the intersection of circuits, embedded hardware, robotics, and artificial intelligence.*

[**Explore Live Website &rarr;**](https://abishektamilarasan.github.io/Portfolio/)

</div>

---

## Overview

A modern, high-performance engineering portfolio designed from the ground up without generic templates or bloated frameworks. Engineered with vanilla JavaScript, modern CSS3 liquid glassmorphism, and hardware-accelerated 3D graphics to showcase work spanning silicon design to autonomous edge AI systems.

### Key Interactive Features

- **Interactive 3D Three.js Background**: Real-time deformable wireframe plane with GPU-accelerated wave propagation and exact 3D raycast cursor tracking for zero-offset cloth-like interactive displacement.
- **Intelligent Section-Boundary Takeover**: Natural inertia scrolling inside multi-card sections paired with automatic smooth gliding transitions when moving between section boundaries.
- **Liquid Glassmorphism UI**: Dynamic prismatic borders, subtle chromatic refraction, and glass shimmer sweeps across cards.
- **Deep Technical Modals**: Clickable project pop-ups featuring architectural deep-dives, quantitative performance metrics, and direct links to GitHub repositories and Hugging Face models.

---

## Technical Domains & Core Stack

```
           +-------------------------------------------------------------+
           |                    Engineering Pipeline                     |
           |  Sensing  -->  Signal  -->  Computation  -->  Intelligence  |
           +-------------------------------------------------------------+
```

| Domain | Focus Areas | Key Tools & Technologies |
| :--- | :--- | :--- |
| **Electronics & RF** | Analog IC design, CMOS VLSI, RF & Microwave metamaterials | Cadence Virtuoso, 180nm CMOS, CST Microwave Studio, ngspice, Magic, KiCad |
| **Embedded Systems** | IoT telemetry, real-time edge nodes, sensor integration | ESP8266, ESP32, Raspberry Pi Pico, Arduino, I2C/SPI, UART, PWM |
| **Robotics & Vision** | Multi-agent coordination, state estimation, autonomous navigation | ROS2 (Humble), Gazebo, OpenCV, ArUco Fiducials, Extended Kalman Filter, PID |
| **AI & Edge ML** | Deep learning, computer vision pathology, self-hosted local LLMs | PyTorch, EfficientNetV2, ONNX Runtime, FastAPI, Ollama, Qwen2.5, ChromaDB |
| **Software & Infrastructure**| Systems programming, backend microservices, containerization | Python, Node.js, Linux, Docker, REST APIs, Git, WebGL |

---

## Featured Projects

### 1. 180nm CMOS Analog Circuit Design
- **Domain**: Electronics & VLSI
- **Tools**: Cadence Virtuoso, Spectre, BSIM4
- **Summary**: Full-custom schematic design and AC/transient characterization of analog IC building blocks in 180nm CMOS. Designed a two-stage op-amp delivering 68 dB open-loop gain and 62&deg; phase margin at 45 MHz UGF, backed by high-swing cascode current mirrors and temperature-compensated bandgap references.

### 2. CSRR Microwave Sensor for Dielectric Characterization
- **Domain**: RF & Microwave Engineering
- **Tools**: CST Microwave Studio
- **Summary**: Planar metamaterial Complementary Split Ring Resonator (CSRR) on microstrip transmission lines. Optimized transmission notch frequency and high Q-factor resonance for high-sensitivity, non-destructive permittivity evaluation of liquid chemicals and biological samples.

### 3. Smart Environmental Monitoring & Telemetry Network
- **Domain**: Embedded Systems & IoT
- **Tools**: ESP8266, C++, MQTT, Telegram Bot API
- **Summary**: End-to-end edge sensor node monitoring combustible gas/smoke (MQ-2), ambient temperature/humidity (DHT11), and optical flame presence with automated threshold alerts delivered through Telegram with sub-second latency.

### 4. Multi-Robot Autonomous Fleet Orchestration
- **Domain**: Robotics & Computer Vision
- **Tools**: ROS2 Humble, Gazebo, OpenCV, Python
- **Summary**: Decentralized multi-agent robot coordination simulated in physics-accurate Gazebo environments. Features real-time 6-DoF visual pose estimation via ArUco markers, sensor fusion with an Extended Kalman Filter (EKF), and closed-loop PID collision-free path tracking.

### 5. Agricultural Crop Disease Detection & Classification
- **Domain**: AI & Edge Machine Learning
- **Tools**: PyTorch, EfficientNetV2-B0, ONNX, FastAPI
- **Summary**: Computer vision pathology pipeline fine-tuned on plant leaf imagery, reaching 96.4% test accuracy across 38 crop disease classes. Quantized for low-power edge execution on single-board computers with a lightweight FastAPI serving backend. Model artifacts hosted on [Hugging Face](https://huggingface.co/abishektamilarasan).

### 6. Local Privacy-First RAG Assistant
- **Domain**: Generative AI & Local LLMs
- **Tools**: Ollama, Qwen2.5, ChromaDB, FastAPI, Python
- **Summary**: Fully offline, self-hosted Retrieval-Augmented Generation assistant. Executes quantized Qwen2.5 models on local GPU paired with ChromaDB vector search and recursive semantic chunking &mdash; zero cloud dependency, zero data leaks, zero API costs.

---

## Getting Started Locally

To run and preview the portfolio locally:

```bash
# Clone the repository
git clone https://github.com/abishektamilarasan/Portfolio.git

# Navigate into the project folder
cd Portfolio

# Serve locally with any static server (e.g. Python)
python -m http.server 3000
```

Open `http://localhost:3000` in any modern web browser.

---

## License & Credits

Designed and developed by **Abishek Tamilarasan** &copy; 2026. All rights reserved.
