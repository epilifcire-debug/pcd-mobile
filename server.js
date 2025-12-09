// ============================================================
// 🌐 PONTO DIGITAL - BACKEND COMPLETO (CRUD + FÉRIAS + STATUS)
// ES Modules (type: "module" no package.json)
// ============================================================

import express from "express";
import cors from "cors";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import crypto from "crypto";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// ============================================================
// ☁️ CLOUDINARY
// ============================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ponto-digital",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });

// ============================================================
// 🔐 CRIPTOGRAFIA AES-256-CBC
// ============================================================
const ENCRYPT_KEY = process.env.ENCRYPT_KEY;

function encrypt(text) {
  if (!text) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPT_KEY, "hex"),
    iv
  );
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text) {
  try {
    if (!text || !text.includes(":")) return text;
    const [ivHex, contentHex] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPT_KEY, "hex"),
      iv
    );
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(contentHex, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return text;
  }
}

// ============================================================
// 🧩 MONGODB
// ============================================================
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Conectado ao MongoDB Atlas"))
  .catch((err) => console.error("❌ Erro MongoDB:", err));

const userSchema = new mongoose.Schema({
  nome: String,
  email: String,
  senhaHash: String,
  cpfCripto: String,
  telefoneCripto: String,
  categoria: String, // RH | VENDEDOR | ADMIN
  turno: String, // MANHA | TARDE
  dataAdmissao: { type: Date, default: new Date() },

  // Controle básico de férias já tiradas
  jaTirouFerias: { type: Boolean, default: false },
  formaUltimasFerias: { type: String, default: null }, // "30dias" | "15em15"
  dataUltimasFeriasInicio: Date,
  dataUltimasFeriasFim: Date,
});

const pontoSchema = new mongoose.Schema({
  userId: String,
  tipo: String, // entrada | saida
  dataHora: Date,
  fotoUrl: String,
});

const feriasSchema = new mongoose.Schema(
  {
    userId: String,
    tipo: String, // "30dias" | "15em15"
    dataInicio: Date,
    dataFim: Date,
    dias: Number,
    status: { type: String, default: "pendente" }, // pendente, aprovada, reprovada
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Ponto = mongoose.model("Ponto", pontoSchema);
const Ferias = mongoose.model("Ferias", feriasSchema);

// ============================================================
// 🌱 SEED USUÁRIOS PADRÃO
// ============================================================
async function seedUsuariosBase() {
  const count = await User.countDocuments();
  if (count === 0) {
    console.log("🌱 Criando usuários padrão...");
    const baseUsers = [
      {
        nome: "Ana Souza",
        email: "ana.rh@empresa.com",
        cpf: "12345678900",
        telefone: "11999999999",
        categoria: "RH",
        dataAdmissao: new Date("2023-01-02"),
      },
      {
        nome: "Bruno Vendedor",
        email: "bruno@empresa.com",
        cpf: "98765432100",
        telefone: "11988888888",
        categoria: "VENDEDOR",
        turno: "MANHA",
        dataAdmissao: new Date("2023-02-10"),
      },
      {
        nome: "Carla Vendedora",
        email: "carla@empresa.com",
        cpf: "11122333444",
        telefone: "11977777777",
        categoria: "VENDEDOR",
        turno: "TARDE",
        dataAdmissao: new Date("2023-03-15"),
      },
    ];

    for (const u of baseUsers) {
      const senha = u.cpf.substring(0, 5);
      await new User({
        ...u,
        senhaHash: bcrypt.hashSync(senha, 10),
        cpfCripto: encrypt(u.cpf),
        telefoneCripto: encrypt(u.telefone),
      }).save();
      console.log(`Usuário: ${u.email} | senha: ${senha}`);
    }
  }
}

// ============================================================
// 🧰 CORREÇÃO AUTOMÁTICA DE NOMES CRIPTOGRAFADOS (RODA 1X)
// ============================================================
async function corrigirNomesCriptografados() {
  console.log("🔍 Verificando nomes criptografados...");
  const usuarios = await User.find();
  let corrigidos = 0;

  for (const u of usuarios) {
    if (typeof u.nome === "string" && u.nome.includes(":")) {
      const nomeDescript = decrypt(u.nome);
      if (nomeDescript && nomeDescript !== u.nome) {
        u.nome = nomeDescript;
        await u.save();
        corrigidos++;
        console.log("✔ Corrigido:", nomeDescript);
      }
    }
  }

  if (corrigidos > 0)
    console.log(`✅ Corrigidos ${corrigidos} nomes criptografados.`);
  else console.log("ℹ️ Nenhum nome criptografado encontrado.");
}

mongoose.connection.once("open", async () => {
  await seedUsuariosBase();
  await corrigirNomesCriptografados();
});

// ============================================================
// 🔑 LOGIN + JWT
// ============================================================
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  const ok = await bcrypt.compare(senha, user.senhaHash);
  if (!ok) return res.status(401).json({ error: "Senha incorreta" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });

  res.json({ token, usuario: user });
});

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Token ausente" });
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

// ============================================================
// 🕒 REGISTRO DE PONTO (COM FOTO)
// ============================================================
app.post("/ponto/registrar", auth, upload.single("foto"), async (req, res) => {
  try {
    await new Ponto({
      userId: req.userId,
      tipo: req.body.tipo,
      dataHora: new Date(),
      fotoUrl: req.file?.path || "",
    }).save();

    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao registrar ponto:", err);
    res.status(500).json({ error: "Erro ao registrar ponto" });
  }
});

// ============================================================
// 🧮 FÉRIAS - INFO GERAL (ALERTA NO LOGIN)
// ============================================================
app.get("/ferias/info", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  const adm = new Date(user.dataAdmissao || new Date());
  const hoje = new Date();
  const diasTrabalhados = Math.floor((hoje - adm) / (1000 * 60 * 60 * 24));
  const ciclos = Math.floor(diasTrabalhados / 365);
  const proxData = new Date(
    adm.getTime() + (ciclos + 1) * 365 * 24 * 60 * 60 * 1000
  );
  const diasProx = Math.ceil((proxData - hoje) / (1000 * 60 * 60 * 24));
  const vencidas = diasTrabalhados - ciclos * 365 - 365;

  let statusFerias = "OK";
  if (vencidas > 0) statusFerias = `⚠️ Férias vencidas há ${vencidas} dias`;
  else if (diasProx < 30)
    statusFerias = `⚠️ Férias vencem em ${diasProx} dias`;

  res.json({
    dataAdmissao: user.dataAdmissao,
    statusFerias,
    proximaDataAquisitiva: proxData,
  });
});

// ============================================================
// 🌴 FÉRIAS - ÚLTIMAS FÉRIAS & SOLICITAÇÃO (FUNCIONÁRIO)
// ============================================================
app.get("/ferias/ultimas", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  let ultima = null;

  if (user.jaTirouFerias && user.formaUltimasFerias) {
    ultima = {
      tipo: user.formaUltimasFerias,
      dataInicio: user.dataUltimasFeriasInicio || null,
      dataFim: user.dataUltimasFeriasFim || null,
    };
  } else {
    const registro = await Ferias.findOne({
      userId: req.userId,
      status: "aprovada",
    }).sort({ dataInicio: -1 });
    if (registro) {
      ultima = {
        tipo: registro.tipo,
        dataInicio: registro.dataInicio,
        dataFim: registro.dataFim,
      };
    }
  }

  res.json({ ultimaFerias: ultima });
});

app.post("/ferias/solicitar", auth, async (req, res) => {
  try {
    const { tipo } = req.body;
    if (!tipo)
      return res.status(400).json({ error: "Tipo de férias obrigatório" });

    const hoje = new Date();
    let dias = 30;
    if (tipo === "15em15") dias = 15;

    const dataInicio = hoje;
    const dataFim = new Date(hoje.getTime() + dias * 86400000);

    const ferias = new Ferias({
      userId: req.userId,
      tipo,
      dataInicio,
      dataFim,
      dias,
      status: "pendente",
    });

    await ferias.save();

    res.json({ ok: true, dataInicio, dataFim, tipo });
  } catch (err) {
    console.error("Erro ao solicitar férias:", err);
    res.status(500).json({ error: "Erro ao solicitar férias" });
  }
});

// ============================================================
// 👥 ADMIN / RH - FUNCIONÁRIOS (LISTAR, CRIAR, EDITAR, EXCLUIR)
// ============================================================
app.get("/admin/funcionarios", auth, async (req, res) => {
  const users = await User.find();
  res.json(
    users.map((u) => ({
      id: u._id,
      nome: u.nome,
      categoria: u.categoria,
      turno: u.turno || "-",
      dataAdmissao: u.dataAdmissao?.toISOString().split("T")[0] || "-",
    }))
  );
});

app.get("/admin/funcionario/:id", auth, async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ error: "Usuário não encontrado" });

  res.json({
    _id: u._id,
    nome: u.nome,
    email: u.email,
    telefone: decrypt(u.telefoneCripto),
    categoria: u.categoria,
    turno: u.turno,
    dataAdmissao: u.dataAdmissao
      ? u.dataAdmissao.toISOString().split("T")[0]
      : "",
    jaTirouFerias: u.jaTirouFerias,
    formaUltimasFerias: u.formaUltimasFerias,
  });
});

app.post("/admin/criar-funcionario", auth, async (req, res) => {
  try {
    const userLogado = await User.findById(req.userId);
    if (!["RH", "ADMIN"].includes(userLogado.categoria))
      return res.status(403).json({ error: "Acesso negado" });

    const {
      nome,
      email,
      cpf,
      telefone,
      categoria,
      turno,
      dataAdmissao,
      feriasTipoInicial,
    } = req.body;

    if (!nome || !email || !cpf || !telefone || !categoria)
      return res
        .status(400)
        .json({ error: "Campos obrigatórios ausentes no cadastro." });

    const senhaGerada = cpf.substring(0, 5);

    const novo = new User({
      nome,
      email,
      senhaHash: bcrypt.hashSync(senhaGerada, 10),
      cpfCripto: encrypt(cpf),
      telefoneCripto: encrypt(telefone),
      categoria,
      turno: categoria === "VENDEDOR" ? turno : undefined,
      dataAdmissao: dataAdmissao ? new Date(dataAdmissao) : new Date(),
    });

    if (feriasTipoInicial && feriasTipoInicial !== "nenhuma") {
      novo.jaTirouFerias = true;
      novo.formaUltimasFerias = feriasTipoInicial;
    }

    await novo.save();
    res.json({ ok: true, senhaGerada });
  } catch (err) {
    console.error("Erro ao criar funcionário:", err);
    res.status(500).json({ error: "Erro ao criar funcionário" });
  }
});

app.put("/admin/funcionario/:id", auth, async (req, res) => {
  try {
    const { nome, email, telefone, categoria, turno, dataAdmissao } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    user.nome = nome || user.nome;
    user.email = email || user.email;
    if (telefone) user.telefoneCripto = encrypt(telefone);
    user.categoria = categoria || user.categoria;
    user.turno = turno || null;
    if (dataAdmissao) user.dataAdmissao = new Date(dataAdmissao);

    await user.save();
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao atualizar funcionário:", err);
    res.status(500).json({ error: "Erro ao atualizar funcionário" });
  }
});

app.delete("/admin/funcionario/:id", auth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao excluir funcionário:", err);
    res.status(500).json({ error: "Erro ao excluir funcionário" });
  }
});

// ============================================================
// 📊 STATUS ADMIN + EXPORTAÇÃO CSV
// ============================================================
app.get("/admin/status", auth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pontosHoje = await Ponto.countDocuments({
      dataHora: { $gte: new Date().setHours(0, 0, 0, 0) },
    });
    const feriasPendentes = await Ferias.countDocuments({ status: "pendente" });

    const logsRecentes = (await Ponto.find().sort({ dataHora: -1 }).limit(10)).map(
      (p) =>
        `${p.tipo.toUpperCase()} - ${new Date(
          p.dataHora
        ).toLocaleString()} (${p.fotoUrl ? "📷" : "—"})`
    );

    const fotosRecentes = (await Ponto.find({
      fotoUrl: { $ne: "" },
    })
      .sort({ dataHora: -1 })
      .limit(5)).map((p) => p.fotoUrl);

    res.json({
      funcionariosAtivos: totalUsers,
      pontosHoje,
      feriasPendentes,
      logsRecentes,
      fotosRecentes,
      ultimaAtualizacao: new Date(),
    });
  } catch (err) {
    console.error("Erro ao carregar status:", err);
    res.status(500).json({ error: "Erro ao carregar status" });
  }
});

app.get("/admin/exportar", auth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pontosHoje = await Ponto.countDocuments({
      dataHora: { $gte: new Date().setHours(0, 0, 0, 0) },
    });

    const logsRecentes = (await Ponto.find().sort({ dataHora: -1 }).limit(10)).map(
      (p) =>
        `${p.tipo.toUpperCase()};${new Date(
          p.dataHora
        ).toLocaleString()};${p.fotoUrl || "-"}`
    );

    let csv = "Relatório Administrativo - Ponto Digital\n\n";
    csv += `Gerado em:;${new Date().toLocaleString()}\n\n`;
    csv += "Funcionários;Pontos Hoje\n";
    csv += `${totalUsers};${pontosHoje}\n\n`;
    csv += "Tipo;Data/Hora;Foto\n";
    csv += logsRecentes.join("\n");

    res.header("Content-Type", "text/csv");
    res.attachment(
      `Relatorio_PontoDigital_${new Date().toISOString().slice(0, 10)}.csv`
    );
    res.send(csv);
  } catch (err) {
    console.error("Erro ao exportar CSV:", err);
    res.status(500).json({ error: "Erro ao gerar CSV" });
  }
});

// ============================================================
// 🚀 INICIAR SERVIDOR
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
);
