// ============================================================
// 🕒 PONTO DIGITAL - FRONTEND APP.JS FINAL (2025)
// ============================================================

// 🔗 Conexão com o backend hospedado no Render
const API_URL = "https://ponto-digital-d207.onrender.com";

let token = null;
let usuarioAtual = null;

// ===== SELETORES =====
const loginSection = document.getElementById("login-section");
const pontoSection = document.getElementById("ponto-section");
const painelRH = document.getElementById("painel-rh");
const msgErro = document.getElementById("msg-erro");
const boasVindas = document.getElementById("boas-vindas");
const alertaFerias = document.getElementById("alerta-ferias");

// ============================================================
// 🔐 LOGIN
// ============================================================
document.getElementById("btn-login").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();
  if (!email || !senha) return (msgErro.textContent = "Preencha todos os campos.");

  try {
    const resp = await fetch(API_URL + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Erro ao fazer login.");

    token = data.token;
    usuarioAtual = data.usuario;
    msgErro.textContent = "";

    if (["RH", "ADMIN"].includes(usuarioAtual.categoria)) {
      loginSection.classList.add("oculto");
      painelRH.classList.remove("oculto");
      carregarAbaFuncionarios();

      // Mostrar botão “Novo Admin” se for ADMIN
      if (usuarioAtual.categoria === "ADMIN") {
        document.getElementById("btn-novo-admin").classList.remove("oculto");
      }
    } else {
      loginSection.classList.add("oculto");
      pontoSection.classList.remove("oculto");
      boasVindas.textContent = `Olá, ${usuarioAtual.nome}`;
      verificarFerias();
    }
  } catch (err) {
    msgErro.textContent = err.message;
  }
});

// ============================================================
// 🚪 LOGOUT
// ============================================================
function logout() {
  token = null;
  usuarioAtual = null;
  loginSection.classList.remove("oculto");
  pontoSection.classList.add("oculto");
  painelRH.classList.add("oculto");
  document.getElementById("email").value = "";
  document.getElementById("senha").value = "";
}

document.getElementById("btn-logout-func").addEventListener("click", logout);
document.getElementById("btn-logout-rh").addEventListener("click", logout);

// ============================================================
// 🌴 FÉRIAS - FUNCIONÁRIO
// ============================================================
async function verificarFerias() {
  try {
    const resp = await fetch(API_URL + "/ferias/info", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await resp.json();
    if (data.statusFerias && data.statusFerias.startsWith("⚠️")) {
      alertaFerias.classList.remove("oculto");
      alertaFerias.textContent = data.statusFerias;
    } else alertaFerias.classList.add("oculto");
  } catch (err) {
    console.error("Erro ao verificar férias:", err);
  }
}

// ============================================================
// 📸 REGISTRAR PONTO
// ============================================================
async function capturarFoto() {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        setTimeout(() => {
          ctx.drawImage(video, 0, 0, 320, 240);
          stream.getTracks().forEach((t) => t.stop());
          canvas.toBlob(resolve, "image/jpeg", 0.8);
        }, 1500);
      })
      .catch(reject);
  });
}

async function registrarPonto(tipo) {
  try {
    const fotoBlob = await capturarFoto();
    const formData = new FormData();
    formData.append("tipo", tipo);
    if (fotoBlob) formData.append("foto", fotoBlob, "ponto.jpg");

    const resp = await fetch(API_URL + "/ponto/registrar", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: formData,
    });

    const data = await resp.json();
    if (resp.ok) alert("✅ Ponto registrado!");
    else alert("Erro: " + (data.error || "Falha"));
  } catch (err) {
    alert("Erro: " + err.message);
  }
}

document.getElementById("btn-entrada").addEventListener("click", () => registrarPonto("entrada"));
document.getElementById("btn-saida").addEventListener("click", () => registrarPonto("saida"));
document.getElementById("btn-intervalo").addEventListener("click", () => {
  alert("⏳ Intervalo de 15 minutos iniciado!");
  setTimeout(() => alert("⚠️ Intervalo finalizado."), 15 * 60 * 1000);
});

// ============================================================
// 🧑‍💼 PAINEL RH / ADMIN
// ============================================================
document.querySelectorAll(".tab-btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "tab-funcionarios") carregarAbaFuncionarios();
  })
);

// ============================================================
// 👥 LISTAR FUNCIONÁRIOS
// ============================================================
async function carregarAbaFuncionarios() {
  const resp = await fetch(API_URL + "/admin/funcionarios", {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await resp.json();
  const tbody = document.querySelector("#tabela-funcionarios tbody");
  tbody.innerHTML = "";
  data.forEach((u) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.nome}</td>
      <td>${u.categoria}</td>
      <td>${u.turno || "-"}</td>
      <td>${u.dataAdmissao ? new Date(u.dataAdmissao).toLocaleDateString() : "-"}</td>
      <td>
        <button class="btn-editar" data-id="${u._id}">✏️</button>
        <button class="btn-excluir" data-id="${u._id}">🗑</button>
      </td>`;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".btn-editar").forEach((b) =>
    b.addEventListener("click", () => abrirModalEdicao(b.dataset.id))
  );
  document.querySelectorAll(".btn-excluir").forEach((b) =>
    b.addEventListener("click", () => excluirFuncionario(b.dataset.id))
  );
}

// ============================================================
// ➕ CADASTRAR FUNCIONÁRIO
// ============================================================
const modal = document.getElementById("modal-cadastro");
document.getElementById("btn-novo-funcionario").addEventListener("click", () => modal.classList.remove("oculto"));
document.getElementById("btn-fechar-modal").addEventListener("click", () => modal.classList.add("oculto"));

document.getElementById("btn-salvar-func").addEventListener("click", async () => {
  const nome = document.getElementById("cad-nome").value.trim();
  const email = document.getElementById("cad-email").value.trim();
  const cpf = document.getElementById("cad-cpf").value.trim();
  const telefone = document.getElementById("cad-telefone").value.trim();
  const categoria = document.getElementById("cad-categoria").value;
  const turno = document.getElementById("cad-turno").value;
  const dataAdmissao = document.getElementById("cad-admissao").value;
  if (!nome || !email || !cpf || !telefone || !categoria || !dataAdmissao)
    return alert("Preencha todos os campos.");

  const resp = await fetch(API_URL + "/admin/criar-funcionario", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ nome, email, cpf, telefone, categoria, turno, dataAdmissao }),
  });
  const data = await resp.json();
  if (resp.ok) {
    alert(`✅ Funcionário cadastrado!\nSenha: ${data.senhaGerada}`);
    modal.classList.add("oculto");
    carregarAbaFuncionarios();
  } else alert(data.error || "Erro ao cadastrar funcionário.");
});

// ============================================================
// 👑 CRIAR NOVO ADMIN
// ============================================================
document.getElementById("btn-novo-admin").addEventListener("click", async () => {
  const nome = prompt("Nome do novo administrador:");
  const email = prompt("E-mail do novo administrador:");
  if (!nome || !email) return alert("Dados incompletos.");

  const resp = await fetch(API_URL + "/admin/criar-funcionario", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({
      nome,
      email,
      cpf: "00000000000",
      telefone: "00000000000",
      categoria: "ADMIN",
      dataAdmissao: new Date(),
    }),
  });

  const data = await resp.json();
  if (resp.ok) alert(`✅ Novo admin criado!\nSenha: ${data.senhaGerada}`);
  else alert("Erro: " + (data.error || "Falha ao criar admin"));
});

// ============================================================
// ✏️ EDITAR E EXCLUIR
// ============================================================
async function abrirModalEdicao(id) {
  const resp = await fetch(API_URL + "/admin/funcionarios", {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await resp.json();
  const user = data.find((u) => u._id === id);
  document.getElementById("edit-nome").value = user.nome;
  document.getElementById("edit-email").value = user.email;
  document.getElementById("edit-telefone").value = user.telefone || "";
  document.getElementById("edit-categoria").value = user.categoria;
  document.getElementById("edit-turno").value = user.turno || "";
  document.getElementById("edit-ferias-tipo").value = user.formaUltimasFerias || "";
  document.getElementById("edit-ferias-inicio").value = user.dataUltimasFeriasInicio
    ? new Date(user.dataUltimasFeriasInicio).toISOString().split("T")[0]
    : "";
  document.getElementById("edit-ferias-fim").value = user.dataUltimasFeriasFim
    ? new Date(user.dataUltimasFeriasFim).toISOString().split("T")[0]
    : "";
  modalEditar.classList.remove("oculto");
}

async function excluirFuncionario(id) {
  if (!confirm("Tem certeza que deseja excluir?")) return;
  const resp = await fetch(API_URL + `/admin/funcionario/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
  if (resp.ok) {
    alert("🗑 Funcionário removido!");
    carregarAbaFuncionarios();
  } else alert("Erro ao excluir funcionário.");
}
