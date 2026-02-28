const canvas = document.getElementById("dust");
const ctx = canvas.getContext("2d");

let particles = [];
const count = 70;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

function createParticle() {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.8 + 0.3,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: Math.random() * -0.25 - 0.05,
        alpha: Math.random() * 0.5 + 0.2
    };
}

for (let i = 0; i < count; i++) particles.push(createParticle());

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 245, 210, ${p.alpha})`;
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
            Object.assign(p, createParticle(), { y: canvas.height + 10 });
        }
    }

    requestAnimationFrame(draw);
}

draw();