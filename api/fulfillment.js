const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// Carrega os dados dos produtos do arquivo JSON uma vez ao iniciar
const produtosData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "produtos.json"), "utf-8")
);

// Faixas de preço baseadas na tabela da entidade
const priceRanges = [
  { ref: 500, min: 1, max: 500 },
  { ref: 1000, min: 501, max: 1000 },
  { ref: 1500, min: 1001, max: 1500 },
  { ref: 2000, min: 1501, max: 2000 },
  { ref: 2500, min: 2001, max: 2500 },
  { ref: 3000, min: 2501, max: 3000 },
  { ref: 3500, min: 3001, max: 3500 },
  { ref: 4000, min: 3501, max: 4000 },
  { ref: 4500, min: 4001, max: 4500 },
  { ref: 5000, min: 4501, max: 5000 },
  { ref: 5500, min: 5001, max: 5500 },
  { ref: 6000, min: 5501, max: 6000 },
  { ref: 6500, min: 6001, max: 6500 },
  { ref: 7000, min: 6501, max: 7000 },
  { ref: 7500, min: 7001, max: 7500 },
  { ref: 8000, min: 7501, max: 8000 },
  { ref: 8500, min: 8001, max: 8500 },
  { ref: 9000, min: 8501, max: 9000 },
  { ref: 9500, min: 9001, max: 9500 },
  { ref: 10000, min: 9501, max: 10000 },
];

function getPriceRange(priceString) {
  const price = Number(priceString);
  if (!price || price < 1) return null;
  if (price <= 500) return { min: 1, max: 500 };
  const range = priceRanges.find((r) => r.ref === price);
  if (range) return { min: range.min, max: range.max };
  // fallback: maior faixa disponível
  return { min: 1, max: price };
}

app.post("/webhook", (req, res) => {
  // Extrai parâmetros principais
  let parameters = req.body.queryResult.parameters || {};

  // Se parameters está vazio, busca nos contexts!
  if (Object.keys(parameters).length === 0) {
    const contexts = req.body.queryResult.outputContexts || [];
    for (let ctx of contexts) {
      if (ctx.parameters) {
        parameters = { ...parameters, ...ctx.parameters };
      }
    }
  }

  console.log("Parâmetros extraídos:", parameters);

  const categoria = parameters.tipo_produto || "celular";
  const marca = parameters.marca_produto || "";
  const cor = parameters.cor_produto || "";
  const faixaPreco = parameters.faixa_preco || "";

  // Lógica de faixa de preço aprimorada
  let minPreco = 0,
    maxPreco = Infinity;
  if (faixaPreco) {
    const range = getPriceRange(faixaPreco);
    if (range) {
      minPreco = range.min;
      maxPreco = range.max;
    }
  }

  let resultados = produtosData.filter((produto) => {
    return (
      (!categoria ||
        produto.categoria.toLowerCase() === categoria.toLowerCase()) &&
      (!marca || produto.marca.toLowerCase() === marca.toLowerCase()) &&
      (!cor || produto.cor.toLowerCase() === cor.toLowerCase()) &&
      (!faixaPreco || (produto.preco >= minPreco && produto.preco <= maxPreco))
    );
  });

  let fulfillmentText;
  if (resultados.length) {
    const prod = resultados[0]; // pega o primeiro resultado
    fulfillmentText = `🔥 RECOMENDAÇÃO ESPECIAL 🔥` +
      `${prod.categoria.toUpperCase()}: ${prod.marca} ${prod.modelo}
      ` +
      `🎨 Cor: ${prod.cor}
      ` +
      `💰 Preço: R$ ${prod.preco}
      ` +
      `📝 Descrição: ${prod.descricao}
      ` +
      `⭐ Avaliação: ${prod.avaliacao}/5.0
      ` +
      `📦 Disponibilidade: ${prod.disponibilidade}
      ` +
      `🛡️ Garantia: ${prod.garantia}
      ` +
      `
      ✨ Produto ideal para suas necessidades!`;
  } else {
    fulfillmentText =
      "😔 Desculpe, não encontramos um produto com essas características." +
      "💡 Dica: Tente ser mais específico ou remover alguns filtros para encontrar mais opções!";
  }

  res.json({ fulfillmentText });
});

module.exports = app;
