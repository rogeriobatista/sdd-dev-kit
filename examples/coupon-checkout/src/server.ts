import http from "node:http";
import { applyCoupon, type Coupon } from "./coupon.js";

const PORT = Number(process.env.PORT ?? 4173);

const coupons: Record<string, Coupon> = {
  PROMO10: {
    code: "PROMO10",
    percentOff: 10,
    expiresAt: new Date(Date.now() + 86_400_000),
  },
  OLD10: {
    code: "OLD10",
    percentOff: 10,
    expiresAt: new Date(Date.now() - 86_400_000),
  },
};

function htmlPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Checkout — Cupom</title>
  <style>
    :root { color-scheme: light; font-family: "Segoe UI", sans-serif; }
    body { margin: 2rem; background: linear-gradient(160deg, #f7fafc, #e8f0fe); min-height: 100vh; }
    main { max-width: 28rem; }
    label { display: block; margin-top: 1rem; }
    input, button { font: inherit; padding: 0.4rem 0.6rem; }
    #message { margin-top: 1rem; min-height: 1.5rem; }
    #message.error { color: #b00020; }
    #message.ok { color: #0b6b2f; }
  </style>
</head>
<body>
  <main>
    <h1>Checkout</h1>
    <p>Total: <strong id="total">100</strong></p>
    <p id="receipt"></p>
    <label>Cupom <input id="code" name="code" value="" /></label>
    <button id="apply" type="button">Aplicar cupom</button>
    <p id="message" role="status"></p>
  </main>
  <script>
    const totalEl = document.getElementById("total");
    const receiptEl = document.getElementById("receipt");
    const messageEl = document.getElementById("message");
    document.getElementById("apply").addEventListener("click", async () => {
      const code = document.getElementById("code").value.trim();
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ total: 100, code }),
      });
      const data = await res.json();
      totalEl.textContent = String(data.total);
      receiptEl.textContent = data.receiptLine || "";
      messageEl.textContent = data.error || (data.receiptLine ? "Cupom aplicado" : "");
      messageEl.className = data.error ? "error" : "ok";
    });
  </script>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url?.startsWith("/index"))) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(htmlPage());
    return;
  }

  if (req.method === "POST" && req.url === "/api/apply") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as {
      total?: number;
      code?: string;
    };
    const coupon = coupons[String(body.code ?? "").toUpperCase()];
    if (!coupon) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          total: body.total ?? 100,
          discountApplied: 0,
          error: "Cupom não encontrado",
        }),
      );
      return;
    }
    const result = applyCoupon({ total: body.total ?? 100 }, coupon);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(result));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`coupon-checkout UI on http://127.0.0.1:${PORT}`);
});
