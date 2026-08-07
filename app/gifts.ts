export type GiftCategory = "cozinha" | "quarto";
export type GiftQuantityUnit = "jogo" | "conjunto" | "unidade";

export type GiftItem = {
  id: string;
  category: GiftCategory;
  name: string;
  suggestedColor: string;
  colorSwatch: string;
  quantity: {
    total: number;
    unit: GiftQuantityUnit;
  };
  description: string;
  image: string;
  imageAlt: string;
};

const silverAndBlackSwatch =
  "linear-gradient(135deg, #d9dcdd 0 48%, #252725 48%)";
const silverSwatch = "linear-gradient(135deg, #f2f3f3, #9ea5a6)";
const transparentSwatch =
  "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(202,217,220,0.52))";
const lightColorsSwatch =
  "linear-gradient(135deg, #fffdf8 0 48%, #ded1bd 48%)";
const darkColorsSwatch =
  "linear-gradient(135deg, #252725 0 48%, #515655 48%)";
const blackAndWhiteSwatch =
  "linear-gradient(135deg, #252725 0 48%, #ffffff 48%)";
const whiteAndTransparentSwatch =
  "linear-gradient(135deg, #ffffff 0 48%, rgba(202,217,220,0.58) 48%)";

export const gifts: GiftItem[] = [
  {
    id: "jogo-de-pratos",
    category: "cozinha",
    name: "Jogo de pratos",
    suggestedColor: "Branco",
    colorSwatch: "linear-gradient(135deg, #ffffff, #e8e7e2)",
    quantity: { total: 2, unit: "jogo" },
    description:
      "Para encher a mesa de comida boa, conversa e gente querida.",
    image: "/gifts/jogo-de-pratos.webp",
    imageAlt: "Pilha de pratos brancos com borda dourada.",
  },
  {
    id: "jogo-de-talheres",
    category: "cozinha",
    name: "Jogo de talheres",
    suggestedColor: "Prata",
    colorSwatch: silverSwatch,
    quantity: { total: 2, unit: "jogo" },
    description:
      "Para acompanhar dos jantares caprichados às refeições de todo dia.",
    image: "/gifts/jogo-de-talheres.webp",
    imageAlt:
      "Jogo de talheres de aço inoxidável com facas, garfos e colheres.",
  },
  {
    id: "jogo-de-copos",
    category: "cozinha",
    name: "Jogo de copos",
    suggestedColor: "Transparente",
    colorSwatch: transparentSwatch,
    quantity: { total: 2, unit: "jogo" },
    description: "Para brindar cada conquista — inclusive as pequenas.",
    image: "/gifts/jogo-de-copos.webp",
    imageAlt:
      "Seis copos transparentes texturizados com borda dourada.",
  },
  {
    id: "jogo-de-xicaras",
    category: "cozinha",
    name: "Jogo de xícaras",
    suggestedColor: "Branco ou transparente",
    colorSwatch: whiteAndTransparentSwatch,
    quantity: { total: 2, unit: "conjunto" },
    description:
      "Para cafés compartilhados e conversas sem hora para acabar.",
    image: "/gifts/jogo-de-xicaras.webp",
    imageAlt: "Seis xícaras brancas com pires e acabamento marrom.",
  },
  {
    id: "jogo-de-panelas",
    category: "cozinha",
    name: "Jogo de panelas",
    suggestedColor: "Cores claras",
    colorSwatch: lightColorsSwatch,
    quantity: { total: 1, unit: "jogo" },
    description: "Para começar nossa coleção de almoços de domingo.",
    image: "/gifts/jogo-de-panelas.webp",
    imageAlt:
      "Jogo de panelas bege com tampas e cabos que imitam madeira.",
  },
  {
    id: "conjunto-de-formas",
    category: "cozinha",
    name: "Conjunto de formas",
    suggestedColor: "Preto ou prata",
    colorSwatch: silverAndBlackSwatch,
    quantity: { total: 1, unit: "conjunto" },
    description:
      "Para assar bolos, tortas e receitas que vão perfumar a casa.",
    image: "/gifts/conjunto-de-formas.webp",
    imageAlt:
      "Conjunto de cinco formas pretas para assar em diferentes formatos.",
  },
  {
    id: "conjunto-de-utensilios",
    category: "cozinha",
    name: "Conjunto de utensílios",
    suggestedColor: "Preto ou branco",
    colorSwatch: blackAndWhiteSwatch,
    quantity: { total: 1, unit: "jogo" },
    description:
      "Para deixar cada receita mais prática e cada almoço mais gostoso.",
    image: "/gifts/kit-de-utensilios.webp",
    imageAlt: "Utensílios de cozinha pretos com cabos de madeira.",
  },
  {
    id: "conjunto-de-facas",
    category: "cozinha",
    name: "Conjunto de facas",
    suggestedColor: "Preto ou prata",
    colorSwatch: silverAndBlackSwatch,
    quantity: { total: 1, unit: "conjunto" },
    description:
      "Para preparar nossas refeições com praticidade no dia a dia.",
    image: "/gifts/conjunto-de-facas.webp",
    imageAlt:
      "Conjunto preto com quatro facas, descascador e tesoura de cozinha.",
  },
  {
    id: "jogo-de-potes-hermeticos",
    category: "cozinha",
    name: "Potes herméticos",
    suggestedColor: "Transparente",
    colorSwatch: transparentSwatch,
    quantity: { total: 3, unit: "conjunto" },
    description:
      "Para manter a despensa organizada e os ingredientes sempre à mão.",
    image: "/gifts/potes-hermeticos.webp",
    imageAlt: "Cinco potes herméticos de vidro com tampas de bambu.",
  },
  {
    id: "micro-ondas",
    category: "cozinha",
    name: "Micro-ondas",
    suggestedColor: "Preto ou prata",
    colorSwatch: silverAndBlackSwatch,
    quantity: { total: 1, unit: "unidade" },
    description:
      "Uma ajudinha preciosa para os dias corridos da vida a dois.",
    image: "/gifts/micro-ondas.webp",
    imageAlt: "Micro-ondas preto com painel digital lateral.",
  },
  {
    id: "sanduicheira",
    category: "cozinha",
    name: "Sanduicheira",
    suggestedColor: "Preto ou prata",
    colorSwatch: silverAndBlackSwatch,
    quantity: { total: 1, unit: "unidade" },
    description:
      "Para cafés da manhã demorados e lanches no fim da noite.",
    image: "/gifts/sanduicheira.webp",
    imageAlt:
      "Sanduicheira prata e preta aberta com dois sanduíches.",
  },
  {
    id: "liquidificador",
    category: "cozinha",
    name: "Liquidificador",
    suggestedColor: "Preto ou prata",
    colorSwatch: silverAndBlackSwatch,
    quantity: { total: 1, unit: "unidade" },
    description:
      "Para sucos, massas, molhos e receitas que ainda vamos inventar.",
    image: "/gifts/liquidificador.webp",
    imageAlt: "Liquidificador preto com jarra transparente e filtro.",
  },
  {
    id: "cuscuzeira",
    category: "cozinha",
    name: "Cuscuzeira",
    suggestedColor: "Preto ou prata",
    colorSwatch: silverAndBlackSwatch,
    quantity: { total: 1, unit: "unidade" },
    description:
      "Porque um cuscuz quentinho também é um jeito de dizer bom dia.",
    image: "/gifts/cuscuzeira.webp",
    imageAlt:
      "Cuscuzeira preta desmontada acompanhada de um cuscuz servido.",
  },
  {
    id: "batedeira",
    category: "cozinha",
    name: "Batedeira",
    suggestedColor: "Preto ou prata",
    colorSwatch: silverAndBlackSwatch,
    quantity: { total: 1, unit: "unidade" },
    description:
      "Para bolos de aniversário, domingos e comemorações sem motivo.",
    image: "/gifts/batedeira.webp",
    imageAlt: "Batedeira planetária preta com tigela e batedor.",
  },
  {
    id: "jogo-de-cama",
    category: "quarto",
    name: "Jogo de cama",
    suggestedColor: "Cores escuras",
    colorSwatch: darkColorsSwatch,
    quantity: { total: 3, unit: "conjunto" },
    description: "Para deixar nosso cantinho bonito, leve e aconchegante.",
    image: "/gifts/jogo-de-cama.webp",
    imageAlt: "Jogo de cama branco e cinza com colcha e fronhas.",
  },
  {
    id: "ferro-de-passar",
    category: "quarto",
    name: "Ferro de passar",
    suggestedColor: "Preto ou prata",
    colorSwatch: silverAndBlackSwatch,
    quantity: { total: 1, unit: "unidade" },
    description: "Para deixar cada detalhe do nosso novo lar bem cuidado.",
    image: "/gifts/ferro-de-passar.jpeg",
    imageAlt: "Ferro de passar preto e prata.",
  },
];
