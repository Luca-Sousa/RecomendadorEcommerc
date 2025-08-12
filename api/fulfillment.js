const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// Carrega os dados dos produtos do arquivo JSON uma vez ao iniciar
const produtosData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "produtos.json"), "utf-8")
);

app.post("/webhook", (req, res) => {
  // Extrai parâmetros do Dialogflow
  // Extrai parâmetros principais
  let parameters = req.body.queryResult.parameters || {};

  // Se parameters está vazio, busca nos contexts!
  if (Object.keys(parameters).length === 0) {
    const contexts = req.body.queryResult.outputContexts || [];
    // Procura o context que tem os dados (ajuste conforme o nome dos contexts no seu Dialogflow)
    for (let ctx of contexts) {
      // Contexts que podem ter os parâmetros
      if (ctx.parameters) {
        // Copia os parâmetros encontrados
        parameters = { ...parameters, ...ctx.parameters };
      }
    }
  }

  const categoria = parameters.tipo_produto || "celular";
  const marca = parameters.marca_produto || "";
  const cor = parameters.cor_produto || "";
  const faixaPreco = parameters.faixa_preco || "";

  // Filtra produtos com base nas preferências
  let resultados = produtosData.filter((produto) => {
    return (
      produto.categoria.toLowerCase() === categoria.toLowerCase() &&
      (!marca || produto.marca.toLowerCase() === marca.toLowerCase()) &&
      (!cor || produto.cor.toLowerCase() === cor.toLowerCase()) &&
      (!faixaPreco ||
        (produto.preco >= faixaPreco.min && produto.preco <= faixaPreco.max))
    );
  });

  let fulfillmentText;
  if (resultados.length) {
    const prod = resultados[0]; // pega o primeiro resultado
    fulfillmentText = `Recomendamos: ${prod.categoria} da ${prod.marca} ${prod.modelo}, cor ${prod.cor}, por R$${prod.preco}`;
  } else {
    fulfillmentText =
      "Desculpe, não encontramos um produto com essas características.";
  }

  res.json({ fulfillmentText });
});

module.exports = app;
